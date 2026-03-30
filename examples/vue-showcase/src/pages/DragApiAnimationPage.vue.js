import { onMounted, onUnmounted } from 'vue';
import { providePulse } from '@pulse/vue';
import { engine } from '../../../vue/drag-api-animation/src/engine';
import DragApiAnimationApp from '../../../vue/drag-api-animation/src/App.vue';
providePulse(engine);
onMounted(() => {
    ;
    window.__pulseEngine = engine;
});
onUnmounted(() => {
    ;
    window.__pulseEngine = null;
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {[typeof DragApiAnimationApp, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(DragApiAnimationApp, new DragApiAnimationApp({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
var __VLS_3 = {};
var __VLS_2;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            DragApiAnimationApp: DragApiAnimationApp,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
