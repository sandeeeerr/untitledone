"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function CreateFeedbackDialog({ projectId, versionId, trigger, onCreated }: { projectId: string; versionId: string; trigger: React.ReactNode; onCreated?: (id: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");

  const handleSubmit = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId, description: title.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      const body = await res.json();
      setOpen(false);
      setTitle("");
      onCreated?.(body.id);
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuwe feedback</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Input placeholder="Titel omschrijving..." value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuleer</Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>Opslaan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


