import { useEffect, useRef } from 'react'

export default function Modal({ label, onClose, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    const panel = ref.current
    panel.focus()
    function keys(event) {
      if (event.key === 'Escape') { event.preventDefault(); onClose() }
      if (event.key !== 'Tab') return
      const items = [...panel.querySelectorAll('button, input, select, [tabindex="0"]')].filter(el => !el.disabled && el.offsetParent !== null)
      const first = items[0], last = items.at(-1)
      if (!first) { event.preventDefault(); return }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel)) { event.preventDefault(); first.focus() }
    }
    panel.addEventListener('keydown', keys)
    return () => { panel.removeEventListener('keydown', keys); previous?.focus() }
  }, [onClose])
  return <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}><section ref={ref} tabIndex={-1} className="settings-panel" role="dialog" aria-modal="true" aria-label={label}>{children}</section></div>
}
