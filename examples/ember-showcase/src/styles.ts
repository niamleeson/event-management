/**
 * Global styles for the Ember showcase.
 *
 * In a real Ember app, these would be in app/styles/app.css and loaded
 * by ember-cli. Here we inject them as a <style> tag since we're using
 * a Vite-based demonstration of the @pulse/ember adapter pattern.
 */
export function injectStyles(): void {
  const style = document.createElement('style')
  style.textContent = GLOBAL_STYLES
  document.head.appendChild(style)
}

const GLOBAL_STYLES = `
  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
    width: 100%;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f0f2f5;
    color: #1a1a2e;
  }

  /* ---- Layout ---- */
  .layout {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  .sidebar {
    width: 260px;
    min-width: 260px;
    background: #1a1a2e;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    border-right: 1px solid rgba(255, 255, 255, 0.06);
  }

  .sidebar-header {
    padding: 24px 20px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #4361ee, #7c3aed);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 800;
    font-size: 1.25rem;
    letter-spacing: -0.5px;
    flex-shrink: 0;
  }

  .logo-title {
    display: block;
    color: #ffffff;
    font-size: 1.2rem;
    font-weight: 700;
    letter-spacing: -0.3px;
    line-height: 1.2;
  }

  .logo-subtitle {
    display: block;
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.75rem;
    font-weight: 400;
    line-height: 1.2;
    margin-top: 1px;
  }

  .sidebar-nav {
    flex: 1;
    padding: 12px 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .nav-link {
    display: flex;
    flex-direction: column;
    padding: 10px 14px;
    border-radius: 8px;
    text-decoration: none;
    transition: background 0.15s, transform 0.1s;
    cursor: pointer;
  }

  .nav-link:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .nav-link.active {
    background: #4361ee;
  }

  .nav-link.active:hover {
    background: #3a56d4;
  }

  .nav-label {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1.3;
  }

  .nav-link.active .nav-label {
    color: #ffffff;
  }

  .nav-desc {
    color: rgba(255, 255, 255, 0.35);
    font-size: 0.75rem;
    line-height: 1.3;
    margin-top: 2px;
  }

  .nav-link.active .nav-desc {
    color: rgba(255, 255, 255, 0.65);
  }

  .sidebar-footer {
    padding: 16px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .footer-text {
    color: rgba(255, 255, 255, 0.25);
    font-size: 0.75rem;
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
    background: #f0f2f5;
    position: relative;
  }

  /* ---- Example containers ---- */
  .example-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 32px 40px;
  }

  .example-header {
    margin-bottom: 24px;
  }

  .example-header h2 {
    font-size: 1.6rem;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 4px;
  }

  .example-header .subtitle {
    color: #666;
    font-size: 0.9rem;
  }

  .ember-note {
    background: #f8f4ff;
    border: 1px solid #e0d4f5;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 20px;
    font-size: 0.82rem;
    color: #5b3d8f;
    line-height: 1.5;
  }

  .ember-note strong {
    color: #4a2d7a;
  }

  .ember-note code {
    background: rgba(124, 58, 237, 0.08);
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 0.8rem;
  }

  /* ---- Input styles ---- */
  input[type="text"],
  input[type="email"],
  input[type="tel"],
  select {
    padding: 8px 12px;
    border: 1px solid #d0d5dd;
    border-radius: 6px;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
  }

  input[type="text"]:focus,
  input[type="email"]:focus,
  input[type="tel"]:focus,
  select:focus {
    border-color: #4361ee;
    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.12);
  }

  /* ---- Button styles ---- */
  button, .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, opacity 0.15s;
    background: #4361ee;
    color: white;
  }

  button:hover {
    background: #3a56d4;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button.secondary {
    background: #e4e7ec;
    color: #344054;
  }

  button.secondary:hover {
    background: #d0d5dd;
  }

  button.danger {
    background: #e63946;
  }

  button.danger:hover {
    background: #c5303c;
  }

  /* ---- Todo styles ---- */
  .input-row {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .input-row input {
    flex: 1;
  }

  .error {
    color: #e63946;
    font-size: 0.82rem;
    margin-bottom: 8px;
  }

  .filter-bar {
    display: flex;
    gap: 6px;
    margin-bottom: 16px;
  }

  .filter-bar button {
    background: #e4e7ec;
    color: #344054;
    padding: 6px 14px;
    font-size: 0.82rem;
  }

  .filter-bar button:hover {
    background: #d0d5dd;
  }

  .filter-bar button.active {
    background: #4361ee;
    color: white;
  }

  .todo-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: white;
    border-radius: 8px;
    margin-bottom: 6px;
    border: 1px solid #e4e7ec;
    transition: background 0.15s;
  }

  .todo-item.completed .todo-text {
    text-decoration: line-through;
    color: #98a2b3;
  }

  .todo-text {
    flex: 1;
    font-size: 0.9rem;
  }

  .remove-btn {
    background: transparent;
    color: #98a2b3;
    padding: 4px 8px;
    font-size: 1.1rem;
    line-height: 1;
  }

  .remove-btn:hover {
    color: #e63946;
    background: rgba(230, 57, 70, 0.08);
  }

  .empty {
    color: #98a2b3;
    text-align: center;
    padding: 24px;
    font-size: 0.9rem;
  }

  .footer {
    color: #667085;
    font-size: 0.82rem;
    margin-top: 12px;
  }

  .hint {
    color: #98a2b3;
    font-size: 0.8rem;
    margin-top: 16px;
    font-style: italic;
  }

  /* ---- Search / API Call styles ---- */
  .search-row {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  .search-row input {
    flex: 1;
  }

  .clear-btn {
    background: #e4e7ec;
    color: #344054;
  }

  .loading {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px;
    color: #667085;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e4e7ec;
    border-top-color: #4361ee;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #fef3f2;
    border: 1px solid #fecdca;
    border-radius: 8px;
    margin-bottom: 12px;
    color: #b42318;
    font-size: 0.85rem;
  }

  .error-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: #e63946;
    color: white;
    border-radius: 50%;
    font-size: 0.7rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .results {
    margin-bottom: 16px;
  }

  .result-count {
    color: #667085;
    font-size: 0.82rem;
    margin-bottom: 10px;
  }

  .user-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: white;
    border: 1px solid #e4e7ec;
    border-radius: 8px;
    margin-bottom: 6px;
  }

  .avatar {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #4361ee, #7c3aed);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .user-info {
    flex: 1;
  }

  .user-name {
    font-weight: 600;
    font-size: 0.9rem;
  }

  .user-email {
    color: #667085;
    font-size: 0.82rem;
  }

  /* ---- Counter / Simple Animation ---- */
  .counter-display {
    text-align: center;
    margin: 24px 0;
  }

  .counter-value {
    font-size: 4rem;
    font-weight: 800;
    color: #1a1a2e;
    line-height: 1;
    transition: color 0.2s;
  }

  .counter-value.animating {
    color: #4361ee;
  }

  .actual-value {
    display: block;
    color: #98a2b3;
    font-size: 0.85rem;
    margin-top: 8px;
  }

  .progress-bar {
    height: 4px;
    background: #e4e7ec;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 4px;
  }

  .progress-fill {
    height: 100%;
    background: #4361ee;
    border-radius: 2px;
    transition: width 0.05s linear;
  }

  .progress-label {
    color: #667085;
    font-size: 0.78rem;
    text-align: center;
    margin-bottom: 16px;
  }

  .controls {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin-bottom: 12px;
  }

  .controls .btn.increment { background: #2a9d8f; }
  .controls .btn.increment:hover { background: #238b7e; }
  .controls .btn.decrement { background: #e76f51; }
  .controls .btn.decrement:hover { background: #d15f43; }
  .controls .btn.reset { background: #667085; }
  .controls .btn.reset:hover { background: #556070; }

  /* ---- Staggered Cards / Complex Animation ---- */
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }

  .card {
    background: white;
    border-radius: 10px;
    padding: 20px;
    border: 1px solid #e4e7ec;
    position: relative;
    transition: box-shadow 0.15s;
  }

  .card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }

  .card-title {
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .card-description {
    font-size: 0.82rem;
    color: #667085;
  }

  .card-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: #4361ee;
    color: white;
    font-size: 0.65rem;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
  }

  .success-banner {
    background: #ecfdf3;
    border: 1px solid #a6f4c5;
    border-radius: 8px;
    padding: 12px 16px;
    color: #065f46;
    font-size: 0.85rem;
    margin-bottom: 16px;
  }

  /* ---- Kanban / Drag + API ---- */
  .toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .status {
    font-size: 0.82rem;
    padding: 4px 10px;
    border-radius: 4px;
  }

  .status.saving {
    background: #fef3c7;
    color: #92400e;
  }

  .status.error {
    background: #fef3f2;
    color: #b42318;
  }

  .board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 16px;
  }

  .column {
    background: white;
    border-radius: 10px;
    border: 1px solid #e4e7ec;
    min-height: 200px;
  }

  .column-header {
    padding: 12px 16px;
    border-bottom: 1px solid #e4e7ec;
    font-size: 0.9rem;
    font-weight: 700;
    color: #344054;
  }

  .column-body {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 80px;
  }

  .kanban-card {
    background: #f9fafb;
    border: 1px solid #e4e7ec;
    border-radius: 6px;
    padding: 10px 12px;
    cursor: grab;
    transition: box-shadow 0.15s, background 0.15s;
  }

  .kanban-card:hover {
    background: #f0f2f5;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  }

  .kanban-card.dragging {
    opacity: 0.6;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .kanban-card .card-title {
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .card-actions {
    display: flex;
    gap: 4px;
    margin-top: 6px;
  }

  .move-btn {
    background: #e4e7ec;
    color: #344054;
    padding: 3px 10px;
    font-size: 0.78rem;
    border-radius: 4px;
  }

  .move-btn:hover {
    background: #d0d5dd;
  }

  .debug-info {
    background: #f1f3f5;
    border-radius: 6px;
    padding: 10px 14px;
    font-size: 0.78rem;
    color: #667085;
    margin-bottom: 12px;
    font-family: monospace;
  }

  /* ---- Dashboard ---- */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 14px;
    margin-bottom: 20px;
  }

  .metric-card {
    background: white;
    border: 1px solid #e4e7ec;
    border-radius: 10px;
    padding: 16px;
  }

  .metric-card h3 {
    font-size: 0.78rem;
    color: #667085;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }

  .metric-value {
    font-size: 1.6rem;
    font-weight: 800;
    color: #1a1a2e;
    line-height: 1.2;
  }

  .metric-value.danger {
    color: #e63946;
  }

  .bar-container {
    height: 6px;
    background: #e4e7ec;
    border-radius: 3px;
    overflow: hidden;
    margin-top: 8px;
  }

  .bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease-out;
  }

  .sparkline {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 40px;
    margin-top: 10px;
  }

  .spark-bar {
    flex: 1;
    border-radius: 2px 2px 0 0;
    min-height: 2px;
    transition: height 0.3s ease-out;
  }

  .alerts-panel {
    background: white;
    border: 1px solid #e4e7ec;
    border-radius: 10px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .alerts-panel h3 {
    font-size: 0.9rem;
    font-weight: 700;
    margin-bottom: 12px;
    color: #344054;
  }

  .alert-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 6px;
    margin-bottom: 6px;
    font-size: 0.82rem;
  }

  .alert-item.warning {
    background: #fef3c7;
    color: #92400e;
  }

  .alert-item.critical {
    background: #fef3f2;
    color: #b42318;
  }

  .alert-badge {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 3px;
    background: rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
  }

  .alert-message {
    flex: 1;
  }

  .dismiss-btn {
    background: transparent;
    color: inherit;
    padding: 2px 8px;
    font-size: 0.75rem;
    opacity: 0.6;
  }

  .dismiss-btn:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.05);
  }

  .no-alerts {
    color: #98a2b3;
    font-size: 0.85rem;
  }

  .btn.start {
    background: #2a9d8f;
  }

  .btn.start:hover {
    background: #238b7e;
  }

  .btn.stop {
    background: #e63946;
  }

  .btn.stop:hover {
    background: #c5303c;
  }

  /* ---- Form Wizard ---- */
  .progress-container {
    margin-bottom: 24px;
  }

  .step-indicators {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
  }

  .step-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #e4e7ec;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    color: #667085;
    transition: background 0.2s, color 0.2s;
  }

  .step-dot.active {
    background: #4361ee;
    color: white;
  }

  .step-dot.completed {
    background: #2a9d8f;
    color: white;
  }

  .step-title {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 16px;
    color: #1a1a2e;
  }

  .step-content {
    margin-bottom: 20px;
    min-height: 120px;
  }

  .form-group {
    margin-bottom: 14px;
  }

  .form-group label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: #344054;
    margin-bottom: 4px;
  }

  .checkbox-label {
    display: flex !important;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .checkbox-label input[type="checkbox"] {
    width: 16px;
    height: 16px;
  }

  .field-error {
    color: #e63946;
    font-size: 0.78rem;
    margin-top: 4px;
  }

  .error-list {
    background: #fef3f2;
    border: 1px solid #fecdca;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 12px;
  }

  .error-item {
    color: #b42318;
    font-size: 0.82rem;
    margin-bottom: 2px;
  }

  .submit-error {
    background: #fef3f2;
    border: 1px solid #fecdca;
    border-radius: 8px;
    padding: 10px 14px;
    color: #b42318;
    font-size: 0.85rem;
    margin-bottom: 12px;
  }

  .nav-buttons {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .nav-buttons .spacer {
    flex: 1;
  }

  .btn.prev {
    background: #e4e7ec;
    color: #344054;
  }

  .btn.prev:hover {
    background: #d0d5dd;
  }

  .btn.next {
    background: #4361ee;
  }

  .btn.submit {
    background: #2a9d8f;
  }

  .btn.submit:hover {
    background: #238b7e;
  }

  .review-section {
    background: #f9fafb;
    border: 1px solid #e4e7ec;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 10px;
  }

  .review-section h4 {
    font-size: 0.82rem;
    font-weight: 700;
    color: #344054;
    margin-bottom: 4px;
  }

  .review-section p {
    font-size: 0.85rem;
    color: #667085;
  }

  .success-panel {
    text-align: center;
    padding: 40px 20px;
  }

  .success-panel h3 {
    font-size: 1.4rem;
    color: #065f46;
    margin-bottom: 12px;
  }

  .success-panel p {
    color: #667085;
    margin-bottom: 8px;
  }

  .success-panel button {
    margin-top: 16px;
  }
`
