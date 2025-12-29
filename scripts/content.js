// StackRipper Content Script

async function scan() {
    const rulesUrl = chrome.runtime.getURL('data/rules.json');
    try {
        const response = await fetch(rulesUrl);
        const data = await response.json();
        const rules = data.technologies;

        const detections = [];

        rules.forEach(tech => {
            // 1. Scan DOM
            if (tech.patterns.dom && tech.patterns.dom.length > 0) {
                tech.patterns.dom.forEach(selector => {
                    try {
                        if (selector === 'html' || selector === 'script') {
                            if (document.querySelector(selector)) detections.push({ name: tech.name, method: 'DOM' });
                            return;
                        }

                        if (document.querySelector(selector)) {
                            detections.push({ name: tech.name, method: 'DOM' });
                        }
                    } catch (e) { }
                });
            }

            // 2. Scan Scripts
            if (tech.patterns.scripts && tech.patterns.scripts.length > 0) {
                const scripts = Array.from(document.querySelectorAll('script'));
                const pageScripts = scripts.map(s => s.src).filter(Boolean);
                const inlineScripts = scripts.map(s => s.textContent).filter(Boolean);

                tech.patterns.scripts.forEach(pattern => {
                    const regex = new RegExp(pattern, 'i');
                    // Check external scripts
                    if (pageScripts.some(src => regex.test(src))) {
                        detections.push({ name: tech.name, method: 'Script' });
                    }
                    // Check inline scripts for bundle signatures
                    if (inlineScripts.some(text => regex.test(text))) {
                        detections.push({ name: tech.name, method: 'Inline' });
                    }
                });
            }
        });

        // Unique detections by name (keep first method found)
        const uniqueDetectionsMap = new Map();
        detections.forEach(d => {
            if (!uniqueDetectionsMap.has(d.name)) {
                uniqueDetectionsMap.set(d.name, d.method);
            }
        });

        if (uniqueDetectionsMap.size > 0) {
            chrome.runtime.sendMessage({
                type: 'DETECTIONS',
                detections: Array.from(uniqueDetectionsMap.entries()).map(([name, method]) => ({ name, method }))
            });
        }
    } catch (err) {
        console.error('StackRipper: Fetch rules failed', err);
    }
}

// Version Detector Injection
function injectVersionDetector() {
    const script = document.createElement('script');
    script.textContent = `
        (function() {
            function detect() {
                const versions = {};
                try {
                    if (window.React) versions['React'] = window.React.version;
                    if (window.next) versions['Next.js'] = window.next.version;
                    if (window.angular) versions['Angular'] = window.angular.version ? window.angular.version.full : 'detected';
                    if (window.Vue) versions['Vue.js'] = window.Vue.version;
                    if (window.jQuery) versions['jQuery'] = window.jQuery.fn.jquery;
                    
                    window.postMessage({ type: 'STACKRIPPER_VERSIONS', versions }, '*');
                } catch(e) {}
            }
            detect();
            // Re-detect on dynamic changes
            const observer = new MutationObserver(detect);
            observer.observe(document.documentElement, { childList: true, subtree: true });
        })();
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
}

window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'STACKRIPPER_VERSIONS') {
        chrome.runtime.sendMessage({
            type: 'VERSIONS_UPDATE',
            versions: event.data.versions
        });
    }
});

// Performance Metrics
function capturePerformance() {
    const timing = performance.getEntriesByType('navigation')[0];
    if (!timing) return;

    const metrics = {
        loadTime: Math.round(timing.loadEventEnd),
        domReady: Math.round(timing.domContentLoadedEventEnd),
        responseTime: Math.round(timing.responseEnd - timing.requestStart)
    };

    // Only send if values are positive (page fully loaded)
    if (metrics.loadTime > 0) {
        chrome.runtime.sendMessage({ type: 'PERFORMANCE_METRICS', metrics });
    }
}

// Initial Scan & Injection
scan();
injectVersionDetector();

// High-frequency polling for first 10 seconds for dynamic apps
let scanCount = 0;
const scanInterval = setInterval(() => {
    scan();
    scanCount++;
    if (scanCount >= 10) clearInterval(scanInterval);
}, 1000);

// Final capture
setTimeout(() => {
    scan();
    capturePerformance();
}, 12000);
