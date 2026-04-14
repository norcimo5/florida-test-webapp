import type { AppSettings } from '../types'
import './OptionsDrawer.css'

interface Props {
  isOpen: boolean
  settings: AppSettings
  onSettingsUpdate: (s: AppSettings) => void
  onResetExam: () => void
  onResetAll: () => void
  onClose: () => void
}

export default function OptionsDrawer({ isOpen, settings, onSettingsUpdate, onResetExam, onResetAll, onClose }: Props) {
  function handleResetAll() {
    if (window.confirm('¿Estás seguro? Esto borrará todo tu progreso. Esta acción no se puede deshacer.')) {
      onResetAll()
    }
  }

  return (
    <>
      {isOpen && <div className="drawer-overlay" onClick={onClose} />}
      <aside className={`drawer ${isOpen ? 'drawer--open' : ''}`}>
        <div className="drawer__header">
          <span className="drawer__title">⚙️ Opciones</span>
          <button className="drawer__close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="drawer__body">
          <section className="drawer__section">
            <div className="drawer__section-label">LONGITUD DEL EXAMEN</div>
            <div className="drawer__toggle">
              <button
                className={`drawer__toggle-btn ${settings.examLength === 25 ? 'drawer__toggle-btn--active' : ''}`}
                onClick={() => onSettingsUpdate({ ...settings, examLength: 25 })}
              >
                <span className="drawer__toggle-num">25</span>
                <span className="drawer__toggle-desc">preguntas rápido</span>
              </button>
              <button
                className={`drawer__toggle-btn ${settings.examLength === 50 ? 'drawer__toggle-btn--active' : ''}`}
                onClick={() => onSettingsUpdate({ ...settings, examLength: 50 })}
              >
                <span className="drawer__toggle-num">50</span>
                <span className="drawer__toggle-desc">examen completo</span>
              </button>
            </div>
          </section>

          <div className="drawer__divider" />

          <section className="drawer__section">
            <div className="drawer__action-row">
              <div className="drawer__action-info">
                <span className="drawer__action-title">Reiniciar examen actual</span>
                <span className="drawer__action-desc">Borra tu intento actual · El progreso de estudio se mantiene</span>
              </div>
              <button className="drawer__action-btn drawer__action-btn--warn" onClick={onResetExam}>
                Reiniciar
              </button>
            </div>
          </section>

          <section className="drawer__section">
            <div className="drawer__action-row">
              <div className="drawer__action-info">
                <span className="drawer__action-title">Borrar todo el progreso</span>
                <span className="drawer__action-desc">Reinicia desde cero · No se puede deshacer</span>
              </div>
              <button className="drawer__action-btn drawer__action-btn--danger" onClick={handleResetAll}>
                Borrar todo
              </button>
            </div>
          </section>

          <div className="drawer__divider" />

          <p className="drawer__about">
            Preguntas basadas en el examen oficial de Florida DHSMV.<br />
            Tu progreso se guarda en este navegador.
          </p>
        </div>
      </aside>
    </>
  )
}
