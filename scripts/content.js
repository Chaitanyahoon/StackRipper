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
                        // Check for HTML and JS manually or via matching
                        if (selector === 'html' || selector === 'script') {
                            if (document.querySelector(selector)) detections.push(tech.name);
                            return;
                        }

                        if (document.querySelector(selector)) {
                            detections.push(tech.name);
                        }
                    } catch (e) {
                        if (selector.startsWith('.')) {
                            const elements = document.querySelectorAll(selector);
                            if (elements.length > 0) detections.push(tech.name);
                        }
                    }
                });
            }

            // 2. Scan Scripts
            if (tech.patterns.scripts && tech.patterns.scripts.length > 0) {
                const pageScripts = Array.from(document.querySelectorAll('script')).map(s => s.src);
                tech.patterns.scripts.forEach(pattern => {
                    const regex = new RegExp(pattern, 'i');
                    if (pageScripts.some(src => regex.test(src))) {
                        detections.push(tech.name);
                    }
                });
            }
        });

        // Unique detections
        const uniqueDetections = [...new Set(detections)];

        if (uniqueDetections.length > 0) {
            chrome.runtime.sendMessage({
                type: 'DETECTIONS',
                detections: uniqueDetections
            });
        }
    } catch (err) {
        console.error('StackRipper: Fetch rules failed', err);
    }
}

// Perform multiple scans to catch dynamic content
scan(); // Immediate
setTimeout(scan, 1000); // 1s
setTimeout(scan, 3000); // 3s
setTimeout(scan, 6000); // 6s
