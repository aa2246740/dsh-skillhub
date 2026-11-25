/**
 * Keep a fixed-position floating element anchored to a trigger.
 *
 * rc.3 compatibility shim: `useAnchoredPosition` was exported by
 * `@deepseek-ai/dsh-client-ui-primitives` in 0.2.1 but dropped from the rc.3
 * inline module table, which left the installed client factory with an
 * `undefined` hook and unmounted the whole conversation composer slot. This
 * module ports the 0.2.1 implementation verbatim (same options, same return
 * shape) so the plugin no longer depends on that export.
 *
 * A portaled panel is positioned from its anchor's viewport rect, which stops
 * being true the moment anything scrolls or the window resizes. This owns
 * that one concern: measure the anchor, offset the panel below or above it,
 * clamp the result inside the viewport, and re-run on scroll (capture phase),
 * on resize, and on the panel's own size changes while it is open.
 */
import { useLayoutEffect, useState, type RefObject } from 'react'

export interface AnchoredPositionOptions {
  readonly open: boolean
  readonly anchorRef: RefObject<HTMLElement | null>
  readonly panelRef: RefObject<HTMLElement | null>
  readonly side?: 'bottom' | 'top' | undefined
  readonly align?: 'start' | 'end' | undefined
  readonly gap: number
  readonly margin: number
}

export interface AnchoredPosition {
  readonly left: number
  readonly top: number
}

/** Viewport top clearance that respects frame chrome (mirrors the 0.2.1 helper). */
function overlayTopMargin(min: number): number {
  const root = document.documentElement
  const clearance = Number.parseFloat(getComputedStyle(root).getPropertyValue('--dsh-frame-top-clearance'))
  if (Number.isNaN(clearance)) return min
  return Math.max(min, (root.hasAttribute('data-fullscreen') ? 0 : clearance) + 20)
}

/**
 * Track an anchor and return the panel's fixed coordinates.
 * @returns `left`/`top` for the panel, or `null` before the first measurement.
 */
export function useAnchoredPosition(options: AnchoredPositionOptions): AnchoredPosition | null {
  const { open, anchorRef, panelRef, side = 'bottom', align = 'start', gap, margin } = options
  const [position, setPosition] = useState<AnchoredPosition | null>(null)
  useLayoutEffect(() => {
    if (!open) {
      setPosition(null)
      return
    }
    const place = () => {
      const rect = anchorRef.current?.getBoundingClientRect()
      if (rect === undefined) return
      const panel = panelRef.current
      const width = panel?.offsetWidth ?? 0
      const height = panel?.offsetHeight ?? 0
      let left = align === 'end' ? rect.right - width : rect.left
      let top = side === 'top' ? rect.top - gap - height : rect.bottom + gap
      if (width > 0) left = Math.min(Math.max(left, margin), window.innerWidth - width - margin)
      if (height > 0) top = Math.min(Math.max(top, overlayTopMargin(margin)), window.innerHeight - height - margin)
      setPosition({ left, top })
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    const panel = panelRef.current
    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && panel !== null) {
      observer = new ResizeObserver(place)
      observer.observe(panel)
    }
    return () => {
      observer?.disconnect()
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, anchorRef, panelRef, side, align, gap, margin])
  return position
}
