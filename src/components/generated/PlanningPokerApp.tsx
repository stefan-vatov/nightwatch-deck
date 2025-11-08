import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  RefreshCw,
  Eye,
  Copy,
  Check,
  LogOut,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type EstimationCard = 0 | 1 | 2 | 3 | 5 | 8 | 13 | 21 | 34 | 55 | 89 | "?"
type Player = {
  id: string
  name: string
  estimate: EstimationCard | null
  isOwner: boolean
}
type Room = {
  id: string
  players: Player[]
  revealed: boolean
}
type AppState = "home" | "join" | "room"

const FIBONACCI_CARDS: EstimationCard[] = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, "?"]
const HOME_HIGHLIGHTS = [
  "Lightning-fast room setup",
  "Ready-made Fibonacci deck",
  "Owners control reveal/reset",
  "Clipboard-friendly share links",
]
const JOIN_TIPS = [
  "Room codes are six characters.",
  "Joining never overwrites an active room.",
  "Use the copied invite link for quick access.",
]

const inputClasses =
  "w-full rounded-2xl border border-input bg-background px-4 py-3 text-base shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"

// @component: PlanningPokerApp
export const PlanningPokerApp = () => {
  const [appState, setAppState] = useState<AppState>("home")
  const [room, setRoom] = useState<Room | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [nameInput, setNameInput] = useState("")
  const [roomIdInput, setRoomIdInput] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const roomId = params.get("room")
    if (roomId) {
      setRoomIdInput(roomId)
      setAppState("join")
    }
  }, [])

  const generateRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase()

  const createRoom = () => {
    if (!nameInput.trim()) return
    const roomId = generateRoomId()
    const player: Player = {
      id: Math.random().toString(36).substring(7),
      name: nameInput.trim(),
      estimate: null,
      isOwner: true,
    }
    const newRoom: Room = {
      id: roomId,
      players: [player],
      revealed: false,
    }
    setCurrentPlayer(player)
    setRoom(newRoom)
    setAppState("room")
    window.history.pushState({}, "", `?room=${roomId}`)
  }

  const joinRoom = () => {
    if (!nameInput.trim() || !roomIdInput.trim()) return
    const player: Player = {
      id: Math.random().toString(36).substring(7),
      name: nameInput.trim(),
      estimate: null,
      isOwner: false,
    }
    const newRoom: Room = {
      id: roomIdInput.trim().toUpperCase(),
      players: [player],
      revealed: false,
    }
    setCurrentPlayer(player)
    setRoom(newRoom)
    setAppState("room")
  }

  const selectCard = (card: EstimationCard) => {
    if (!currentPlayer || !room) return
    const updatedPlayer = {
      ...currentPlayer,
      estimate: card,
    }
    setCurrentPlayer(updatedPlayer)
    const updatedPlayers = room.players.map(player => (player.id === currentPlayer.id ? updatedPlayer : player))
    setRoom({
      ...room,
      players: updatedPlayers,
    })
  }

  const revealEstimates = () => {
    if (!room || !currentPlayer?.isOwner) return
    setRoom({
      ...room,
      revealed: true,
    })
  }

  const resetEstimates = () => {
    if (!room || !currentPlayer?.isOwner) return
    const resetPlayers = room.players.map(player => ({
      ...player,
      estimate: null,
    }))
    setRoom({
      ...room,
      players: resetPlayers,
      revealed: false,
    })
    if (currentPlayer) {
      setCurrentPlayer({
        ...currentPlayer,
        estimate: null,
      })
    }
  }

  const copyRoomLink = async () => {
    if (!room) return
    const link = `${window.location.origin}${window.location.pathname}?room=${room.id}`
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        throw new Error("Clipboard API unavailable")
      }
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy room link", error)
    }
  }

  const leaveRoom = () => {
    setRoom(null)
    setCurrentPlayer(null)
    setNameInput("")
    setRoomIdInput("")
    setAppState("home")
    window.history.pushState({}, "", window.location.pathname)
  }

  const getEstimateGroups = () => {
    if (!room) return []
    const groups = new Map<EstimationCard | null, Player[]>()
    room.players.forEach(player => {
      const estimate = player.estimate
      if (!groups.has(estimate)) {
        groups.set(estimate, [])
      }
      groups.get(estimate)?.push(player)
    })
    return Array.from(groups.entries()).sort((a, b) => {
      if (a[0] === null) return 1
      if (b[0] === null) return -1
      if (a[0] === "?") return 1
      if (b[0] === "?") return -1
      return (a[0] as number) - (b[0] as number)
    })
  }

  const allPlayersVoted = () => room?.players.every(player => player.estimate !== null) ?? false

  const renderHome = () => (
    <motion.div
      key="home"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="relative overflow-hidden rounded-[2rem] border-none bg-gradient-to-br from-primary/10 via-card to-card/70 p-8 shadow-xl ring-1 ring-primary/10">
          <CardHeader className="space-y-6 p-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-primary-foreground">
              <Sparkles className="h-4 w-4" />
              Live session
            </div>
            <div>
              <CardTitle className="text-4xl font-semibold tracking-tight text-foreground">
                Set the tone for thoughtful estimation
              </CardTitle>
              <CardDescription className="mt-3 text-base">
                Planning Poker keeps the discussion human while the UI stays out of the way. Spin up a room, invite the
                squad, and move from idea to estimate in minutes.
              </CardDescription>
            </div>
            <ul className="grid gap-3 text-sm text-foreground/80 sm:grid-cols-2">
              {HOME_HIGHLIGHTS.map(item => (
                <li
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/30 bg-white/60 px-3 py-2 shadow-sm last:mb-0 dark:border-white/10 dark:bg-white/5"
                >
                  <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_0_4px_rgba(99,102,241,0.15)]" />
                  {item}
                </li>
              ))}
            </ul>
          </CardHeader>
        </Card>

        <Card className="rounded-[2rem] border border-border/70 bg-card/95 shadow-xl">
          <CardHeader className="space-y-2">
            <CardTitle>Create a room</CardTitle>
            <CardDescription>Drop your name in and you're ready to host.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="home-name">
                Your name
              </label>
              <input
                id="home-name"
                type="text"
                value={nameInput}
                onChange={event => setNameInput(event.target.value)}
                onKeyDown={event => event.key === "Enter" && createRoom()}
                placeholder="Sofia Patel"
                className={inputClasses}
              />
            </div>
            <Button
              size="lg"
              onClick={createRoom}
              disabled={!nameInput.trim()}
              className="w-full rounded-2xl text-base font-semibold"
            >
              Create Room
            </Button>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              or
              <div className="h-px flex-1 bg-border" />
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setAppState("join")}
              className="w-full rounded-2xl border border-dashed border-border/70 text-base font-semibold hover:border-border hover:bg-muted/50"
            >
              Join Existing Room
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )

  const renderJoin = () => (
    <motion.div
      key="join"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="rounded-[2rem] border border-border/70 bg-card/95 shadow-xl">
          <CardHeader className="space-y-5">
            <CardTitle>Join a room</CardTitle>
            <CardDescription>Every room is lightweight—drop in and align quickly.</CardDescription>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {JOIN_TIPS.map(item => (
                <li key={item} className="flex items-start gap-3 rounded-2xl border border-dashed border-border/70 px-3 py-2">
                  <ShieldCheck className="mt-1 h-4 w-4 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 border-t border-border/60 pt-6 sm:flex-row">
            <Button
              variant="ghost"
              onClick={() => setAppState("home")}
              className="flex-1 rounded-2xl border border-border/80 text-base font-medium"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={joinRoom}
              disabled={!nameInput.trim() || !roomIdInput.trim()}
              className="flex-1 rounded-2xl text-base font-semibold"
            >
              Join Room
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border border-border/70 bg-card/95 shadow-xl">
          <CardHeader className="space-y-2">
            <CardTitle>Enter your details</CardTitle>
            <CardDescription>We'll spin up a local-only session with this info.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="join-name">
                Your name
              </label>
              <input
                id="join-name"
                type="text"
                value={nameInput}
                onChange={event => setNameInput(event.target.value)}
                placeholder="Amina, Jake, Priya..."
                className={inputClasses}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="join-room">
                Room code
              </label>
              <input
                id="join-room"
                type="text"
                value={roomIdInput}
                onChange={event => setRoomIdInput(event.target.value.toUpperCase())}
                onKeyDown={event => event.key === "Enter" && joinRoom()}
                placeholder="e.g. A1B2C3"
                className={cn(inputClasses, "uppercase tracking-[0.35em]")}
              />
            </div>
            <Button
              size="lg"
              onClick={joinRoom}
              disabled={!nameInput.trim() || !roomIdInput.trim()}
              className="w-full rounded-2xl text-base font-semibold"
            >
              Join Room
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )

  const renderRoom = () => {
    if (!room || !currentPlayer) return null
    return (
      <motion.div
        key="room"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-8"
      >
        <Card className="rounded-[2rem] border border-border/70 bg-card/95 shadow-2xl">
          <CardHeader className="gap-6 p-6 sm:flex sm:items-center sm:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.35em] text-muted-foreground">Active room</p>
              <CardTitle className="text-3xl">Planning Poker</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {room.players.length} player{room.players.length === 1 ? "" : "s"}
              </div>
            </div>
            <div className="space-y-3 sm:w-auto">
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-background/80 px-4 py-2 text-sm shadow-sm">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">Room</span>
                  <span className="font-mono text-lg font-semibold text-foreground">{room.id}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={copyRoomLink}
                  className="rounded-xl border border-border/60 bg-card px-3 py-1"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={leaveRoom} className="rounded-2xl px-4 text-sm font-semibold">
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave
                </Button>
                {currentPlayer.isOwner && (
                  <>
                    <Button
                      type="button"
                      onClick={revealEstimates}
                      disabled={room.revealed || !allPlayersVoted()}
                      className="rounded-2xl px-4 text-sm font-semibold"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Reveal
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={resetEstimates}
                      className="rounded-2xl border border-border/70 px-4 text-sm font-semibold"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {!room.revealed && (
          <Card className="rounded-[1.75rem] border border-dashed border-border/70 bg-muted/40 shadow-inner">
            <CardHeader>
              <CardTitle className="text-xl">Select your estimate</CardTitle>
              <CardDescription>Tap a card to lock your vote. Change it anytime before reveal.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {FIBONACCI_CARDS.map(card => (
                  <motion.button
                    key={card}
                    onClick={() => selectCard(card)}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "aspect-[2/3] rounded-2xl border-2 text-2xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
                      currentPlayer.estimate === card
                        ? "border-primary bg-primary text-primary-foreground shadow-xl"
                        : "border-border bg-card text-foreground shadow-sm hover:border-primary/60 hover:text-primary"
                    )}
                  >
                    {card}
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-[1.75rem] border border-border/70 bg-card/95 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Players</CardTitle>
            <CardDescription>
              {room.revealed
                ? "Grouped results once everyone has flipped their cards."
                : allPlayersVoted()
                  ? "All votes are in—ready when you are."
                  : "Waiting on a few folks before revealing."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {room.revealed ? (
              <div className="space-y-4">
                {getEstimateGroups().map(([estimate, players]) => (
                  <div key={estimate?.toString() ?? "none"} className="rounded-2xl border border-border/70 bg-muted/40 p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-4">
                      <div
                        className={cn(
                          "flex h-16 w-12 items-center justify-center rounded-xl text-2xl font-bold",
                          estimate !== null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {estimate ?? "—"}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-foreground">
                          {estimate !== null ? `Estimate: ${estimate}` : "No Estimate"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {players.length} {players.length === 1 ? "person" : "people"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {players.map(player => (
                        <span
                          key={player.id}
                          className="rounded-full border border-border/70 bg-card px-3 py-1.5 text-sm text-foreground shadow-sm"
                        >
                          {player.name}
                          {player.isOwner && <span className="ml-1.5 text-xs font-semibold text-primary/80">(Owner)</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {room.players.map(player => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-center shadow-sm"
                  >
                    <div className="mb-3">
                      <div
                        className={cn(
                          "flex aspect-[2/3] w-full items-center justify-center rounded-xl text-xl font-semibold transition-colors",
                          player.estimate !== null
                            ? "bg-primary text-primary-foreground shadow-lg"
                            : "bg-card text-muted-foreground"
                        )}
                      >
                        {player.estimate !== null ? "✓" : "?"}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-foreground">{player.name}</p>
                    {player.isOwner && <p className="text-xs font-semibold text-primary/80">Owner</p>}
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-10">
      <AnimatePresence mode="wait">
        {appState === "home" && renderHome()}
        {appState === "join" && renderJoin()}
        {appState === "room" && renderRoom()}
      </AnimatePresence>
    </div>
  )
}
