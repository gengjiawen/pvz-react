import { useEffect, useRef } from 'react'

const FOCUSABLE = 'button:not([disabled]),[href],input,select,textarea,[tabindex="0"]'

/**
 * Keeps Tab inside a dialog and moves focus to `initialSelector` on open.
 * Returns the ref to spread onto the dialog container.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean, initialSelector?: string) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const container = ref.current
    if (!active || !container) return

    const initial = initialSelector
      ? container.querySelector<HTMLElement>(initialSelector)
      : container.querySelector<HTMLElement>(FOCUSABLE)
    initial?.focus({ preventScroll: true })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const items = [...container.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    container.ownerDocument.addEventListener('keydown', onKeyDown)
    return () => container.ownerDocument.removeEventListener('keydown', onKeyDown)
  }, [active, initialSelector])

  return ref
}
