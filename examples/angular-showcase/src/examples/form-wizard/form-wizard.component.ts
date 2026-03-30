import { Component, computed, type WritableSignal, OnInit, OnDestroy } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import { providePulse, PulseService } from '@pulse/angular'
import {
  engine,
  currentStep,
  stepDirection,
  fieldValues,
  fieldErrors,
  stepValid,
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

@Component({
  selector: 'app-form-wizard',
  standalone: true,
  imports: [NgTemplateOutlet],
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="page">
      <style>
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
      </style>

      @if (result()?.success) {
        <div class="card">
          <div class="success-card">
            <div class="success-icon"><span>&#10004;</span></div>
            <h2 class="success-title">Submission Complete</h2>
            <p class="success-message">
              Your form has been submitted successfully. All state was managed through
              Pulse events and signals.
            </p>
          </div>
        </div>
      } @else {
        <div
          class="card"
          [class.shake]="shake() > 0"
          [attr.data-shake]="shake()"
        >
          <div class="card-header">
            <h1 class="title">Create Account</h1>
            <p class="subtitle">Multi-step form with event-driven validation</p>
          </div>

          <!-- Progress bar -->
          <div class="progress-bar-area">
            @for (label of stepLabels; track $index; let i = $index) {
              <div class="progress-step-wrap">
                <div class="progress-step">
                  <div
                    class="progress-dot"
                    [class.active]="step() === i"
                    [class.completed]="step() > i"
                  >
                    {{ step() > i ? '\u2713' : i + 1 }}
                  </div>
                  <span
                    class="progress-label"
                    [class.active]="step() === i"
                  >{{ label }}</span>
                </div>
                @if (i < stepLabels.length - 1) {
                  <div
                    class="progress-line"
                    [class.completed]="step() > i"
                  ></div>
                }
              </div>
            }
          </div>

          <!-- Form body -->
          <div class="body">
            @if (step() === 0) {
              <div class="form-row">
                <ng-container *ngTemplateOutlet="fieldTpl; context: { field: 'firstName', step: 0 }"></ng-container>
                <ng-container *ngTemplateOutlet="fieldTpl; context: { field: 'lastName', step: 0 }"></ng-container>
              </div>
              <ng-container *ngTemplateOutlet="fieldTpl; context: { field: 'email', step: 0 }"></ng-container>
              <ng-container *ngTemplateOutlet="fieldTpl; context: { field: 'phone', step: 0 }"></ng-container>
            }

            @if (step() === 1) {
              <ng-container *ngTemplateOutlet="fieldTpl; context: { field: 'street', step: 1 }"></ng-container>
              <ng-container *ngTemplateOutlet="fieldTpl; context: { field: 'city', step: 1 }"></ng-container>
              <div class="form-row">
                <ng-container *ngTemplateOutlet="fieldTpl; context: { field: 'state', step: 1 }"></ng-container>
                <ng-container *ngTemplateOutlet="fieldTpl; context: { field: 'zip', step: 1 }"></ng-container>
              </div>
            }

            @if (step() === 2) {
              <p class="review-intro">Please review your information before submitting.</p>
              @for (item of reviewFields(); track item.label) {
                <div class="review-section">
                  <div class="review-label">{{ item.label }}</div>
                  <div class="review-value">{{ item.value || '(not provided)' }}</div>
                </div>
              }
            }
          </div>

          <div class="footer">
            @if (step() > 0) {
              <button class="back-btn" (click)="prev()">Back</button>
            } @else {
              <div></div>
            }
            <button
              class="next-btn"
              [class.disabled]="submitting()"
              [disabled]="submitting()"
              (click)="next()"
            >
              {{ submitting() ? 'Submitting...' : step() === 2 ? 'Submit' : 'Continue' }}
            </button>
          </div>
        </div>
      }
    </div>

    <ng-template #fieldTpl let-field="field" let-step="step">
      <div class="field-group">
        <label class="field-label">{{ getFieldLabel(field) }}</label>
        <input
          class="field-input"
          [class.has-error]="getFieldError(field) !== null"
          [value]="getFieldValue(field)"
          [placeholder]="getFieldLabel(field)"
          (input)="onFieldInput(step, field, $event)"
        />
        <div class="error-text">{{ getFieldError(field) ?? '\u00A0' }}</div>
      </div>
    </ng-template>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 20px;
    }
    .card {
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      width: 100%;
      max-width: 540px;
      overflow: hidden;
    }
    .card.shake {
      animation: shakeForm 0.5s ease-in-out;
    }
    .card-header {
      padding: 32px 32px 0;
    }
    .title {
      font-size: 28px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .subtitle {
      color: #64748b;
      font-size: 14px;
      margin-top: 4px;
    }
    .progress-bar-area {
      display: flex;
      align-items: center;
      padding: 24px 32px;
    }
    .progress-step-wrap {
      flex: 1;
      display: flex;
      align-items: center;
    }
    .progress-step {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .progress-dot {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      background: #e2e8f0;
      color: #64748b;
      transition: all 0.3s;
    }
    .progress-dot.active,
    .progress-dot.completed {
      background: #4361ee;
      color: #fff;
    }
    .progress-label {
      font-size: 12px;
      font-weight: 400;
      color: #64748b;
      margin-top: 6px;
      transition: color 0.3s;
    }
    .progress-label.active {
      font-weight: 600;
      color: #4361ee;
    }
    .progress-line {
      flex: 1;
      height: 2px;
      background: #e2e8f0;
      margin-bottom: 22px;
      transition: background 0.3s;
    }
    .progress-line.completed {
      background: #4361ee;
    }
    .body {
      padding: 8px 32px 32px;
      min-height: 280px;
    }
    .field-group {
      margin-bottom: 20px;
    }
    .field-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .field-input {
      width: 100%;
      padding: 12px 14px;
      font-size: 15px;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.2s;
      background: #fff;
    }
    .field-input:focus {
      border-color: #4361ee;
    }
    .field-input.has-error {
      border-color: #ef4444;
      background: #fef2f2;
    }
    .error-text {
      font-size: 12px;
      color: #ef4444;
      margin-top: 4px;
      min-height: 16px;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .review-intro {
      color: #64748b;
      font-size: 14px;
      margin-bottom: 20px;
    }
    .review-section {
      margin-bottom: 16px;
    }
    .review-label {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .review-value {
      font-size: 16px;
      color: #0f172a;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      padding: 16px 32px 32px;
    }
    .back-btn {
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 600;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      background: #fff;
      color: #0f172a;
      cursor: pointer;
      transition: border-color 0.2s;
    }
    .next-btn {
      padding: 12px 32px;
      font-size: 14px;
      font-weight: 600;
      border: none;
      border-radius: 10px;
      background: #4361ee;
      color: #fff;
      cursor: pointer;
      transition: background 0.2s;
    }
    .next-btn.disabled {
      background: #e2e8f0;
      color: #64748b;
      cursor: not-allowed;
    }
    .success-card {
      text-align: center;
      padding: 60px 32px;
    }
    .success-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #ecfdf5;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      font-size: 32px;
      color: #10b981;
    }
    .success-title {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .success-message {
      color: #64748b;
      font-size: 14px;
      margin-top: 8px;
    }
  `],
})
export class FormWizardComponent implements OnInit, OnDestroy {
  stepLabels = STEP_LABELS

  step: WritableSignal<StepId>
  direction: WritableSignal<'next' | 'prev'>
  values: WritableSignal<FormData>
  errors: WritableSignal<Record<string, string | null>>
  submitting: WritableSignal<boolean>
  result: WritableSignal<{ success: boolean } | null>
  shake: WritableSignal<number>

  reviewFields = computed(() => {
    const v = this.values()
    return [
      { label: 'Name', value: `${v.firstName} ${v.lastName}` },
      { label: 'Email', value: v.email },
      { label: 'Phone', value: v.phone },
      { label: 'Address', value: `${v.street}, ${v.city}, ${v.state} ${v.zip}` },
    ]
  })

  constructor(private pulse: PulseService) {
    this.step = pulse.signal(currentStep)
    this.direction = pulse.signal(stepDirection)
    this.values = pulse.signal(fieldValues)
    this.errors = pulse.signal(fieldErrors)
    this.submitting = pulse.signal(isSubmitting)
    this.result = pulse.signal(submitResult)
    this.shake = pulse.signal(shakeActive)
  }

  ngOnInit(): void {
    ;(window as any).__pulseEngine = engine
  }

  ngOnDestroy(): void {
    ;(window as any).__pulseEngine = null
    engine.destroy()
  }

  getFieldLabel(field: string): string {
    return FIELD_LABELS[field] ?? field
  }

  getFieldValue(field: string): string {
    return (this.values() as any)[field] ?? ''
  }

  getFieldError(field: string): string | null {
    return this.errors()[field] ?? null
  }

  onFieldInput(step: StepId, field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value
    this.pulse.emit(FieldUpdated, { step, field, value })
  }

  next(): void {
    this.pulse.emit(NextStep, undefined)
  }

  prev(): void {
    this.pulse.emit(PrevStep, undefined)
  }
}
