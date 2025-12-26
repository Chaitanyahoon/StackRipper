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
                const pageScripts = Array.from(document.querySelectorAll('script')).map(s => s.src);
                tech.patterns.scripts.forEach(pattern => {
                    const regex = new RegExp(pattern, 'i');
                    if (pageScripts.some(src => regex.test(src))) {
                        detections.push({ name: tech.name, method: 'Script' });
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
            const versions = {};
            try {
                if (window.React) versions['React'] = window.React.version;
                if (window.next) versions['Next.js'] = window.next.version;
                if (window.angular) versions['Angular'] = window.angular.version ? window.angular.version.full : 'detected';
                if (window.Vue) versions['Vue.js'] = window.Vue.version;
                if (window.jQuery) versions['jQuery'] = window.jQuery.fn.jquery;
                
                window.postMessage({ type: 'STACKRIPPER_VERSIONS', versions }, '*');
            } catch(e) {}
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

// Delayed Scans
setTimeout(scan, 1000);
setTimeout(scan, 3000);
setTimeout(() => {
    scan();
    capturePerformance();
}, 6000);
