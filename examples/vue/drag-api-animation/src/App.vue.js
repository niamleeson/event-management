import { onMounted, onUnmounted } from 'vue';
import { providePulse, useSignal, useSpring, useEmit } from '@pulse/vue';
import { engine, cards, dragState, cardStatuses, dragSpringX, dragSpringY, DragStart, DragMove, DragEnd, CardMoved, UndoRequested, } from './engine';
providePulse(engine);
const emit = useEmit();
const allCards = useSignal(cards);
const drag = useSignal(dragState);
const statuses = useSignal(cardStatuses);
const springX = useSpring(dragSpringX);
const springY = useSpring(dragSpringY);
const COLUMNS = [
    { id: 'todo', title: 'Todo', color: '#4361ee' },
    { id: 'in-progress', title: 'In Progress', color: '#f59e0b' },
    { id: 'done', title: 'Done', color: '#10b981' },
];
const PRIORITY_COLORS = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
};
const STATUS_LABELS = {
    idle: '',
    saving: 'Saving...',
    saved: 'Saved',
    error: 'Error - retrying',
    settled: '',
};
function getCardStatus(cardId) {
    return statuses.value[cardId] ?? 'idle';
}
function cardBorderColor(status) {
    if (status === 'saving')
        return '#f59e0b';
    if (status === 'saved')
        return '#10b981';
    if (status === 'error')
        return '#ef4444';
    return '#334155';
}
function cardBg(status) {
    if (status === 'saved')
        return '#10b98108';
    if (status === 'error')
        return '#ef444408';
    return '#0f172a';
}
function statusColor(status) {
    const map = {
        idle: '#64748b',
        saving: '#f59e0b',
        saved: '#10b981',
        error: '#ef4444',
        settled: '#64748b',
    };
    return map[status];
}
function cardAnimation(status) {
    if (status === 'error')
        return 'shake 0.5s ease-in-out';
    if (status === 'saved')
        return 'flashGreen 0.6s ease-out';
    return undefined;
}
function columnCards(colId) {
    return allCards.value.filter((c) => c.column === colId);
}
function handleMouseDown(card, e) {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    emit(DragStart, {
        cardId: card.id,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
    });
}
function handleDropZoneMouseUp(colId) {
    if (drag.value) {
        const card = allCards.value.find((c) => c.id === drag.value.cardId);
        if (card && card.column !== colId) {
            emit(CardMoved, {
                cardId: drag.value.cardId,
                fromColumn: card.column,
                toColumn: colId,
            });
        }
        emit(DragEnd, undefined);
    }
}
// Global mouse handlers
function onGlobalMouseMove(e) {
    if (drag.value) {
        emit(DragMove, { x: e.clientX, y: e.clientY });
    }
}
function onGlobalMouseUp() {
    if (drag.value) {
        emit(DragEnd, undefined);
    }
}
onMounted(() => {
    window.addEventListener('mousemove', onGlobalMouseMove);
    window.addEventListener('mouseup', onGlobalMouseUp);
});
onUnmounted(() => {
    window.removeEventListener('mousemove', onGlobalMouseMove);
    window.removeEventListener('mouseup', onGlobalMouseUp);
});
// Ghost card
function ghostCard() {
    if (!drag.value)
        return null;
    return allCards.value.find((c) => c.id === drag.value.cardId) ?? null;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({
            minHeight: '100vh',
            background: '#0f172a',
            padding: '32px 24px',
            fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
        }) },
});
const __VLS_0 = (('style'));
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ textAlign: 'center', marginBottom: '32px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ style: ({ fontSize: '36px', fontWeight: 800, color: '#f1f5f9', margin: 0 }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ style: ({ color: '#94a3b8', fontSize: '14px', marginTop: '6px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
            maxWidth: '1100px',
            margin: '0 auto',
        }) },
});
for (const [col] of __VLS_getVForSourceType((__VLS_ctx.COLUMNS))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (col.id),
        ...{ style: ({
                background: '#1e293b',
                borderRadius: '16px',
                padding: '16px',
                minHeight: '400px',
                borderTop: `3px solid ${col.color}`,
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '0 4px' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: ({ fontSize: '16px', fontWeight: 700, color: '#e2e8f0' }) },
    });
    (col.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: ({
                fontSize: '13px',
                fontWeight: 600,
                color: col.color,
                background: `${col.color}22`,
                padding: '2px 10px',
                borderRadius: '12px',
            }) },
    });
    (__VLS_ctx.columnCards(col.id).length);
    for (const [card] of __VLS_getVForSourceType((__VLS_ctx.columnCards(col.id)))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onMousedown: ((e) => __VLS_ctx.handleMouseDown(card, e)) },
            key: (card.id),
            ...{ style: ({
                    background: __VLS_ctx.cardBg(__VLS_ctx.getCardStatus(card.id)),
                    border: `2px solid ${__VLS_ctx.cardBorderColor(__VLS_ctx.getCardStatus(card.id))}`,
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '10px',
                    cursor: __VLS_ctx.drag?.cardId === card.id ? 'grabbing' : 'grab',
                    opacity: __VLS_ctx.drag?.cardId === card.id ? 0.4 : 1,
                    transition: 'border-color 0.3s, background 0.3s, opacity 0.15s',
                    userSelect: 'none',
                    animation: __VLS_ctx.cardAnimation(__VLS_ctx.getCardStatus(card.id)),
                }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ style: ({ fontSize: '15px', fontWeight: 600, color: '#e2e8f0', margin: 0, marginBottom: '4px' }) },
        });
        (card.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ style: ({ fontSize: '13px', color: '#94a3b8', margin: 0, marginBottom: '10px' }) },
        });
        (card.description);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ style: ({
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: __VLS_ctx.PRIORITY_COLORS[card.priority] ?? '#94a3b8',
                    background: `${__VLS_ctx.PRIORITY_COLORS[card.priority] ?? '#94a3b8'}22`,
                    padding: '2px 8px',
                    borderRadius: '8px',
                }) },
        });
        (card.priority);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        if (__VLS_ctx.STATUS_LABELS[__VLS_ctx.getCardStatus(card.id)]) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ style: ({ fontSize: '11px', fontWeight: 600, color: __VLS_ctx.statusColor(__VLS_ctx.getCardStatus(card.id)) }) },
            });
            (__VLS_ctx.STATUS_LABELS[__VLS_ctx.getCardStatus(card.id)]);
        }
        if (__VLS_ctx.getCardStatus(card.id) === 'saved' || __VLS_ctx.getCardStatus(card.id) === 'error') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.getCardStatus(card.id) === 'saved' || __VLS_ctx.getCardStatus(card.id) === 'error'))
                            return;
                        __VLS_ctx.emit(__VLS_ctx.UndoRequested, card.id);
                    } },
                ...{ style: ({
                        fontSize: '12px',
                        color: '#94a3b8',
                        background: 'none',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        padding: '2px 8px',
                        cursor: 'pointer',
                        marginLeft: '8px',
                    }) },
            });
        }
    }
    if (__VLS_ctx.drag !== null) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onMouseenter: ((e) => {
                    e.currentTarget.style.borderColor = '#4361ee';
                    e.currentTarget.style.background = '#4361ee11';
                }) },
            ...{ onMouseleave: ((e) => {
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.background = 'transparent';
                }) },
            ...{ onMouseup: (...[$event]) => {
                    if (!(__VLS_ctx.drag !== null))
                        return;
                    __VLS_ctx.handleDropZoneMouseUp(col.id);
                } },
            ...{ style: ({
                    minHeight: '60px',
                    border: '2px dashed transparent',
                    borderRadius: '8px',
                    transition: 'border-color 0.2s, background 0.2s',
                    background: 'transparent',
                }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: ({ padding: '20px', textAlign: 'center', color: '#475569', fontSize: '13px' }) },
        });
    }
}
if (__VLS_ctx.drag && __VLS_ctx.ghostCard()) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: ({
                position: 'fixed',
                pointerEvents: 'none',
                zIndex: 1000,
                width: '300px',
                background: '#1e293b',
                border: '2px solid #4361ee',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                left: `${__VLS_ctx.springX - __VLS_ctx.drag.offsetX}px`,
                top: `${__VLS_ctx.springY - __VLS_ctx.drag.offsetY}px`,
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ style: ({ fontSize: '15px', fontWeight: 600, color: '#e2e8f0', margin: 0, marginBottom: '4px' }) },
    });
    (__VLS_ctx.ghostCard().title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ style: ({ fontSize: '13px', color: '#94a3b8', margin: 0 }) },
    });
    (__VLS_ctx.ghostCard().description);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({
            textAlign: 'center',
            marginTop: '32px',
            padding: '16px',
            background: '#1e293b',
            borderRadius: '12px',
            maxWidth: '500px',
            margin: '32px auto 0',
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ style: ({ color: '#94a3b8', fontSize: '13px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.code, __VLS_intrinsicElements.code)({
    ...{ style: ({ color: '#4361ee', fontFamily: 'monospace', fontSize: '12px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ style: ({ color: '#94a3b8', fontSize: '13px', marginTop: '8px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.code, __VLS_intrinsicElements.code)({
    ...{ style: ({ color: '#4361ee', fontFamily: 'monospace', fontSize: '12px' }) },
});
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            UndoRequested: UndoRequested,
            emit: emit,
            drag: drag,
            springX: springX,
            springY: springY,
            COLUMNS: COLUMNS,
            PRIORITY_COLORS: PRIORITY_COLORS,
            STATUS_LABELS: STATUS_LABELS,
            getCardStatus: getCardStatus,
            cardBorderColor: cardBorderColor,
            cardBg: cardBg,
            statusColor: statusColor,
            cardAnimation: cardAnimation,
            columnCards: columnCards,
            handleMouseDown: handleMouseDown,
            handleDropZoneMouseUp: handleDropZoneMouseUp,
            ghostCard: ghostCard,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
