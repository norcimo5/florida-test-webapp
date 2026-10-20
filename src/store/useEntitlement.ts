/**
 * useEntitlement.ts — React hooks that combine the stored state with "today":
 *   useToday()        the day the app treats as today (domain/dates.ts effectiveDay): the phone's
 *                     local date, but never earlier than the latest day already seen (blocks
 *                     date-rollback tricks). Refreshes at local midnight and when the app returns
 *                     to the foreground, so free counters reset even if the app stays open.
 *   useEntitlement()  the user's Premium status (billing/entitlement.ts), memoized
 */
import { useEffect, useMemo, useState } from 'react'
import { computeEntitlement, isPremium, type Entitlement } from '../billing/entitlement'
import { dayKey, effectiveDay, msUntilNextLocalMidnight } from '../domain/dates'
import { noteDaySeen, useAppState } from './appStore'

/** The effective day key ("2026-10-20"); updates at midnight and on focus/visibility change. */
export function useToday(): string {
  const { lastSeenDay } = useAppState()
  const [clockDay, setClockDay] = useState(dayKey)

  useEffect(() => {
    const refresh = () => setClockDay(dayKey())
    let timer: ReturnType<typeof setTimeout>
    const scheduleMidnight = () => {
      timer = setTimeout(() => {
        refresh()
        scheduleMidnight()
      }, msUntilNextLocalMidnight())
    }
    scheduleMidnight()
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const today = effectiveDay(clockDay, lastSeenDay)
  useEffect(() => noteDaySeen(today), [today])
  return today
}

/** Premium status + a convenience `premium` boolean. */
export function useEntitlement(): { entitlement: Entitlement; premium: boolean; today: string } {
  const { unlock } = useAppState()
  const today = useToday()
  const entitlement = useMemo(() => computeEntitlement(unlock, today), [unlock, today])
  return { entitlement, premium: isPremium(entitlement), today }
}
