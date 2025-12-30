document.addEventListener('DOMContentLoaded', () => {
    // 1. Tab Switching Logic
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(b => b.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const target = btn.getAttribute('data-tab');
            document.getElementById(`${target}-view`).classList.add('active');

            if (target === 'history') loadHistory();
            if (target === 'architect') resetArchitect();
        });
    });

    // 2. Initial Scanner Load
    const resultsContainer = document.getElementById('results');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.runtime.sendMessage({ type: 'GET_DETECTIONS', tabId: tabs[0].id }, (response) => {
                renderScanner(response, resultsContainer);
            });
        }
    });

    // 3. Architect Logic (Local AI)
    const analyzeBtn = document.getElementById('analyze-btn');
    const architectResult = document.getElementById('architect-result');

    analyzeBtn.addEventListener('click', () => {
        analyzeBtn.innerText = "Analyzing...";
        analyzeBtn.disabled = true;

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.runtime.sendMessage({ type: 'GET_CRITIQUE', tabId: tabs[0].id }, (response) => {
                setTimeout(() => {
                    analyzeBtn.innerText = "Analyze Stack";
                    analyzeBtn.disabled = false;
                    architectResult.classList.remove('hidden');
                    architectResult.innerHTML = `<p>${response.critique}</p>`;
                }, 800);
            });
        });
    });

    function resetArchitect() {
        architectResult.classList.add('hidden');
    }

    // 4. Time Machine Logic (History)
    function loadHistory() {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '<div class="spinner small"></div>'; // Loading state

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            try {
                const url = new URL(tabs[0].url);
                const hostname = url.hostname;

                chrome.runtime.sendMessage({ type: 'GET_HISTORY', hostname: hostname }, (history) => {
                    historyList.innerHTML = '';

                    if (!history || history.length === 0) {
                        historyList.innerHTML = '<li class="empty-msg">No history found for this domain.</li>';
                        return;
                    }

                    // Show newest first
                    history.reverse().forEach(entry => {
                        const date = new Date(entry.timestamp).toLocaleDateString() + ' ' + new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const techCount = entry.detections.length;
                        const techNames = entry.detections.map(d => d.name).slice(0, 3).join(', ');

                        const li = document.createElement('li');
                        li.className = 'history-item';
                        li.innerHTML = `
                            <div class="history-left">
                                <span class="history-date">${date}</span>
                                <span class="history-summary">${techNames}${entry.detections.length > 3 ? '...' : ''}</span>
                            </div>
                            <span class="history-badge">${techCount}</span>
                        `;
                        historyList.appendChild(li);
                    });
                });
            } catch (e) {
                historyList.innerHTML = '<li class="empty-msg">Cannot access history for this page.</li>';
            }
        });
    }

    // Export Logic
    document.getElementById('export-btn').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.runtime.sendMessage({ type: 'GET_DETECTIONS', tabId: tabs[0].id }, (data) => {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                chrome.downloads.download({
                    url: url,
                    filename: 'stack_report.json'
                });
            });
        });
    });
});

function renderScanner(data, container) {
    if (!data || !data.detections || data.detections.length === 0) {
        container.innerHTML = '<div class="empty-state">No technologies detected.</div>';
        return;
    }

    container.innerHTML = ''; // Clear loading

    // Group by category
    const cats = {};
    data.detections.forEach(d => {
        if (!cats[d.category]) cats[d.category] = [];
        cats[d.category].push(d);
    });

    Object.keys(cats).sort().forEach(cat => {
        const group = document.createElement('div');
        group.className = 'tech-group';
        group.innerHTML = `<h3 class="cat-title">${cat}</h3>`;

        cats[cat].forEach(tech => {
            const version = data.versions && data.versions[tech.name];
            const item = document.createElement('div');
            item.className = 'tech-row';
            item.innerHTML = `
                <div class="tech-info">
                    <span class="tech-name">${tech.name}</span>
                    <span class="tech-method">${tech.method}</span>
                </div>
                ${version ? `<span class="tech-version">v${version}</span>` : ''}
            `;
            group.appendChild(item);
        });
        container.appendChild(group);
    });
}

    // Inspector Logic
    const inspectorBtn = document.getElementById('inspector-btn');
    if (inspectorBtn) {
        inspectorBtn.addEventListener('click', () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_INSPECTOR' });
                window.close(); // Close popup so user can use inspector
            });
        });
    }
