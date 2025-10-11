"use client";

import { Separator } from "@/components/ui/separator";
import DisconnectDialog from "@/components/molecules/disconnect-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useDeleteProfile } from "@/lib/api/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsAccountPage() {
  const [open, setOpen] = useState(false);
  const deleteProfile = useDeleteProfile();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Account</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account and dangerous actions.
        </p>
      </div>
      <Separator />

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Delete profile</CardTitle>
          <CardDescription>
            This action cannot be undone. This will permanently delete your profile and remove your data from our servers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setOpen(true)} disabled={deleteProfile.isPending}>
            {deleteProfile.isPending ? "Deleting..." : "Delete profile"}
          </Button>
        </CardContent>
      </Card>

      <DisconnectDialog
        open={open}
        onOpenChange={setOpen}
        provider={"dropbox"}
        onConfirm={async () => {
          await deleteProfile.mutateAsync();
          if (typeof window !== "undefined") window.location.href = "/";
        }}
      />
    </div>
  );
}


