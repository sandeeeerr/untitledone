"use client"

import * as React from "react"
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { setLanguageCookie } from "@/lib/cookies"
import { useRouter } from "next/navigation"

export function LanguageToggle() {
  const router = useRouter()

  const change = (locale: string) => {
    setLanguageCookie(locale)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Language">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => change("en")}>English</DropdownMenuItem>
        <DropdownMenuItem onClick={() => change("nl")}>Nederlands</DropdownMenuItem>
        <DropdownMenuItem onClick={() => change("fr")}>Français</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default LanguageToggle


