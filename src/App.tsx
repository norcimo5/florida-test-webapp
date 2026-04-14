import { useState, useEffect } from 'react'
import questions from './data/questions.json'
import type { Question, Progress, AppSettings, Screen } from './types'
import {
  loadProgress,
  saveProgress,
  loadSettings,
  saveSettings,
  clearExam,
  clearAll,
  isLocalStorageAvailable,
} from './store/progressStore'
import HomeScreen from './components/HomeScreen'
import StudyMode from './components/StudyMode'
import ExamMode from './components/ExamMode'
import ResultsScreen from './components/ResultsScreen'
import OptionsDrawer from './components/OptionsDrawer'

const typedQuestions = questions as Question[]

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [reviewMode, setReviewMode] = useState(false)
  const [progress, setProgress] = useState<Progress>(() => loadProgress())
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [storageWarning] = useState(() => !isLocalStorageAvailable())

  useEffect(() => { saveProgress(progress) }, [progress])
  useEffect(() => { saveSettings(settings) }, [settings])

  function handleNavigate(target: Screen, mode?: 'review') {
    setReviewMode(mode === 'review')
    setScreen(target)
  }

  function handleProgressUpdate(p: Progress) {
    setProgress(p)
  }

  function handleSettingsUpdate(s: AppSettings) {
    setSettings(s)
  }

  function handleResetExam() {
    setProgress(prev => clearExam(prev))
    setOptionsOpen(false)
  }

  function handleResetAll() {
    clearAll()
    setProgress(loadProgress())
    setSettings(loadSettings())
    setOptionsOpen(false)
    setScreen('home')
  }

  function handleExamComplete() {
    setScreen('results')
  }

  function handleRetryExam() {
    setProgress(prev => clearExam(prev))
    setScreen('exam')
  }

  return (
    <>
      {storageWarning && (
        <div style={{
          background: '#fff3cd',
          borderBottom: '2px solid #ffc107',
          padding: '10px 20px',
          fontSize: '13px',
          color: '#856404',
          textAlign: 'center',
        }}>
          ⚠️ Tu navegador no permite guardar progreso en este modo. El progreso se perderá al cerrar la ventana.
        </div>
      )}

      {screen === 'home' && (
        <HomeScreen
          progress={progress}
          settings={settings}
          totalQuestions={typedQuestions.length}
          onNavigate={handleNavigate}
          onOpenOptions={() => setOptionsOpen(true)}
        />
      )}

      {screen === 'study' && (
        <StudyMode
          questions={typedQuestions}
          progress={progress}
          onProgressUpdate={handleProgressUpdate}
          onBack={() => setScreen('home')}
          reviewMode={reviewMode}
        />
      )}

      {screen === 'exam' && (
        <ExamMode
          questions={typedQuestions}
          progress={progress}
          settings={settings}
          onProgressUpdate={handleProgressUpdate}
          onComplete={handleExamComplete}
          onBack={() => setScreen('home')}
        />
      )}

      {screen === 'results' && (
        <ResultsScreen
          questions={typedQuestions}
          progress={progress}
          onRetry={handleRetryExam}
          onStudy={() => handleNavigate('study', 'review')}
          onBack={() => setScreen('home')}
        />
      )}

      <OptionsDrawer
        isOpen={optionsOpen}
        settings={settings}
        onSettingsUpdate={handleSettingsUpdate}
        onResetExam={handleResetExam}
        onResetAll={handleResetAll}
        onClose={() => setOptionsOpen(false)}
      />
    </>
  )
}
