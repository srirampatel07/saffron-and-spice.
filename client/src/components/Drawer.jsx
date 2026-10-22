import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Close } from './Icons';
import { projectMomentum, rubberBand } from '../lib/spring';
import { useReducedMotion } from '../lib/useMediaQuery';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const STIFFNESS = 420;
const DAMPING = 33;

export default function Drawer({ open, onClose, title, children, footer, className = '' }) {
  const [mounted, setMounted] = useState(false);
  const mountedRef = useRef(false);
  const enteredRef = useRef(false);
  const panelRef = useRef(null);
  const scrimRef = useRef(null);
  const closeRef = useRef(null);
  const triggerRef = useRef(null);
  const widthRef = useRef(440);
  const animRef = useRef({ raf: 0, x: 0, v: 0, target: 0, last: 0 });
  const dragRef = useRef(null);
  const reduceTimerRef = useRef(0);
  const reduceMotion = useReducedMotion();
  const titleId = useId();

  const setPanelX = useCallback((x) => {
    const panel = panelRef.current;
    if (!panel) return;
    const width = widthRef.current || panel.offsetWidth || 1;
    panel.style.transform = `translate3d(${x}px, 0, 0)`;
    if (scrimRef.current) {
      scrimRef.current.style.opacity = String(Math.max(0, Math.min(1, 1 - x / width)));
    }
  }, []);

  const stopAnimation = useCallback(() => {
    if (animRef.current.raf) {
      cancelAnimationFrame(animRef.current.raf);
      animRef.current.raf = 0;
    }
  }, []);

  const restoreFocus = useCallback(() => {
    const trigger = triggerRef.current;
    triggerRef.current = null;
    if (trigger && typeof trigger.focus === 'function' && document.contains(trigger)) {
      trigger.focus({ preventScroll: true });
    }
  }, []);

  const finishClose = useCallback(() => {
    stopAnimation();
    setMounted(false);
    mountedRef.current = false;
    enteredRef.current = false;
    document.body.classList.remove('is-locked');
    restoreFocus();
  }, [restoreFocus, stopAnimation]);

  const animateTo = useCallback(
    (target, velocity = 0, onRest) => {
      cancelAnimationFrame(animRef.current.raf);
      const state = animRef.current;
      state.target = target;
      state.v = velocity;

      if (reduceMotion) {
        state.x = target;
        setPanelX(target);
        onRest?.();
        return;
      }

      state.last = performance.now();
      const tick = (now) => {
        const delta = Math.min(Math.max((now - state.last) / 1000, 0), 1 / 30);
        state.last = now;
        const force = -STIFFNESS * (state.x - state.target) - DAMPING * state.v;
        state.v += force * delta;
        state.x += state.v * delta;

        if (Math.abs(state.v) < 8 && Math.abs(state.x - state.target) < 0.5) {
          state.x = state.target;
          state.raf = 0;
          setPanelX(state.x);
          onRest?.();
          return;
        }

        setPanelX(state.x);
        state.raf = requestAnimationFrame(tick);
      };
      state.raf = requestAnimationFrame(tick);
    },
    [reduceMotion, setPanelX],
  );

  useEffect(() => {
    if (!mounted) return undefined;
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    const animation = animRef.current;
    if (!panel) return undefined;

    widthRef.current = panel.offsetWidth || 440;
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    enteredRef.current = true;
    document.body.classList.add('is-locked');

    if (reduceMotion) {
      panel.style.transform = 'none';
      panel.style.opacity = '0';
      if (scrim) {
        scrim.style.transition = 'opacity 180ms ease';
        scrim.style.opacity = '1';
      }
      requestAnimationFrame(() => {
        if (panelRef.current) panelRef.current.style.opacity = '1';
      });
    } else {
      animRef.current.x = widthRef.current;
      animRef.current.v = 0;
      setPanelX(widthRef.current);
      requestAnimationFrame(() => {
        if (mountedRef.current) animateTo(0, 0);
      });
    }

    const focusTimer = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 40);

    return () => {
      window.clearTimeout(focusTimer);
      window.clearTimeout(reduceTimerRef.current);
      cancelAnimationFrame(animation.raf);
      document.body.classList.remove('is-locked');
    };
  }, [mounted, reduceMotion, animateTo, setPanelX]);

  useEffect(() => {
    if (open) {
      window.clearTimeout(reduceTimerRef.current);
      if (!mountedRef.current) {
        mountedRef.current = true;
        setMounted(true);
      } else if (enteredRef.current) {
        if (reduceMotion) {
          if (panelRef.current) panelRef.current.style.opacity = '1';
          if (scrimRef.current) scrimRef.current.style.opacity = '1';
        } else {
          animateTo(0, animRef.current.v);
        }
      }
      return;
    }

    if (!mountedRef.current) return;
    if (reduceMotion) {
      if (panelRef.current) panelRef.current.style.opacity = '0';
      if (scrimRef.current) scrimRef.current.style.opacity = '0';
      reduceTimerRef.current = window.setTimeout(finishClose, 180);
    } else {
      animateTo(widthRef.current, animRef.current.v, finishClose);
    }
  }, [open, reduceMotion, animateTo, finishClose]);

  useEffect(() => {
    if (!open || !mounted) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
        (element) => element.getClientRects().length > 0,
      );
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, mounted, onClose]);

  const handlePointerDown = (event) => {
    if (reduceMotion || dragRef.current) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    stopAnimation();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      panelX: animRef.current.x,
      width: widthRef.current,
      samples: [{ t: performance.now(), x: event.clientX }],
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const delta = event.clientX - drag.startX;
    let next = drag.panelX + delta;
    if (next < 0) next = -rubberBand(-next, drag.width);
    animRef.current.x = next;
    animRef.current.v = 0;
    setPanelX(next);

    drag.samples.push({ t: performance.now(), x: event.clientX });
    if (drag.samples.length > 8) drag.samples.shift();
  };

  const endDrag = (event, cancelled = false) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;

    if (cancelled) {
      animateTo(0, 0);
      return;
    }

    const now = performance.now();
    const recent = drag.samples.filter((sample) => now - sample.t < 120);
    let velocity = 0;
    if (recent.length > 1) {
      const first = recent[0];
      const last = recent[recent.length - 1];
      const elapsed = (last.t - first.t) / 1000;
      if (elapsed > 0.016) velocity = (last.x - first.x) / elapsed;
    }

    const projected = animRef.current.x + projectMomentum(velocity);
    const shouldClose = velocity > 500 || (velocity > -50 && projected > drag.width * 0.34);
    if (shouldClose) {
      animateTo(drag.width, velocity, finishClose);
    } else {
      animateTo(0, velocity);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="drawer-root">
      <div
        ref={scrimRef}
        className="drawer__scrim"
        onClick={onClose}
        onPointerDown={(event) => event.stopPropagation()}
        aria-hidden="true"
      />
      <section
        ref={panelRef}
        className={`drawer__panel ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{ transform: 'translate3d(100%, 0, 0)' }}
      >
        <div
          className="drawer__handle"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={(event) => endDrag(event)}
          onPointerCancel={(event) => endDrag(event, true)}
          aria-hidden="true"
        >
          <span />
        </div>
        <div className="drawer__head">
          <h2 id={titleId} className="drawer__heading">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="drawer__close"
            onClick={onClose}
            aria-label="Close panel"
          >
            <Close />
          </button>
        </div>
        <div className="drawer__body">{children}</div>
        {footer ? <div className="drawer__footer">{footer}</div> : null}
      </section>
    </div>,
    document.body,
  );
}
