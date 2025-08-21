"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MessageSquare, Plus, FileAudio, Music, Download } from "lucide-react";

export type ProjectActivityChangeType = "addition" | "feedback" | "update";

export interface ProjectActivityMicroChange {
  id: string;
  type: ProjectActivityChangeType;
  description: string;
  author: string;
  time: string; // HH:mm or relative
  avatar?: string | null;
  filename?: string; // optional file reference to preview
}

export interface ProjectActivityVersion {
  version: string; // e.g., v1.0
  description: string;
  author: string;
  date: string; // ISO date or human-readable range
  avatar?: string | null;
  microChanges: ProjectActivityMicroChange[];
  isActive?: boolean; // highlight as current active version
}

export default function ProjectActivity({
  versions,
  locale = "nl-NL",
  query,
}: {
  versions: ProjectActivityVersion[];
  locale?: string;
  query?: string;
}) {
  const getChangeIcon = (type: ProjectActivityChangeType) => {
    switch (type) {
      case "addition":
        return <Plus className="h-3 w-3 text-green-600" />;
      case "feedback":
        return <MessageSquare className="h-3 w-3 text-blue-600" />;
      case "update":
        return <Clock className="h-3 w-3 text-orange-600" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getChangePrefix = (type: ProjectActivityChangeType) => {
    switch (type) {
      case "addition":
        return "+";
      case "feedback":
        return "";
      case "update":
        return "~";
      default:
        return "";
    }
  };

  const getFileIcon = (filename?: string) => {
    if (!filename) return null;
    const extension = filename.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "wav":
      case "mp3":
      case "flac":
        return <FileAudio className="h-3 w-3 text-green-600" />;
      case "mid":
      case "midi":
        return <Music className="h-3 w-3 text-green-600" />;
      case "als":
      case "flp":
      default:
        return <Download className="h-3 w-3 text-green-600" />;
    }
  };

  const formatDateSafe = (value: string, locale: string) => {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
    }
    // Fallback to raw string if it's not a valid ISO date
    return value;
  };

  if (!versions || versions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nog geen activiteit.</p>
        </CardContent>
      </Card>
    );
  }

  const normalizedQuery = (query ?? "").trim().toLowerCase()
  const filteredVersions = !normalizedQuery
    ? versions
    : versions.map(v => ({
        ...v,
        microChanges: v.microChanges.filter(c => {
          const hay = [c.description, c.author, c.filename ?? ""].join(" ").toLowerCase()
          return hay.includes(normalizedQuery)
        })
      })).filter(v => v.microChanges.length > 0)

  return (
    <div className="space-y-6">
      {filteredVersions.map((v, idx) => {
        const isActive = v.isActive ?? idx === 0;
        return (
          <Card
            key={v.version}
            className={`${isActive ? "border-l-4 border-l-green-500" : "border-l-4 border-l-gray-200"}`}
          >
            <CardHeader className="pb-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <Avatar className="h-9 w-9 mt-1">
                    <AvatarImage src={v.avatar || undefined} alt={v.author} />
                    <AvatarFallback>{v.author.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base font-semibold truncate">{v.version}</CardTitle>
                      {isActive && (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-xs">
                          Actief
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground  truncate">{v.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                      <span className="font-medium">{v.author}</span>
                      <span>•</span>
                      <span>{formatDateSafe(v.date, locale)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                {v.microChanges.map((change) => {
                  const base =
                    "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all border";
                  const typeStyles =
                    change.type === "feedback"
                      ? "bg-blue-50/30 border-blue-100 hover:bg-blue-50/50 hover:border-blue-200 dark:bg-blue-950/10 dark:border-blue-900/30 dark:hover:bg-blue-950/20"
                      : change.type === "addition"
                      ? "bg-green-50/30 border-green-100 hover:bg-green-50/50 hover:border-green-200 dark:bg-green-950/10 dark:border-green-900/30 dark:hover:bg-green-950/20"
                      : "bg-orange-50/30 border-orange-100 hover:bg-orange-50/50 hover:border-orange-200 dark:bg-orange-950/10 dark:border-orange-900/30 dark:hover:bg-orange-950/20";

                  return (
                    <div key={change.id} className={`${base} ${typeStyles}`}>
                      <div className="flex items-center gap-2 mt-0.5">
                        {getChangeIcon(change.type)}
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={change.avatar || undefined} alt={change.author} />
                          <AvatarFallback className="text-xs">
                            {change.author.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${
                            change.type === "feedback" ? "italic text-blue-700 dark:text-blue-300" : ""
                          }`}
                        >
                          <span
                            className={`font-medium mr-1 ${
                              change.type === "addition"
                                ? "text-green-700 dark:text-green-300"
                                : change.type === "feedback"
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-orange-700 dark:text-orange-300"
                            }`}
                          >
                            {getChangePrefix(change.type)}
                          </span>
                          {change.description}
                        </p>

                        {change.filename && (
                          <div className="flex items-center gap-2 mt-2 p-2 bg-white/80 dark:bg-gray-800/80 rounded border border-green-200 dark:border-green-800">
                            {getFileIcon(change.filename)}
                            <span className="text-xs font-mono text-green-700 dark:text-green-300">
                              {change.filename}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium">{change.author}</span>
                            <span>•</span>
                            <span>{change.time}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            {change.type === "feedback" && (
                              <span className="text-xs text-blue-600 dark:text-blue-400">Klik om te reageren</span>
                            )}
                            {change.filename && (
                              <span className="text-xs text-green-600 dark:text-green-400">Klik om te bekijken</span>
                            )}
                            {change.type !== "feedback" && !change.filename && (
                              <span className="text-xs text-gray-600 dark:text-gray-400">Klik voor details</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


