<script setup lang="ts">
import { computed } from 'vue'
import { providePulse, useEmit, usePulse } from '@pulse/vue'
import {
  engine,
  FieldUpdated,
  NextStep,
  PrevStep,
  STEP_FIELDS,
  STEP_LABELS,
  type StepId,
  type FormData,
  CurrentStepChanged,
  StepDirectionChanged,
  FieldValuesChanged,
  FieldErrorsChanged,
  IsSubmittingChanged,
  SubmitResultChanged,
  ShakeActiveChanged,
  getCurrentStep,
  getStepDirection,
  getFieldValues,
  getFieldErrors,
  getIsSubmitting,
  getSubmitResult,
  getShakeActive,
} from './engine'

providePulse(engine)

const emit = useEmit()
const step = usePulse(CurrentStepChanged, getCurrentStep())
const direction = usePulse(StepDirectionChanged, getStepDirection())
const values = usePulse(FieldValuesChanged, getFieldValues())
const errors = usePulse(FieldErrorsChanged, getFieldErrors())
const submitting = usePulse(IsSubmittingChanged, getIsSubmitting())
const result = usePulse(SubmitResultChanged, getSubmitResult())
const shake = usePulse(ShakeActiveChanged, getShakeActive())

const colors = {
  bg: '#f8fafc',
  card: '#ffffff',
  primary: '#4361ee',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  error: '#ef4444',
  errorBg: '#fef2f2',
  success: '#10b981',
  successBg: '#ecfdf5',
}

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

function getFieldValue(field: string): string {
  return values.value[field as keyof FormData] ?? ''
}

function getFieldError(field: string): string | null {
  return errors.value[field] ?? null
}

function hasError(field: string): boolean {
  return getFieldError(field) !== null
}

function onFieldInput(field: string, e: Event, fieldStep: StepId) {
  emit(FieldUpdated, { step: fieldStep, field, value: (e.target as HTMLInputElement).value })
}

const reviewFields = computed(() => [
  { label: 'Name', value: `${values.value.firstName} ${values.value.lastName}` },
  { label: 'Email', value: values.value.email },
  { label: 'Phone', value: values.value.phone },
  { label: 'Address', value: `${values.value.street}, ${values.value.city}, ${values.value.state} ${values.value.zip}` },
])
</script>

<template>
  <!-- Success Screen -->
  <div v-if="result?.success" :style="{
    minHeight: '100vh',
    background: colors.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
    padding: '20px',
  }">
    <div :style="{
      background: colors.card,
      borderRadius: '20px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      width: '100%',
      maxWidth: '540px',
      overflow: 'hidden',
    }">
      <div :style="{ textAlign: 'center', padding: '60px 32px' }">
        <div :style="{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: colors.successBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: '32px',
        }">&#10004;</div>
        <h2 :style="{ fontSize: '24px', fontWeight: 700, color: colors.text, margin: 0 }">Submission Complete</h2>
        <p :style="{ color: colors.muted, fontSize: '14px', marginTop: '8px' }">
          Your form has been submitted successfully. All state was managed through Pulse events and signals.
        </p>
      </div>
    </div>
  </div>

  <!-- Form -->
  <div v-else :style="{
    minHeight: '100vh',
    background: colors.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
    padding: '20px',
  }">
    <component :is="'style'">
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
    </component>

    <div
      :key="`shake-${shake}`"
      :style="{
        background: colors.card,
        borderRadius: '20px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        width: '100%',
        maxWidth: '540px',
        overflow: 'hidden',
        animation: shake > 0 ? 'shakeForm 0.5s ease-in-out' : undefined,
      }"
    >
      <!-- Header -->
      <div :style="{ padding: '32px 32px 0' }">
        <h1 :style="{ fontSize: '28px', fontWeight: 800, color: colors.text, margin: 0 }">Create Account</h1>
        <p :style="{ color: colors.muted, fontSize: '14px', marginTop: '4px' }">
          Multi-step form with event-driven validation
        </p>
      </div>

      <!-- Progress Bar -->
      <div :style="{ display: 'flex', alignItems: 'center', padding: '24px 32px', gap: '0' }">
        <div
          v-for="(label, i) in STEP_LABELS"
          :key="i"
          :style="{ display: 'flex', alignItems: 'center', flex: 1 }"
        >
          <div :style="{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }">
            <div :style="{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 700,
              background: step > i ? colors.primary : step === i ? colors.primary : colors.border,
              color: step > i || step === i ? '#fff' : colors.muted,
              transition: 'all 0.3s',
            }">
              {{ step > i ? '\u2713' : i + 1 }}
            </div>
            <span :style="{
              fontSize: '12px',
              fontWeight: step === i ? 600 : 400,
              color: step === i ? colors.primary : colors.muted,
              marginTop: '6px',
              transition: 'color 0.3s',
            }">{{ label }}</span>
          </div>
          <div
            v-if="i < STEP_LABELS.length - 1"
            :style="{
              flex: 1,
              height: '2px',
              background: step > i ? colors.primary : colors.border,
              marginBottom: '22px',
              transition: 'background 0.3s',
            }"
          />
        </div>
      </div>

      <!-- Step Body -->
      <div
        :key="`step-${step}`"
        :style="{
          padding: '8px 32px 32px',
          minHeight: '280px',
          animation: direction === 'next' ? 'slideInRight 0.3s ease-out' : 'slideInLeft 0.3s ease-out',
        }"
      >
        <!-- Step 0: Personal Info -->
        <div v-if="step === 0">
          <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }">
            <div v-for="field in ['firstName', 'lastName']" :key="field" :style="{ marginBottom: '20px' }">
              <label :style="{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.text, marginBottom: '6px' }">{{ FIELD_LABELS[field] }}</label>
              <input
                :style="{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '15px',
                  border: `2px solid ${hasError(field) ? colors.error : colors.border}`,
                  borderRadius: '10px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                  background: hasError(field) ? colors.errorBg : '#fff',
                }"
                :value="getFieldValue(field)"
                :placeholder="FIELD_LABELS[field]"
                @input="(e) => onFieldInput(field, e, 0)"
              />
              <div :style="{ fontSize: '12px', color: colors.error, marginTop: '4px', minHeight: '16px' }">{{ getFieldError(field) ?? '\u00A0' }}</div>
            </div>
          </div>
          <div v-for="field in ['email', 'phone']" :key="field" :style="{ marginBottom: '20px' }">
            <label :style="{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.text, marginBottom: '6px' }">{{ FIELD_LABELS[field] }}</label>
            <input
              :style="{
                width: '100%',
                padding: '12px 14px',
                fontSize: '15px',
                border: `2px solid ${hasError(field) ? colors.error : colors.border}`,
                borderRadius: '10px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                background: hasError(field) ? colors.errorBg : '#fff',
              }"
              :value="getFieldValue(field)"
              :placeholder="FIELD_LABELS[field]"
              @input="(e) => onFieldInput(field, e, 0)"
            />
            <div :style="{ fontSize: '12px', color: colors.error, marginTop: '4px', minHeight: '16px' }">{{ getFieldError(field) ?? '\u00A0' }}</div>
          </div>
        </div>

        <!-- Step 1: Address -->
        <div v-if="step === 1">
          <div v-for="field in ['street', 'city']" :key="field" :style="{ marginBottom: '20px' }">
            <label :style="{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.text, marginBottom: '6px' }">{{ FIELD_LABELS[field] }}</label>
            <input
              :style="{
                width: '100%',
                padding: '12px 14px',
                fontSize: '15px',
                border: `2px solid ${hasError(field) ? colors.error : colors.border}`,
                borderRadius: '10px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                background: hasError(field) ? colors.errorBg : '#fff',
              }"
              :value="getFieldValue(field)"
              :placeholder="FIELD_LABELS[field]"
              @input="(e) => onFieldInput(field, e, 1)"
            />
            <div :style="{ fontSize: '12px', color: colors.error, marginTop: '4px', minHeight: '16px' }">{{ getFieldError(field) ?? '\u00A0' }}</div>
          </div>
          <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }">
            <div v-for="field in ['state', 'zip']" :key="field" :style="{ marginBottom: '20px' }">
              <label :style="{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.text, marginBottom: '6px' }">{{ FIELD_LABELS[field] }}</label>
              <input
                :style="{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '15px',
                  border: `2px solid ${hasError(field) ? colors.error : colors.border}`,
                  borderRadius: '10px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                  background: hasError(field) ? colors.errorBg : '#fff',
                }"
                :value="getFieldValue(field)"
                :placeholder="FIELD_LABELS[field]"
                @input="(e) => onFieldInput(field, e, 1)"
              />
              <div :style="{ fontSize: '12px', color: colors.error, marginTop: '4px', minHeight: '16px' }">{{ getFieldError(field) ?? '\u00A0' }}</div>
            </div>
          </div>
        </div>

        <!-- Step 2: Review -->
        <div v-if="step === 2">
          <p :style="{ color: colors.muted, fontSize: '14px', marginBottom: '20px' }">
            Please review your information before submitting.
          </p>
          <div v-for="item in reviewFields" :key="item.label" :style="{ marginBottom: '16px' }">
            <div :style="{ fontSize: '12px', fontWeight: 600, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }">{{ item.label }}</div>
            <div :style="{ fontSize: '16px', color: colors.text, padding: '8px 0', borderBottom: `1px solid ${colors.border}` }">{{ item.value || '(not provided)' }}</div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div :style="{ display: 'flex', justifyContent: 'space-between', padding: '16px 32px 32px' }">
        <button
          v-if="step > 0"
          :style="{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 600,
            border: `2px solid ${colors.border}`,
            borderRadius: '10px',
            background: '#fff',
            color: colors.text,
            cursor: 'pointer',
            transition: 'border-color 0.2s',
          }"
          @click="emit(PrevStep, undefined as unknown as void)"
        >Back</button>
        <div v-else />
        <button
          :style="{
            padding: '12px 32px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            borderRadius: '10px',
            background: submitting ? colors.border : colors.primary,
            color: submitting ? colors.muted : '#fff',
            cursor: submitting ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }"
          :disabled="submitting"
          @click="emit(NextStep, undefined as unknown as void)"
        >
          {{ submitting ? 'Submitting...' : step === 2 ? 'Submit' : 'Continue' }}
        </button>
      </div>
    </div>
  </div>
</template>
