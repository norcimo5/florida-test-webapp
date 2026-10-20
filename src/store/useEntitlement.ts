/**
 * useEntitlement.ts — React hooks that combine the stored state with "today":
 *   useToday()        the local day key, refreshed when the app returns to the foreground
 *                     (so the free counter resets at midnight even if the app stays open)
 *   useEntitlement()  the user's Premium status (billing/entitlement.ts), memoized
 */
import { useEffect, useMemo, useState } from 'react'
import { computeEntitlement, isPremium, type Entitlement } from '../billing/entitlement'
import { dayKey } from '../domain/dates'
import { useAppState } from './appStore'

/** Today's local day key ("2026-10-20"); updates on focus/visibility change. */
export function useToday(): string {
  const [today, setToday] = useState(dayKey)
  useEffect(() => {
    const refresh = () => setToday(dayKey())
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])
  return today
}

/** Premium status + a convenience `premium` boolean. */
export function useEntitlement(): { entitlement: Entitlement; premium: boolean; today: string } {
  const { unlock } = useAppState()
  const today = useToday()
  const entitlement = useMemo(() => computeEntitlement(unlock, today), [unlock, today])
  return { entitlement, premium: isPremium(entitlement), today }
}
