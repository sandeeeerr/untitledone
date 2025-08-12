"use client"

import { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useProfile, useUpdateProfile, useDeleteProfile } from "@/lib/api/queries";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Badge } from "@/components/ui/badge";
import { SOCIAL_PLATFORMS, SocialIconMap } from "@/components/socials";
import type { SocialPlatform } from "@/lib/api/socials";
import { getCurrentSocials, putCurrentSocials } from "@/lib/api/socials";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const platformValues = SOCIAL_PLATFORMS.map((p) => p.value) as [SocialPlatform, ...SocialPlatform[]];

const SocialLinkSchema = z.object({
  platform: z.enum(platformValues),
  url: z.string().trim().max(255).optional().default(""),
});

const ProfileEditSchema = z.object({
  display_name: z.string().max(120).optional(),
  bio: z.string().max(1000).optional(),
  location: z.string().max(120).optional(),
  socials: z.array(SocialLinkSchema).default([]),
});

export function ProfileEditModal({ open, onOpenChange }: ProfileEditModalProps) {
  const { data: profile } = useProfile();
  const { data: user } = useCurrentUser();
  const router = useRouter();

  type ProfileFormValues = z.input<typeof ProfileEditSchema>;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileEditSchema),
    defaultValues: {
      display_name: "",
      bio: "",
      location: "",
      socials: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ name: "socials", control: form.control });

  useEffect(() => {
    if (profile) {
      form.reset({
        display_name: profile.display_name ?? "",
        bio: profile.bio ?? "",
        location: profile.location ?? "",
        socials: form.getValues("socials"),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const links = await getCurrentSocials();
        replace(links);
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();
  const { mutateAsync: removeProfile, isPending: isDeleting } = useDeleteProfile();

  async function onSubmit(values: ProfileFormValues) {
    const updated = await updateProfile({
      display_name: values.display_name,
      bio: values.bio,
      location: values.location,
    });

    try {
      const sanitized = (form.getValues("socials") ?? [])
        .map((l) => ({ platform: l.platform, url: (l.url ?? "").trim() }))
        .filter((l) => l.url.length > 0);
      await putCurrentSocials(sanitized);
    } catch (e) {
      console.error(e);
    }

    onOpenChange(false);

    const newUsername = (updated as { username?: string } | undefined)?.username ?? profile?.username;
    if (newUsername) {
      router.push(`/u/${newUsername}`);
      return;
    }

    router.refresh();
  }

  async function onDelete() {
    const ok = window.confirm("Are you sure you want to delete your profile? This cannot be undone.");
    if (!ok) return;
    await removeProfile();
    onOpenChange(false);
    router.push("/");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>

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
            </div>
          )}
        </div>

        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
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

          <div className="space-y-3">
            <div className="text-sm font-medium">Socials</div>
            <div className="space-y-2">
              {fields.map((field, index) => {
                const platform = form.watch(`socials.${index}.platform`);
                const Icon = platform ? SocialIconMap[platform as SocialPlatform] : null;
                const placeholder =
                  SOCIAL_PLATFORMS.find((p) => p.value === platform)?.placeholder ?? "https://";
                return (
                  <div key={field.id} className="flex items-center gap-2">
                    <Controller
                      name={`socials.${index}.platform` as const}
                      control={form.control}
                      defaultValue={form.getValues(`socials.${index}.platform`) ?? SOCIAL_PLATFORMS[0].value}
                      render={({ field: ctrl }) => (
                        <Select value={ctrl.value} onValueChange={ctrl.onChange}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Platform" />
                          </SelectTrigger>
                          <SelectContent>
                            {SOCIAL_PLATFORMS.map((p) => {
                              const ItemIcon = SocialIconMap[p.value];
                              return (
                                <SelectItem key={p.value} value={p.value}>
                                  <span className="inline-flex items-center gap-2">
                                    <ItemIcon className="h-4 w-4" /> {p.label}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <div className="flex-1 relative">
                      <Input
                        {...form.register(`socials.${index}.url`)}
                        placeholder={placeholder}
                        className="pl-9"
                      />
                      {Icon ? (
                        <Icon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      ) : null}
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
            <div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => append({ platform: SOCIAL_PLATFORMS[0].value, url: "" })}
              >
                Add link
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-between">
            <Button type="button" variant="destructive" onClick={onDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete profile"}
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}