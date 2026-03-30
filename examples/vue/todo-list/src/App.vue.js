import { providePulse } from '@pulse/vue';
import { engine } from './engine';
import TodoInput from './TodoInput.vue';
import FilterBar from './FilterTabs.vue';
import TodoList from './TodoList.vue';
providePulse(engine);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({
            maxWidth: '560px',
            margin: '40px auto',
            fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
            padding: '0 20px',
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ textAlign: 'center', marginBottom: '32px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ style: ({ fontSize: '36px', fontWeight: 700, color: '#1a1a2e', margin: 0 }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ style: ({ color: '#666', fontSize: '14px', marginTop: '4px' }) },
});
/** @type {[typeof TodoInput, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(TodoInput, new TodoInput({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
/** @type {[typeof FilterBar, ]} */ ;
// @ts-ignore
const __VLS_3 = __VLS_asFunctionalComponent(FilterBar, new FilterBar({}));
const __VLS_4 = __VLS_3({}, ...__VLS_functionalComponentArgsRest(__VLS_3));
/** @type {[typeof TodoList, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(TodoList, new TodoList({}));
const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            TodoInput: TodoInput,
            FilterBar: FilterBar,
            TodoList: TodoList,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
