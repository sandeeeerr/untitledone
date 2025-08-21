-- Migration: Create profiles table for user profile data
-- Purpose: Store additional user profile information like bio and social accounts
-- Affected tables: profiles (new table)

-- Create profiles table to store additional user information
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    username text unique,
    full_name text,
    bio text,
    avatar_url text,
    website text,
    location text,
    social_links jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Create indexes for better performance
create index profiles_username_idx on public.profiles (username);
create index profiles_created_at_idx on public.profiles (created_at);

-- RLS Policies for profiles table

-- Allow users to view all profiles (public access)
create policy "Profiles are viewable by everyone"
on public.profiles
for select
to authenticated, anon
using (true);

-- Allow users to insert their own profile
create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Allow users to delete their own profile
create policy "Users can delete their own profile"
on public.profiles
for delete
to authenticated
using (auth.uid() = id);

-- Create function to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, username, full_name)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
        coalesce(new.raw_user_meta_data->>'full_name', new.email)
    );
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger to automatically create profile when user signs up
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger handle_profiles_updated_at
    before update on public.profiles
    for each row execute procedure public.handle_updated_at();
