"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateFeedbackChange } from "@/lib/api/queries";

export default function CreateFeedbackDialog({ projectId, versionId, trigger, onCreated }: { projectId: string; versionId: string; trigger: React.ReactNode; onCreated?: (id: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const createFeedback = useCreateFeedbackChange(projectId);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    
    try {
      const result = await createFeedback.mutateAsync({ 
        versionId, 
        description: title.trim() 
      });
      setOpen(false);
      setTitle("");
      onCreated?.(result.id);
    } catch (error) {
      // Error handling is already done in the mutation hook via toast
      console.error('Failed to create feedback:', error);
    }
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
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={createFeedback.isPending}>Annuleer</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || createFeedback.isPending}>
            {createFeedback.isPending ? "Opslaan..." : "Opslaan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


