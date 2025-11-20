"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DemoHome() {
  
  const steps = [
    {
      id: "1-atoms",
      title: "1. Atoms",
      description: "Het kleinste deel. Gewoon een losse knop.",
      example: "Alleen de Knop",
    },
    {
      id: "2-molecules",
      title: "2. Molecules",
      description: "We plakken bouwstenen aan elkaar. Een knop hoort bij een invulveld.",
      example: "Knop + Invulveld",
    },
    {
      id: "3-organisms",
      title: "3. Organisms",
      description: "Een compleet stukje van de website dat je op zichzelf kan gebruiken.",
      example: "Nieuwsbrief Blokje",
    },
    {
      id: "4-templates",
      title: "4. Templates",
      description: "De indeling van de pagina, zonder echte tekst of plaatjes.",
      example: "Pagina Indeling",
    },
    {
      id: "5-pages",
      title: "5. Pages",
      description: "Het eindresultaat met echte tekst en foto's.",
      example: "De Landingspagina",
    },
    {
      id: "6-reuse",
      title: "6. Reuse",
      description: "Hetzelfde blok (organism) hergebruiken voor meerdere projecten.",
      example: "Meerdere Projectkaarten",
    },
  ]

  return (
    <div className="container mx-auto py-10 max-w-4xl relative">
      <div className="mb-10 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          Demo: Hoe we een website bouwen
        </h1>
        <p className="text-slate-500 text-lg">
          Een simpele uitleg van &quot;Atomic Design&quot; voor niet-technische mensen.
          Klik op de stappen om te zien hoe het werkt.
        </p>
      </div>

      <div className="grid gap-6">
        {steps.map((step) => (
          <Link key={step.id} href={`/demo/atomic-design/${step.id}`}>
            <Card className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer hover:shadow-md border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-xl">{step.title}</CardTitle>
                <CardDescription className="text-base">{step.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium text-slate-500">Voorbeeld: {step.example}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
