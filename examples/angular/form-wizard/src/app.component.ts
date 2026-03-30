import { Component, computed, type WritableSignal } from '@angular/core'
import { PulseService } from '@pulse/angular'
import {
  PersonalUpdated,
  AddressUpdated,
  PreferencesUpdated,
  NextStep,
  PrevStep,
  SubmitForm,
  ValidateStep,
  currentStepSig,
  personalSig,
  addressSig,
  preferencesSig,
  validationSig,
  submittingSig,
  submitResultSig,
  submitErrorSig,
  stepTransitionTween,
  type PersonalInfo,
  type AddressInfo,
  type PreferencesInfo,
  type StepValidation,
  type SubmitResult,
  type FormData,
} from './engine'

@Component({
  selector: 'app-root',
  standalone: true,
  providers: [PulseService],
  template: `
    <div class="container">
      <h1>Registration Wizard</h1>

      <div class="steps">
        @for (label of stepLabels; track $index) {
          <div
            class="step-indicator"
            [class.active]="currentStep() === $index"
            [class.completed]="currentStep() > $index"
          >
            <span class="step-num">{{ $index + 1 }}</span>
            <span class="step-label">{{ label }}</span>
          </div>
        }
      </div>

      <div class="progress-bar">
        <div class="progress-fill" [style.width.%]="progressPercent()"></div>
      </div>

      @if (submitResult()) {
        <div class="success-panel">
          <h2>Success!</h2>
          <p>{{ submitResult()!.message }}</p>
        </div>
      } @else {
        <div class="form-body" [style.opacity]="transitionOpacity()">

          @if (currentStep() === 0) {
            <div class="form-section">
              <h2>Personal Information</h2>
              <label>
                First Name
                <input
                  type="text"
                  [value]="personal().firstName"
                  (input)="updatePersonal('firstName', $event)"
                  placeholder="John"
                />
              </label>
              <label>
                Last Name
                <input
                  type="text"
                  [value]="personal().lastName"
                  (input)="updatePersonal('lastName', $event)"
                  placeholder="Doe"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  [value]="personal().email"
                  (input)="updatePersonal('email', $event)"
                  placeholder="john@example.com"
                />
              </label>
            </div>
          }

          @if (currentStep() === 1) {
            <div class="form-section">
              <h2>Address</h2>
              <label>
                Street
                <input
                  type="text"
                  [value]="address().street"
                  (input)="updateAddress('street', $event)"
                  placeholder="123 Main St"
                />
              </label>
              <label>
                City
                <input
                  type="text"
                  [value]="address().city"
                  (input)="updateAddress('city', $event)"
                  placeholder="Springfield"
                />
              </label>
              <div class="row">
                <label>
                  State
                  <input
                    type="text"
                    [value]="address().state"
                    (input)="updateAddress('state', $event)"
                    placeholder="IL"
                  />
                </label>
                <label>
                  ZIP Code
                  <input
                    type="text"
                    [value]="address().zip"
                    (input)="updateAddress('zip', $event)"
                    placeholder="62701"
                  />
                </label>
              </div>
            </div>
          }

          @if (currentStep() === 2) {
            <div class="form-section">
              <h2>Preferences</h2>
              <label class="checkbox">
                <input
                  type="checkbox"
                  [checked]="preferences().newsletter"
                  (change)="updatePreferences('newsletter', $event)"
                />
                Subscribe to newsletter
              </label>
              <label class="checkbox">
                <input
                  type="checkbox"
                  [checked]="preferences().notifications"
                  (change)="updatePreferences('notifications', $event)"
                />
                Enable notifications
              </label>
              <label>
                Theme
                <select
                  [value]="preferences().theme"
                  (change)="updatePreferences('theme', $event)"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
            </div>
          }

          @if (currentStep() === 3) {
            <div class="form-section">
              <h2>Review</h2>
              <div class="review-group">
                <h3>Personal</h3>
                <p>{{ personal().firstName }} {{ personal().lastName }}</p>
                <p>{{ personal().email }}</p>
              </div>
              <div class="review-group">
                <h3>Address</h3>
                <p>{{ address().street }}</p>
                <p>{{ address().city }}, {{ address().state }} {{ address().zip }}</p>
              </div>
              <div class="review-group">
                <h3>Preferences</h3>
                <p>Newsletter: {{ preferences().newsletter ? 'Yes' : 'No' }}</p>
                <p>Theme: {{ preferences().theme }}</p>
                <p>Notifications: {{ preferences().notifications ? 'Yes' : 'No' }}</p>
              </div>
            </div>
          }

          @if (validationErrors().length > 0) {
            <div class="errors">
              @for (err of validationErrors(); track err) {
                <p>{{ err }}</p>
              }
            </div>
          }

          @if (submitError()) {
            <div class="errors">
              <p>{{ submitError() }}</p>
            </div>
          }

          <div class="nav-buttons">
            @if (currentStep() > 0) {
              <button class="btn-prev" (click)="prev()" [disabled]="submitting()">
                Back
              </button>
            }
            <div class="spacer"></div>
            @if (currentStep() < 3) {
              <button class="btn-next" (click)="next()">
                Next
              </button>
            }
            @if (currentStep() === 3) {
              <button class="btn-submit" (click)="submit()" [disabled]="submitting()">
                {{ submitting() ? 'Submitting...' : 'Submit' }}
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .container {
      max-width: 550px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    h1 { text-align: center; margin-bottom: 1.5rem; }
    h2 { margin-bottom: 1rem; color: #2c3e50; }
    h3 { font-size: 0.9rem; color: #888; margin-bottom: 0.25rem; }
    .steps {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    .step-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }
    .step-num {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #eee;
      color: #999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.85rem;
    }
    .step-indicator.active .step-num {
      background: #3498db;
      color: white;
    }
    .step-indicator.completed .step-num {
      background: #27ae60;
      color: white;
    }
    .step-label {
      font-size: 0.75rem;
      color: #999;
    }
    .step-indicator.active .step-label { color: #3498db; }
    .step-indicator.completed .step-label { color: #27ae60; }
    .progress-bar {
      height: 4px;
      background: #eee;
      border-radius: 2px;
      margin-bottom: 1.5rem;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: #3498db;
      border-radius: 2px;
      transition: width 0.3s ease;
    }
    .form-body {
      transition: opacity 0.15s;
    }
    .form-section label {
      display: block;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      color: #555;
    }
    .form-section input[type="text"],
    .form-section input[type="email"],
    .form-section select {
      display: block;
      width: 100%;
      padding: 0.5rem;
      margin-top: 0.25rem;
      border: 2px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }
    .form-section input:focus,
    .form-section select:focus {
      outline: none;
      border-color: #3498db;
    }
    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .checkbox {
      display: flex !important;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }
    .checkbox input {
      width: auto !important;
    }
    .review-group {
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 6px;
    }
    .review-group p {
      color: #555;
      font-size: 0.9rem;
    }
    .errors {
      background: #fce4e4;
      color: #c0392b;
      padding: 0.75rem;
      border-radius: 6px;
      margin-bottom: 1rem;
      font-size: 0.85rem;
    }
    .errors p { margin-bottom: 0.25rem; }
    .errors p:last-child { margin-bottom: 0; }
    .nav-buttons {
      display: flex;
      align-items: center;
      margin-top: 1rem;
    }
    .spacer { flex: 1; }
    .btn-prev {
      padding: 0.5rem 1.25rem;
      border: 2px solid #ddd;
      border-radius: 6px;
      background: white;
      color: #555;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .btn-next, .btn-submit {
      padding: 0.5rem 1.25rem;
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .btn-next { background: #3498db; }
    .btn-submit { background: #27ae60; }
    .btn-next:hover { background: #2980b9; }
    .btn-submit:hover { background: #219a52; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .success-panel {
      text-align: center;
      padding: 3rem 1rem;
    }
    .success-panel h2 {
      color: #27ae60;
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
  `],
})
export class AppComponent {
  stepLabels = ['Personal', 'Address', 'Preferences', 'Review']

  currentStep: WritableSignal<number>
  personal: WritableSignal<PersonalInfo>
  address: WritableSignal<AddressInfo>
  preferences: WritableSignal<PreferencesInfo>
  validation: WritableSignal<StepValidation>
  submitting: WritableSignal<boolean>
  submitResult: WritableSignal<SubmitResult | null>
  submitError: WritableSignal<string | null>
  transitionTween: WritableSignal<number>

  progressPercent = computed(() => (this.currentStep() / 3) * 100)

  transitionOpacity = computed(() => {
    // Use tween for a fade-in effect; clamp to [0, 1]
    return Math.min(1, Math.max(0, this.transitionTween()))
  })

  validationErrors = computed(() => {
    const v = this.validation()
    if (v.step === this.currentStep() && !v.valid) {
      return v.errors
    }
    return []
  })

  constructor(private pulse: PulseService) {
    this.currentStep = pulse.signal(currentStepSig)
    this.personal = pulse.signal(personalSig)
    this.address = pulse.signal(addressSig)
    this.preferences = pulse.signal(preferencesSig)
    this.validation = pulse.signal(validationSig)
    this.submitting = pulse.signal(submittingSig)
    this.submitResult = pulse.signal(submitResultSig)
    this.submitError = pulse.signal(submitErrorSig)
    this.transitionTween = pulse.tween(stepTransitionTween)
  }

  updatePersonal(field: keyof PersonalInfo, event: Event): void {
    const value = (event.target as HTMLInputElement).value
    this.pulse.emit(PersonalUpdated, { [field]: value })
  }

  updateAddress(field: keyof AddressInfo, event: Event): void {
    const value = (event.target as HTMLInputElement).value
    this.pulse.emit(AddressUpdated, { [field]: value })
  }

  updatePreferences(field: keyof PreferencesInfo, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement
    let value: boolean | string
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      value = target.checked
    } else {
      value = target.value
    }
    this.pulse.emit(PreferencesUpdated, { [field]: value })
  }

  next(): void {
    this.pulse.emit(NextStep, undefined)
  }

  prev(): void {
    this.pulse.emit(PrevStep, undefined)
  }

  submit(): void {
    // Validate the review step (step 3 is always valid), then submit
    const formData: FormData = {
      personal: this.personal(),
      address: this.address(),
      preferences: this.preferences(),
    }
    this.pulse.emit(SubmitForm, formData)
  }
}
