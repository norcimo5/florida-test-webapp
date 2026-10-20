/**
 * core.tsx — shared building blocks used by every screen. Each is a port of a Compose component
 * from the Android app (ui/common/Components.kt, TopicVisuals.kt, HomeScreen.kt SectionTitle):
 *
 *   GradientHeader  brand hero header (gradient behind the status bar)
 *   PassMeter       "Probabilidad de Aprobar" bar inside the header
 *   AppCard         white rounded card with soft shadow (clickable when `onClick` is set)
 *   TealButton      primary call-to-action button
 *   TextLink        secondary text action with a >= 48px touch target
 *   ProgressRow     label + % + bar (Temas list)
 *   MiniBar         thin mastery bar (Inicio grid)
 *   TopicIconChip   colored icon square per study topic
 *   SectionTitle    small gray section heading
 *   Disclaimer      "Herramienta de práctica…" footer line
 *   HeroShield      shield + check art (ic_hero_shield.xml)
 */
import { useEffect, useState, type ReactNode } from 'react'
import { Icon, type IconName } from '../icons'
import type { MacroTopic } from '../../domain/macroTopic'
import './components.css'

/** Props for GradientHeader. */
export interface GradientHeaderProps {
  title: string
  subtitle?: string
  /** Decoration pinned top-right (e.g. <HeroShield />). */
  trailing?: ReactNode
  /** Extra content under the title (e.g. <PassMeter />). */
  children?: ReactNode
}

/** Brand hero header. The title is the screen's <h1>. */
export function GradientHeader({ title, subtitle, trailing, children }: GradientHeaderProps) {
  return (
    <header className={`gradient-header${trailing ? ' gradient-header--with-trailing' : ''}`}>
      {trailing && <div className="gradient-header__trailing">{trailing}</div>}
      <div className="gradient-header__text">
        <h1 className="t-headline-medium">{title}</h1>
        {subtitle && <p className="gradient-header__subtitle t-body-medium">{subtitle}</p>}
      </div>
      {children}
    </header>
  )
}

/** Pass-probability meter. Animates from 0 to `pct` on first show (Android tween(800)). */
export function PassMeter({ pct }: { pct: number }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(pct))
    return () => cancelAnimationFrame(id)
  }, [pct])
  return (
    <div className="pass-meter">
      <p className="pass-meter__label t-label-medium" id="pass-meter-label">
        Probabilidad de Aprobar
      </p>
      <div
        className="pass-meter__track"
        role="progressbar"
        aria-labelledby="pass-meter-label"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className="pass-meter__fill" style={{ width: `${shown}%` }} />
      </div>
      <p className="pass-meter__value t-title-large">{pct}%</p>
    </div>
  )
}

/** Props for AppCard. */
export interface AppCardProps {
  children: ReactNode
  /** When set, the whole card is a button. */
  onClick?: () => void
  /** Adds the vertical 6px gap used when cards are stacked in a list. */
  stacked?: boolean
  className?: string
  ariaLabel?: string
}

/** White rounded card (Android AppCard: radius 16, elevation 3, padding 16). */
export function AppCard({ children, onClick, stacked, className = '', ariaLabel }: AppCardProps) {
  const cls = `app-card${stacked ? ' app-card--stacked' : ''} ${className}`.trim()
  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick} aria-label={ariaLabel}>
        {children}
      </button>
    )
  }
  return <div className={cls}>{children}</div>
}

/** Props for TealButton. */
export interface TealButtonProps {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
}

/** Primary teal button (min height 54, radius 14, label in labelLarge). */
export function TealButton({ children, onClick, disabled, type = 'button' }: TealButtonProps) {
  return (
    <button type={type} className="teal-button t-label-large" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

/** Props for TextLink. */
export interface TextLinkProps {
  children: ReactNode
  onClick: () => void
  /** CSS color; default brand blue. */
  color?: string
  /** Full-width, centered (Android `Modifier.fillMaxWidth()`). */
  block?: boolean
}

/** Text-only action with a guaranteed 48px touch target. */
export function TextLink({ children, onClick, color = 'var(--brand-blue)', block }: TextLinkProps) {
  return (
    <button
      type="button"
      className={`text-link t-body-medium${block ? ' text-link--block' : ''}`}
      style={{ color }}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

/** Label + percentage + 8px bar (Temas list rows). */
export function ProgressRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="progress-row">
      <div className="progress-row__top">
        <span className="progress-row__label t-body-medium w-medium">{label}</span>
        <span className="progress-row__pct t-body-medium w-bold">{pct}%</span>
      </div>
      <div className="bar" aria-hidden="true">
        <div className="bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/** Thin 6px mastery bar used in the Inicio topic grid. */
export function MiniBar({ pct }: { pct: number }) {
  return (
    <div className="bar bar--thin" aria-hidden="true">
      <div className="bar__fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

const TOPIC_ICONS: Record<MacroTopic, IconName> = {
  SENALES: 'traffic',
  REGLAS: 'altRoute',
  SEGURIDAD: 'shield',
  ESPECIAL: 'directionsCar',
}

/** Rounded colored icon square identifying a study topic (decorative). */
export function TopicIconChip({ topic }: { topic: MacroTopic }) {
  return (
    <span className={`topic-chip topic-chip--${topic}`} aria-hidden="true">
      <Icon name={TOPIC_ICONS[topic]} size={24} />
    </span>
  )
}

/** Small gray section heading (labelMedium, gray-500). */
export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="section-title t-label-medium">{children}</h2>
}

/** Legal footer line shown on several screens. */
export function Disclaimer() {
  return <p className="disclaimer t-label-small">Herramienta de práctica. No afiliada al FLHSMV.</p>
}

/** Brand shield art (white shield, blue inner, teal check) — port of ic_hero_shield.xml. */
export function HeroShield({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 62) / 52} viewBox="0 0 52 62" aria-hidden="true" focusable="false">
      <path fill="#FFFFFF" d="M26,0 L52,8.5 L52,30 C52,46 41,56 26,61.5 C11,56 0,46 0,30 L0,8.5 Z" />
      <path fill="#1E40AF" d="M26,5.5 L47,12.5 L47,29.5 C47,42.5 38,51.5 26,56 C14,51.5 5,42.5 5,29.5 L5,12.5 Z" />
      <path
        fill="none"
        stroke="#2DD4BF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15,30.5 L23,38.5 L38,20.5"
      />
    </svg>
  )
}
