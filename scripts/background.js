// StackRipper Background Service Worker
let rules = null;

// Initialize: Load rules
async function loadRules() {
  try {
    const response = await fetch(chrome.runtime.getURL('data/rules.json'));
    const data = await response.json();
    rules = data.technologies;
    console.log('StackRipper: Rules loaded', rules);
  } catch (err) {
    console.error('StackRipper: Failed to load rules', err);
  }
}

loadRules();

// Store detected technologies per tabId
const detectedTechs = {};

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  delete detectedTechs[tabId];
  chrome.storage.local.remove(tabId.toString());
});

// Context Menu Setup
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "inspect-stack",
    title: "Inspect Component with StackRipper",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "inspect-stack") {
    chrome.tabs.sendMessage(tab.id, { type: "INSPECT_ELEMENT" });
  }
});

// Reset detections ONLY on new page navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && (changeInfo.url || tab.url)) {
    const url = changeInfo.url || tab.url;
    detectedTechs[tabId] = {
      url: url,
      detections: [],
      versions: {},
      metrics: {}
    };
    chrome.storage.local.set({ [tabId]: detectedTechs[tabId] });
    updateBadge(tabId);
  }
});

function updateBadge(tabId) {
  const count = detectedTechs[tabId]?.detections?.length || 0;
  chrome.action.setBadgeText({
    tabId: tabId,
    text: count > 0 ? count.toString() : ''
  });
  chrome.action.setBadgeBackgroundColor({
    tabId: tabId,
    color: '#ffb7b2'
  });
}

// Listen for response headers
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (!rules || details.tabId < 0) return;

    const tabId = details.tabId;
    if (!detectedTechs[tabId]) {
      detectedTechs[tabId] = { detections: [], versions: {}, metrics: {} };
    }

    const headers = details.responseHeaders;

    rules.forEach(tech => {
      const headerPatterns = tech.patterns.headers;
      if (!headerPatterns || headerPatterns.length === 0) return;

      headerPatterns.forEach(pattern => {
        const [pName, pValue] = pattern.split(':').map(s => s.trim().toLowerCase());
        headers.forEach(h => {
          const hName = h.name.toLowerCase();
          const hValue = h.value ? h.value.toLowerCase() : '';

          if (pName && pValue) {
            if (hName === pName && hValue.includes(pValue)) {
              addDetection(tabId, tech, 'Header');
            }
          } else if (pName) {
            if (hName === pName) {
              addDetection(tabId, tech, 'Header');
            }
          }
        });
      });
    });
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

function addDetection(tabId, tech, method = 'Unknown') {
  if (!detectedTechs[tabId]) detectedTechs[tabId] = { detections: [], versions: {}, metrics: {} };

  const alreadyDetected = detectedTechs[tabId].detections.some(t => t.name === tech.name);
  if (!alreadyDetected) {
    detectedTechs[tabId].detections.push({
      name: tech.name,
      category: tech.category,
      method: method
    });

    chrome.storage.local.set({ [tabId]: detectedTechs[tabId] });
    updateBadge(tabId);

    // Save to History (Debounced or on complete)
    if (detectedTechs[tabId].url) {
      saveHistory(detectedTechs[tabId].url, detectedTechs[tabId].detections);
    }
  }
}

async function saveHistory(url, detections) {
  try {
    const hostname = new URL(url).hostname;
    const key = `history_${hostname}`;
    const result = await chrome.storage.local.get(key);
    const history = result[key] || [];

    const currentStack = detections.map(d => d.name).sort().join(',');
    const lastEntry = history[history.length - 1];

    if (!lastEntry || lastEntry.stack !== currentStack) {
      history.push({
        timestamp: new Date().toISOString(),
        stack: currentStack,
        detections: detections
      });
      // Keep last 10 changes
      const trimmedHistory = history.slice(-10);
      await chrome.storage.local.set({ [key]: trimmedHistory });
      console.log(`StackRipper: History updated for ${hostname}`);
    }
  } catch (e) { }
}

// Handle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DETECTIONS' && sender.tab) {
    const tabId = sender.tab.id;
    message.detections.forEach(d => {
      const tech = rules.find(t => t.name === d.name);
      if (tech) {
        addDetection(tabId, tech, d.method);
      }
    });
  }

  if (message.type === 'VERSIONS_UPDATE' && sender.tab) {
    const tabId = sender.tab.id;
    if (!detectedTechs[tabId]) detectedTechs[tabId] = { detections: [], versions: {}, metrics: {} };
    detectedTechs[tabId].versions = { ...detectedTechs[tabId].versions, ...message.versions };
    chrome.storage.local.set({ [tabId]: detectedTechs[tabId] });
  }

  if (message.type === 'PERFORMANCE_METRICS' && sender.tab) {
    const tabId = sender.tab.id;
    if (!detectedTechs[tabId]) detectedTechs[tabId] = { detections: [], versions: {}, metrics: {} };
    detectedTechs[tabId].metrics = message.metrics;
    chrome.storage.local.set({ [tabId]: detectedTechs[tabId] });
  }

  if (message.type === 'GET_DETECTIONS') {
    const tabId = message.tabId;
    if (detectedTechs[tabId]) {
      sendResponse(detectedTechs[tabId]);
    } else {
      chrome.storage.local.get(tabId.toString(), (result) => {
        sendResponse(result[tabId] || { detections: [], versions: {}, metrics: {} });
      });
      return true;
    }
  }

  if (message.type === 'GET_HISTORY') {
    const hostname = message.hostname;
    chrome.storage.local.get(`history_${hostname}`, (result) => {
      sendResponse(result[`history_${hostname}`] || []);
    });
    return true;
  }
});
