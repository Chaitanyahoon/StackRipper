document.addEventListener('DOMContentLoaded', async () => {
    const resultsContainer = document.getElementById('results-container');
    const techCountEl = document.getElementById('tech-count');
    const tabUrlEl = document.getElementById('tab-url');
    const exportBtn = document.getElementById('export-json');

    let rulesData = [];
    let currentData = null;

    // Load rules metadata
    try {
        const response = await fetch(chrome.runtime.getURL('data/rules.json'));
        const data = await response.json();
        rulesData = data.technologies;
    } catch (e) {
        rulesData = [];
    }

    // MOCK FOR PREVIEW
    if (!window.chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
        tabUrlEl.textContent = 'stackripper.pro';
        renderDetections({
            detections: [
                { name: 'React', category: 'Frontend', method: 'Script' },
                { name: 'Next.js', category: 'Frontend', method: 'DOM' },
                { name: 'Cloudflare', category: 'Hosting / CDN', method: 'Header' }
            ],
            versions: { 'React': '18.2.0', 'Next.js': '14.0.1' },
            metrics: { loadTime: 450, responseTime: 82, domReady: 310 }
        });
        return;
    }

    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    tabUrlEl.textContent = tab.url ? new URL(tab.url).hostname : 'unknown domain';

    // Fetch detections
    chrome.runtime.sendMessage({ type: 'GET_DETECTIONS', tabId: tab.id }, (response) => {
        if (!response || !response.detections || response.detections.length === 0) {
            renderEmptyState();
        } else {
            currentData = response;
            renderDetections(response);
        }
    });

    function renderDetections(data) {
        const { detections, versions, metrics } = data;
        resultsContainer.innerHTML = '';
        techCountEl.textContent = detections.length;

        // Add Site Profile
        const profile = generateProfile(detections);
        const profileDiv = document.createElement('div');
        profileDiv.className = 'site-profile';

        const perfHtml = metrics && metrics.responseTime ?
            `<span class="performance-pill" title="TTFB (Time to First Byte)">TTFB: ${metrics.responseTime}ms</span>` : '';

        profileDiv.innerHTML = `
            <div class="profile-label">
                SITE IDENTITY PROFILE
                ${perfHtml}
            </div>
            <div class="profile-summary">${profile}</div>
        `;
        resultsContainer.appendChild(profileDiv);

        // Group by category
        const categories = {};
        detections.forEach(tech => {
            if (!categories[tech.category]) {
                categories[tech.category] = [];
            }
            categories[tech.category].push(tech);
        });

        Object.keys(categories).sort().forEach(category => {
            const group = document.createElement('div');
            group.className = 'category-group';

            const title = document.createElement('div');
            title.className = 'category-title';
            title.textContent = category;
            group.appendChild(title);

            const list = document.createElement('div');
            list.className = 'tech-list';

            categories[category].forEach(tech => {
                const techMeta = rulesData.find(r => r.name === tech.name) || {};
                const version = versions ? versions[tech.name] : null;

                const card = document.createElement('div');
                card.className = 'tech-card';

                card.innerHTML = `
                    <div class="tech-name-row">
                        <div class="tech-name">${tech.name}</div>
                        ${version ? `<div class="tech-version">v${version}</div>` : ''}
                    </div>
                    <div class="tech-desc">${techMeta.description || 'Enterprise technology detected.'}</div>
                    <div class="tech-meta-row">
                        <div class="tech-method">Via ${tech.method || 'Unknown'}</div>
                        ${techMeta.website ? `<a href="${techMeta.website}" target="_blank" class="tech-docs">Documentation</a>` : ''}
                    </div>
                `;
                list.appendChild(card);
            });

            group.appendChild(list);
            resultsContainer.appendChild(group);
        });
    }

    function generateProfile(detections) {
        const names = detections.map(d => d.name);
        if (names.includes('Flipkart')) return "Comprehensive e-commerce ecosystem. Optimized for high-concurrency and deep user engagement with a modular React infrastructure.";
        if (names.includes('Next.js')) return "Modern full-stack React implementation. Leverages edge computing and server-side generation for elite performance and technical SEO.";
        if (names.includes('React')) return "Dynamic frontend architecture. Built on component-driven principles for a reactive and fast user experience.";
        return "Specialized professional stack detected. System is architected for scalability using industry-standard enterprise frameworks.";
    }

    function renderEmptyState() {
        resultsContainer.innerHTML = `
            <div class="loading" style="animation: none;">
                <p style="color: var(--text-secondary); font-weight: 500;">No technologies detected</p>
                <p style="font-size: 0.7rem; margin-top: 10px; opacity: 0.6;">Try refreshing the page to scan again</p>
            </div>
        `;
        techCountEl.textContent = '0';
    }

    // Export Logic
    exportBtn.addEventListener('click', () => {
        if (!currentData) return;
        const report = {
            hostname: tabUrlEl.textContent,
            timestamp: new Date().toISOString(),
            stack: currentData.detections,
            versions: currentData.versions,
            performance: currentData.metrics
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `stackripper_${tabUrlEl.textContent.replace(/\./g, '_')}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });
});
