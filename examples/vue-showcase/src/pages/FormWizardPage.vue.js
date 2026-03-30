import { onMounted, onUnmounted } from 'vue';
import { providePulse } from '@pulse/vue';
import { engine } from '../../../vue/form-wizard/src/engine';
import FormWizardApp from '../../../vue/form-wizard/src/App.vue';
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
/** @type {[typeof FormWizardApp, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(FormWizardApp, new FormWizardApp({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
var __VLS_3 = {};
var __VLS_2;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            FormWizardApp: FormWizardApp,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
