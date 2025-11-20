"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DemoButton } from "../demo-components"
import { Music, ArrowRight, List, Filter } from "lucide-react"

type Project = {
  id: number
  name: string
  role: string
  status: "in-progress" | "review" | "done"
}

const projects: Project[] = [
  {
    id: 1,
    name: "Late Night Remix",
    role: "Producer + Vocalist",
    status: "in-progress",
  },
  {
    id: 2,
    name: "Festival Set 2025",
    role: "DJ Set",
    status: "review",
  },
  {
    id: 3,
    name: "Lo-fi Beat Tape",
    role: "Beatmaker",
    status: "done",
  },
]

function ProjectCard({ project }: { project: Project }) {
  const statusLabel =
    project.status === "in-progress"
      ? "Bezig"
      : project.status === "review"
      ? "Feedback"
      : "Afgerond"

  const statusVariant =
    project.status === "in-progress"
      ? "secondary"
      : project.status === "review"
      ? "outline"
      : "default"

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Music className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-base">{project.name}</CardTitle>
          <CardDescription>{project.role}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={statusVariant as any}>{statusLabel}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <DemoButton className="flex-1" size="sm">
            Open project
          </DemoButton>
          <DemoButton className="flex-1" size="sm" variant="outline">
            Bekijk feedback
          </DemoButton>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ReusePage() {
  const [step, setStep] = useState<"molecules" | "component" | "context">("molecules")

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-black p-10 relative">
      <div className="mb-8 text-center max-w-2xl">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">6. Hergebruik</h2>
        <p className="text-xl text-slate-500 dark:text-slate-400">
          {step === "molecules" && "Eerst: alle losse onderdelen (molecules) die we nodig hebben"}
          {step === "component" && "Dan: één compleet component (organism) dat we kunnen hergebruiken"}
          {step === "context" && "Eindelijk: het component in gebruik op een echte pagina"}
        </p>
      </div>

      {/* Step Navigation */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={step === "molecules" ? "default" : "outline"}
          size="sm"
          onClick={() => setStep("molecules")}
        >
          1. Molecules
        </Button>
        <Button
          variant={step === "component" ? "default" : "outline"}
          size="sm"
          onClick={() => setStep("component")}
        >
          2. Component
        </Button>
        <Button
          variant={step === "context" ? "default" : "outline"}
          size="sm"
          onClick={() => setStep("context")}
        >
          3. In Context
        </Button>
      </div>

      {/* Molecules View */}
      {step === "molecules" && (
        <div className="p-20 min-h-[400px] min-w-[600px] flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center text-sm text-slate-400 font-medium mb-4">
              Losse onderdelen (molecules) die we nodig hebben:
            </div>
            
            {/* Card molecule */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Card (kaartje)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Dit is een lege kaart</p>
              </CardContent>
            </Card>

            {/* Icon molecule */}
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Music className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium">Icon (icoon)</div>
                <div className="text-xs text-muted-foreground">Muziek icoon</div>
              </div>
            </div>

            {/* Title + Subtitle molecule */}
            <div className="space-y-1 p-3 border rounded-lg">
              <div className="text-base font-semibold">Titel + Ondertitel</div>
              <div className="text-sm text-muted-foreground">Late Night Remix</div>
              <div className="text-xs text-muted-foreground mt-1">Producer + Vocalist</div>
            </div>

            {/* Badge molecule */}
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant="secondary">Bezig</Badge>
            </div>

            {/* Buttons molecule */}
            <div className="flex gap-2 p-3 border rounded-lg">
              <DemoButton size="sm" className="flex-1">Open project</DemoButton>
              <DemoButton size="sm" variant="outline" className="flex-1">Bekijk feedback</DemoButton>
            </div>
          </div>
        </div>
      )}

      {/* Component View */}
      {step === "component" && (
        <div className="p-20 min-h-[400px] min-w-[600px] flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
          <div className="w-full max-w-md">
            <div className="text-center text-sm text-slate-400 font-medium mb-4">
              Alle molecules samen = één component (organism)
            </div>
            <ProjectCard project={projects[0]} />
            <p className="mt-4 text-sm text-center text-muted-foreground">
              Dit component kunnen we nu overal gebruiken!
            </p>
          </div>
        </div>
      )}

      {/* Context View */}
      {step === "context" && (
        <div className="w-full max-w-5xl">
          {/* Page Header */}
          <div className="mb-6 space-y-4">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              Mijn Projecten
            </h3>
            
            {/* Filters */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="search" className="text-sm">Zoeken</Label>
                <Input id="search" placeholder="Zoek projecten..." className="mt-1" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
                <Button size="sm">Nieuw Project</Button>
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          <p className="mt-6 text-sm text-muted-foreground text-center">
            Hetzelfde component, maar met verschillende projectgegevens. We hoeven het maar één keer te maken!
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="fixed bottom-10 right-10 flex gap-4 items-center">
        <Link href="/demo/atomic-design">
          <Button variant="outline" size="sm">
            <List className="mr-2 h-4 w-4" /> Overzicht
          </Button>
        </Link>
        {step !== "context" && (
          <Button
            size="sm"
            onClick={() => {
              if (step === "molecules") setStep("component")
              if (step === "component") setStep("context")
            }}
          >
            Volgende <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
