"use client";

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Replace } from "lucide-react";

export default function ReplaceFileDialog({ projectId, fileId, trigger, onReplaced }: { projectId: string; fileId: string; trigger?: React.ReactNode; onReplaced?: (newFileId: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [description, setDescription] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      if (description.trim()) form.append("description", description.trim());
      const res = await fetch(`/api/projects/${projectId}/files/${fileId}?action=replace`, { method: "POST", body: form });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to replace file");
      }
      const data = (await res.json().catch(() => ({}))) as { newFileId?: string };
      const newId = data?.newFileId;
      setOpen(false);
      setFile(null);
      setDescription("");
      onReplaced?.(newId || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to replace file");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="secondary" className="gap-2">
            <Replace className="h-4 w-4" />
            Replace
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg w-[calc(100%-1.5rem)]">
        <DialogHeader>
          <DialogTitle>Replace file</DialogTitle>
          <DialogDescription>Upload a new file to supersede the current one. The old file remains accessible.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm">New file</div>
            <Input
              type="file"
              accept=".wav,.aiff,.flac,.mp3,.aac,.ogg,.m4a,.opus,.mid,.midi,.syx,.als,.flp,.logicx,.band,.cpr,.ptx,.rpp,.song,.bwproject,.reason,.zip,.rar,.7z,.tar,.gz,.nki,.adg,.fst,.fxp,.fxb,.nmsv,.h2p,.txt,.md,.doc,.docx,.pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.mp4,.mov,.mkv,.json,.xml"
              onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">Supported: Audio, DAW projects, MIDI/SysEx, presets, archives, docs, images, video. Max ~200MB.</p>
          </div>
          <div className="space-y-2">
            <div className="text-sm">Description (optional)</div>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What changed in this replacement?" />
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={!file || submitting} className="gap-2">
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Replacing...
                </>
              ) : (
                <>
                  <Replace className="h-4 w-4" />
                  Replace file
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


