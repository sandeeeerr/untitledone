"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, List, Wand2, Lock, Download, Share2 } from "lucide-react"
import { DemoButton, useDemo, DemoProvider } from "../demo-components"
import { Suspense } from "react"

function OrganismsPageContent() {
  const { toggleCrazy, isCrazy } = useDemo()
  const searchParams = useSearchParams()
  const isInteractive = searchParams.get("interactive") === "true"

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-black p-10 relative">
       <div className="mb-8 text-center max-w-xl">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">3. Organisms</h2>
        <p className="text-xl text-slate-500 dark:text-slate-400">
          {isInteractive 
            ? "Zie je? Omdat we de bouwsteen hebben aangepast, is ALLES aangepast." 
            : "Een compleet stukje van de website dat je op zichzelf kan gebruiken."}
        </p>
      </div>

      {/* THE DEMO ELEMENT(S) - één grote box net als bij Molecules */}
      <div className="p-20 min-h-[400px] min-w-[600px] flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
        <div className="flex flex-wrap gap-6 items-start justify-center w-full max-w-7xl">
          {/* 1. The Original Newsletter Card */}
          <div className="w-full max-w-md">
            <div className="text-center mb-4 text-sm text-slate-400 font-medium">1. Nieuwsbrief</div>
            <Card className="w-full shadow-lg">
              <CardHeader>
                <CardTitle>Nieuwsbrief</CardTitle>
                <CardDescription>Blijf op de hoogte.</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Consistent layout: knop naast input zoals in molecules */}
                <div className="flex w-full items-end space-x-2">
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="email">Emailadres</Label>
                    <Input type="email" id="email" placeholder="naam@voorbeeld.nl" />
                  </div>
                  <DemoButton type="submit">Aanmelden</DemoButton>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 2. The NEW Login Card (Only visible in Interactive Mode) */}
          {isInteractive && (
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-center mb-4 text-sm text-purple-500 font-bold">2. Inloggen</div>
              <Card className="w-full shadow-lg border-purple-200 dark:border-purple-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" /> Inloggen
                  </CardTitle>
                  <CardDescription>Toegang tot je account.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <div className="grid w-full gap-1.5 text-left">
                      <Label htmlFor="login-email">Gebruikersnaam</Label>
                      <Input type="email" id="login-email" />
                    </div>
                    <div className="grid w-full gap-1.5 text-left">
                      <Label htmlFor="login-pass">Wachtwoord</Label>
                      <Input type="password" id="login-pass" />
                    </div>
                    {/* HERE IS THE SAME BUTTON */}
                    <DemoButton type="submit" variant="default" className="w-full">
                      Nu Inloggen
                    </DemoButton>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 3. The NEW Action Card with 2 buttons (Only visible in Interactive Mode) */}
          {isInteractive && (
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <div className="text-center mb-4 text-sm text-purple-500 font-bold">3. Acties (2 knoppen!)</div>
              <Card className="w-full shadow-lg border-purple-200 dark:border-purple-900">
                <CardHeader>
                  <CardTitle>Download & Deel</CardTitle>
                  <CardDescription>Je project is klaar. Wat wil je doen?</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground mb-2">
                      Beide knoppen gebruiken dezelfde bouwsteen!
                    </p>
                    {/* TWO BUTTONS SIDE BY SIDE */}
                    <div className="flex gap-2">
                      <DemoButton variant="default" className="flex-1">
                        <Download className="mr-2 h-4 w-4" />
                        Downloaden
                      </DemoButton>
                      <DemoButton variant="outline" className="flex-1">
                        <Share2 className="mr-2 h-4 w-4" />
                        Delen
                      </DemoButton>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
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
           {isCrazy ? "Zet Normaal" : "Nog eens: Maak Gek!"}
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
            <>
              <Link href="/demo/atomic-design/full-page?interactive=true">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Bekijk Volledige Pagina <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo/atomic-design">
                <Button variant="outline">
                  Klaar met Demo
                </Button>
              </Link>
            </>
        ) : (
            <Link href="/demo/atomic-design/4-templates">
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
        <OrganismsPageContent />
      </Suspense>
    </DemoProvider>
  )
}
