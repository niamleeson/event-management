import { providePulse, useEmit, useSignal, useSpring } from '@pulse/vue';
import { engine, USERS, UserTyped, UserDeleted, CursorMoved, document as doc, cursors, editHistory, cursorXSprings, } from './engine';
providePulse(engine);
const emit = useEmit();
const text = useSignal(doc);
const cursorMap = useSignal(cursors);
const history = useSignal(editHistory);
const cursorSprings = {};
for (const user of USERS) {
    cursorSprings[user.name] = useSpring(cursorXSprings[user.name]);
}
let myPosition = 0;
function onInput(e) {
    const textarea = e.target;
    const newVal = textarea.value;
    const oldVal = text.value;
    if (newVal.length > oldVal.length) {
        const inserted = newVal.slice(myPosition, myPosition + (newVal.length - oldVal.length));
        emit(UserTyped, { user: 'You', text: inserted, position: myPosition });
        myPosition += inserted.length;
    }
    else if (newVal.length < oldVal.length) {
        const count = oldVal.length - newVal.length;
        emit(UserDeleted, { user: 'You', position: myPosition, count });
        myPosition = Math.max(0, myPosition - count);
    }
    emit(CursorMoved, { user: 'You', position: myPosition, color: '#4361ee' });
}
function onKeyUp(e) {
    const textarea = e.target;
    myPosition = textarea.selectionStart ?? 0;
    emit(CursorMoved, { user: 'You', position: myPosition, color: '#4361ee' });
}
function onClick(e) {
    const textarea = e.target;
    myPosition = textarea.selectionStart ?? 0;
    emit(CursorMoved, { user: 'You', position: myPosition, color: '#4361ee' });
}
function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ width: '800px', display: 'flex', gap: '24px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ flex: 1 }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ style: ({ fontSize: '24px', fontWeight: 700, color: '#333', marginBottom: '16px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', gap: '12px', marginBottom: '16px' }) },
});
for (const [user] of __VLS_getVForSourceType((__VLS_ctx.USERS))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (user.name),
        ...{ style: ({
                display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px',
                background: '#fff', borderRadius: '16px', border: `1px solid ${user.color}44`,
                fontSize: '13px',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ style: ({ width: '8px', height: '8px', borderRadius: '50%', background: user.color }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: ({ color: '#333' }) },
    });
    (user.name);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ position: 'relative' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
    ...{ onInput: (__VLS_ctx.onInput) },
    ...{ onKeyup: (__VLS_ctx.onKeyUp) },
    ...{ onClick: (__VLS_ctx.onClick) },
    value: (__VLS_ctx.text),
    ...{ style: ({
            width: '100%', height: '400px', padding: '16px', fontSize: '14px',
            fontFamily: 'Consolas, monospace', border: '1px solid #ddd', borderRadius: '8px',
            resize: 'none', outline: 'none', background: '#fff', lineHeight: '1.6',
        }) },
});
for (const [user] of __VLS_getVForSourceType((__VLS_ctx.USERS.filter(u => u.name !== 'You')))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (user.name),
        ...{ style: ({
                position: 'absolute', top: '8px',
                left: `${16 + __VLS_ctx.cursorSprings[user.name].value}px`,
                pointerEvents: 'none',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ style: ({ width: '2px', height: '20px', background: user.color }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({
                fontSize: '10px', color: '#fff', background: user.color,
                padding: '1px 4px', borderRadius: '2px', whiteSpace: 'nowrap',
            }) },
    });
    (user.name);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ width: '240px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ style: ({ fontSize: '16px', fontWeight: 600, color: '#333', marginBottom: '12px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ maxHeight: '500px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }) },
});
for (const [edit] of __VLS_getVForSourceType(([...__VLS_ctx.history].reverse()))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (edit.id),
        ...{ style: ({
                padding: '8px 10px', background: '#fff', borderRadius: '6px',
                borderLeft: `3px solid ${__VLS_ctx.USERS.find(u => u.name === edit.user)?.color ?? '#888'}`,
                fontSize: '12px',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: ({ fontWeight: 600, color: __VLS_ctx.USERS.find(u => u.name === edit.user)?.color ?? '#888' }) },
    });
    (edit.user);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: ({ color: '#999' }) },
    });
    (__VLS_ctx.formatTime(edit.timestamp));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ color: edit.type === 'insert' ? '#00b894' : '#d63031' }) },
    });
    (edit.type === 'insert' ? '+' : '-');
    (edit.text.slice(0, 30));
    (edit.text.length > 30 ? '...' : '');
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            USERS: USERS,
            text: text,
            history: history,
            cursorSprings: cursorSprings,
            onInput: onInput,
            onKeyUp: onKeyUp,
            onClick: onClick,
            formatTime: formatTime,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
