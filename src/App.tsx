import { useState, useEffect, useRef } from 'react'
import questions from './data/questions.json'
import type { Question, Progress, AppSettings, Screen, MacroTopic } from './types'
import {
  loadProgress,
  saveProgress,
  loadSettings,
  saveSettings,
  clearExam,
  clearAll,
  isLocalStorageAvailable,
} from './store/progressStore'
import { recordDailyReadiness } from './store/computed'
import HomeScreen from './components/HomeScreen'
import StudyMode from './components/StudyMode'
import ExamMode from './components/ExamMode'
import ResultsScreen from './components/ResultsScreen'
import TemasScreen from './components/TemasScreen'
import PerfilScreen from './components/PerfilScreen'
import AjustesScreen from './components/AjustesScreen'
import BottomTabBar from './components/BottomTabBar'

const typedQuestions = questions as Question[]

/** Screens that hide the bottom tab bar (focus / in-session mode). */
const FOCUS_SCREENS: Screen[] = ['study', 'exam', 'results']

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [reviewMode, setReviewMode] = useState(false)
  const [filterTopic, setFilterTopic] = useState<MacroTopic | null>(null)
  const [progress, setProgress] = useState<Progress>(() => loadProgress())
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())
  const [storageWarning] = useState(() => !isLocalStorageAvailable())

  // Persist progress and settings whenever they change
  useEffect(() => { saveProgress(progress) }, [progress])
  useEffect(() => { saveSettings(settings) }, [settings])

  // Record daily readiness once per session when the home screen is first shown.
  // Deferred via setTimeout(0) to avoid calling setState synchronously in the
  // effect body (react-hooks/set-state-in-effect).
  const hasRecordedReadiness = useRef(false)
  useEffect(() => {
    if (screen !== 'home') return
    if (hasRecordedReadiness.current) return
    hasRecordedReadiness.current = true
    const tid = setTimeout(() => {
      setProgress(prev => recordDailyReadiness(prev, typedQuestions))
    }, 0)
    return () => clearTimeout(tid)
  }, [screen])

  // ── Navigation helpers ───────────────────────────────────────────────────────

  function navigateTo(target: Screen) {
    setReviewMode(false)
    setFilterTopic(null)
    setScreen(target)
  }

  function handleTopicTap(topic: MacroTopic) {
    setFilterTopic(topic)
    setReviewMode(false)
    setScreen('study')
  }

  function handleStartFullMock() {
    setProgress(prev => clearExam(prev))
    setScreen('exam')
  }

  // v1: daily quiz routes to the same full mock handler (5-question mechanic deferred to v2)
  function handleStartDailyQuiz() {
    handleStartFullMock()
  }

  function handleProgressUpdate(p: Progress) {
    setProgress(p)
  }

  function handleExamComplete() {
    setScreen('results')
  }

  function handleResetComplete() {
    clearAll()
    setProgress(loadProgress())
    setSettings(loadSettings())
    setScreen('home')
  }

  // ── BottomTabBar onChange ────────────────────────────────────────────────────

  function handleTabChange(tab: Screen) {
    if (tab === 'exam') {
      // Exámenes tab always launches a fresh full mock
      handleStartFullMock()
    } else {
      navigateTo(tab)
    }
  }

  // ── Determine which Screen the tab bar should highlight ─────────────────────
  // During focus screens (study/exam/results), the tab bar is hidden,
  // so active tab value doesn't matter — but keep 'home' as fallback.
  const activeTab: Screen = FOCUS_SCREENS.includes(screen) ? 'home' : screen

  const showTabBar = !FOCUS_SCREENS.includes(screen)

  return (
    <>
      {storageWarning && (
        <div className="storage-warning" role="alert">
          ⚠️ Tu navegador no permite guardar progreso en este modo. El progreso se perderá al cerrar la ventana.
        </div>
      )}

      {screen === 'home' && (
        <HomeScreen
          questions={typedQuestions}
          progress={progress}
          settings={settings}
          onTopicTap={handleTopicTap}
          onStartFullMock={handleStartFullMock}
          onStartDailyQuiz={handleStartDailyQuiz}
        />
      )}

      {screen === 'temas' && (
        <TemasScreen
          questions={typedQuestions}
          progress={progress}
          onTopicTap={handleTopicTap}
        />
      )}

      {screen === 'study' && (
        <StudyMode
          questions={typedQuestions}
          progress={progress}
          onProgressUpdate={handleProgressUpdate}
          onBack={() => navigateTo('home')}
          reviewMode={reviewMode}
          filterTopic={filterTopic ?? undefined}
        />
      )}

      {screen === 'exam' && (
        <ExamMode
          questions={typedQuestions}
          progress={progress}
          settings={settings}
          onProgressUpdate={handleProgressUpdate}
          onComplete={handleExamComplete}
          onBack={() => navigateTo('home')}
        />
      )}

      {screen === 'results' && (
        <ResultsScreen
          questions={typedQuestions}
          progress={progress}
          onProgressUpdate={handleProgressUpdate}
          onStudy={() => {
            // v1: "Repasar Errores" navigates to study in review mode (existing logic)
            setReviewMode(true)
            setFilterTopic(null)
            setScreen('study')
          }}
          onBack={() => navigateTo('home')}
        />
      )}

      {screen === 'perfil' && (
        <PerfilScreen
          questions={typedQuestions}
          progress={progress}
          settings={settings}
          onNavigateToAjustes={() => navigateTo('ajustes')}
        />
      )}

      {screen === 'ajustes' && (
        <AjustesScreen
          onResetComplete={handleResetComplete}
        />
      )}

      {showTabBar && (
        <BottomTabBar
          active={activeTab}
          onChange={handleTabChange}
        />
      )}
    </>
  )
}
