import supabaseClient from "@/lib/supabase-client";
import { Tables, TablesUpdate } from "@/types/database";

export type Profile = Tables<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;

export async function getCurrentProfile() {
  const { data: auth } = await supabaseClient.auth.getUser();
  const user = auth?.user;
  if (!user) return null;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function updateCurrentProfile(update: ProfileUpdate) {
  const { data: auth } = await supabaseClient.auth.getUser();
  const user = auth?.user;
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabaseClient
    .from("profiles")
    .update(update)
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
} 