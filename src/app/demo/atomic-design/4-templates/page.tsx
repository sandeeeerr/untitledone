"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, List } from "lucide-react"
import { DemoButton, useDemo, DemoProvider } from "../demo-components"

export default function TemplatesPageContent() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-black p-10 relative">
      <div className="mb-8 text-center max-w-xl">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">4. Templates</h2>
        <p className="text-xl text-slate-500 dark:text-slate-400">
          Voordat we de pagina invullen, maken we een "schets".<br/>
          We bepalen waar het "Nieuwsbrief Blok" komt te staan.
        </p>
      </div>

      {/* THE DEMO ELEMENT - WIREFRAME */}
      <div className="w-full max-w-4xl h-[600px] border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col shadow-sm bg-slate-50 dark:bg-slate-900">
        
        {/* Header Placeholder */}
        <div className="h-16 bg-slate-200 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 flex items-center px-8">
          <div className="w-32 h-6 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
          <div className="ml-auto flex gap-4">
            <div className="w-20 h-4 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
            <div className="w-20 h-4 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Main Content Placeholder */}
        <div className="flex-1 p-8 flex flex-col items-center justify-center gap-8">
          {/* Hero Text Placeholder */}
          <div className="w-2/3 h-12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
          <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
          
          {/* ORGANISM PLACEHOLDER */}
          <div className="w-full max-w-lg h-48 bg-blue-100 dark:bg-blue-900/30 rounded-lg border-2 border-dashed border-blue-400 dark:border-blue-600 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
            [ Hier komt: Het Nieuwsbrief Blok ]
          </div>
        </div>

        {/* Footer Placeholder */}
        <div className="h-24 bg-slate-200 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 mt-auto flex items-center justify-center">
           <div className="w-48 h-4 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
        </div>

      </div>

      {/* Navigation */}
      <div className="fixed bottom-10 right-10 flex gap-4">
        <Link href="/demo/atomic-design">
          <Button variant="outline" size="sm">
            <List className="mr-2 h-4 w-4" /> Overzicht
          </Button>
        </Link>
        <Link href="/demo/atomic-design/5-pages">
          <DemoButton size="sm">
            Volgende Stap <ArrowRight className="ml-2 h-4 w-4" />
          </DemoButton>
        </Link>
      </div>
    </div>
  )
}
