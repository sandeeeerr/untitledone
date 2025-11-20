"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, List } from "lucide-react"
import { DemoButton, useDemo, DemoProvider } from "../demo-components"

export default function MoleculesPageContent() {
  const { toggleCrazy } = useDemo()

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-black p-10 relative">
      <div className="mb-12 text-center max-w-xl">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">2. Molecules</h2>
        <p className="text-xl text-slate-500 dark:text-slate-400">
          Nu plakken we er iets tegenaan: een invulveld.<br/>
          De knop blijft hetzelfde, maar krijgt context.
        </p>
      </div>

      {/* THE DEMO ELEMENT */}
      <div className="p-20 min-h-[400px] min-w-[600px] flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
        
        <div className="flex w-full max-w-md items-end space-x-2">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="email" className="text-left">Je Emailadres</Label>
            <Input type="email" id="email" placeholder="naam@voorbeeld.nl" />
          </div>
          <DemoButton type="submit" size="lg">Aanmelden</DemoButton>
        </div>

      </div>

       {/* Controls */}
       <div className="fixed bottom-10 right-10 flex gap-4 items-center">
        <Link href="/demo/atomic-design">
          <Button variant="outline" size="sm">
            <List className="mr-2 h-4 w-4" /> Overzicht
          </Button>
        </Link>
        <Link href="/demo/atomic-design/3-organisms">
          <DemoButton size="sm">
            Volgende Stap <ArrowRight className="ml-2 h-4 w-4" />
          </DemoButton>
        </Link>
      </div>
    </div>
  )
}
