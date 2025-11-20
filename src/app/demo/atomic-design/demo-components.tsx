"use client"

import React, { createContext, useContext, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Context for the "Crazy Mode"
type DemoContextType = {
  isCrazy: boolean
  toggleCrazy: () => void
}

const DemoContext = createContext<DemoContextType>({
  isCrazy: false,
  toggleCrazy: () => {},
})

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isCrazy, setIsCrazy] = useState(false)
  return (
    <DemoContext.Provider value={{ isCrazy, toggleCrazy: () => setIsCrazy(!isCrazy) }}>
      {children}
    </DemoContext.Provider>
  )
}

export function useDemo() {
  return useContext(DemoContext)
}

// The Demo Button that reacts to the context
export function DemoButton(props: React.ComponentProps<typeof Button>) {
  const { isCrazy } = useDemo()
  
  return (
    <Button
      {...props}
      className={cn(
        props.className,
        isCrazy && "bg-[#ff00ff] text-[#ffff00] font-serif text-xl border-4 border-[#00ff00] rounded-none rotate-[-2deg] hover:bg-[#d100d1] hover:rotate-[2deg] transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      )}
    />
  )
}
