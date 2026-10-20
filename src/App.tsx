/**
 * App.tsx — the app shell: onboarding gate, route → screen mapping, bottom nav, snackbar.
 * Port of the Android ui/nav/AppNav.kt (NavHost + NavigationBar). Route table: ui/router.ts.
 */
import { useEffect } from 'react'
import { useAppState } from './store/appStore'
import { isMacroTopic } from './domain/macroTopic'
import { TAB_ROUTES, useRoute, navigate } from './ui/router'
import { BottomNav, Snackbar } from './ui/components/overlays'
import { OnboardingScreen } from './ui/screens/OnboardingScreen'
import { HomeScreen } from './ui/screens/HomeScreen'
import { TemasScreen, ExamsScreen, PerfilScreen } from './ui/screens/TabScreens'
import { AjustesScreen } from './ui/screens/AjustesScreen'
import { StudyScreen } from './ui/screens/StudyScreen'
import { ExamScreen, ResultsScreen } from './ui/screens/ExamScreens'
import { PaywallScreen } from './ui/screens/PaywallScreen'
import { ActivateScreen } from './ui/screens/ActivateScreen'
import { InstallScreen } from './ui/screens/InstallScreen'

/** Picks the screen for the current route. Unknown routes fall back to Inicio. */
function Screen({ segments }: { segments: string[] }) {
  const [name, a, b] = segments
  switch (name) {
    case 'home':
      return <HomeScreen />
    case 'topics':
      return <TemasScreen />
    case 'exams':
      return <ExamsScreen />
    case 'profile':
      return <PerfilScreen />
    case 'settings':
      return <AjustesScreen />
    case 'study':
      if (a && isMacroTopic(a)) return <StudyScreen key={a} topic={a} />
      break
    case 'exam': {
      const n = Number(a)
      if (n === 5 || n === 50) return <ExamScreen key={n} count={n} />
      break
    }
    case 'results': {
      const c = Number(a)
      const t = Number(b)
      if (Number.isInteger(c) && Number.isInteger(t) && t > 0 && c >= 0 && c <= t) {
        return <ResultsScreen correct={c} total={t} />
      }
      break
    }
    case 'paywall':
      return <PaywallScreen />
    case 'activate':
      return <ActivateScreen />
    case 'install':
      return <InstallScreen />
  }
  return <Redirect />
}

function Redirect() {
  useEffect(() => navigate('/home', { replace: true }), [])
  return null
}

/** Root component. */
export default function App() {
  const { userName } = useAppState()
  const route = useRoute()

  // Every navigation starts at the top of the new screen (Compose screens do too).
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route.path])

  if (userName === null) return <OnboardingScreen />

  const isTab = (TAB_ROUTES as readonly string[]).includes(route.path)
  return (
    <>
      <main key={route.path} className={isTab ? 'screen--with-nav' : 'screen--full'}>
        <Screen segments={route.segments} />
      </main>
      {isTab && <BottomNav current={route.path} />}
      <Snackbar />
    </>
  )
}
