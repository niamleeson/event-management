// ---- All CSS for Pulse DevTools ----
// Injected at runtime via <style> tag. Namespaced under .pulse-devtools.

export const DEVTOOLS_CSS = /* css */ `
/* =========================================
   Pulse DevTools — Dark Theme
   ========================================= */

.pulse-devtools *,
.pulse-devtools *::before,
.pulse-devtools *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.pulse-devtools {
  --pd-bg: #1a1a2e;
  --pd-bg-secondary: #16213e;
  --pd-bg-tertiary: #0f3460;
  --pd-bg-input: #0d1b2a;
  --pd-border: #2a2a4a;
  --pd-border-focus: #5a67d8;
  --pd-text: #e2e8f0;
  --pd-text-dim: #8892a4;
  --pd-text-bright: #f7fafc;
  --pd-accent: #7c3aed;
  --pd-accent-hover: #6d28d9;
  --pd-green: #10b981;
  --pd-green-dim: #065f46;
  --pd-red: #ef4444;
  --pd-red-dim: #7f1d1d;
  --pd-yellow: #f59e0b;
  --pd-blue: #3b82f6;
  --pd-cyan: #06b6d4;
  --pd-orange: #f97316;
  --pd-pink: #ec4899;
  --pd-mono: 'SF Mono', 'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace;
  --pd-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --pd-radius: 6px;
  --pd-radius-sm: 4px;
  --pd-shadow: 0 8px 32px rgba(0,0,0,0.4);
  --pd-transition: 150ms ease;

  font-family: var(--pd-sans);
  font-size: 13px;
  line-height: 1.5;
  color: var(--pd-text);
  background: var(--pd-bg);
  border: 1px solid var(--pd-border);
  border-radius: var(--pd-radius);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Light theme overrides */
.pulse-devtools.pd-theme-light {
  --pd-bg: #f8fafc;
  --pd-bg-secondary: #f1f5f9;
  --pd-bg-tertiary: #e2e8f0;
  --pd-bg-input: #ffffff;
  --pd-border: #cbd5e1;
  --pd-border-focus: #7c3aed;
  --pd-text: #1e293b;
  --pd-text-dim: #64748b;
  --pd-text-bright: #0f172a;
  --pd-shadow: 0 8px 32px rgba(0,0,0,0.12);
}

/* ---- Floating Panel ---- */
.pulse-devtools.pd-floating {
  position: fixed;
  z-index: 99999;
  box-shadow: var(--pd-shadow);
  resize: both;
  overflow: auto;
  min-width: 460px;
  min-height: 320px;
}

.pulse-devtools.pd-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 360px;
  z-index: 99999;
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-bottom: none;
  box-shadow: 0 -4px 24px rgba(0,0,0,0.3);
  resize: vertical;
  overflow: auto;
}

.pulse-devtools.pd-right {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 420px;
  z-index: 99999;
  border-radius: 0;
  border-top: none;
  border-right: none;
  border-bottom: none;
  box-shadow: -4px 0 24px rgba(0,0,0,0.3);
  resize: horizontal;
  overflow: auto;
}

.pulse-devtools.pd-collapsed {
  height: auto !important;
  min-height: 0 !important;
  resize: none;
}

/* ---- Titlebar ---- */
.pd-titlebar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--pd-bg-secondary);
  border-bottom: 1px solid var(--pd-border);
  cursor: move;
  user-select: none;
  flex-shrink: 0;
}

.pd-titlebar-logo {
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--pd-accent);
}

.pd-titlebar-spacer {
  flex: 1;
}

.pd-titlebar-badge {
  font-size: 10px;
  font-family: var(--pd-mono);
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 600;
}

.pd-badge-paused {
  background: var(--pd-red-dim);
  color: var(--pd-red);
}

.pd-badge-running {
  background: var(--pd-green-dim);
  color: var(--pd-green);
}

.pd-titlebar-btn {
  background: none;
  border: none;
  color: var(--pd-text-dim);
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: var(--pd-radius-sm);
  transition: color var(--pd-transition), background var(--pd-transition);
  font-family: var(--pd-sans);
  line-height: 1;
}

.pd-titlebar-btn:hover {
  color: var(--pd-text);
  background: var(--pd-bg-tertiary);
}

/* ---- Tabs ---- */
.pd-tabs {
  display: flex;
  border-bottom: 1px solid var(--pd-border);
  background: var(--pd-bg-secondary);
  flex-shrink: 0;
  overflow-x: auto;
}

.pd-tab {
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 500;
  color: var(--pd-text-dim);
  cursor: pointer;
  border: none;
  background: none;
  border-bottom: 2px solid transparent;
  transition: color var(--pd-transition), border-color var(--pd-transition);
  white-space: nowrap;
  font-family: var(--pd-sans);
}

.pd-tab:hover {
  color: var(--pd-text);
}

.pd-tab.pd-tab-active {
  color: var(--pd-accent);
  border-bottom-color: var(--pd-accent);
}

/* ---- Tab Content ---- */
.pd-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.pd-panel {
  position: absolute;
  inset: 0;
  overflow: auto;
  display: none;
  padding: 12px;
}

.pd-panel.pd-panel-active {
  display: block;
}

/* ---- Graph Panel ---- */
.pd-graph-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  cursor: grab;
}

.pd-graph-container:active {
  cursor: grabbing;
}

.pd-graph-svg {
  display: block;
}

.pd-graph-node-event rect {
  fill: var(--pd-bg-tertiary);
  stroke: var(--pd-blue);
  stroke-width: 1.5;
  rx: 4;
  ry: 4;
  cursor: pointer;
  transition: stroke-width 120ms ease;
}

.pd-graph-node-event:hover rect {
  stroke-width: 2.5;
}

.pd-graph-node-rule rect {
  fill: var(--pd-bg-secondary);
  stroke: var(--pd-accent);
  stroke-width: 1.5;
  rx: 10;
  ry: 10;
  cursor: pointer;
  transition: stroke-width 120ms ease;
}

.pd-graph-node-rule:hover rect {
  stroke-width: 2.5;
}

.pd-graph-node-label {
  fill: var(--pd-text);
  font-family: var(--pd-mono);
  font-size: 11px;
  pointer-events: none;
  dominant-baseline: central;
  text-anchor: middle;
}

.pd-graph-edge {
  fill: none;
  stroke: var(--pd-border);
  stroke-width: 1.5;
  marker-end: url(#pd-arrowhead);
  transition: stroke 200ms ease, stroke-width 200ms ease;
}

.pd-graph-edge.pd-edge-active {
  stroke: var(--pd-green);
  stroke-width: 2.5;
}

.pd-graph-edge.pd-edge-active-anim {
  stroke-dasharray: 8 4;
  animation: pd-dash 0.6s linear infinite;
}

@keyframes pd-dash {
  to { stroke-dashoffset: -12; }
}

.pd-graph-tooltip {
  position: absolute;
  background: var(--pd-bg-secondary);
  border: 1px solid var(--pd-border);
  border-radius: var(--pd-radius);
  padding: 8px 12px;
  font-size: 12px;
  font-family: var(--pd-mono);
  color: var(--pd-text);
  pointer-events: none;
  z-index: 10;
  max-width: 300px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  white-space: pre-wrap;
}

.pd-graph-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--pd-text-dim);
  font-size: 14px;
}

/* ---- Timeline ---- */
.pd-timeline-toolbar {
  display: flex;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--pd-border);
  margin-bottom: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.pd-timeline-filter,
.pd-timeline-search {
  background: var(--pd-bg-input);
  border: 1px solid var(--pd-border);
  border-radius: var(--pd-radius-sm);
  color: var(--pd-text);
  padding: 4px 8px;
  font-size: 12px;
  font-family: var(--pd-sans);
  outline: none;
  transition: border-color var(--pd-transition);
}

.pd-timeline-filter:focus,
.pd-timeline-search:focus {
  border-color: var(--pd-border-focus);
}

.pd-timeline-search {
  flex: 1;
  min-width: 120px;
}

.pd-timeline-clear-btn {
  background: var(--pd-bg-tertiary);
  border: 1px solid var(--pd-border);
  border-radius: var(--pd-radius-sm);
  color: var(--pd-text-dim);
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  font-family: var(--pd-sans);
  transition: background var(--pd-transition), color var(--pd-transition);
}

.pd-timeline-clear-btn:hover {
  background: var(--pd-bg-secondary);
  color: var(--pd-text);
}

.pd-timeline-list {
  max-height: calc(100% - 50px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pd-timeline-entry {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 8px;
  border-radius: var(--pd-radius-sm);
  cursor: pointer;
  transition: background var(--pd-transition);
  font-size: 12px;
}

.pd-timeline-entry:hover {
  background: var(--pd-bg-secondary);
}

.pd-timeline-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.pd-timeline-time {
  color: var(--pd-text-dim);
  font-family: var(--pd-mono);
  font-size: 11px;
  flex-shrink: 0;
  min-width: 85px;
}

.pd-timeline-type {
  font-weight: 600;
  color: var(--pd-text-bright);
  flex-shrink: 0;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pd-timeline-payload {
  color: var(--pd-text-dim);
  font-family: var(--pd-mono);
  font-size: 11px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pd-timeline-seq {
  color: var(--pd-text-dim);
  font-family: var(--pd-mono);
  font-size: 10px;
  flex-shrink: 0;
  opacity: 0.6;
}

.pd-timeline-detail {
  background: var(--pd-bg-secondary);
  border: 1px solid var(--pd-border);
  border-radius: var(--pd-radius);
  padding: 10px;
  margin: 4px 0 4px 16px;
  font-family: var(--pd-mono);
  font-size: 11px;
}

.pd-timeline-detail-label {
  color: var(--pd-text-dim);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  font-family: var(--pd-sans);
  font-weight: 600;
}

.pd-timeline-detail pre {
  color: var(--pd-text);
  background: var(--pd-bg-input);
  border-radius: var(--pd-radius-sm);
  padding: 8px;
  overflow-x: auto;
  max-height: 200px;
  white-space: pre-wrap;
  word-break: break-all;
}

.pd-timeline-detail-rules {
  margin-top: 6px;
}

.pd-timeline-detail-rule-tag {
  display: inline-block;
  background: var(--pd-bg-tertiary);
  color: var(--pd-accent);
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 10px;
  margin-right: 4px;
  margin-bottom: 2px;
}

.pd-timeline-cycle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 8px;
  font-size: 10px;
  color: var(--pd-text-dim);
  border-top: 1px dashed var(--pd-border);
  margin-top: 2px;
  font-family: var(--pd-mono);
}

.pd-timeline-cycle-label {
  font-weight: 600;
  color: var(--pd-cyan);
}

.pd-timeline-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--pd-text-dim);
}

/* ---- Inspector ---- */
.pd-inspector-section {
  margin-bottom: 16px;
}

.pd-inspector-heading {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--pd-text-dim);
  padding-bottom: 6px;
  border-bottom: 1px solid var(--pd-border);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.pd-inspector-heading-count {
  background: var(--pd-bg-tertiary);
  color: var(--pd-text);
  font-size: 10px;
  padding: 0 5px;
  border-radius: 3px;
  font-weight: 500;
}

.pd-inspector-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.pd-inspector-table th {
  text-align: left;
  padding: 4px 8px;
  color: var(--pd-text-dim);
  font-weight: 500;
  font-size: 11px;
  border-bottom: 1px solid var(--pd-border);
}

.pd-inspector-table td {
  padding: 4px 8px;
  border-bottom: 1px solid var(--pd-border);
  vertical-align: top;
}

.pd-inspector-name {
  font-family: var(--pd-mono);
  font-weight: 500;
  color: var(--pd-text-bright);
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pd-inspector-value {
  font-family: var(--pd-mono);
  color: var(--pd-cyan);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pd-inspector-empty {
  color: var(--pd-text-dim);
  font-style: italic;
  padding: 12px 0;
  text-align: center;
  font-size: 12px;
}

/* Progress bars for tweens */
.pd-progress-bar {
  width: 100%;
  height: 6px;
  background: var(--pd-bg-input);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 2px;
}

.pd-progress-fill {
  height: 100%;
  background: var(--pd-accent);
  border-radius: 3px;
  transition: width 60ms linear;
}

.pd-progress-fill.pd-tween-active {
  background: var(--pd-green);
}

.pd-spring-velocity {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.pd-spring-indicator {
  display: inline-block;
  width: 40px;
  height: 4px;
  background: var(--pd-bg-input);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}

.pd-spring-indicator-fill {
  position: absolute;
  top: 0;
  left: 50%;
  height: 100%;
  background: var(--pd-orange);
  border-radius: 2px;
  transition: width 60ms linear, left 60ms linear;
}

.pd-spring-settled {
  color: var(--pd-green);
  font-size: 10px;
  font-weight: 600;
}

/* ---- Event Fire Panel ---- */
.pd-fire-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pd-fire-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--pd-text-dim);
  margin-bottom: 4px;
}

.pd-fire-select {
  background: var(--pd-bg-input);
  border: 1px solid var(--pd-border);
  border-radius: var(--pd-radius-sm);
  color: var(--pd-text);
  padding: 6px 10px;
  font-size: 13px;
  font-family: var(--pd-mono);
  outline: none;
  width: 100%;
  transition: border-color var(--pd-transition);
}

.pd-fire-select:focus {
  border-color: var(--pd-border-focus);
}

.pd-fire-textarea {
  background: var(--pd-bg-input);
  border: 1px solid var(--pd-border);
  border-radius: var(--pd-radius-sm);
  color: var(--pd-text);
  padding: 8px 10px;
  font-size: 12px;
  font-family: var(--pd-mono);
  outline: none;
  resize: vertical;
  min-height: 100px;
  width: 100%;
  line-height: 1.5;
  tab-size: 2;
  transition: border-color var(--pd-transition);
}

.pd-fire-textarea:focus {
  border-color: var(--pd-border-focus);
}

.pd-fire-textarea.pd-fire-invalid {
  border-color: var(--pd-red);
}

.pd-fire-error {
  color: var(--pd-red);
  font-size: 11px;
  font-family: var(--pd-mono);
  min-height: 16px;
}

.pd-fire-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pd-fire-btn {
  background: var(--pd-accent);
  color: #fff;
  border: none;
  border-radius: var(--pd-radius-sm);
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--pd-sans);
  transition: background var(--pd-transition);
}

.pd-fire-btn:hover {
  background: var(--pd-accent-hover);
}

.pd-fire-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pd-fire-recent {
  margin-top: 8px;
}

.pd-fire-recent-heading {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--pd-text-dim);
  margin-bottom: 6px;
  font-weight: 600;
}

.pd-fire-recent-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.pd-fire-recent-btn {
  background: var(--pd-bg-tertiary);
  border: 1px solid var(--pd-border);
  border-radius: var(--pd-radius-sm);
  color: var(--pd-text);
  padding: 3px 8px;
  font-size: 11px;
  font-family: var(--pd-mono);
  cursor: pointer;
  transition: background var(--pd-transition), border-color var(--pd-transition);
}

.pd-fire-recent-btn:hover {
  background: var(--pd-bg-secondary);
  border-color: var(--pd-accent);
}

/* ---- Pause Controls ---- */
.pd-pause-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--pd-bg-secondary);
  border-top: 1px solid var(--pd-border);
  flex-shrink: 0;
}

.pd-pause-btn {
  background: var(--pd-bg-tertiary);
  border: 1px solid var(--pd-border);
  border-radius: var(--pd-radius-sm);
  color: var(--pd-text);
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  font-family: var(--pd-sans);
  font-weight: 500;
  transition: background var(--pd-transition), border-color var(--pd-transition);
  display: flex;
  align-items: center;
  gap: 4px;
}

.pd-pause-btn:hover {
  border-color: var(--pd-accent);
  background: var(--pd-bg-secondary);
}

.pd-pause-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pd-pause-btn-icon {
  font-size: 10px;
}

.pd-pause-info {
  flex: 1;
  text-align: right;
  font-size: 11px;
  font-family: var(--pd-mono);
  color: var(--pd-text-dim);
}

.pd-pause-pending {
  margin-top: 8px;
  background: var(--pd-bg-secondary);
  border: 1px solid var(--pd-border);
  border-radius: var(--pd-radius);
  padding: 8px;
}

.pd-pause-pending-heading {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--pd-yellow);
  margin-bottom: 6px;
}

.pd-pause-pending-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
  font-size: 12px;
  font-family: var(--pd-mono);
}

.pd-pause-pending-type {
  color: var(--pd-text-bright);
  font-weight: 500;
}

.pd-pause-pending-payload {
  color: var(--pd-text-dim);
  font-size: 11px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---- Mailbox Panel (shown when paused) ---- */
.pd-mailbox-section {
  margin-top: 12px;
}

.pd-mailbox-heading {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--pd-cyan);
  margin-bottom: 6px;
}

.pd-mailbox-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 8px;
  font-size: 12px;
  font-family: var(--pd-mono);
  border-left: 2px solid var(--pd-border);
  margin-bottom: 2px;
}

.pd-mailbox-type {
  color: var(--pd-blue);
  font-weight: 500;
  min-width: 100px;
}

.pd-mailbox-count {
  color: var(--pd-text-dim);
  font-size: 11px;
}

/* ---- Scrollbar Styling ---- */
.pulse-devtools ::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.pulse-devtools ::-webkit-scrollbar-track {
  background: transparent;
}

.pulse-devtools ::-webkit-scrollbar-thumb {
  background: var(--pd-border);
  border-radius: 3px;
}

.pulse-devtools ::-webkit-scrollbar-thumb:hover {
  background: var(--pd-text-dim);
}

/* ---- Animations ---- */
@keyframes pd-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.pd-timeline-entry {
  animation: pd-fade-in 120ms ease;
}
`

let styleInjected = false

/**
 * Inject the devtools CSS into the document head (only once).
 */
export function injectStyles(): void {
  if (styleInjected) return
  const style = document.createElement('style')
  style.setAttribute('data-pulse-devtools', '')
  style.textContent = DEVTOOLS_CSS
  document.head.appendChild(style)
  styleInjected = true
}
