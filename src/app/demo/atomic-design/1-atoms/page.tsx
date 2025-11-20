"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, ArrowLeft, List, Wand2, Music } from "lucide-react"
import { DemoButton, useDemo, DemoProvider } from "../demo-components"
import { Suspense } from "react"

function AtomsPageContent() {
  const { toggleCrazy, isCrazy } = useDemo()
  const searchParams = useSearchParams()
  const isInteractive = searchParams.get("interactive") === "true"
  const [currentAtom, setCurrentAtom] = useState(0)

  const atoms = [
    {
      id: 1,
      name: "Button",
      description: "Een klikbare knop",
      component: <DemoButton size="lg">Aanmelden</DemoButton>
    },
    {
      id: 2,
      name: "Input",
      description: "Een invulveld voor tekst",
      component: <Input type="email" placeholder="naam@voorbeeld.nl" className="w-64" />
    },
    {
      id: 3,
      name: "Label",
      description: "Een label voor tekst",
      component: <Label className="text-lg">Je Emailadres</Label>
    },
    {
      id: 4,
      name: "Icon",
      description: "Een icoon voor visuele communicatie",
      component: <Music className="h-16 w-16 text-primary" />
    }
  ]

  const nextAtom = () => {
    setCurrentAtom((prev) => (prev + 1) % atoms.length)
  }

  const prevAtom = () => {
    setCurrentAtom((prev) => (prev - 1 + atoms.length) % atoms.length)
  }

  const currentAtomData = atoms[currentAtom]

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-black p-10 relative">
      <div className="mb-12 text-center max-w-xl">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">1. Atoms</h2>
        <p className="text-xl text-slate-500 dark:text-slate-400 mb-2">
          {isInteractive 
            ? "Pas nu de bouwsteen aan. Kijk wat er gebeurt!" 
            : "Dit zijn de bouwstenen. Alles is hieruit opgebouwd."}
        </p>
        <p className="text-sm text-slate-400">
          Atom {currentAtom + 1} van {atoms.length}: {currentAtomData.name}
        </p>
      </div>

      {/* THE DEMO ELEMENT WITH CAROUSEL */}
      <div className="relative w-full max-w-2xl">
        {/* Navigation Arrows */}
        <button
          onClick={prevAtom}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          aria-label="Vorige atom"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <button
          onClick={nextAtom}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          aria-label="Volgende atom"
        >
          <ArrowRight className="h-5 w-5" />
        </button>

        {/* Atom Display Area */}
        <div className="p-20 min-h-[400px] flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
          <div key={currentAtom} className="animate-in fade-in slide-in-from-right-4 duration-300">
            {currentAtomData.component}
          </div>
        </div>

        {/* Atom Info */}
        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {currentAtomData.description}
          </p>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {atoms.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentAtom(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentAtom
                  ? "w-8 bg-slate-600 dark:bg-slate-400"
                  : "w-2 bg-slate-300 dark:bg-slate-600"
              }`}
              aria-label={`Ga naar atom ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="fixed bottom-10 right-10 flex gap-4 items-center">
        {isInteractive && (
          <Button 
              onClick={toggleCrazy} 
              variant="secondary" 
              className="mr-4 border-2 border-purple-500 bg-purple-50 text-purple-700 hover:bg-purple-100"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            {isCrazy ? "Zet Normaal" : "Maak de Huisstijl Gek!"}
          </Button>
        )}

        {!isInteractive && (
          <Link href="/demo/atomic-design">
            <Button variant="outline" size="sm">
              <List className="mr-2 h-4 w-4" /> Overzicht
            </Button>
          </Link>
        )}

        {isInteractive ? (
           <Link href="/demo/atomic-design/3-organisms?interactive=true">
             <Button size="lg" className={isCrazy ? "animate-pulse bg-purple-600 hover:bg-purple-700" : ""}>
               Bekijk Resultaat (Stap 3) <ArrowRight className="ml-2 h-4 w-4" />
             </Button>
           </Link>
        ) : (
          <Link href="/demo/atomic-design/2-molecules">
            <DemoButton size="sm">
              Volgende Stap <ArrowRight className="ml-2 h-4 w-4" />
            </DemoButton>
          </Link>
        )}
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <DemoProvider>
      <Suspense fallback={<div>Laden...</div>}>
        <AtomsPageContent />
      </Suspense>
    </DemoProvider>
  )
}
