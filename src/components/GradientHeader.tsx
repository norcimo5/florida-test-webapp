import type { ReactNode } from 'react'
import './GradientHeader.css'

interface GradientHeaderProps {
  /** Title text shown in the header */
  title?: string
  /** Element placed on the left side (e.g. back button) */
  left?: ReactNode
  /** Element placed on the right side (e.g. bookmark button) */
  right?: ReactNode
  /**
   * `full`  — tall hero header for Home; accepts children for greeting/probability slot.
   * `strip` — slim title bar for Study, Exam, Results, and other screens.
   */
  variant?: 'full' | 'strip'
  /** Extra content rendered below the title row (used in `full` variant for greeting, probability, etc.) */
  children?: ReactNode
}

export function GradientHeader({
  title,
  left,
  right,
  variant = 'strip',
  children,
}: GradientHeaderProps) {
  return (
    <header
      className={`gradient-header gradient-header--${variant}`}
      role="banner"
    >
      <div className="gradient-header__top-row">
        {left ? (
          <div className="gradient-header__left">{left}</div>
        ) : (
          <div className="gradient-header__left gradient-header__left--empty" />
        )}

        {title && (
          <h1 className="gradient-header__title">{title}</h1>
        )}

        {right ? (
          <div className="gradient-header__right">{right}</div>
        ) : (
          <div className="gradient-header__right gradient-header__right--empty" />
        )}
      </div>

      {children && (
        <div className="gradient-header__body">{children}</div>
      )}
    </header>
  )
}

export default GradientHeader
