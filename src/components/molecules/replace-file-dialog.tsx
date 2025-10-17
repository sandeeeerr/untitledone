"use client";

import React, { useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Replace, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReplaceFileDialog({ projectId, fileId, trigger, onReplaced }: { projectId: string; fileId: string; trigger?: React.ReactNode; onReplaced?: (newFileId: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [description, setDescription] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setFile(files[0]);
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setError(null);
    try {
      // For large files (>4.5MB), upload directly to Supabase Storage
      const isLargeFile = file.size > 4.5 * 1024 * 1024; // 4.5MB
      
      if (isLargeFile) {
        // Direct upload to Supabase Storage
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        const key = `${projectId}/${crypto.randomUUID()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(key, file, {
            contentType: file.type || 'application/octet-stream',
            cacheControl: '3600'
          });
        
        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
        
        // Send metadata to our API
        const form = new FormData();
        form.append("uploadedPath", key);
        form.append("size", file.size.toString());
        form.append("type", file.type || 'application/octet-stream');
        form.append("name", file.name);
        if (description.trim()) form.append("description", description.trim());
        
        const res = await fetch(`/api/projects/${projectId}/files/${fileId}?action=replace`, { 
          method: "POST", 
          body: form 
        });
        
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
      } else {
        // Original flow for small files
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
      }
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
            
            {/* Drag & Drop Zone */}
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                "hover:border-primary/50 hover:bg-muted/50",
                "cursor-pointer"
              )}
              onClick={() => document.getElementById('replace-file-input')?.click()}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-1">
                {file ? file.name : "Drop file here or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground">
                Supported: Audio, DAW projects, MIDI/SysEx, presets, archives, docs, images, video. Max ~200MB.
              </p>
            </div>
            
            <Input
              id="replace-file-input"
              type="file"
              accept=".wav,.aiff,.flac,.mp3,.aac,.ogg,.m4a,.opus,.mid,.midi,.syx,.als,.flp,.logicx,.band,.cpr,.ptx,.rpp,.song,.bwproject,.reason,.zip,.rar,.7z,.tar,.gz,.nki,.adg,.fst,.fxp,.fxb,.nmsv,.h2p,.txt,.md,.doc,.docx,.pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.mp4,.mov,.mkv,.json,.xml"
              onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)}
              disabled={submitting}
              className="hidden"
            />
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


