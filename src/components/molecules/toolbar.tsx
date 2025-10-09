"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type ToolbarProps = React.HTMLAttributes<HTMLDivElement>

export default function Toolbar({ className, ...props }: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 flex-wrap",
        className
      )}
      {...props}
    />
  )
}


