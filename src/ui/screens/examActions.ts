/**
 * examActions.ts — the gate in front of the two exams, shared by Inicio and Exámenes.
 * Mirrors the onFullMock / onDailyQuiz lambdas in the Android ui/nav/AppNav.kt:
 * allowed → open the exam; not allowed → open the paywall.
 */
import { dailyQuizAllowed, fullMockAllowed } from '../../domain/gating'
import { DAILY_QUIZ_LENGTH, FULL_MOCK_LENGTH } from '../../domain/metrics'
import { navigate } from '../router'

/** Opens the 50-question Full Mock, or the paywall for free users. */
export function startFullMock(premium: boolean): void {
  navigate(fullMockAllowed(premium) ? `/exam/${FULL_MOCK_LENGTH}` : '/paywall')
}

/** Opens the 5-question Daily Quiz, or the paywall when today's free quiz was already used. */
export function startDailyQuiz(premium: boolean, lastQuizDay: string | null, today: string): void {
  navigate(dailyQuizAllowed(premium, lastQuizDay, today) ? `/exam/${DAILY_QUIZ_LENGTH}` : '/paywall')
}
