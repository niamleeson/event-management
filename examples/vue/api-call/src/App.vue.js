import { providePulse, useSignal } from '@pulse/vue';
import { engine, error } from './engine';
import SearchBar from './SearchBar.vue';
import UserList from './UserList.vue';
import UserDetail from './UserDetail.vue';
providePulse(engine);
const err = useSignal(error);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({
            maxWidth: '720px',
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
    ...{ style: ({ color: '#6c757d', fontSize: '14px', marginTop: '4px' }) },
});
if (__VLS_ctx.err) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({
                padding: '16px',
                background: '#fef2f2',
                border: '1px solid #e63946',
                borderRadius: '8px',
                color: '#e63946',
                fontSize: '14px',
                marginBottom: '16px',
            }) },
    });
    (__VLS_ctx.err);
}
/** @type {[typeof SearchBar, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(SearchBar, new SearchBar({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
/** @type {[typeof UserList, ]} */ ;
// @ts-ignore
const __VLS_3 = __VLS_asFunctionalComponent(UserList, new UserList({}));
const __VLS_4 = __VLS_3({}, ...__VLS_functionalComponentArgsRest(__VLS_3));
/** @type {[typeof UserDetail, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(UserDetail, new UserDetail({}));
const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            SearchBar: SearchBar,
            UserList: UserList,
            UserDetail: UserDetail,
            err: err,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
