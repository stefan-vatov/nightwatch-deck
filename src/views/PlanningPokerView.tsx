import { useEffect } from "react"
import { PlanningPokerApp } from "@/components/generated/PlanningPokerApp"
import { ensureLightMode } from "@/lib/utils"

export function PlanningPokerView() {
  useEffect(() => {
    ensureLightMode()
  }, [])

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8">
      <section className="rounded-[2.5rem] bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-8 shadow-inner">
        <div className="flex min-h-[60vh] items-center justify-center">
          <PlanningPokerApp />
        </div>
      </section>
    </div>
  )
}
