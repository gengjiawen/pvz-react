import { useEffect, type ReactNode } from 'react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { Icon } from './Icon'

interface ModalProps {
  onClose(): void
  wide?: boolean
  children: ReactNode
}

export function Modal({ onClose, wide = false, children }: ModalProps) {
  const ref = useFocusTrap<HTMLElement>(true, '.modal-close')

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalTitle"
        style={{ width: wide ? 820 : 600 }}
        ref={ref}
      >
        <button className="modal-close icon-button" aria-label="关闭" onClick={onClose}>
          <Icon name="close" />
        </button>
        <div>{children}</div>
      </section>
    </div>
  )
}
