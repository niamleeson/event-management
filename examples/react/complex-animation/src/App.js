import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useSignal, useTween, useSpring, useEmit } from '@pulse/react';
import { CARDS, CARD_COUNT, PageLoaded, HoverCard, UnhoverCard, cardOpacity, cardTranslateY, cardHoverScale, cardHoverShadow, welcomeOpacity, welcomeTranslateY, allEntered, } from './engine';
// ---------------------------------------------------------------------------
// Card Component
// ---------------------------------------------------------------------------
function AnimatedCard({ card, index }) {
    const emit = useEmit();
    const opacity = useTween(cardOpacity[index]);
    const translateY = useTween(cardTranslateY[index]);
    const scale = useTween(cardHoverScale[index]);
    const shadowSize = useSpring(cardHoverShadow[index]);
    return (_jsxs("div", { style: {
            opacity,
            transform: `translateY(${translateY}px) scale(${scale})`,
            background: '#fff',
            borderRadius: 16,
            padding: 28,
            boxShadow: `0 ${2 + shadowSize * 0.5}px ${8 + shadowSize}px rgba(0,0,0,${0.06 + shadowSize * 0.008})`,
            cursor: 'pointer',
            borderTop: `4px solid ${card.color}`,
            transition: 'box-shadow 0.05s',
        }, onMouseEnter: () => emit(HoverCard[index], index), onMouseLeave: () => emit(UnhoverCard[index], index), children: [_jsx("div", { style: {
                    fontSize: 36,
                    marginBottom: 12,
                }, children: card.icon }), _jsx("h3", { style: {
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#1a1a2e',
                    marginBottom: 8,
                }, children: card.title }), _jsx("p", { style: {
                    margin: 0,
                    fontSize: 14,
                    color: '#6c757d',
                    lineHeight: 1.5,
                }, children: card.description })] }));
}
// ---------------------------------------------------------------------------
// Welcome message
// ---------------------------------------------------------------------------
function WelcomeMessage() {
    const entered = useSignal(allEntered);
    const opacity = useTween(welcomeOpacity);
    const translateY = useTween(welcomeTranslateY);
    if (!entered && opacity === 0)
        return null;
    return (_jsxs("div", { style: {
            opacity,
            transform: `translateY(${translateY}px)`,
            textAlign: 'center',
            marginTop: 48,
            padding: '32px 24px',
            background: 'linear-gradient(135deg, #4361ee 0%, #7209b7 100%)',
            borderRadius: 16,
            color: '#fff',
        }, children: [_jsx("h2", { style: { margin: 0, fontSize: 28, fontWeight: 700 }, children: "Welcome to Pulse" }), _jsxs("p", { style: {
                    margin: '8px 0 0',
                    fontSize: 16,
                    opacity: 0.9,
                }, children: ["All ", CARD_COUNT, " cards have entered \u2014 this message was triggered by a join rule"] })] }));
}
// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
    const emit = useEmit();
    // Fire PageLoaded on mount
    useEffect(() => {
        // Small delay to ensure everything is mounted
        const timer = setTimeout(() => {
            emit(PageLoaded, undefined);
        }, 300);
        return () => clearTimeout(timer);
    }, [emit]);
    return (_jsx("div", { style: {
            minHeight: '100vh',
            background: '#f8f9fa',
            padding: '60px 20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }, children: _jsxs("div", { style: { maxWidth: 900, margin: '0 auto' }, children: [_jsxs("div", { style: { textAlign: 'center', marginBottom: 48 }, children: [_jsx("h1", { style: {
                                fontSize: 42,
                                fontWeight: 800,
                                color: '#1a1a2e',
                                margin: 0,
                            }, children: "Staggered Card Entrance" }), _jsx("p", { style: {
                                color: '#6c757d',
                                fontSize: 16,
                                marginTop: 8,
                                maxWidth: 500,
                                marginLeft: 'auto',
                                marginRight: 'auto',
                            }, children: "Cards cascade in with staggered tweens. Hover for spring-driven shadows. A join rule fires after all cards enter." })] }), _jsx("div", { style: {
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                        gap: 20,
                    }, children: CARDS.map((card, i) => (_jsx(AnimatedCard, { card: card, index: i }, card.id))) }), _jsx(WelcomeMessage, {})] }) }));
}
