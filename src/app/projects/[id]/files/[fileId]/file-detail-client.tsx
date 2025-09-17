"use client";

import React from "react";
import { useProject, useProjectFileDetail, useProjectActivity, useCommentsCount } from "@/lib/api/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/components/atoms/user-avatar";
import EmptyState from "@/components/atoms/empty-state";
import LoadingState from "@/components/atoms/loading-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Clock, User, HardDrive, Trash2, Replace } from "lucide-react";
import { getFileIconForName, getFileIconForMime } from "@/lib/ui/file-icons";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import ThreadedComments from "@/components/molecules/threaded-comments";
import { useProjectComments } from "@/lib/api/queries";
import BasicWaveform from "@/components/molecules/basic-waveform";
import type { BasicWaveformHandle } from "@/components/molecules/basic-waveform";
import ReplaceFileDialog from "@/components/molecules/replace-file-dialog";
import { useTranslations } from "next-intl";

// Type for file with superseded info
interface FileWithSupersededInfo {
  supersededByFileId?: string | null;
  [key: string]: unknown;
}

// Extended Window interface for webkit audio context
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

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

// (legacy helper removed)

function truncateText(text: string, maxChars: number): string {
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return text.slice(0, Math.max(0, maxChars - 1)) + "…";
}

export default function FileDetailClient({ projectId, fileId }: FileDetailClientProps) {
  const t = useTranslations();
  const { data: project } = useProject(projectId);
  const { data: file, isLoading, error, refetch } = useProjectFileDetail(projectId, fileId);
  const { data: activity } = useProjectActivity(projectId);
  const { data: commentsCount = 0 } = useCommentsCount({ projectId, fileId }, { enabled: Boolean(fileId), staleTime: 60 * 1000 });
  const { data: comments = [], isLoading: commentsLoading } = useProjectComments({ projectId, fileId, limit: 200 }, { enabled: Boolean(fileId) });
  const [currentMs, setCurrentMs] = React.useState<number>(0);
  const [analyzed, setAnalyzed] = React.useState<{ sampleRate?: number; channels?: number; durationMs?: number; bitrateKbps?: number } | null>(null);
  const wfRef = React.useRef<BasicWaveformHandle | null>(null);

  const getTimestampMs = () => currentMs;

  const seekToMs = (ms: number) => {
    wfRef.current?.seekToMs(ms);
  };

  const displayFilename = React.useMemo(() => truncateText(file?.filename ?? "", 80), [file?.filename]);

  const isAudioFile = React.useMemo(() => {
    if (!file) return false;
    const ft = file.fileType?.toLowerCase() || "";
    return ft.includes("audio") || /\.(wav|mp3|flac|aac|aiff|ogg|m4a|opus)$/i.test(file.filename);
  }, [file]);

  const formatMs = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const mm = Math.floor(total / 60).toString().padStart(2, '0');
    const ss = (total % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  async function handleDownload() {
    try {
      const res = await fetch(`/api/projects/${projectId}/files/${fileId}?action=download`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to get download URL');
      const { url } = await res.json();
      window.open(url, '_blank');
    } catch {}
  }

  function navigateToNewFile(newFileId?: string) {
    if (!newFileId) {
      refetch();
      return;
    }
    window.location.href = `/projects/${projectId}/files/${newFileId}`;
  }

  async function handleDelete() {
    if (!confirm(t("common.deleteFileConfirm"))) return;
    const res = await fetch(`/api/projects/${projectId}/files/${fileId}?action=delete`, { method: 'POST' });
    if (res.ok) {
      window.history.back();
    }
  }

  const deletion = React.useMemo(() => {
    if (!error) return null;
    if (!activity) return null;
    for (const v of activity) {
      for (const mc of v.microChanges) {
        if (mc.type === "update" && typeof mc.description === "string" && mc.description.includes("File deleted:") && mc.description.includes(`[${fileId}]`)) {
          return { author: mc.author, when: mc.fullTimestamp };
        }
      }
    }
    return null;
  }, [error, activity, fileId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-48 w-full" />
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    if (deletion) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{t("files.fileDeleted")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              {t("files.fileDeletedDescription", { time: formatDistanceToNow(new Date(deletion.when), { addSuffix: true, locale: nl }), author: deletion.author ? ` door ${deletion.author}` : "" })}
            </p>
            <div>
              <Button size="sm" variant="outline" onClick={() => window.history.back()}>{t("projects.actions.back")}</Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    return (
      <EmptyState 
        title={t("files.loadError")}
        description={t("files.loadErrorDescription")}
      >
        <Button onClick={() => refetch()}>{t("projects.actions.tryAgain")}</Button>
      </EmptyState>
    );
  }

  if (!file) {
    return (
      <EmptyState 
        title={t("files.fileNotFound")}
        description={t("files.fileNotFoundDescription")}
      >
        <Button onClick={() => window.history.back()}>{t("projects.actions.back")}</Button>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Title row: stack on mobile, side-by-side on desktop */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {getFileIconForName(file.filename, { className: "h-5 w-5 shrink-0" })}
              <h1 className="text-2xl font-semibold leading-tight truncate overflow-hidden flex-1 max-w-[calc(100vw-2rem)] md:max-w-full" title={file.filename}>{displayFilename}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto sm:justify-end flex-wrap mt-2 sm:mt-0">
              <Button size="sm" variant="outline" onClick={handleDownload} disabled={project ? !project.downloads_enabled : false}>
                <Download className="h-4 w-4" />
                {t("projects.actions.download")}
              </Button>
              <ReplaceFileDialog 
                projectId={projectId} 
                fileId={fileId} 
                onReplaced={navigateToNewFile}
                trigger={
                  <Button size="sm" variant="outline" className="gap-2">
                    <Replace className="h-4 w-4" />
                    {t("projects.actions.replace")}
                  </Button>
                }
              />
              <Button size="sm" variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
                {t("projects.actions.delete")}
              </Button>
            </div>
          </div>
          
          {/* Compact meta under title */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground !mt-1">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
                <span>{t("files.size")}:</span>
              <span className="font-medium text-foreground">{formatFileSize(file.fileSize)}</span>
            </div>
            <div className="flex items-center gap-2">
              {getFileIconForMime(file.fileType, { className: "h-4 w-4" })}
                <span>{t("files.type")}:</span>
              <Badge variant="secondary">{file.fileType}</Badge>
            </div>
          </div>

          {/* Superseded banner */}
          {file && (file as FileWithSupersededInfo).supersededByFileId ? (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              {t("files.superseded")}
              <Button variant="link" className="px-2" onClick={() => navigateToNewFile((file as FileWithSupersededInfo).supersededByFileId!)}>{t("files.openNewFile")}</Button>
            </div>
          ) : null}

          {/* Waveform */}
          {(() => {
            if (!isAudioFile) return null;
            return (
              <SimpleWaveWrapper
                projectId={projectId}
                fileId={fileId}
                onTime={(ms) => setCurrentMs(ms)}
                forwardRef={wfRef}
                onAnalyzed={(meta) => setAnalyzed(meta)}
              />
            );
          })()}

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">{t("comments.title")} <Badge variant="secondary">{commentsCount}</Badge></CardTitle>
            </CardHeader>
            <CardContent>
              <ThreadedComments 
                projectId={projectId}
                context={{ fileId }}
                comments={comments}
                isLoading={commentsLoading}
                getTimestampMs={isAudioFile ? getTimestampMs : undefined}
                onSeekToTimestamp={seekToMs}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upload Info (top) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t("files.uploadInfo")}
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
                {t("files.uploaded")} {formatDistanceToNow(new Date(file.uploadedAt), { 
                  addSuffix: true, 
                  locale: nl 
                })}
              </div>

              {file.description && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">{t("files.description")}</div>
                  <p className="text-sm leading-relaxed break-words">{file.description}</p>
                </div>
              )}

              {file.version && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">{t("files.version")}</div>
                  <div className="flex items-center gap-2">
                    <Badge>{file.version.name}</Badge>
                    {file.version.description && (
                      <span className="text-sm text-muted-foreground">- {file.version.description}</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bestandsmetadata (checksum, sample rate, etc.) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("files.fileMetadata")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {analyzed?.durationMs && (
                <div className="flex items-center justify-between"><span className="text-muted-foreground">{t("files.duration")}</span><span className="font-medium">{formatMs(analyzed.durationMs)}</span></div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("files.sampleRate")}</span>
                <span className="font-medium">{analyzed?.sampleRate ? `${(analyzed.sampleRate/1000).toFixed(1)} kHz` : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("files.channels")}</span>
                <span className="font-medium">{analyzed?.channels ? (analyzed.channels === 1 ? t("files.mono") : analyzed.channels === 2 ? t("files.stereo") : `${analyzed.channels} ch`) : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("files.bitrate")}</span>
                <span className="font-medium">{analyzed?.bitrateKbps ? `${analyzed.bitrateKbps} kbps` : '—'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SimpleWaveWrapper({ projectId, fileId, onTime, forwardRef, onAnalyzed }: { projectId: string; fileId: string; onTime?: (ms: number) => void; forwardRef?: React.Ref<BasicWaveformHandle | null>; onAnalyzed?: (meta: { sampleRate?: number; channels?: number; durationMs?: number; bitrateKbps?: number }) => void }) {
  const [url, setUrl] = React.useState<string>("");
  // Keep a stable reference to the callback to avoid re-running the effect on each render
  const onAnalyzedRef = React.useRef<typeof onAnalyzed | undefined>(onAnalyzed);
  React.useEffect(() => { onAnalyzedRef.current = onAnalyzed; }, [onAnalyzed]);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await fetch(`/api/projects/${projectId}/files/${fileId}?action=download`, { method: "POST" });
      if (!res.ok) return;
      const { url } = await res.json();
      if (mounted) setUrl(url || "");

      // Client-side audio metadata (Web Audio API)
      try {
        const response = await fetch(url);
        const arrayBuf = await response.arrayBuffer();
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuf = await ctx.decodeAudioData(arrayBuf.slice(0));
        const durationMs = Math.floor(audioBuf.duration * 1000);
        const sampleRate = audioBuf.sampleRate;
        const channels = audioBuf.numberOfChannels;
        const bitrateKbps = durationMs > 0 ? Math.round(((response.headers.get('Content-Length') ? Number(response.headers.get('Content-Length')) : 0) * 8) / (durationMs / 1000) / 1000) : undefined;
        onAnalyzedRef.current?.({ durationMs, sampleRate, channels, bitrateKbps });
        ctx.close().catch(() => {});
      } catch {}
    })();
    return () => { mounted = false };
  }, [projectId, fileId]);
  if (!url) return null;
  return <BasicWaveform ref={forwardRef as React.RefObject<BasicWaveformHandle>} url={url} height={96} onTime={onTime} />;
}
