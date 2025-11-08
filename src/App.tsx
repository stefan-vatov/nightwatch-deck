import './App.css'
import { PlanningPokerView } from '@/views/PlanningPokerView'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <PlanningPokerView />
      </main>
    </div>
  )
}

export default App
