import { useSignal, useEmit } from '@pulse/vue';
import { TodoTextChanged, TodoAdded, currentText, validationError, } from './engine';
const emit = useEmit();
const text = useSignal(currentText);
const validation = useSignal(validationError);
function handleAdd() {
    if (!validation.value.valid)
        return;
    const todo = {
        id: crypto.randomUUID(),
        text: text.value.trim(),
        completed: false,
    };
    emit(TodoAdded, todo);
    emit(TodoTextChanged, '');
}
function handleKeyDown(e) {
    if (e.key === 'Enter')
        handleAdd();
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', gap: '8px', marginBottom: '8px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onInput: ((e) => __VLS_ctx.emit(__VLS_ctx.TodoTextChanged, e.target.value)) },
    ...{ onKeydown: (__VLS_ctx.handleKeyDown) },
    ...{ style: ({
            flex: 1,
            padding: '12px 16px',
            fontSize: '16px',
            border: '2px solid #e0e0e0',
            borderRadius: '8px',
            outline: 'none',
            transition: 'border-color 0.2s',
        }) },
    value: (__VLS_ctx.text),
    placeholder: "What needs to be done?",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.handleAdd) },
    ...{ style: ({
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 600,
            border: 'none',
            borderRadius: '8px',
            cursor: !__VLS_ctx.validation.valid ? 'not-allowed' : 'pointer',
            background: !__VLS_ctx.validation.valid ? '#ccc' : '#4361ee',
            color: '#fff',
            transition: 'background 0.2s',
        }) },
    disabled: (!__VLS_ctx.validation.valid),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ color: '#e63946', fontSize: '13px', minHeight: '20px', marginBottom: '16px' }) },
});
(__VLS_ctx.validation.error ?? '\u00A0');
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            TodoTextChanged: TodoTextChanged,
            emit: emit,
            text: text,
            validation: validation,
            handleAdd: handleAdd,
            handleKeyDown: handleKeyDown,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
