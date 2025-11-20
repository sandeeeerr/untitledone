"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wand2, Check, ArrowRight } from "lucide-react"
import { DemoButton, useDemo, DemoProvider } from "../demo-components"
import { Suspense } from "react"

function TokensPageContent() {
  const searchParams = useSearchParams()
  const isInteractive = searchParams.get("interactive") === "true"
  const [primaryColor, setPrimaryColor] = useState("#3b82f6") // blue-500
  const [borderRadius, setBorderRadius] = useState(8)

  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement
      // Convert hex to HSL for CSS variable
      const hexToHsl = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255
        const g = parseInt(hex.slice(3, 5), 16) / 255
        const b = parseInt(hex.slice(5, 7), 16) / 255

        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        let h = 0
        let s = 0
        const l = (max + min) / 2

        if (max !== min) {
          const d = max - min
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
          switch (max) {
            case r:
              h = ((g - b) / d + (g < b ? 6 : 0)) / 6
              break
            case g:
              h = ((b - r) / d + 2) / 6
              break
            case b:
              h = ((r - g) / d + 4) / 6
              break
          }
        }

        return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
      }

      root.style.setProperty("--primary", hexToHsl(primaryColor))
      root.style.setProperty("--radius", `${borderRadius}px`)
    }
  }, [primaryColor, borderRadius])

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
    <div className="min-h-screen w-full bg-white dark:bg-black p-10 relative">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-200 mb-4">
            Design Tokens Demo
          </h2>
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Pas de "huisstijl regels" aan en zie hoe alles automatisch verandert. 
            Net zoals je één knop aanpast, kun je ook één kleur of vorm aanpassen.
          </p>
        </div>

        {/* Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Pas de Huisstijl Aan</CardTitle>
            <CardDescription>
              Verander de primaire kleur en de rondheid van hoeken. Alles past zich automatisch aan!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Primary Color Control */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="color-picker" className="text-base font-medium">
                  Primaire Kleur
                </Label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded border-2 border-slate-300 dark:border-slate-700"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <Input
                    id="color-picker"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Border Radius Control */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="radius-slider" className="text-base font-medium">
                  Rondheid van Hoeken: {borderRadius}px
                </Label>
              </div>
              <Input
                id="radius-slider"
                type="range"
                min="0"
                max="24"
                value={borderRadius}
                onChange={(e) => setBorderRadius(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Code Preview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Wat gebeurt er in de Code?</CardTitle>
            <CardDescription>
              We passen alleen deze twee regels aan, en alles verandert automatisch:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`:root {
  --primary: ${primaryColor};
  --radius: ${borderRadius}px;
}`}</code>
            </pre>
            <p className="text-sm text-muted-foreground mt-3">
              Deze "tokens" worden gebruikt door alle knoppen, kaarten en andere onderdelen.
            </p>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Voorbeeld 1: Knoppen</CardTitle>
              <CardDescription>Alle knoppen gebruiken de nieuwe kleur en vorm.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <DemoButton className="w-full">Primaire Knop</DemoButton>
              <DemoButton variant="outline" className="w-full">Secundaire Knop</DemoButton>
              <DemoButton variant="secondary" className="w-full">Tertiaire Knop</DemoButton>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Voorbeeld 2: Kaarten</CardTitle>
              <CardDescription>Ook kaarten passen zich aan de nieuwe stijl aan.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  Deze kaart gebruikt de nieuwe primaire kleur en rondheid.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Full Example */}
        <Card>
          <CardHeader>
            <CardTitle>Volledig Voorbeeld</CardTitle>
            <CardDescription>
              Een compleet formulier met de nieuwe huisstijl:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="demo-name">Naam</Label>
                <Input id="demo-name" placeholder="Je naam" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="demo-email">Email</Label>
                <Input id="demo-email" type="email" placeholder="email@voorbeeld.nl" />
              </div>
              <DemoButton className="w-full">Versturen</DemoButton>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-10 right-10 flex gap-4 items-center">
        <Link href="/demo/atomic-design">
          <Button size="lg">
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
        <TokensPageContent />
      </Suspense>
    </DemoProvider>
  )
}


