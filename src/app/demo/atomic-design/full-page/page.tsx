"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wand2, ArrowRight, Check, Music, Users, Zap, Download, Share2, Play, Heart } from "lucide-react"
import { DemoButton, useDemo, DemoProvider } from "../demo-components"
import { Suspense } from "react"

function FullPageContent() {
  const { toggleCrazy, isCrazy } = useDemo()
  const searchParams = useSearchParams()
  const isInteractive = searchParams.get("interactive") === "true"

  if (!isInteractive) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-slate-500">Deze pagina is alleen beschikbaar in de interactive demo.</p>
          <Link href="/demo/atomic-design/1-atoms?interactive=true">
            <Button className="mt-4">Start Interactive Demo</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-white dark:bg-black relative">
      {/* Header met navigatie knoppen */}
      <header className="border-b bg-white dark:bg-slate-950 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight">UntitledOne</div>
          <nav className="flex gap-4">
            <DemoButton variant="ghost" size="sm">Functies</DemoButton>
            <DemoButton variant="ghost" size="sm">Prijzen</DemoButton>
            <DemoButton variant="outline" size="sm">Inloggen</DemoButton>
            <DemoButton size="sm">Gratis Proberen</DemoButton>
          </nav>
        </div>
      </header>

      {/* Hero sectie met grote CTA knop */}
      <section className="py-20 px-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-extrabold tracking-tight mb-6">
            Muziek maken doe je samen
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Werk samen met producers en DJ's van over de hele wereld. Deel projecten, krijg feedback en maak betere muziek.
          </p>
          <div className="flex gap-4 justify-center">
            <DemoButton size="lg" className="text-lg px-8">
              Start Nu Gratis
            </DemoButton>
            <DemoButton size="lg" variant="outline" className="text-lg px-8">
              Bekijk Demo
            </DemoButton>
          </div>
        </div>
      </section>

      {/* Features sectie met meerdere knoppen */}
      <section className="py-20 px-6 bg-white dark:bg-slate-950">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Waarom UntitledOne?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Music className="w-10 h-10 mb-4 text-primary" />
                <CardTitle>Samenwerken</CardTitle>
                <CardDescription>
                  Deel je projecten met anderen en werk samen in real-time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DemoButton className="w-full">Meer Info</DemoButton>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="w-10 h-10 mb-4 text-primary" />
                <CardTitle>Feedback</CardTitle>
                <CardDescription>
                  Krijg tijdgebaseerde feedback op je tracks van andere producers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DemoButton className="w-full">Ontdekken</DemoButton>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="w-10 h-10 mb-4 text-primary" />
                <CardTitle>Snel & Eenvoudig</CardTitle>
                <CardDescription>
                  Upload, deel en beheer je projecten zonder gedoe.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DemoButton className="w-full">Proberen</DemoButton>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Actie sectie met meerdere knoppen */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Klaar om te beginnen?</CardTitle>
              <CardDescription className="text-lg">
                Upload je eerste project en deel het met de community.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <DemoButton size="lg" className="flex-1 max-w-xs">
                <Download className="mr-2 h-5 w-5" />
                Project Uploaden
              </DemoButton>
              <DemoButton size="lg" variant="outline" className="flex-1 max-w-xs">
                <Share2 className="mr-2 h-5 w-5" />
                Delen met Vrienden
              </DemoButton>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer met knoppen */}
      <footer className="border-t bg-white dark:bg-slate-950 py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">Product</h3>
              <div className="flex flex-col gap-2">
                <DemoButton variant="ghost" className="justify-start" size="sm">Functies</DemoButton>
                <DemoButton variant="ghost" className="justify-start" size="sm">Prijzen</DemoButton>
                <DemoButton variant="ghost" className="justify-start" size="sm">Updates</DemoButton>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-4">Community</h3>
              <div className="flex flex-col gap-2">
                <DemoButton variant="ghost" className="justify-start" size="sm">Forum</DemoButton>
                <DemoButton variant="ghost" className="justify-start" size="sm">Discord</DemoButton>
                <DemoButton variant="ghost" className="justify-start" size="sm">Events</DemoButton>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <div className="flex flex-col gap-2">
                <DemoButton variant="ghost" className="justify-start" size="sm">Help Center</DemoButton>
                <DemoButton variant="ghost" className="justify-start" size="sm">Contact</DemoButton>
                <DemoButton variant="ghost" className="justify-start" size="sm">Status</DemoButton>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-4">Account</h3>
              <div className="flex flex-col gap-2">
                <DemoButton variant="ghost" className="justify-start" size="sm">Inloggen</DemoButton>
                <DemoButton variant="ghost" className="justify-start" size="sm">Registreren</DemoButton>
                <DemoButton variant="ghost" className="justify-start" size="sm">Instellingen</DemoButton>
              </div>
            </div>
          </div>
          <div className="border-t pt-8 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              &copy; 2025 UntitledOne. Alle rechten voorbehouden.
            </p>
            <div className="flex gap-2">
              <DemoButton variant="ghost" size="sm">
                <Heart className="h-4 w-4" />
              </DemoButton>
              <DemoButton variant="ghost" size="sm">
                <Share2 className="h-4 w-4" />
              </DemoButton>
            </div>
          </div>
        </div>
      </footer>

      {/* Controls */}
      <div className="fixed bottom-10 right-10 flex gap-4 items-center z-50">
        <Button 
          onClick={toggleCrazy} 
          variant="secondary" 
          className="border-2 border-purple-500 bg-purple-50 text-purple-700 hover:bg-purple-100"
        >
          <Wand2 className="mr-2 h-4 w-4" />
          {isCrazy ? "Zet Normaal" : "Maak Gek!"}
        </Button>

        <Link href="/demo/atomic-design/tokens?interactive=true">
          <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white">
            Bekijk Tokens Demo <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Link href="/demo/atomic-design">
          <Button variant="outline">
            <Check className="mr-2 h-4 w-4" /> Klaar met Demo
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
        <FullPageContent />
      </Suspense>
    </DemoProvider>
  )
}

