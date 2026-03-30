// ---- DOM Helpers & Formatting Utilities ----

/**
 * Create a DOM element with optional class, attributes, and children.
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  opts?: {
    cls?: string | string[]
    attrs?: Record<string, string>
    text?: string
    html?: string
    style?: Partial<CSSStyleDeclaration>
    children?: (Node | null | undefined)[]
    on?: Record<string, EventListener>
  },
): HTMLElementTagNameMap[K] {
  const elem = document.createElement(tag)
  if (opts) {
    if (opts.cls) {
      const classes = Array.isArray(opts.cls) ? opts.cls : [opts.cls]
      for (const c of classes) {
        if (c) elem.classList.add(c)
      }
    }
    if (opts.attrs) {
      for (const [k, v] of Object.entries(opts.attrs)) {
        elem.setAttribute(k, v)
      }
    }
    if (opts.text !== undefined) elem.textContent = opts.text
    if (opts.html !== undefined) elem.innerHTML = opts.html
    if (opts.style) {
      for (const [k, v] of Object.entries(opts.style)) {
        ;(elem.style as any)[k] = v
      }
    }
    if (opts.children) {
      for (const child of opts.children) {
        if (child) elem.appendChild(child)
      }
    }
    if (opts.on) {
      for (const [event, handler] of Object.entries(opts.on)) {
        elem.addEventListener(event, handler)
      }
    }
  }
  return elem
}

/**
 * Create an SVG element.
 */
export function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
): SVGElementTagNameMap[K] {
  const elem = document.createElementNS('http://www.w3.org/2000/svg', tag)
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      elem.setAttribute(k, v)
    }
  }
  return elem
}

/**
 * Truncate a string to maxLen, adding ellipsis if needed.
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 1) + '\u2026'
}

/**
 * Format a JSON payload for display. Returns a truncated string.
 */
export function formatPayload(payload: any, maxLen = 80): string {
  if (payload === undefined) return 'undefined'
  if (payload === null) return 'null'
  try {
    const str = JSON.stringify(payload)
    return truncate(str, maxLen)
  } catch {
    return truncate(String(payload), maxLen)
  }
}

/**
 * Pretty-print JSON with indentation.
 */
export function prettyJSON(payload: any): string {
  if (payload === undefined) return 'undefined'
  if (payload === null) return 'null'
  try {
    return JSON.stringify(payload, null, 2)
  } catch {
    return String(payload)
  }
}

/**
 * Format a timestamp (ms since page load or Date.now()) as HH:MM:SS.mmm
 */
export function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return `${hh}:${mm}:${ss}.${ms}`
}

/**
 * Format a relative time (ms) as a human-readable string.
 */
export function formatDuration(ms: number): string {
  if (ms < 1) return '<1ms'
  if (ms < 1000) return `${ms.toFixed(1)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * Generate a deterministic color from a string.
 */
export function hashColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  const hue = ((hash % 360) + 360) % 360
  return `hsl(${hue}, 65%, 55%)`
}

/**
 * Debounce a function.
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Remove all child nodes from an element.
 */
export function clearChildren(el: Element): void {
  while (el.firstChild) {
    el.removeChild(el.firstChild)
  }
}

/**
 * Strip the auto-incremented suffix from an event type name (e.g. "Click#0" -> "Click").
 */
export function cleanName(name: string): string {
  const idx = name.lastIndexOf('#')
  if (idx > 0) return name.slice(0, idx)
  return name
}
