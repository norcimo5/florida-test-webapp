import type { Question, Progress, MacroTopic } from '../types'
import { GradientHeader } from './GradientHeader'
import { TopicCard } from './TopicCard'
import { topicMasteryPct } from '../store/computed'
import './TemasScreen.css'

const MACRO_TOPICS: MacroTopic[] = ['senales', 'reglas', 'seguridad', 'especial']

interface TemasProps {
  questions: Question[]
  progress: Progress
  onTopicTap: (topic: MacroTopic) => void
}

export function TemasScreen({ questions, progress, onTopicTap }: TemasProps) {
  return (
    <div className="temas">
      <GradientHeader variant="strip" title="Temas" />

      <div className="temas__body">
        <div className="temas__topic-list">
          {MACRO_TOPICS.map(topic => (
            <TopicCard
              key={topic}
              topic={topic}
              masteryPct={topicMasteryPct(progress, questions, topic)}
              onTap={() => onTopicTap(topic)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default TemasScreen
