document.addEventListener('DOMContentLoaded', async () => {
    const resultsContainer = document.getElementById('results-container');
    const techCountEl = document.getElementById('tech-count');
    const tabUrlEl = document.getElementById('tab-url');
    const exportBtn = document.getElementById('export-json');
    const aiConsultBtn = document.getElementById('ai-consultor');

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

    // Check for Chrome Extension environment
    if (!window.chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
        renderEmptyState("Environment not supported. Please run as a Chrome Extension.");
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
            <div id="ai-advice-container"></div>
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
        if (names.includes('Flipkart Stack')) return "Comprehensive e-commerce ecosystem. Optimized for high-concurrency and deep user engagement with a modular React infrastructure.";
        if (names.includes('Next.js')) return "Modern full-stack React implementation. Leverages edge computing and server-side generation for elite performance and technical SEO.";
        if (names.includes('React')) return "Dynamic frontend architecture. Built on component-driven principles for a reactive and fast user experience.";
        return "Specialized professional stack detected. System is architected for scalability using industry-standard enterprise frameworks.";
    }

    function renderEmptyState(customMsg) {
        resultsContainer.innerHTML = `
            <div class="loading" style="animation: none;">
                <p style="color: var(--text-secondary); font-weight: 500;">${customMsg || 'No technologies detected'}</p>
                <p style="font-size: 0.7rem; margin-top: 10px; opacity: 0.6;">Try refreshing the page to scan again</p>
            </div>
        `;
        techCountEl.textContent = '0';
    }

    // --- AI LOGIC (PRODUCTION READY - NO HARDCODED KEYS) ---
    aiConsultBtn.addEventListener('click', async () => {
        if (!currentData || !currentData.detections.length) return;

        const adviceContainer = document.getElementById('ai-advice-container');
        if (!adviceContainer) return;

        // Check storage for API Key first
        chrome.storage.local.get(['gemini_api_key'], async (settings) => {
            const apiKey = settings.gemini_api_key;

            if (!apiKey) {
                adviceContainer.innerHTML = `
                    <div class="ai-advice-box">
                        <p style="margin-bottom:8px">Please set your Gemini AI API Key in settings to use the Consultant.</p>
                        <input type="password" id="api-key-input" placeholder="Enter API Key" style="width:100%; padding:4px; border-radius:4px; border:1px solid var(--accent-color); margin-bottom:8px;">
                        <button id="save-api-key" style="background:var(--accent-color); color:white; border:none; border-radius:4px; padding:4px 12px; cursor:pointer;">Save Key</button>
                    </div>
                `;
                document.getElementById('save-api-key').addEventListener('click', () => {
                    const newKey = document.getElementById('api-key-input').value;
                    if (newKey) {
                        chrome.storage.local.set({ gemini_api_key: newKey }, () => {
                            aiConsultBtn.click(); // Re-trigger
                        });
                    }
                });
                return;
            }

            adviceContainer.innerHTML = `<div class="ai-advice-box"><span class="ai-loading"></span>Analysing stack architecture...</div>`;

            const techList = currentData.detections.map(d => d.name).sort().join(', ');
            const cacheKey = `ai_review_${techList}`;

            // 1. Check Cache
            chrome.storage.local.get(cacheKey, async (result) => {
                if (result[cacheKey]) {
                    adviceContainer.innerHTML = `<div class="ai-advice-box">${result[cacheKey]}</div>`;
                    return;
                }

                // 2. Call API
                try {
                    const prompt = `You are a Senior Tech Architect. Analyze this tech stack: [${techList}]. Provide a 2-sentence professional critique on performance, security, or modern best practices. Be concise and insightful.`;

                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }]
                        })
                    });

                    const data = await response.json();
                    if (data.error) throw new Error(data.error.message);

                    const advice = data.candidates?.[0]?.content?.parts?.[0]?.text || "Architecture looks solid.";

                    // 3. Cache Result
                    const cacheData = {};
                    cacheData[cacheKey] = advice;
                    chrome.storage.local.set(cacheData);

                    adviceContainer.innerHTML = `<div class="ai-advice-box">${advice}</div>`;
                } catch (err) {
                    adviceContainer.innerHTML = `<div class="ai-advice-box" style="color:#ff6b6b;">AI Analysis Failed: ${err.message}</div>`;
                    // If unauthorized, clear key
                    if (err.message.includes('API key')) {
                        chrome.storage.local.remove('gemini_api_key');
                    }
                }
            });
        });
    });


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
