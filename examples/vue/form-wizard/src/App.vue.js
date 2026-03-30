import { computed } from 'vue';
import { providePulse, useSignal, useEmit } from '@pulse/vue';
import { engine, currentStep, stepDirection, fieldValues, fieldErrors, isSubmitting, submitResult, shakeActive, FieldUpdated, NextStep, PrevStep, STEP_LABELS, } from './engine';
providePulse(engine);
const emit = useEmit();
const step = useSignal(currentStep);
const direction = useSignal(stepDirection);
const values = useSignal(fieldValues);
const errors = useSignal(fieldErrors);
const submitting = useSignal(isSubmitting);
const result = useSignal(submitResult);
const shake = useSignal(shakeActive);
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
};
const FIELD_LABELS = {
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email Address',
    phone: 'Phone Number',
    street: 'Street Address',
    city: 'City',
    state: 'State',
    zip: 'ZIP Code',
};
function getFieldValue(field) {
    return values.value[field] ?? '';
}
function getFieldError(field) {
    return errors.value[field] ?? null;
}
function hasError(field) {
    return getFieldError(field) !== null;
}
function onFieldInput(field, e, fieldStep) {
    emit(FieldUpdated, { step: fieldStep, field, value: e.target.value });
}
const reviewFields = computed(() => [
    { label: 'Name', value: `${values.value.firstName} ${values.value.lastName}` },
    { label: 'Email', value: values.value.email },
    { label: 'Phone', value: values.value.phone },
    { label: 'Address', value: `${values.value.street}, ${values.value.city}, ${values.value.state} ${values.value.zip}` },
]);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
if (__VLS_ctx.result?.success) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({
                minHeight: '100vh',
                background: __VLS_ctx.colors.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
                padding: '20px',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({
                background: __VLS_ctx.colors.card,
                borderRadius: '20px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                width: '100%',
                maxWidth: '540px',
                overflow: 'hidden',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ textAlign: 'center', padding: '60px 32px' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: __VLS_ctx.colors.successBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '32px',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
        ...{ style: ({ fontSize: '24px', fontWeight: 700, color: __VLS_ctx.colors.text, margin: 0 }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ style: ({ color: __VLS_ctx.colors.muted, fontSize: '14px', marginTop: '8px' }) },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({
                minHeight: '100vh',
                background: __VLS_ctx.colors.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
                padding: '20px',
            }) },
    });
    const __VLS_0 = (('style'));
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({}));
    const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_3.slots.default;
    var __VLS_3;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (`shake-${__VLS_ctx.shake}`),
        ...{ style: ({
                background: __VLS_ctx.colors.card,
                borderRadius: '20px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                width: '100%',
                maxWidth: '540px',
                overflow: 'hidden',
                animation: __VLS_ctx.shake > 0 ? 'shakeForm 0.5s ease-in-out' : undefined,
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ padding: '32px 32px 0' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
        ...{ style: ({ fontSize: '28px', fontWeight: 800, color: __VLS_ctx.colors.text, margin: 0 }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ style: ({ color: __VLS_ctx.colors.muted, fontSize: '14px', marginTop: '4px' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ display: 'flex', alignItems: 'center', padding: '24px 32px', gap: '0' }) },
    });
    for (const [label, i] of __VLS_getVForSourceType((__VLS_ctx.STEP_LABELS))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (i),
            ...{ style: ({ display: 'flex', alignItems: 'center', flex: 1 }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 700,
                    background: __VLS_ctx.step > i ? __VLS_ctx.colors.primary : __VLS_ctx.step === i ? __VLS_ctx.colors.primary : __VLS_ctx.colors.border,
                    color: __VLS_ctx.step > i || __VLS_ctx.step === i ? '#fff' : __VLS_ctx.colors.muted,
                    transition: 'all 0.3s',
                }) },
        });
        (__VLS_ctx.step > i ? '\u2713' : i + 1);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ style: ({
                    fontSize: '12px',
                    fontWeight: __VLS_ctx.step === i ? 600 : 400,
                    color: __VLS_ctx.step === i ? __VLS_ctx.colors.primary : __VLS_ctx.colors.muted,
                    marginTop: '6px',
                    transition: 'color 0.3s',
                }) },
        });
        (label);
        if (i < __VLS_ctx.STEP_LABELS.length - 1) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
                ...{ style: ({
                        flex: 1,
                        height: '2px',
                        background: __VLS_ctx.step > i ? __VLS_ctx.colors.primary : __VLS_ctx.colors.border,
                        marginBottom: '22px',
                        transition: 'background 0.3s',
                    }) },
            });
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (`step-${__VLS_ctx.step}`),
        ...{ style: ({
                padding: '8px 32px 32px',
                minHeight: '280px',
                animation: __VLS_ctx.direction === 'next' ? 'slideInRight 0.3s ease-out' : 'slideInLeft 0.3s ease-out',
            }) },
    });
    if (__VLS_ctx.step === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }) },
        });
        for (const [field] of __VLS_getVForSourceType((['firstName', 'lastName']))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (field),
                ...{ style: ({ marginBottom: '20px' }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ style: ({ display: 'block', fontSize: '13px', fontWeight: 600, color: __VLS_ctx.colors.text, marginBottom: '6px' }) },
            });
            (__VLS_ctx.FIELD_LABELS[field]);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onInput: ((e) => __VLS_ctx.onFieldInput(field, e, 0)) },
                ...{ style: ({
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: '15px',
                        border: `2px solid ${__VLS_ctx.hasError(field) ? __VLS_ctx.colors.error : __VLS_ctx.colors.border}`,
                        borderRadius: '10px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                        background: __VLS_ctx.hasError(field) ? __VLS_ctx.colors.errorBg : '#fff',
                    }) },
                value: (__VLS_ctx.getFieldValue(field)),
                placeholder: (__VLS_ctx.FIELD_LABELS[field]),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ style: ({ fontSize: '12px', color: __VLS_ctx.colors.error, marginTop: '4px', minHeight: '16px' }) },
            });
            (__VLS_ctx.getFieldError(field) ?? '\u00A0');
        }
        for (const [field] of __VLS_getVForSourceType((['email', 'phone']))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (field),
                ...{ style: ({ marginBottom: '20px' }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ style: ({ display: 'block', fontSize: '13px', fontWeight: 600, color: __VLS_ctx.colors.text, marginBottom: '6px' }) },
            });
            (__VLS_ctx.FIELD_LABELS[field]);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onInput: ((e) => __VLS_ctx.onFieldInput(field, e, 0)) },
                ...{ style: ({
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: '15px',
                        border: `2px solid ${__VLS_ctx.hasError(field) ? __VLS_ctx.colors.error : __VLS_ctx.colors.border}`,
                        borderRadius: '10px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                        background: __VLS_ctx.hasError(field) ? __VLS_ctx.colors.errorBg : '#fff',
                    }) },
                value: (__VLS_ctx.getFieldValue(field)),
                placeholder: (__VLS_ctx.FIELD_LABELS[field]),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ style: ({ fontSize: '12px', color: __VLS_ctx.colors.error, marginTop: '4px', minHeight: '16px' }) },
            });
            (__VLS_ctx.getFieldError(field) ?? '\u00A0');
        }
    }
    if (__VLS_ctx.step === 1) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        for (const [field] of __VLS_getVForSourceType((['street', 'city']))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (field),
                ...{ style: ({ marginBottom: '20px' }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ style: ({ display: 'block', fontSize: '13px', fontWeight: 600, color: __VLS_ctx.colors.text, marginBottom: '6px' }) },
            });
            (__VLS_ctx.FIELD_LABELS[field]);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onInput: ((e) => __VLS_ctx.onFieldInput(field, e, 1)) },
                ...{ style: ({
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: '15px',
                        border: `2px solid ${__VLS_ctx.hasError(field) ? __VLS_ctx.colors.error : __VLS_ctx.colors.border}`,
                        borderRadius: '10px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                        background: __VLS_ctx.hasError(field) ? __VLS_ctx.colors.errorBg : '#fff',
                    }) },
                value: (__VLS_ctx.getFieldValue(field)),
                placeholder: (__VLS_ctx.FIELD_LABELS[field]),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ style: ({ fontSize: '12px', color: __VLS_ctx.colors.error, marginTop: '4px', minHeight: '16px' }) },
            });
            (__VLS_ctx.getFieldError(field) ?? '\u00A0');
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }) },
        });
        for (const [field] of __VLS_getVForSourceType((['state', 'zip']))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (field),
                ...{ style: ({ marginBottom: '20px' }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ style: ({ display: 'block', fontSize: '13px', fontWeight: 600, color: __VLS_ctx.colors.text, marginBottom: '6px' }) },
            });
            (__VLS_ctx.FIELD_LABELS[field]);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onInput: ((e) => __VLS_ctx.onFieldInput(field, e, 1)) },
                ...{ style: ({
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: '15px',
                        border: `2px solid ${__VLS_ctx.hasError(field) ? __VLS_ctx.colors.error : __VLS_ctx.colors.border}`,
                        borderRadius: '10px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                        background: __VLS_ctx.hasError(field) ? __VLS_ctx.colors.errorBg : '#fff',
                    }) },
                value: (__VLS_ctx.getFieldValue(field)),
                placeholder: (__VLS_ctx.FIELD_LABELS[field]),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ style: ({ fontSize: '12px', color: __VLS_ctx.colors.error, marginTop: '4px', minHeight: '16px' }) },
            });
            (__VLS_ctx.getFieldError(field) ?? '\u00A0');
        }
    }
    if (__VLS_ctx.step === 2) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ style: ({ color: __VLS_ctx.colors.muted, fontSize: '14px', marginBottom: '20px' }) },
        });
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.reviewFields))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (item.label),
                ...{ style: ({ marginBottom: '16px' }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ style: ({ fontSize: '12px', fontWeight: 600, color: __VLS_ctx.colors.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }) },
            });
            (item.label);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ style: ({ fontSize: '16px', color: __VLS_ctx.colors.text, padding: '8px 0', borderBottom: `1px solid ${__VLS_ctx.colors.border}` }) },
            });
            (item.value || '(not provided)');
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ display: 'flex', justifyContent: 'space-between', padding: '16px 32px 32px' }) },
    });
    if (__VLS_ctx.step > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.result?.success))
                        return;
                    if (!(__VLS_ctx.step > 0))
                        return;
                    __VLS_ctx.emit(__VLS_ctx.PrevStep, undefined);
                } },
            ...{ style: ({
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 600,
                    border: `2px solid ${__VLS_ctx.colors.border}`,
                    borderRadius: '10px',
                    background: '#fff',
                    color: __VLS_ctx.colors.text,
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                }) },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({});
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.result?.success))
                    return;
                __VLS_ctx.emit(__VLS_ctx.NextStep, undefined);
            } },
        ...{ style: ({
                padding: '12px 32px',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '10px',
                background: __VLS_ctx.submitting ? __VLS_ctx.colors.border : __VLS_ctx.colors.primary,
                color: __VLS_ctx.submitting ? __VLS_ctx.colors.muted : '#fff',
                cursor: __VLS_ctx.submitting ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
            }) },
        disabled: (__VLS_ctx.submitting),
    });
    (__VLS_ctx.submitting ? 'Submitting...' : __VLS_ctx.step === 2 ? 'Submit' : 'Continue');
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NextStep: NextStep,
            PrevStep: PrevStep,
            STEP_LABELS: STEP_LABELS,
            emit: emit,
            step: step,
            direction: direction,
            submitting: submitting,
            result: result,
            shake: shake,
            colors: colors,
            FIELD_LABELS: FIELD_LABELS,
            getFieldValue: getFieldValue,
            getFieldError: getFieldError,
            hasError: hasError,
            onFieldInput: onFieldInput,
            reviewFields: reviewFields,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
