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

// Reset detections ONLY on new page navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // If the status is loading AND the URL is present (meaning a navigation started)
  if (changeInfo.status === 'loading' && changeInfo.url) {
    detectedTechs[tabId] = {
      url: changeInfo.url,
      detections: []
    };
    chrome.storage.local.set({ [tabId]: detectedTechs[tabId] });
  }
});

// Listen for response headers
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (!rules || details.tabId < 0) return;

    const tabId = details.tabId;
    if (!detectedTechs[tabId]) {
      detectedTechs[tabId] = { detections: [] };
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
              addDetection(tabId, tech);
            }
          } else if (pName) {
            if (hName === pName) {
              addDetection(tabId, tech);
            }
          }
        });
      });
    });
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

function addDetection(tabId, tech) {
  if (!detectedTechs[tabId]) detectedTechs[tabId] = { detections: [] };

  const alreadyDetected = detectedTechs[tabId].detections.some(t => t.name === tech.name);
  if (!alreadyDetected) {
    detectedTechs[tabId].detections.push({
      name: tech.name,
      category: tech.category
    });

    // Persist to storage for popup
    chrome.storage.local.set({ [tabId]: detectedTechs[tabId] });
  }
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DETECTIONS' && sender.tab) {
    const tabId = sender.tab.id;
    message.detections.forEach(techName => {
      const tech = rules.find(t => t.name === techName);
      if (tech) {
        addDetection(tabId, tech);
      }
    });
  }

  if (message.type === 'GET_DETECTIONS') {
    const tabId = message.tabId;
    // Try to get from local cache first, then storage
    if (detectedTechs[tabId]) {
      sendResponse(detectedTechs[tabId]);
    } else {
      chrome.storage.local.get(tabId.toString(), (result) => {
        sendResponse(result[tabId] || { detections: [] });
      });
      return true; // Keep message port open for async
    }
  }
});
