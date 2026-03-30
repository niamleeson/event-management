import { ref as vueRef, nextTick, watch } from 'vue';
import { providePulse, useEmit, useSignal, useTween } from '@pulse/vue';
import { engine, SendMessage, MarkRead, messages, typing, unreadCount, slideInTweens } from './engine';
providePulse(engine);
const emit = useEmit();
const msgs = useSignal(messages);
const typingState = useSignal(typing);
const unread = useSignal(unreadCount);
const inputText = vueRef('');
const messagesEndRef = vueRef(null);
const slideVals = Array.from({ length: 50 }, (_, i) => useTween(slideInTweens[i]));
watch(msgs, () => {
    nextTick(() => {
        messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' });
    });
});
function send() {
    const text = inputText.value.trim();
    if (!text)
        return;
    emit(SendMessage, text);
    inputText.value = '';
}
function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
    }
}
const senderColors = {
    'You': '#4361ee',
    'Alice Bot': '#00b894',
    'Bob Bot': '#e17055',
};
const typingUsers = () => Object.entries(typingState.value).filter(([, v]) => v).map(([k]) => k);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({
            width: '480px',
            height: '700px',
            background: '#16213e',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ background: '#1a1a3e', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ style: ({ color: '#fff', fontSize: '18px', fontWeight: 600 }) },
});
if (__VLS_ctx.unread > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.unread > 0))
                    return;
                __VLS_ctx.emit(__VLS_ctx.MarkRead, 0);
            } },
        ...{ style: ({
                background: '#e17055', color: '#fff', borderRadius: '12px', padding: '2px 10px',
                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
            }) },
    });
    (__VLS_ctx.unread);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }) },
});
for (const [msg, i] of __VLS_getVForSourceType((__VLS_ctx.msgs))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (msg.id),
        ...{ style: ({
                alignSelf: msg.sender === 'You' ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                transform: `translateY(${__VLS_ctx.slideVals[i % 50].value}px)`,
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ fontSize: '11px', color: __VLS_ctx.senderColors[msg.sender] || '#888', marginBottom: '4px', fontWeight: 600 }) },
    });
    (msg.sender);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({
                background: msg.sender === 'You' ? '#4361ee' : '#2a2a4a',
                color: '#fff',
                padding: '10px 14px',
                borderRadius: msg.sender === 'You' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                fontSize: '14px',
                lineHeight: '1.5',
            }) },
    });
    (msg.text);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ fontSize: '10px', color: '#555', marginTop: '4px', textAlign: msg.sender === 'You' ? 'right' : 'left' }) },
    });
    (msg.time);
    if (msg.sender === 'You') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ style: ({ marginLeft: '4px' }) },
        });
        (msg.read ? 'Read' : 'Sent');
    }
}
for (const [user] of __VLS_getVForSourceType((__VLS_ctx.typingUsers()))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (user),
        ...{ style: ({ color: '#888', fontSize: '13px', fontStyle: 'italic' }) },
    });
    (user);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ref: "messagesEndRef",
});
/** @type {typeof __VLS_ctx.messagesEndRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', padding: '12px 16px', background: '#1a1a3e', gap: '8px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onKeydown: (__VLS_ctx.onKeyDown) },
    placeholder: "Type a message...",
    ...{ style: ({
            flex: 1, background: '#2a2a4a', border: 'none', color: '#fff', padding: '10px 14px',
            borderRadius: '8px', fontSize: '14px', outline: 'none',
        }) },
});
(__VLS_ctx.inputText);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.send) },
    ...{ style: ({
            background: '#4361ee', border: 'none', color: '#fff', padding: '10px 20px',
            borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
        }) },
});
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            MarkRead: MarkRead,
            emit: emit,
            msgs: msgs,
            unread: unread,
            inputText: inputText,
            messagesEndRef: messagesEndRef,
            slideVals: slideVals,
            send: send,
            onKeyDown: onKeyDown,
            senderColors: senderColors,
            typingUsers: typingUsers,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
