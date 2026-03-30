import { Show, For, Switch, Match, createMemo } from 'solid-js'
import { useSignal, useEmit } from '@pulse/solid'
import {
  currentStep,
  stepDirection,
  fieldValues,
  fieldErrors,
  isSubmitting,
  submitResult,
  shakeActive,
  FieldUpdated,
  NextStep,
  PrevStep,
  STEP_FIELDS,
  STEP_LABELS,
  type StepId,
  type FormData,
} from './engine'

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

const colors = {
  bg: '#f8fafc',
  card: '#ffffff',
  primary: '#4361ee',
  primaryHover: '#3451de',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  error: '#ef4444',
  errorBg: '#fef2f2',
  success: '#10b981',
  successBg: '#ecfdf5',
}

// ---------------------------------------------------------------------------
// Field labels
// ---------------------------------------------------------------------------

const FIELD_LABELS: Record<string, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email Address',
  phone: 'Phone Number',
  street: 'Street Address',
  city: 'City',
  state: 'State',
  zip: 'ZIP Code',
}

// ---------------------------------------------------------------------------
// FormField component
// ---------------------------------------------------------------------------

function FormField(props: { field: string; step: StepId }) {
  const emit = useEmit()
  const values = useSignal(fieldValues)
  const errors = useSignal(fieldErrors)

  const value = createMemo(() => values()[props.field as keyof FormData] ?? '')
  const error = createMemo(() => errors()[props.field] ?? null)
  const hasError = createMemo(() => error() !== null)

  return (
    <div style={{ 'margin-bottom': '20px' }}>
      <label
        style={{
          display: 'block',
          'font-size': '13px',
          'font-weight': '600',
          color: colors.text,
          'margin-bottom': '6px',
        }}
      >
        {FIELD_LABELS[props.field] ?? props.field}
      </label>
      <input
        style={{
          width: '100%',
          padding: '12px 14px',
          'font-size': '15px',
          border: `2px solid ${hasError() ? colors.error : colors.border}`,
          'border-radius': '10px',
          outline: 'none',
          'box-sizing': 'border-box',
          transition: 'border-color 0.2s',
          background: hasError() ? colors.errorBg : '#fff',
        }}
        value={value()}
        placeholder={FIELD_LABELS[props.field] ?? props.field}
        onInput={(e) =>
          emit(FieldUpdated, { step: props.step, field: props.field, value: e.currentTarget.value })
        }
        onFocus={(e) => {
          e.currentTarget.style.borderColor = hasError() ? colors.error : colors.primary
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = hasError() ? colors.error : colors.border
        }}
      />
      <div
        style={{
          'font-size': '12px',
          color: colors.error,
          'margin-top': '4px',
          'min-height': '16px',
        }}
      >
        {error() ?? '\u00A0'}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 0: Personal Info
// ---------------------------------------------------------------------------

function PersonalInfoStep() {
  return (
    <div>
      <div
        style={{
          display: 'grid',
          'grid-template-columns': '1fr 1fr',
          gap: '16px',
        }}
      >
        <FormField field="firstName" step={0} />
        <FormField field="lastName" step={0} />
      </div>
      <FormField field="email" step={0} />
      <FormField field="phone" step={0} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 1: Address
// ---------------------------------------------------------------------------

function AddressStep() {
  return (
    <div>
      <FormField field="street" step={1} />
      <FormField field="city" step={1} />
      <div
        style={{
          display: 'grid',
          'grid-template-columns': '1fr 1fr',
          gap: '16px',
        }}
      >
        <FormField field="state" step={1} />
        <FormField field="zip" step={1} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2: Review
// ---------------------------------------------------------------------------

function ReviewStep() {
  const values = useSignal(fieldValues)

  const reviewFields = createMemo(() => [
    { label: 'Name', value: `${values().firstName} ${values().lastName}` },
    { label: 'Email', value: values().email },
    { label: 'Phone', value: values().phone },
    {
      label: 'Address',
      value: `${values().street}, ${values().city}, ${values().state} ${values().zip}`,
    },
  ])

  return (
    <div>
      <p style={{ color: colors.muted, 'font-size': '14px', 'margin-bottom': '20px' }}>
        Please review your information before submitting.
      </p>
      <For each={reviewFields()}>
        {(item) => (
          <div style={{ 'margin-bottom': '16px' }}>
            <div
              style={{
                'font-size': '12px',
                'font-weight': '600',
                color: colors.muted,
                'text-transform': 'uppercase',
                'letter-spacing': '0.5px',
                'margin-bottom': '4px',
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                'font-size': '16px',
                color: colors.text,
                padding: '8px 0',
                'border-bottom': `1px solid ${colors.border}`,
              }}
            >
              {item.value || '(not provided)'}
            </div>
          </div>
        )}
      </For>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

function ProgressBar() {
  const step = useSignal(currentStep)

  return (
    <div
      style={{
        display: 'flex',
        'align-items': 'center',
        padding: '24px 32px',
        gap: '0',
      }}
    >
      <For each={STEP_LABELS}>
        {(label, i) => (
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              flex: '1',
            }}
          >
            <div
              style={{
                flex: '1',
                display: 'flex',
                'flex-direction': 'column',
                'align-items': 'center',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  'border-radius': '50%',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  'font-size': '13px',
                  'font-weight': '700',
                  background:
                    step() > i() ? colors.primary : step() === i() ? colors.primary : colors.border,
                  color: step() > i() || step() === i() ? '#fff' : colors.muted,
                  transition: 'all 0.3s',
                }}
              >
                {step() > i() ? '\u2713' : i() + 1}
              </div>
              <span
                style={{
                  'font-size': '12px',
                  'font-weight': step() === i() ? '600' : '400',
                  color: step() === i() ? colors.primary : colors.muted,
                  'margin-top': '6px',
                  transition: 'color 0.3s',
                }}
              >
                {label}
              </span>
            </div>
            <Show when={i() < STEP_LABELS.length - 1}>
              <div
                style={{
                  flex: '1',
                  height: '2px',
                  background: step() > i() ? colors.primary : colors.border,
                  'margin-bottom': '22px',
                  transition: 'background 0.3s',
                }}
              />
            </Show>
          </div>
        )}
      </For>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Success screen
// ---------------------------------------------------------------------------

function SuccessScreen() {
  return (
    <div
      style={{
        'text-align': 'center',
        padding: '60px 32px',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          'border-radius': '50%',
          background: colors.successBg,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          margin: '0 auto 16px',
          'font-size': '32px',
        }}
      >
        <span role="img" aria-label="check">&#10004;</span>
      </div>
      <h2
        style={{
          'font-size': '24px',
          'font-weight': '700',
          color: colors.text,
          margin: '0',
        }}
      >
        Submission Complete
      </h2>
      <p
        style={{
          color: colors.muted,
          'font-size': '14px',
          'margin-top': '8px',
        }}
      >
        Your form has been submitted successfully. All state was managed through
        Pulse events and signals.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const emit = useEmit()
  const step = useSignal(currentStep)
  const direction = useSignal(stepDirection)
  const submitting = useSignal(isSubmitting)
  const result = useSignal(submitResult)
  const shake = useSignal(shakeActive)

  return (
    <Show
      when={!result()?.success}
      fallback={
        <div
          style={{
            'min-height': '100vh',
            background: colors.bg,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'font-family':
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: colors.card,
              'border-radius': '20px',
              'box-shadow': '0 4px 24px rgba(0,0,0,0.08)',
              width: '100%',
              'max-width': '540px',
              overflow: 'hidden',
            }}
          >
            <SuccessScreen />
          </div>
        </div>
      }
    >
      <div
        style={{
          'min-height': '100vh',
          background: colors.bg,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'font-family':
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '20px',
        }}
      >
        <style>{`
          @keyframes shakeForm {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
            20%, 40%, 60%, 80% { transform: translateX(6px); }
          }
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(30px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(-30px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>

        <div
          style={{
            background: colors.card,
            'border-radius': '20px',
            'box-shadow': '0 4px 24px rgba(0,0,0,0.08)',
            width: '100%',
            'max-width': '540px',
            overflow: 'hidden',
            animation: shake() > 0 ? 'shakeForm 0.5s ease-in-out' : undefined,
          }}
        >
          <div style={{ padding: '32px 32px 0' }}>
            <h1
              style={{
                'font-size': '28px',
                'font-weight': '800',
                color: colors.text,
                margin: '0',
              }}
            >
              Create Account
            </h1>
            <p
              style={{
                color: colors.muted,
                'font-size': '14px',
                'margin-top': '4px',
              }}
            >
              Multi-step form with event-driven validation
            </p>
          </div>

          <ProgressBar />

          <div
            style={{
              padding: '8px 32px 32px',
              'min-height': '280px',
              animation:
                direction() === 'next'
                  ? 'slideInRight 0.3s ease-out'
                  : 'slideInLeft 0.3s ease-out',
            }}
          >
            <Switch>
              <Match when={step() === 0}>
                <PersonalInfoStep />
              </Match>
              <Match when={step() === 1}>
                <AddressStep />
              </Match>
              <Match when={step() === 2}>
                <ReviewStep />
              </Match>
            </Switch>
          </div>

          <div
            style={{
              display: 'flex',
              'justify-content': 'space-between',
              padding: '16px 32px 32px',
            }}
          >
            <Show when={step() > 0} fallback={<div />}>
              <button
                style={{
                  padding: '12px 24px',
                  'font-size': '14px',
                  'font-weight': '600',
                  border: `2px solid ${colors.border}`,
                  'border-radius': '10px',
                  background: '#fff',
                  color: colors.text,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
                onClick={() => emit(PrevStep, undefined)}
              >
                Back
              </button>
            </Show>
            <button
              style={{
                padding: '12px 32px',
                'font-size': '14px',
                'font-weight': '600',
                border: 'none',
                'border-radius': '10px',
                background: submitting() ? colors.border : colors.primary,
                color: submitting() ? colors.muted : '#fff',
                cursor: submitting() ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
              disabled={submitting()}
              onClick={() => emit(NextStep, undefined)}
            >
              {submitting()
                ? 'Submitting...'
                : step() === 2
                  ? 'Submit'
                  : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </Show>
  )
}
