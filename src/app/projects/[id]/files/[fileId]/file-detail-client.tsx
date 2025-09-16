"use client";

import { useProject, useProjectFileDetail } from "@/lib/api/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/components/atoms/user-avatar";
import EmptyState from "@/components/atoms/empty-state";
import LoadingState from "@/components/atoms/loading-state";
import { Download, FileIcon, Clock, User, HardDrive, Tag, Pencil, Trash2, Replace } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import ThreadedComments from "@/components/molecules/threaded-comments";
import { useProjectComments } from "@/lib/api/queries";

interface FileDetailClientProps {
  projectId: string;
  fileId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileIcon(fileType: string) {
  const type = fileType.toLowerCase();
  if (type.includes("audio")) return "🎵";
  if (type.includes("video")) return "🎬";
  if (type.includes("image")) return "🖼️";
  if (type.includes("text") || type.includes("document")) return "📄";
  return "📁";
}

export default function FileDetailClient({ projectId, fileId }: FileDetailClientProps) {
  const { data: project } = useProject(projectId);
  const { data: file, isLoading, error, refetch } = useProjectFileDetail(projectId, fileId);
  const { data: comments = [], isLoading: commentsLoading } = useProjectComments({ projectId, fileId, limit: 200 }, { enabled: Boolean(fileId) });
  async function handleDownload() {
    try {
      const res = await fetch(`/api/projects/${projectId}/files/${fileId}?action=download`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to get download URL');
      const { url } = await res.json();
      window.open(url, '_blank');
    } catch {}
  }

  async function handleReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const fileInput = e.target.files?.[0];
    if (!fileInput) return;
    const form = new FormData();
    form.append('file', fileInput);
    const res = await fetch(`/api/projects/${projectId}/files/${fileId}?action=replace`, { method: 'POST', body: form });
    if (res.ok) refetch();
    e.target.value = '';
  }

  async function handleDelete() {
    if (!confirm('Delete this file?')) return;
    const res = await fetch(`/api/projects/${projectId}/files/${fileId}?action=delete`, { method: 'POST' });
    if (res.ok) {
      window.history.back();
    }
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <EmptyState 
        title="Fout bij laden"
        description="Er is een probleem opgetreden bij het laden van het bestand."
      >
        <Button onClick={() => refetch()}>Opnieuw proberen</Button>
      </EmptyState>
    );
  }

  if (!file) {
    return (
      <EmptyState 
        title="Bestand niet gevonden"
        description="Het gevraagde bestand bestaat niet of je hebt geen toegang."
      >
        <Button onClick={() => window.history.back()}>Terug</Button>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Title row (not in a card) */}
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <FileIcon className="h-5 w-5 shrink-0" />
              <h1 className="text-2xl font-semibold leading-tight truncate" title={file.filename}>{file.filename}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={handleDownload} disabled={project ? !project.downloads_enabled : false}>
                <Download className="h-4 w-4" />
                Download
              </Button>
              <label className="inline-flex">
                <input type="file" className="hidden" onChange={handleReplace} />
                <Button size="sm" variant="secondary" asChild>
                  <span className="inline-flex items-center gap-2"><Replace className="h-4 w-4" />Replace</span>
                </Button>
              </label>
              <Button size="sm" variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          {/* Compact meta under title (like project page) */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              <span>Grootte:</span>
              <span className="font-medium text-foreground">{formatFileSize(file.fileSize)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span>Type:</span>
              <Badge variant="secondary">{file.fileType}</Badge>
            </div>
          </div>

          {/* Metadata (not in a card) */}
          {file.description && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Beschrijving</div>
              <p className="text-sm leading-relaxed">{file.description}</p>
            </div>
          )}

          

          {file.version && (
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Versie</div>
              <div className="flex items-center gap-2">
                <Badge>{file.version.name}</Badge>
                {file.version.description && (
                  <span className="text-sm text-muted-foreground">- {file.version.description}</span>
                )}
              </div>
            </div>
          )}

          {/* Waveform placeholder for audio files (not in a card) */}
          {(() => {
            const isAudio = file.fileType?.toLowerCase().includes("audio") || /\.(wav|mp3|flac|aac|aiff|ogg)$/i.test(file.filename);
            if (!isAudio) return null;
            return (
              <div aria-label="Waveform placeholder">
                <div className="h-24 sm:h-28 md:h-32 w-full rounded-md bg-muted overflow-hidden relative">
                  <div className="absolute inset-0 flex items-end gap-1 px-2 animate-pulse">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-0.5 bg-foreground/40"
                        style={{ height: `${30 + (Math.sin(i / 2) * 20 + (i % 7) * 3)}%` }}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-background/70 to-transparent" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Voorbeeldweergave — functie in ontwikkeling</p>
              </div>
            );
          })()}

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle>Reacties</CardTitle>
            </CardHeader>
            <CardContent>
              <ThreadedComments 
                projectId={projectId}
                context={{ fileId }}
                comments={comments}
                isLoading={commentsLoading}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */
        }
        <div className="space-y-6">
          {/* Upload Info (top) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Upload informatie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <UserAvatar 
                  className="h-10 w-10"
                  name={file.uploadedBy.name}
                  username={file.uploadedBy.username}
                  userId={file.uploadedBy.id}
                  src={file.uploadedBy.avatar}
                />
                <div>
                  <p className="font-medium">{file.uploadedBy.name}</p>
                  {file.uploadedBy.username && (
                    <p className="text-sm text-muted-foreground">@{file.uploadedBy.username}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Geüpload {formatDistanceToNow(new Date(file.uploadedAt), { 
                  addSuffix: true, 
                  locale: nl 
                })}
              </div>

              {/* Torrent/network placeholder (disabled) */}
              <div className="space-y-3 opacity-60 pointer-events-none select-none">
                <div className="text-sm">
                  <div className="text-muted-foreground">Torrent status</div>
                  <div className="font-medium">Niet gedeeld (0 seeds, 0 peers)</div>
                </div>
                <div className="text-sm break-words">
                  <div className="text-muted-foreground">Magnet link</div>
                  <div className="font-mono text-xs">magnet:?xt=urn:btih:DEMOHASH123&dn={encodeURIComponent(file.filename)}</div>
                </div>
                <div className="text-sm">
                  <div className="text-muted-foreground">Netwerk</div>
                  <div className="font-medium">UDP tracker inactief</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" disabled>Kopieer link</Button>
                  <Button size="sm" variant="outline" disabled>Open in client</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bestandsmetadata (checksum, sample rate, etc.) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bestandsmetadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Checksum</span>
                <span className="font-mono">a1b2c3d4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sample rate</span>
                <span className="font-medium">44.1 kHz</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Bit depth</span>
                <span className="font-medium">24-bit</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Channels</span>
                <span className="font-medium">Stereo</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions moved next to title */}
        </div>
      </div>
    </div>
  );
}
