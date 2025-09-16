import React from "react";
import { File as FileGeneric, FileAudio, Music, Headphones, Video, Image as ImageIcon, FileText, Archive, FileCode, Sliders, Disc, LayoutGrid, Terminal, Mic, Sun, CircuitBoard, Piano, Usb, Drum, Settings, Sparkles, FileType, Notebook, Code } from "lucide-react";

export type FileIconOptions = {
  className?: string;
};

function withSize<T extends { className?: string }>(icon: React.ReactElement<T>, opts?: FileIconOptions): React.ReactElement<T> {
  const sizeClass = opts?.className || "h-4 w-4";
  const existing = (icon.props as unknown as { className?: string })?.className ?? "";
  return React.cloneElement(icon, { className: `${sizeClass} ${existing}`.trim() } as Partial<T>);
}

export function getFileIconForExtension(ext?: string, opts?: FileIconOptions, filenameHint?: string): React.ReactElement {
  const e = (ext || "").toLowerCase();
  switch (e) {
    // Audio (lossless / raw)
    case "wav":
    case "aiff":
    case "flac":
      if ((filenameHint || "").toLowerCase().match(/loop|one[-_ ]?shot|oneshot/)) {
        return withSize(<Drum className="text-amber-600" />, opts);
      }
      return withSize(<Music className="text-green-600" />, opts);

    // Compressed audio
    case "mp3":
    case "aac":
    case "ogg":
    case "m4a":
    case "opus":
      return withSize(<Headphones className="text-emerald-600" />, opts);

    // MIDI
    case "mid":
    case "midi":
      return withSize(<Piano className="text-purple-600" />, opts);
    case "syx":
      return withSize(<Usb className="text-purple-600" />, opts);

    // Video
    case "mp4":
    case "mov":
    case "webm":
    case "mkv":
      return withSize(<Video className="text-blue-600" />, opts);

    // Images
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
    case "svg":
      return withSize(<ImageIcon className="text-teal-600" />, opts);

    // Archives
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return withSize(<Archive className="text-orange-600" />, opts);

    // DAW projects
    case "als":
      return withSize(<Sliders className="text-blue-600" />, opts);
    case "flp":
      return withSize(<Disc className="text-orange-600" />, opts);
    case "logicx":
    case "band":
      return withSize(<LayoutGrid className="text-blue-700" />, opts);
    case "cpr":
      return withSize(<FileAudio className="text-indigo-600" />, opts);
    case "ptx":
      return withSize(<Sliders className="text-pink-600" />, opts);
    case "rpp":
      return withSize(<Terminal className="text-gray-700" />, opts);
    case "song":
      return withSize(<Mic className="text-rose-600" />, opts);
    case "bwproject":
      return withSize(<Sun className="text-amber-500" />, opts);
    case "reason":
      return withSize(<CircuitBoard className="text-green-700" />, opts);
    // Presets / patches
    case "fxp":
    case "fxb":
    case "nmsv":
    case "h2p":
      return withSize(<Sparkles className="text-fuchsia-600" />, opts);

    // Instruments / racks / presets
    case "nki":
    case "adg":
    case "fst":
      return withSize(<Settings className="text-cyan-700" />, opts);

    // Documents
    case "pdf":
      return withSize(<FileText className="text-red-600" />, opts);
    case "doc":
    case "docx":
    case "txt":
    case "rtf":
    case "md":
    case "csv":
    case "xls":
    case "xlsx":
      return withSize(<FileText className="text-gray-600" />, opts);

    // Code
    case "js":
    case "ts":
    case "tsx":
    case "json":
    case "yaml":
    case "yml":
      return withSize(<FileCode className="text-indigo-600" />, opts);

    default:
      return withSize(<FileGeneric className="text-gray-600" />, opts);
  }
}

export function getFileIconForName(filename?: string, opts?: FileIconOptions): React.ReactElement {
  const ext = filename?.split(".").pop();
  const name = (filename || "").toLowerCase();
  if (name.includes("changelog") || name.endsWith(".md")) return withSize(<Notebook className="text-gray-700" />, opts);
  return getFileIconForExtension(ext, opts, filename);
}

export function getFileIconForMime(mime?: string, opts?: FileIconOptions): React.ReactElement {
  const m = (mime || "").toLowerCase();
  if (m.startsWith("audio/")) return withSize(<Music className="text-green-600" />, opts);
  if (m.startsWith("video/")) return withSize(<Video className="text-blue-600" />, opts);
  if (m.startsWith("image/")) return withSize(<ImageIcon className="text-teal-600" />, opts);
  if (m === "application/pdf") return withSize(<FileType className="text-red-600" />, opts);
  if (m.includes("zip") || m.includes("x-7z") || m.includes("x-rar") || m.includes("tar")) return withSize(<Archive className="text-orange-600" />, opts);
  if (m.includes("json") || m.includes("xml")) return withSize(<Code className="text-indigo-600" />, opts);
  return withSize(<FileGeneric className="text-gray-600" />, opts);
}


