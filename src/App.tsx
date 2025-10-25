import './App.css'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Shield, Satellite, Compass, Truck, CheckCircle2, FileText, Send, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold">
            <Shield className="h-5 w-5" aria-hidden="true" />
            <span>Nightwatch Deck</span>
          </Link>

          <nav className="flex items-center gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn(buttonVariants({ variant: isActive ? 'default' : 'ghost', size: 'sm' }))
              }
            >
              Mission Overview
            </NavLink>
            <NavLink
              to="/briefing"
              className={({ isActive }) =>
                cn(buttonVariants({ variant: isActive ? 'default' : 'ghost', size: 'sm' }))
              }
            >
              Agent Briefing
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Routes>
          <Route index element={<MissionOverview />} />
          <Route path="/briefing" element={<AgentBriefing />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}

function StatusChip({
  label,
  color = 'emerald',
}: {
  label: string
  color?: 'emerald' | 'amber' | 'sky' | 'red'
}) {
  const colorMap = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  } as const

  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', colorMap[color])}>
      {label}
    </span>
  )
}

function MissionOverview() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" aria-hidden="true" />
              Operation Nightfall
            </CardTitle>
            <CardDescription>
              Satellite recon confirms unusual movement across the northern corridor.
            </CardDescription>
          </div>
          <StatusChip label="Active" color="emerald" />
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Eyes in the sky report intermittent signal spikes. Field teams are staged and awaiting final orders.
          </p>
        </CardContent>
        <CardFooter className="gap-2">
          <Button>
            <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
            Review mission packet
          </Button>
        </CardFooter>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Satellite className="h-4 w-4" aria-hidden="true" />
              Signal Intel
            </CardTitle>
            <StatusChip label="Stable" color="sky" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Spectrum watch shows routine chatter; spike windows scheduled at 0200, 0600, 2200Z.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Compass className="h-4 w-4" aria-hidden="true" />
              Field Ops
            </CardTitle>
            <StatusChip label="Staged" color="amber" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Alpha and Bravo positioned on ridgelines; night optics calibrated, routes plotted.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-4 w-4" aria-hidden="true" />
              Logistics
            </CardTitle>
            <StatusChip label="Green" color="emerald" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Fuel, rations, and med kits distributed; uplink trailers prepped for relocation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AgentBriefing() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" aria-hidden="true" />
            Deployment Checklist
          </CardTitle>
          <CardDescription>Confirm each step before dispatching the briefing to field teams.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-6">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" aria-hidden="true" />
              Validate sat pass timing and weather windows
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" aria-hidden="true" />
              Cross-check objectives with field commanders
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" aria-hidden="true" />
              Confirm logistics train and exfil routes
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" aria-hidden="true" />
              Encrypt and sign briefing packet
            </li>
          </ol>
        </CardContent>
        <CardFooter className="gap-2">
          <Button>
            <Send className="mr-2 h-4 w-4" aria-hidden="true" />
            Dispatch brief
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" aria-hidden="true" />
            Active Agents
          </CardTitle>
          <CardDescription>Assignments and readiness</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AgentRow codename="Raven" specialty="Signals analysis" readiness="Ready" />
          <AgentRow codename="Foxglove" specialty="Recon & surveillance" readiness="Standby" />
          <AgentRow codename="Kestrel" specialty="Logistics coordination" readiness="Ready" />
        </CardContent>
      </Card>
    </div>
  )
}

function AgentRow({
  codename,
  specialty,
  readiness,
}: {
  codename: string
  specialty: string
  readiness: 'Ready' | 'Standby'
}) {
  const color = readiness === 'Ready' ? 'emerald' : 'amber'
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium">{codename}</div>
        <div className="text-sm text-muted-foreground">{specialty}</div>
      </div>
      <StatusChip label={readiness} color={color as 'emerald' | 'amber'} />
    </div>
  )
}

function NotFound() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Route not found</CardTitle>
        <CardDescription>The page you’re looking for doesn’t exist.</CardDescription>
      </CardHeader>
      <CardFooter>
        <Link to="/" className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}>
          Back to overview
        </Link>
      </CardFooter>
    </Card>
  )
}

export default App
