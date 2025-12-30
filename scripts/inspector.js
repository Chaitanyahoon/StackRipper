// StackRipper Component Inspector (X-Ray Mode)
let inspectorActive = false;
let tooltip = null;

function initInspector() {
    if (inspectorActive) return;
    inspectorActive = true;
    document.body.style.cursor = 'crosshair';

    // Create Tooltip
    tooltip = document.createElement('div');
    tooltip.id = 'sr-inspector-tooltip';
    Object.assign(tooltip.style, {
        position: 'fixed',
        zIndex: '999999',
        background: '#1a1a1a',
        color: '#ffb7b2',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        pointerEvents: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        border: '1px solid #ffb7b2',
        display: 'none',
        maxWidth: '300px'
    });
    document.body.appendChild(tooltip);

    document.addEventListener('mouseover', handleHover, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKey);
}

function stopInspector() {
    inspectorActive = false;
    document.body.style.cursor = '';
    if (tooltip) tooltip.remove();
    document.removeEventListener('mouseover', handleHover, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKey);

    // Clear any existing outline
    if (lastElement) {
        lastElement.style.outline = '';
        lastElement = null;
    }
}

let lastElement = null;

function handleHover(e) {
    if (!inspectorActive) return;
    e.preventDefault();
    e.stopPropagation();

    const el = e.target;
    if (el === lastElement) return;

    // Render Highlight
    if (lastElement) lastElement.style.outline = '';
    el.style.outline = '2px solid #ffb7b2';
    lastElement = el;

    // Analyze Element
    const info = analyzeElement(el);

    // Render Tooltip
    const rect = el.getBoundingClientRect();
    tooltip.style.display = 'block';
    tooltip.style.top = (rect.top - 40 < 0 ? rect.bottom + 10 : rect.top - 40) + 'px';
    tooltip.style.left = Math.min(window.innerWidth - 300, Math.max(10, rect.left)) + 'px';

    if (info) {
        tooltip.innerHTML = `<strong>${info.tech}</strong><br><span style="color:#ccc">${info.reason}</span>`;
    } else {
        const tag = el.tagName.toLowerCase();
        const classes = Array.from(el.classList).join('.');
        tooltip.innerHTML = `<strong>${tag}</strong><br><span style="color:#ccc">${classes ? '.' + classes : ''}</span>`;
    }
}

function handleClick(e) {
    if (!inspectorActive) return;
    e.preventDefault();
    e.stopPropagation();
    // Keep outline or log to console
    console.log("StackRipper Inspector:", e.target);
    stopInspector(); // Auto-stop on click? Or maybe toggle. Let's stop for now.
}

function handleKey(e) {
    if (e.key === 'Escape') stopInspector();
}

// Simple Heuristics for Inspector
function analyzeElement(el) {
    const cls = el.className.toString();

    if (cls.includes('Mui') || cls.includes('css-')) return { tech: 'Material UI / Emotion', reason: 'Verified by class pattern' };
    if (cls.includes('chakra')) return { tech: 'Chakra UI', reason: 'Chakra class prefix detected' };
    if (cls.includes('ant-')) return { tech: 'Ant Design', reason: 'Ant-Design prefix detected' };
    if (cls.includes('text-') || cls.includes('bg-') || cls.includes('flex')) return { tech: 'Tailwind CSS', reason: 'Utility class pattern detected' };
    if (el.hasAttribute('data-reactid') || el.hasAttribute('data-reactroot')) return { tech: 'React Legacy', reason: 'React ID attribute' };
    if (el.hasAttribute('ng-click') || el.classList.contains('ng-scope')) return { tech: 'AngularJS', reason: 'Angular directive detected' };

    return null;
}

// Message Listener
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'TOGGLE_INSPECTOR') {
        if (inspectorActive) stopInspector();
        else initInspector();
    }
});
