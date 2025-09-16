"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateFeedbackChange } from "@/lib/api/queries";

export default function CreateFeedbackDialog({ projectId, versionId, trigger, onCreated }: { projectId: string; versionId: string; trigger: React.ReactNode; onCreated?: (id: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [summary, setSummary] = React.useState("");
  const createFeedback = useCreateFeedbackChange(projectId);
  const t = useTranslations("activity.createFeedback");

  const handleSubmit = async () => {
    if (!summary.trim()) return;
    
    try {
      const result = await createFeedback.mutateAsync({ 
        versionId, 
        description: summary.trim() 
      });
      setOpen(false);
      setSummary("");
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
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="feedback-summary" className="text-sm">{t('label')}</Label>
          <Textarea id="feedback-summary" rows={3} placeholder={t('placeholder')} value={summary} onChange={(e) => setSummary(e.target.value)} />
          <p className="text-xs text-muted-foreground">{t('help')}</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={createFeedback.isPending}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={!summary.trim() || createFeedback.isPending}>
            {createFeedback.isPending ? t('saving') : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


