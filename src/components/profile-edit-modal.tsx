"use client"

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useProfile, useUpdateProfile } from "@/lib/api/queries";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileEditSchema = z.object({
  display_name: z.string().max(120).optional(),
  bio: z.string().max(1000).optional(),
  location: z.string().max(120).optional(),
});

export function ProfileEditModal({ open, onOpenChange }: ProfileEditModalProps) {
  const { data: profile } = useProfile();
  const { data: user } = useCurrentUser();
  const router = useRouter();

  const form = useForm<z.infer<typeof ProfileEditSchema>>({
    resolver: zodResolver(ProfileEditSchema),
    defaultValues: {
      display_name: "",
      bio: "",
      location: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        display_name: profile.display_name ?? "",
        bio: profile.bio ?? "",
        location: profile.location ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();

  async function onSubmit(values: z.infer<typeof ProfileEditSchema>) {
    await updateProfile({
      display_name: values.display_name,
      bio: values.bio,
      location: values.location,
    });
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>

        {/* Read-only account info */}
        <div className="space-y-3 mb-4">
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">User ID</span>
              <Badge variant="secondary" className="font-mono text-xs truncate max-w-full">
                {user.id}
              </Badge>
            </div>
          )}

          {user?.email && (
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="text-base">{user.email}</div>
            </div>
          )}

          {profile?.username && (
            <div>
              <div className="text-sm text-muted-foreground">Username</div>
              <div className="text-base font-mono">{profile.username}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Username is automatically generated and updated when you change your display name.
              </p>
              <div className="mt-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/u/${profile.username}`}>View public profile</Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Editable fields */}
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Display name</label>
              <Input {...form.register("display_name")} placeholder="Your display name" />
            </div>
            <div>
              <label className="block text-sm mb-1">Location</label>
              <Input {...form.register("location")} placeholder="City, Country" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Bio</label>
              <Textarea
                {...form.register("bio")}
                placeholder="Tell something about yourself"
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 