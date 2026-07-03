import { useEffect, useRef } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** hide the default header (sheet provides its own grab handle/title). */
  bare?: boolean;
}

// Bottom-sheet on mobile / centered card on desktop. Closes on Escape and
// backdrop click; focuses the panel on open.
export function Modal({ title, onClose, children, bare = false }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="animate-fade fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-surface text-ink shadow-sheet outline-none sm:max-w-md sm:rounded-xl sm:border sm:border-line sm:shadow-card"
      >
        {bare ? (
          <div className="px-6 pb-7 pt-4">
            <div className="mx-auto mb-4 h-[5px] w-11 rounded-full bg-line sm:hidden" />
            {children}
          </div>
        ) : (
          <>
            <div className="sticky top-0 flex items-center justify-between border-b border-line-soft bg-surface px-5 py-4">
              <h2 className="text-base font-semibold text-ink">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-accent-soft hover:text-ink"
              >
                ✕
              </button>
            </div>
            <div className="p-5">{children}</div>
          </>
        )}
      </div>
    </div>
  );
}
