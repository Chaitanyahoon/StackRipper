document.addEventListener('DOMContentLoaded', async () => {
    const resultsContainer = document.getElementById('results-container');
    const techCountEl = document.getElementById('tech-count');
    const tabUrlEl = document.getElementById('tab-url');
    const exportBtn = document.getElementById('export-json');
    const aiConsultBtn = document.getElementById('ai-consultor');
    const timeMachineBtn = document.getElementById('time-machine');
    const historyView = document.getElementById('history-view');
    const closeHistoryBtn = document.getElementById('close-history');
    const historyList = document.getElementById('history-list');

    let rulesData = [];
    let currentData = null;

    const VULNERABILITIES = {
        'React': [
            { min: '0.0.0', max: '16.14.0', level: 'High', msg: 'Potential XSS in older React versions. Upgrade to v17+ recommended.' }
        ],
        'jQuery': [
            { min: '0.0.0', max: '3.5.0', level: 'Medium', msg: 'Multiple CVEs found in older jQuery. Upgrade to 3.5.1+.' }
        ],
        'Angular': [
            { min: '0.0.0', max: '10.0.0', level: 'High', msg: 'Legacy Angular versions are no longer receiving security patches.' }
        ],
        'Vue.js': [
            { min: '0.0.0', max: '2.6.0', level: 'Medium', msg: 'Vue 2.x is reaching End of Life. Migration to Vue 3 is advised.' }
        ]
    };

    // Load rules metadata
    try {
        const response = await fetch(chrome.runtime.getURL('data/rules.json'));
        const data = await response.json();
        rulesData = data.technologies;
    } catch (e) {
        rulesData = [];
    }

    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    const hostname = tab.url ? new URL(tab.url).hostname : 'unknown domain';
    tabUrlEl.textContent = hostname;

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

        // Security Audit Check
        const totalVulns = [];
        detections.forEach(tech => {
            const version = versions ? versions[tech.name] : null;
            if (version && VULNERABILITIES[tech.name]) {
                VULNERABILITIES[tech.name].forEach(v => {
                    if (compareVersions(version, v.max) <= 0) {
                        totalVulns.push({ name: tech.name, ...v });
                    }
                });
            }
        });

        if (totalVulns.length > 0) {
            const alert = document.createElement('div');
            alert.className = 'security-alert';
            alert.innerHTML = `⚠️ ${totalVulns.length} Security Risks Detected in this stack. Check marked components.`;
            resultsContainer.appendChild(alert);
        }

        // Site Profile
        const profile = generateProfile(detections);
        const profileDiv = document.createElement('div');
        profileDiv.className = 'site-profile';
        const perfHtml = metrics && metrics.responseTime ? `<span class="performance-pill">TTFB: ${metrics.responseTime}ms</span>` : '';
        profileDiv.innerHTML = `
            <div id="ai-advice-container"></div>
            <div class="profile-label">SITE IDENTITY PROFILE ${perfHtml}</div>
            <div class="profile-summary">${profile}</div>
        `;
        resultsContainer.appendChild(profileDiv);

        // Group by category
        const categories = {};
        detections.forEach(tech => {
            if (!categories[tech.category]) categories[tech.category] = [];
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
                const vuln = totalVulns.find(v => v.name === tech.name);

                const card = document.createElement('div');
                card.className = 'tech-card';
                card.innerHTML = `
                    <div class="tech-name-row">
                        <div class="tech-name">${tech.name} ${vuln ? `<span class="vuln-badge" title="${vuln.msg}">RISK: ${vuln.level}</span>` : ''}</div>
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

    function compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;
            if (p1 > p2) return 1;
            if (p1 < p2) return -1;
        }
        return 0;
    }

    function generateProfile(detections) {
        const names = detections.map(d => d.name);
        if (names.includes('Flipkart Stack')) return "Comprehensive e-commerce ecosystem. Optimized for high-concurrency and deep user engagement with a modular React infrastructure.";
        if (names.includes('Next.js')) return "Modern full-stack React implementation. Leverages edge computing and server-side generation for elite performance and technical SEO.";
        if (names.includes('React')) return "Dynamic frontend architecture. Built on component-driven principles for a reactive and fast user experience.";
        return "Specialized professional stack detected. System is architected for scalability using industry-standard enterprise frameworks.";
    }

    function renderEmptyState(customMsg) {
        resultsContainer.innerHTML = `<div class="loading" style="animation: none;"><p style="color: var(--text-secondary); font-weight: 500;">${customMsg || 'No technologies detected'}</p></div>`;
    }

    // --- TIME MACHINE LOGIC ---
    timeMachineBtn.addEventListener('click', () => {
        historyView.classList.add('active');
        historyList.innerHTML = '<div class="loading"><span class="ai-loading"></span>Rewinding time...</div>';

        chrome.runtime.sendMessage({ type: 'GET_HISTORY', hostname }, (history) => {
            historyList.innerHTML = '';
            if (!history || history.length === 0) {
                historyList.innerHTML = '<p style="text-align:center; padding:20px; opacity:0.6;">No previous stack changes recorded for this domain.</p>';
                return;
            }

            history.reverse().forEach(entry => {
                const item = document.createElement('div');
                item.className = 'history-item';
                const date = new Date(entry.timestamp).toLocaleString();
                item.innerHTML = `
                    <div class="history-date">${date}</div>
                    <div class="history-stack">${entry.stack.split(',').join(' • ')}</div>
                `;
                historyList.appendChild(item);
            });
        });
    });

    closeHistoryBtn.addEventListener('click', () => {
        historyView.classList.remove('active');
    });

    // --- AI LOGIC (PRODUCTION READY) ---
    aiConsultBtn.addEventListener('click', async () => {
        if (!currentData || !currentData.detections.length) return;
        const adviceContainer = document.getElementById('ai-advice-container');
        if (!adviceContainer) return;

        chrome.storage.local.get(['gemini_api_key'], async (settings) => {
            const apiKey = settings.gemini_api_key;
            if (!apiKey) {
                adviceContainer.innerHTML = `<div class="ai-advice-box"><p>Set Gemini API Key in settings to use Consultant.</p></div>`;
                return;
            }
            adviceContainer.innerHTML = `<div class="ai-advice-box"><span class="ai-loading"></span>Analysing architecture...</div>`;
            const techList = currentData.detections.map(d => d.name).sort().join(', ');
            const prompt = `Analyze this tech stack: [${techList}]. Provide a 2-sentence professional critique on performance or security.`;

            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });
                const data = await response.json();
                const advice = data.candidates?.[0]?.content?.parts?.[0]?.text || "Stack looks optimal.";
                adviceContainer.innerHTML = `<div class="ai-advice-box">${advice}</div>`;
            } catch (err) {
                adviceContainer.innerHTML = `<div class="ai-advice-box" style="color:red;">Scan Failed: ${err.message}</div>`;
            }
        });
    });

    // Export Logic
    exportBtn.addEventListener('click', () => {
        if (!currentData) return;
        const report = { hostname, timestamp: new Date().toISOString(), stack: currentData.detections, versions: currentData.versions };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
        const a = document.createElement('a');
        a.href = dataStr;
        a.download = `stackripper_${hostname.replace(/\./g, '_')}.json`;
        a.click();
    });
});
