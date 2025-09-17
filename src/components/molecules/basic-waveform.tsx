"use client";

import React, { forwardRef, useImperativeHandle } from "react";
import WaveSurfer from "wavesurfer.js";
import Timeline from "wavesurfer.js/dist/plugins/timeline.esm.js";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

export type BasicWaveformHandle = {
  seekToMs: (ms: number) => void;
  playPause: () => void;
  getDurationMs: () => number;
};

function BasicWaveform(
  { url, height = 80, onTime }: { url: string; height?: number; onTime?: (ms: number) => void },
  ref: React.Ref<BasicWaveformHandle>,
) {
  const timelineRef = React.useRef<HTMLDivElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const wsRef = React.useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentMs, setCurrentMs] = React.useState(0);
  const [durationMs, setDurationMs] = React.useState(0);
  const onTimeRef = React.useRef<typeof onTime | undefined>(onTime);
  React.useEffect(() => { onTimeRef.current = onTime; }, [onTime]);

  React.useEffect(() => {
    if (!containerRef.current || !url) return;

    // Clear any previous canvases (React StrictMode double-mount in dev)
    try { containerRef.current.innerHTML = ""; } catch {}
    if (timelineRef.current) { try { timelineRef.current.innerHTML = ""; } catch {} }

    // Resolve theme colors from Tailwind/Shadcn CSS variables
    const styles = getComputedStyle(document.documentElement);
    const primary = `hsl(${(styles.getPropertyValue('--primary') || '').trim()})` || '#3b82f6';
    // Custom secondary color: hsl(240, 4.9%, 83.9%)
    const secondary = "hsl(240, 4.9%, 83.9%)";

    const ws = WaveSurfer.create({
      container: containerRef.current,
      height,
      waveColor: secondary,
      progressColor: primary,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      plugins: timelineRef.current ? [Timeline.create({ container: timelineRef.current })] : [],
    });
    wsRef.current = ws;
    ws.on("ready", () => {
      const dur = ws.getDuration();
      setDurationMs(Math.floor(dur * 1000));
    });
    ws.on("audioprocess", () => {
      const ms = Math.floor(ws.getCurrentTime() * 1000);
      setCurrentMs(ms);
      onTimeRef.current?.(ms);
    });
    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));

    ws.load(url);

    return () => {
      try { ws.stop(); } catch {}
      try { ws.unAll(); } catch {}
      // Avoid destroy to prevent AbortError during decode; let GC reclaim
      wsRef.current = null;
      if (containerRef.current) { try { containerRef.current.innerHTML = ""; } catch {} }
      if (timelineRef.current) { try { timelineRef.current.innerHTML = ""; } catch {} }
    };
  }, [url, height]);

  useImperativeHandle(ref, () => ({
    seekToMs: (ms: number) => {
      const ws = wsRef.current;
      if (!ws || durationMs <= 0) return;
      const pos = Math.max(0, Math.min(ms / durationMs, 1));
      ws.seekTo(pos);
    },
    playPause: () => wsRef.current?.playPause(),
    getDurationMs: () => durationMs,
  }), [durationMs]);

  const toggle = () => wsRef.current?.playPause();
  const mmss = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const mm = Math.floor(total / 60).toString().padStart(2, "0");
    const ss = (total % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  return (
    <div className="w-full my-2">
      <div ref={containerRef} className="w-full" style={{ height }} />
      <div ref={timelineRef} className="wavesurfer-timeline ws-timeline w-full h-3" />
      <style jsx global>{`
        .ws-timeline {
          color: rgba(107, 114, 128, 0.9); /* slate-500 */
        }
        .ws-timeline text { fill: rgba(107,114,128,0.9); font-size: 10px; }
        .ws-timeline line { stroke: rgba(156,163,175,0.6); }
      `}</style>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={toggle} aria-label={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <span className="tabular-nums">{mmss(currentMs)}/{mmss(durationMs)}</span>
      </div>
    </div>
  );
}

export default forwardRef(BasicWaveform);
