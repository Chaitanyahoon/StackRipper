document.addEventListener('DOMContentLoaded', async () => {
    const resultsContainer = document.getElementById('results-container');
    const techCountEl = document.getElementById('tech-count');
    const tabUrlEl = document.getElementById('tab-url');

    let rulesData = [];

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
        tabUrlEl.textContent = 'stackripper.demo';
        renderDetections([
            { name: 'React', category: 'Frontend' },
            { name: 'Next.js', category: 'Frontend' },
            { name: 'Cloudflare', category: 'Hosting / CDN' },
            { name: 'Flipkart', category: 'E-commerce' }
        ]);
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
            renderDetections(response.detections);
        }
    });

    function renderDetections(detections) {
        resultsContainer.innerHTML = '';
        techCountEl.textContent = detections.length;

        // Add Site Profile (Summary)
        const profile = generateProfile(detections);
        const profileDiv = document.createElement('div');
        profileDiv.className = 'site-profile';
        profileDiv.innerHTML = `
            <div class="profile-label">SITE IDENTITY PROFILE</div>
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
                const card = document.createElement('div');
                card.className = 'tech-card';

                card.innerHTML = `
                    <div class="tech-name">${tech.name}</div>
                    <div class="tech-desc">${techMeta.description || 'Professional technology implementation detected.'}</div>
                    ${techMeta.website ? `<a href="${techMeta.website}" target="_blank" class="tech-docs">Documentation →</a>` : ''}
                `;
                list.appendChild(card);
            });

            group.appendChild(list);
            resultsContainer.appendChild(group);
        });
    }

    function generateProfile(detections) {
        const names = detections.map(d => d.name);
        if (names.includes('Flipkart')) return "High-performance custom e-commerce architecture. Optimized for the Indian market with a heavy React-based stack and deep analytics integration.";
        if (names.includes('Next.js')) return "Modern React-based delivery system. Utilizing server-side rendering and edge distribution for premium performance and SEO integrity.";
        if (names.includes('React')) return "Interactive component architecture. Focused on a rich user experience with efficient state management and modular design.";
        if (names.includes('.NET')) return "Robust enterprise backend framework. Built for reliability, high-concurrency, and secure professional applications.";
        return "Specialized technology stack identified. The system utilizes industry-standard tools for reliable performance and scalability.";
    }

    function renderEmptyState() {
        resultsContainer.innerHTML = `
            <div class="loading">
                <p style="color: #b0a098; font-weight: 500;">No magic detected yet</p>
                <p style="font-size: 0.7rem; margin-top: 10px; opacity: 0.6;">Try refreshing the page to scan again</p>
            </div>
        `;
        techCountEl.textContent = '0';
    }
});
