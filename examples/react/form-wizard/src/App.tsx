import { usePulse, useEmit } from '@pulse/react'
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
    minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: 20,
  } as React.CSSProperties,
  card: { background: colors.card, borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: 540, overflow: 'hidden' } as React.CSSProperties,
  header: { padding: '32px 32px 0' } as React.CSSProperties,
  title: { fontSize: 28, fontWeight: 800, color: colors.text, margin: 0 } as React.CSSProperties,
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 4 } as React.CSSProperties,
  progressBar: { display: 'flex', alignItems: 'center', padding: '24px 32px', gap: 0 } as React.CSSProperties,
  progressStep: (_active: boolean, _completed: boolean) => ({ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }) as React.CSSProperties,
  progressDot: (active: boolean, completed: boolean) => ({
    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, background: completed ? colors.primary : active ? colors.primary : colors.border,
    color: completed || active ? '#fff' : colors.muted, transition: 'all 0.3s',
  }) as React.CSSProperties,
  progressLabel: (active: boolean) => ({ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? colors.primary : colors.muted, marginTop: 6, transition: 'color 0.3s' }) as React.CSSProperties,
  progressLine: (completed: boolean) => ({ flex: 1, height: 2, background: completed ? colors.primary : colors.border, marginBottom: 22, transition: 'background 0.3s' }) as React.CSSProperties,
  body: { padding: '8px 32px 32px', minHeight: 280 } as React.CSSProperties,
  fieldGroup: { marginBottom: 20 } as React.CSSProperties,
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 6 } as React.CSSProperties,
  input: (hasError: boolean) => ({
    width: '100%', padding: '12px 14px', fontSize: 15, border: `2px solid ${hasError ? colors.error : colors.border}`,
    borderRadius: 10, outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.2s',
    background: hasError ? colors.errorBg : '#fff',
  }) as React.CSSProperties,
  errorText: { fontSize: 12, color: colors.error, marginTop: 4, minHeight: 16 } as React.CSSProperties,
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } as React.CSSProperties,
  footer: { display: 'flex', justifyContent: 'space-between', padding: '16px 32px 32px' } as React.CSSProperties,
  backBtn: { padding: '12px 24px', fontSize: 14, fontWeight: 600, border: `2px solid ${colors.border}`, borderRadius: 10, background: '#fff', color: colors.text, cursor: 'pointer', transition: 'border-color 0.2s' } as React.CSSProperties,
  nextBtn: (disabled: boolean) => ({
    padding: '12px 32px', fontSize: 14, fontWeight: 600, border: 'none', borderRadius: 10,
    background: disabled ? colors.border : colors.primary, color: disabled ? colors.muted : '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
  }) as React.CSSProperties,
  reviewSection: { marginBottom: 16 } as React.CSSProperties,
  reviewLabel: { fontSize: 12, fontWeight: 600, color: colors.muted, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 } as React.CSSProperties,
  reviewValue: { fontSize: 16, color: colors.text, padding: '8px 0', borderBottom: `1px solid ${colors.border}` } as React.CSSProperties,
  successCard: { textAlign: 'center' as const, padding: '60px 32px' } as React.CSSProperties,
  successIcon: { width: 64, height: 64, borderRadius: '50%', background: colors.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 32 } as React.CSSProperties,
  successTitle: { fontSize: 24, fontWeight: 700, color: colors.text, margin: 0 } as React.CSSProperties,
  successMessage: { color: colors.muted, fontSize: 14, marginTop: 8 } as React.CSSProperties,
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

function FormField({ field, step }: { field: string; step: StepId }) {
  const emit = useEmit()
  const values = usePulse(FieldValuesChanged, { firstName: '', lastName: '', email: '', phone: '', street: '', city: '', state: '', zip: '' } as FormData)
  const errors = usePulse(FieldErrorsChanged, {} as Record<string, string | null>)

  const value = values[field as keyof FormData] ?? ''
  const error = errors[field] ?? null
  const hasError = error !== null

  return (
    <div style={styles.fieldGroup}>
      <label style={styles.label}>{FIELD_LABELS[field] ?? field}</label>
      <input
        style={styles.input(hasError)}
        value={value}
        placeholder={FIELD_LABELS[field] ?? field}
        onChange={(e) => emit(FieldUpdated, { step, field, value: e.target.value })}
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
      <p style={{ color: colors.muted, fontSize: 14, marginBottom: 20 }}>Please review your information before submitting.</p>
      {reviewFields.map((item) => (
        <div key={item.label} style={styles.reviewSection}>
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
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div style={styles.progressStep(step === i, step > i)}>
            <div style={styles.progressDot(step === i, step > i)}>{step > i ? '\u2713' : i + 1}</div>
            <span style={styles.progressLabel(step === i)}>{label}</span>
          </div>
          {i < STEP_LABELS.length - 1 && <div style={styles.progressLine(step > i)} />}
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

  if (result?.success) {
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

      <div style={{ ...styles.card, animation: shake > 0 ? 'shakeForm 0.5s ease-in-out' : undefined }} key={`shake-${shake}`}>
        <div style={styles.header}>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>Multi-step form with event-driven validation</p>
        </div>
        <ProgressBar />
        <div style={{ ...styles.body, animation: direction === 'next' ? 'slideInRight 0.3s ease-out' : 'slideInLeft 0.3s ease-out' }} key={`step-${step}`}>
          {stepComponents[step]}
        </div>
        <div style={styles.footer}>
          {step > 0 ? <button style={styles.backBtn} onClick={() => emit(PrevStep, undefined)}>Back</button> : <div />}
          <button style={styles.nextBtn(submitting)} disabled={submitting} onClick={() => emit(NextStep, undefined)}>
            {submitting ? 'Submitting...' : step === 2 ? 'Submit' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
