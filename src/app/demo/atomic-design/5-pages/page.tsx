"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { List, Check, Wand2, ArrowRight } from "lucide-react"
import { DemoButton, useDemo, DemoProvider } from "../demo-components"
import { Suspense } from "react"

function PagesPageContent() {
  const { toggleCrazy, isCrazy } = useDemo()

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-black p-10 relative">
      <div className="mb-8 text-center max-w-xl">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">5. Pages</h2>
        <p className="text-xl text-slate-500 dark:text-slate-400">
          Alles komt samen. De pagina is af.
        </p>
      </div>

      {/* THE DEMO ELEMENT - FULL PAGE */}
      <div className="w-full max-w-4xl h-[500px] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col shadow-2xl bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50 scale-90 origin-top">
        
        {/* Header */}
        <header className="h-16 border-b bg-white dark:bg-slate-950 flex items-center justify-between px-8">
          <div className="font-bold text-xl tracking-tight">UntitledOne</div>
          <nav className="flex gap-6 text-sm font-medium text-muted-foreground">
            <span>Functies</span>
            <span>Prijzen</span>
            <span>Over ons</span>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-center mb-10 space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl">
              Muziek maken doe je samen
            </h1>
            <p className="text-muted-foreground max-w-[600px]">
              Werk samen met producers en DJ's van over de hele wereld.
            </p>
          </div>
          
          {/* ORGANISM INSTANCE */}
          <div className="w-full max-w-lg">
            <Card className="w-full shadow-md border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle>Schrijf je in</CardTitle>
                <CardDescription>
                   Wees er als eerste bij.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex w-full items-end space-x-2">
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="page-email">Emailadres</Label>
                    <Input type="email" id="page-email" placeholder="producer@studio.com" />
                  </div>
                  <DemoButton type="submit">Inschrijven</DemoButton>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-10 right-10 flex gap-4 items-center">
        <Link href="/demo/atomic-design">
           <Button variant="outline" size="sm">
            <List className="mr-2 h-4 w-4" /> Overzicht
          </Button>
        </Link>

        <Link href="/demo/atomic-design/1-atoms?interactive=true">
          <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
            <Wand2 className="mr-2 h-4 w-4" /> Demo: Pas Huisstijl Aan
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <DemoProvider>
      <Suspense fallback={<div>Laden...</div>}>
        <PagesPageContent />
      </Suspense>
    </DemoProvider>
  )
}
