import { providePulse, useEmit, useSignal } from '@pulse/vue';
import { engine, tasks, zoom, TaskMoved, TaskResized, ZoomChanged, TOTAL_DAYS, dayWidth } from './engine';
providePulse(engine);
const emit = useEmit();
const taskList = useSignal(tasks);
const zoomLevel = useSignal(zoom);
const ZOOM_OPTIONS = ['day', 'week', 'month'];
const ROW_HEIGHT = 40;
const LABEL_WIDTH = 140;
let dragState = null;
function onPointerDown(e, task, mode) {
    dragState = { taskId: task.id, mode, startX: e.clientX, origStart: task.start, origDuration: task.duration };
    e.target.setPointerCapture(e.pointerId);
}
function onPointerMove(e) {
    if (!dragState)
        return;
    const dx = e.clientX - dragState.startX;
    const dw = dayWidth(zoomLevel.value);
    const dayDelta = Math.round(dx / dw);
    if (dragState.mode === 'move') {
        emit(TaskMoved, { id: dragState.taskId, newStart: Math.max(0, dragState.origStart + dayDelta) });
    }
    else {
        emit(TaskResized, { id: dragState.taskId, newDuration: Math.max(1, dragState.origDuration + dayDelta) });
    }
}
function onPointerUp() {
    dragState = null;
}
const today = 15;
function depLines(task) {
    const dw = dayWidth(zoomLevel.value);
    return task.dependsOn.map(depId => {
        const dep = taskList.value.find(t => t.id === depId);
        if (!dep)
            return null;
        const fromX = (dep.start + dep.duration) * dw;
        const fromY = taskList.value.indexOf(dep) * ROW_HEIGHT + ROW_HEIGHT / 2;
        const toX = task.start * dw;
        const toY = taskList.value.indexOf(task) * ROW_HEIGHT + ROW_HEIGHT / 2;
        return { fromX, fromY, toX, toY, depId };
    }).filter(Boolean);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ style: ({ fontSize: '24px', fontWeight: 700, color: '#333' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', gap: '8px' }) },
});
for (const [z] of __VLS_getVForSourceType((__VLS_ctx.ZOOM_OPTIONS))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit(__VLS_ctx.ZoomChanged, z);
            } },
        key: (z),
        ...{ style: ({
                background: __VLS_ctx.zoomLevel === z ? '#4361ee' : '#fff',
                color: __VLS_ctx.zoomLevel === z ? '#fff' : '#333',
                border: '1px solid #ddd', padding: '6px 16px', borderRadius: '6px',
                cursor: 'pointer', fontSize: '13px', textTransform: 'capitalize',
            }) },
    });
    (z);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ width: `${__VLS_ctx.LABEL_WIDTH}px`, borderRight: '1px solid #e0e0e0', flexShrink: 0 }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ height: '32px', background: '#f8f8f8', borderBottom: '1px solid #e0e0e0', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#888' }) },
});
for (const [task] of __VLS_getVForSourceType((__VLS_ctx.taskList))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (task.id),
        ...{ style: ({
                height: `${__VLS_ctx.ROW_HEIGHT}px`, display: 'flex', alignItems: 'center', padding: '0 12px',
                borderBottom: '1px solid #f0f0f0', fontSize: '13px', fontWeight: 500, color: '#333',
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ style: ({ width: '8px', height: '8px', borderRadius: '50%', background: task.color, marginRight: '8px' }) },
    });
    (task.name);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onPointermove: (__VLS_ctx.onPointerMove) },
    ...{ onPointerup: (__VLS_ctx.onPointerUp) },
    ...{ style: ({ flex: 1, overflow: 'auto', position: 'relative' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ display: 'flex', height: '32px', background: '#f8f8f8', borderBottom: '1px solid #e0e0e0' }) },
});
for (const [d] of __VLS_getVForSourceType((__VLS_ctx.TOTAL_DAYS))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (d),
        ...{ style: ({
                width: `${__VLS_ctx.dayWidth(__VLS_ctx.zoomLevel)}px`, minWidth: `${__VLS_ctx.dayWidth(__VLS_ctx.zoomLevel)}px`,
                borderRight: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', color: '#999',
            }) },
    });
    (__VLS_ctx.zoomLevel === 'day' ? d : '');
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    ...{ style: ({ position: 'absolute', top: '32px', left: '0', pointerEvents: 'none', width: `${__VLS_ctx.TOTAL_DAYS * __VLS_ctx.dayWidth(__VLS_ctx.zoomLevel)}px`, height: `${__VLS_ctx.taskList.length * __VLS_ctx.ROW_HEIGHT}px` }) },
});
for (const [task] of __VLS_getVForSourceType((__VLS_ctx.taskList))) {
    ('dep-' + task.id);
    for (const [line] of __VLS_getVForSourceType((__VLS_ctx.depLines(task)))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
            key: (line.depId),
            x1: (line.fromX),
            y1: (line.fromY),
            x2: (line.toX),
            y2: (line.toY),
            stroke: "#ccc",
            'stroke-width': "1.5",
            'stroke-dasharray': "4,3",
            'marker-end': "url(#arrow)",
        });
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.defs, __VLS_intrinsicElements.defs)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.marker, __VLS_intrinsicElements.marker)({
    id: "arrow",
    markerWidth: "8",
    markerHeight: "6",
    refX: "8",
    refY: "3",
    orient: "auto",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M0,0 L8,3 L0,6",
    fill: "#ccc",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ style: ({
            position: 'absolute', top: '32px', bottom: '0',
            left: `${__VLS_ctx.today * __VLS_ctx.dayWidth(__VLS_ctx.zoomLevel)}px`,
            width: '2px', background: '#d63031', opacity: 0.5, zIndex: 5,
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({
            position: 'absolute', top: '20px',
            left: `${__VLS_ctx.today * __VLS_ctx.dayWidth(__VLS_ctx.zoomLevel) - 16}px`,
            fontSize: '10px', color: '#d63031', fontWeight: 600, zIndex: 5,
        }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: ({ position: 'relative' }) },
});
for (const [task, idx] of __VLS_getVForSourceType((__VLS_ctx.taskList))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onPointerdown: ((e) => __VLS_ctx.onPointerDown(e, task, 'move')) },
        key: (task.id),
        ...{ style: ({
                position: 'absolute',
                top: `${idx * __VLS_ctx.ROW_HEIGHT + 8}px`,
                left: `${task.start * __VLS_ctx.dayWidth(__VLS_ctx.zoomLevel)}px`,
                width: `${task.duration * __VLS_ctx.dayWidth(__VLS_ctx.zoomLevel)}px`,
                height: `${__VLS_ctx.ROW_HEIGHT - 16}px`,
                background: task.color,
                borderRadius: '4px',
                cursor: 'grab',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '6px',
                fontSize: '11px',
                color: '#fff',
                fontWeight: 600,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                userSelect: 'none',
            }) },
    });
    (task.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ onPointerdown: ((e) => __VLS_ctx.onPointerDown(e, task, 'resize')) },
        ...{ style: ({
                position: 'absolute', right: '0', top: '0', bottom: '0', width: '8px',
                cursor: 'ew-resize', background: 'rgba(0,0,0,0.15)',
            }) },
    });
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ZoomChanged: ZoomChanged,
            TOTAL_DAYS: TOTAL_DAYS,
            dayWidth: dayWidth,
            emit: emit,
            taskList: taskList,
            zoomLevel: zoomLevel,
            ZOOM_OPTIONS: ZOOM_OPTIONS,
            ROW_HEIGHT: ROW_HEIGHT,
            LABEL_WIDTH: LABEL_WIDTH,
            onPointerDown: onPointerDown,
            onPointerMove: onPointerMove,
            onPointerUp: onPointerUp,
            today: today,
            depLines: depLines,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
