/**
 * useScrollLock
 *
 * Hook da chiamare in ogni modal al mount.
 * - Blocca document.body scroll (overflow: hidden)
 * - Espone un ref globale `modalOpenCount`, sicuro per modal annidati:
 *   usa un contatore, non un semplice boolean. Al cleanup (unmount)
 *   decrementa il contatore e ripristina lo scroll solo quando tutti i
 *   modal sono chiusi.
 *
 * Porta 1:1 dell'omonimo hook di Supremi Advisor.
 */

import { useEffect } from 'react';

export const modalOpenCount = { current: 0 };

export function useScrollLock() {
  useEffect(() => {
    modalOpenCount.current += 1;

    const scrollY = window.scrollY;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      modalOpenCount.current = Math.max(0, modalOpenCount.current - 1);

      if (modalOpenCount.current === 0) {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      }
    };
  }, []);
}
