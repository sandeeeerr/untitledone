"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type ProseProps = React.HTMLAttributes<HTMLDivElement>

export default function Prose({ className, ...props }: ProseProps) {
  return (
    <div
      className={cn(
        "max-w-prose md:max-w-[65ch]",
        className
      )}
      {...props}
    />
  )
}


