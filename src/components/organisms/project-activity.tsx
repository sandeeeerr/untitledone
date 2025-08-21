"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MessageSquare, Plus } from "lucide-react";

export type ProjectActivityChangeType = "addition" | "feedback" | "update";

export interface ProjectActivityMicroChange {
  id: string;
  type: ProjectActivityChangeType;
  description: string;
  author: string;
  time: string; // HH:mm or relative
  avatar?: string | null;
}

export interface ProjectActivityVersion {
  version: string; // e.g., v1.0
  description: string;
  author: string;
  date: string; // ISO date
  avatar?: string | null;
  microChanges: ProjectActivityMicroChange[];
}

export default function ProjectActivity({
  versions,
  locale = "nl-NL",
}: {
  versions: ProjectActivityVersion[];
  locale?: string;
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

  return (
    <div className="space-y-6">
      {versions.map((version) => (
        <Card key={version.version} className="border-l-4 border-l-primary">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={version.avatar || undefined} alt={version.author} />
                  <AvatarFallback>{version.author.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <CardTitle className="text-lg font-semibold truncate">{version.version}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 truncate">{version.description}</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs shrink-0">
                {new Date(version.date).toLocaleDateString(locale, { day: "numeric", month: "short" })}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-3">
              {version.microChanges.map((change) => (
                <div
                  key={change.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-muted"
                >
                  <div className="flex items-center gap-2 mt-0.5">
                    {getChangeIcon(change.type)}
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={change.avatar || undefined} alt={change.author} />
                      <AvatarFallback className="text-xs">
                        {change.author.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="text-green-600 font-medium mr-1">
                        {getChangePrefix(change.type)}
                      </span>
                      {change.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="font-medium">{change.author}</span>
                      <span>•</span>
                      <span>{change.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


