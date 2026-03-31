import { usePulse, useEmit } from '@pulse/solid'
import {
  CurrentStepChanged,
  StepDirectionChanged,
  FieldValuesChanged,
  FieldErrorsChanged,
  IsSubmittingChanged,
  SubmitResultChanged,
  ShakeCountChanged,
  FieldUpdated,
  NextStep,
  PrevStep,
  STEP_LABELS,
  type StepId,
  type FormData,
} from './engine'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const colors = {
  bg: '#f8fafc', card: '#ffffff', primary: '#4361ee', primaryHover: '#3451de',
  text: '#0f172a', muted: '#64748b', border: '#e2e8f0', error: '#ef4444',
  errorBg: '#fef2f2', success: '#10b981', successBg: '#ecfdf5',
}

const styles = {
  container: {
    'min-height': '100vh', background: colors.bg, display: 'flex', 'align-items': 'center',
    'justify-content': 'center', 'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: 20,
  },
  card: { background: colors.card, 'border-radius': 20, 'box-shadow': '0 4px 24px rgba(0,0,0,0.08)', width: '100%', 'max-width': 540, overflow: 'hidden' },
  header: { padding: '32px 32px 0' },
  title: { 'font-size': 28, 'font-weight': 800, color: colors.text, margin: 0 },
  subtitle: { color: colors.muted, 'font-size': 14, 'margin-top': 4 },
  progressBar: { display: 'flex', 'align-items': 'center', padding: '24px 32px', gap: 0 },
  progressStep: (_active: boolean, _completed: boolean) => ({ flex: 1, display: 'flex', 'flex-direction': 'column' as const, 'align-items': 'center' }),
  progressDot: (active: boolean, completed: boolean) => ({
    width: 32, height: 32, 'border-radius': '50%', display: 'flex', 'align-items': 'center', 'justify-content': 'center',
    'font-size': 13, 'font-weight': 700, background: completed ? colors.primary : active ? colors.primary : colors.border,
    color: completed || active ? '#fff' : colors.muted, transition: 'all 0.3s',
  }),
  progressLabel: (active: boolean) => ({ 'font-size': 12, 'font-weight': active ? 600 : 400, color: active ? colors.primary : colors.muted, 'margin-top': 6, transition: 'color 0.3s' }),
  progressLine: (completed: boolean) => ({ flex: 1, height: 2, background: completed ? colors.primary : colors.border, 'margin-bottom': 22, transition: 'background 0.3s' }),
  body: { padding: '8px 32px 32px', 'min-height': 280 },
  fieldGroup: { 'margin-bottom': 20 },
  label: { display: 'block', 'font-size': 13, 'font-weight': 600, color: colors.text, 'margin-bottom': 6 },
  input: (hasError: boolean) => ({
    width: '100%', padding: '12px 14px', 'font-size': 15, border: `2px solid ${hasError ? colors.error : colors.border}`,
    'border-radius': 10, outline: 'none', 'box-sizing': 'border-box' as const, transition: 'border-color 0.2s',
    background: hasError ? colors.errorBg : '#fff',
  }),
  errorText: { 'font-size': 12, color: colors.error, 'margin-top': 4, 'min-height': 16 },
  row: { display: 'grid', 'grid-template-columns': '1fr 1fr', gap: 16 },
  footer: { display: 'flex', 'justify-content': 'space-between', padding: '16px 32px 32px' },
  backBtn: { padding: '12px 24px', 'font-size': 14, 'font-weight': 600, border: `2px solid ${colors.border}`, 'border-radius': 10, background: '#fff', color: colors.text, cursor: 'pointer', transition: 'border-color 0.2s' },
  nextBtn: (disabled: boolean) => ({
    padding: '12px 32px', 'font-size': 14, 'font-weight': 600, border: 'none', 'border-radius': 10,
    background: disabled ? colors.border : colors.primary, color: disabled ? colors.muted : '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
  }),
  reviewSection: { 'margin-bottom': 16 },
  reviewLabel: { 'font-size': 12, 'font-weight': 600, color: colors.muted, 'text-transform': 'uppercase' as const, 'letter-spacing': 0.5, 'margin-bottom': 4 },
  reviewValue: { 'font-size': 16, color: colors.text, padding: '8px 0', 'border-bottom': `1px solid ${colors.border}` },
  successCard: { 'text-align': 'center' as const, padding: '60px 32px' },
  successIcon: { width: 64, height: 64, 'border-radius': '50%', background: colors.successBg, display: 'flex', 'align-items': 'center', 'justify-content': 'center', margin: '0 auto 16px', 'font-size': 32 },
  successTitle: { 'font-size': 24, 'font-weight': 700, color: colors.text, margin: 0 },
  successMessage: { color: colors.muted, 'font-size': 14, 'margin-top': 8 },
}

// ---------------------------------------------------------------------------
// Field labels
// ---------------------------------------------------------------------------

const FIELD_LABELS: Record<string, string> = {
  firstName: 'First Name', lastName: 'Last Name', email: 'Email Address', phone: 'Phone Number',
  street: 'Street Address', city: 'City', state: 'State', zip: 'ZIP Code',
}

// ---------------------------------------------------------------------------
// FormField component
// ---------------------------------------------------------------------------

function FormField({ field, step }: { field: string; step(): StepId }) {
  const emit = useEmit()
  const values = usePulse(FieldValuesChanged, { firstName: '', lastName: '', email: '', phone: '', street: '', city: '', state: '', zip: '' } as FormData)
  const errors = usePulse(FieldErrorsChanged, {} as Record<string, string | null>)

  const value = values()[field as keyof FormData] ?? ''
  const error = errors()[field] ?? null
  const hasError = error !== null

  return (
    <div style={styles.fieldGroup}>
      <label style={styles.label}>{FIELD_LABELS[field] ?? field}</label>
      <input
        style={styles.input(hasError)}
        value={value}
        placeholder={FIELD_LABELS[field] ?? field}
        onChange={(e) => emit(FieldUpdated, { step, field, value: e.currentTarget.value })}
        onFocus={(e) => { e.currentTarget.style.borderColor = hasError ? colors.error : colors.primary }}
        onBlur={(e) => { e.currentTarget.style.borderColor = hasError ? colors.error : colors.border }}
      />
      <div style={styles.errorText}>{error ?? '\u00A0'}</div>
    </div>
  )
}

function PersonalInfoStep() {
  return (
    <div>
      <div style={styles.row}>
        <FormField field="firstName" step={0} />
        <FormField field="lastName" step={0} />
      </div>
      <FormField field="email" step={0} />
      <FormField field="phone" step={0} />
    </div>
  )
}

function AddressStep() {
  return (
    <div>
      <FormField field="street" step={1} />
      <FormField field="city" step={1} />
      <div style={styles.row}>
        <FormField field="state" step={1} />
        <FormField field="zip" step={1} />
      </div>
    </div>
  )
}

function ReviewStep() {
  const values = usePulse(FieldValuesChanged, { firstName: '', lastName: '', email: '', phone: '', street: '', city: '', state: '', zip: '' } as FormData)
  const reviewFields = [
    { label: 'Name', value: `${values.firstName} ${values.lastName}` },
    { label: 'Email', value: values.email },
    { label: 'Phone', value: values.phone },
    { label: 'Address', value: `${values.street}, ${values.city}, ${values.state} ${values.zip}` },
  ]

  return (
    <div>
      <p style={{ color: colors.muted, 'font-size': 14, 'margin-bottom': 20 }}>Please review your information before submitting().</p>
      {reviewFields.map((item) => (
        <div style={styles.reviewSection}>
          <div style={styles.reviewLabel}>{item.label}</div>
          <div style={styles.reviewValue}>{item.value || '(not provided)'}</div>
        </div>
      ))}
    </div>
  )
}

function ProgressBar() {
  const step = usePulse(CurrentStepChanged, 0 as StepId)

  return (
    <div style={styles.progressBar}>
      {STEP_LABELS.map((label, i) => (
        <div style={{ display: 'flex', 'align-items': 'center', flex: 1 }}>
          <div style={styles.progressStep(step() === i, step() > i)}>
            <div style={styles.progressDot(step() === i, step() > i)}>{step() > i ? '\u2713' : i + 1}</div>
            <span style={styles.progressLabel(step() === i)}>{label}</span>
          </div>
          {i < STEP_LABELS.length - 1 && <div style={styles.progressLine(step() > i)} />}
        </div>
      ))}
    </div>
  )
}

function SuccessScreen() {
  return (
    <div style={styles.successCard}>
      <div style={styles.successIcon}><span role="img" aria-label="check">&#10004;</span></div>
      <h2 style={styles.successTitle}>Submission Complete</h2>
      <p style={styles.successMessage}>Your form has been submitted successfully. All state was managed through Pulse events and on/emit.</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const emit = useEmit()
  const step = usePulse(CurrentStepChanged, 0 as StepId)
  const direction = usePulse(StepDirectionChanged, 'next' as 'next' | 'prev')
  const submitting = usePulse(IsSubmittingChanged, false)
  const result = usePulse(SubmitResultChanged, null as { success: boolean } | null)
  const shake = usePulse(ShakeCountChanged, 0)

  if (result()?.success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}><SuccessScreen /></div>
      </div>
    )
  }

  const stepComponents = [
    <PersonalInfoStep key="personal" />,
    <AddressStep key="address" />,
    <ReviewStep key="review" />,
  ]

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes shakeForm { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); } 20%, 40%, 60%, 80% { transform: translateX(6px); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      <div style={{ ...styles.card, animation: shake > 0 ? 'shakeForm 0.5s ease-in-out' : undefined }}>
        <div style={styles.header}>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>Multi-step form with event-driven validation</p>
        </div>
        <ProgressBar />
        <div style={{ ...styles.body, animation: direction === 'next' ? 'slideInRight 0.3s ease-out' : 'slideInLeft 0.3s ease-out' }}>
          {stepComponents[step()]}
        </div>
        <div style={styles.footer}>
          {step() > 0 ? <button style={styles.backBtn} onClick={() => emit(PrevStep, undefined)}>Back</button> : <div />}
          <button style={styles.nextBtn(submitting())} disabled={submitting} onClick={() => emit(NextStep, undefined)}>
            {submitting() ? 'Submitting...' : step === 2 ? 'Submit' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
