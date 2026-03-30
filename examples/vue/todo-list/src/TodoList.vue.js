import { computed } from 'vue';
import { useSignal, useEmit } from '@pulse/vue';
import { todoList, activeFilter, TodoRemoved, TodoToggled } from './engine';
const emit = useEmit();
const todos = useSignal(todoList);
const filter = useSignal(activeFilter);
const filtered = computed(() => {
    return todos.value.filter((t) => {
        if (filter.value === 'active')
            return !t.completed;
        if (filter.value === 'completed')
            return t.completed;
        return true;
    });
});
const remaining = computed(() => todos.value.filter((t) => !t.completed).length);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
if (__VLS_ctx.filtered.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ textAlign: 'center', padding: '40px', color: '#bbb', fontSize: '16px' }) },
    });
    (__VLS_ctx.todos.length === 0 ? 'No todos yet. Add one above!' : 'No matching todos.');
}
else {
    for (const [todo] of __VLS_getVForSourceType((__VLS_ctx.filtered))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (todo.id),
            ...{ style: ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    background: '#fff',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    transition: 'opacity 0.2s',
                    opacity: todo.completed ? 0.5 : 1,
                }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            ...{ onChange: (...[$event]) => {
                    if (!!(__VLS_ctx.filtered.length === 0))
                        return;
                    __VLS_ctx.emit(__VLS_ctx.TodoToggled, todo.id);
                } },
            type: "checkbox",
            checked: (todo.completed),
            ...{ style: ({ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#4361ee' }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ style: ({
                    flex: 1,
                    fontSize: '16px',
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    color: todo.completed ? '#999' : '#1a1a2e',
                }) },
        });
        (todo.text);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.filtered.length === 0))
                        return;
                    __VLS_ctx.emit(__VLS_ctx.TodoRemoved, todo.id);
                } },
            ...{ onMouseenter: ((e) => e.currentTarget.style.color = '#e63946') },
            ...{ onMouseleave: ((e) => e.currentTarget.style.color = '#ccc') },
            ...{ style: ({
                    padding: '4px 10px',
                    fontSize: '18px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: '#ccc',
                    transition: 'color 0.2s',
                }) },
        });
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ marginTop: '16px', fontSize: '14px', color: '#888', textAlign: 'center' }) },
});
(__VLS_ctx.remaining);
(__VLS_ctx.remaining !== 1 ? 's' : '');
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            TodoRemoved: TodoRemoved,
            TodoToggled: TodoToggled,
            emit: emit,
            todos: todos,
            filtered: filtered,
            remaining: remaining,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
