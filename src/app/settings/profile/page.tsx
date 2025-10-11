"use client";

import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useProfile, useUpdateProfile } from "@/lib/api/queries";
import { useEffect } from "react";

const ProfileSchema = z.object({
  display_name: z.string().max(120).optional(),
  location: z.string().max(120).optional(),
  bio: z.string().max(1000).optional(),
});

type ProfileFormValues = z.infer<typeof ProfileSchema>;

export default function SettingsProfilePage() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      display_name: "",
      location: "",
      bio: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        display_name: profile.display_name ?? "",
        location: profile.location ?? "",
        bio: profile.bio ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.display_name, profile?.location, profile?.bio]);

  async function onSubmit(values: ProfileFormValues) {
    await updateProfile.mutateAsync(values);
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          This is how others will see you on the site.
        </p>
      </div>
      <Separator />
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Display name</label>
          <Input placeholder="Your display name" {...form.register("display_name")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Location</label>
          <Input placeholder="City, Country" {...form.register("location")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Bio</label>
          <Textarea placeholder="Tell us a little about yourself" className="resize-none" {...form.register("bio")} />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
