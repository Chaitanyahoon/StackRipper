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
    }
  }

// StackRipper Background Script

// 1. Time Machine: Save Detections
function saveHistory(url, detections) {
    try {
      const hostname = new URL(url).hostname;
      const timestamp = new Date().toISOString();

      chrome.storage.local.get([hostname], (result) => {
        const history = result[hostname] || [];

        // Avoid duplicate contiguous entries (if nothing changed)
        const lastEntry = history[history.length - 1];
        const currentSignature = JSON.stringify(detections.sort((a, b) => a.name.localeCompare(b.name)));
        const lastSignature = lastEntry ? JSON.stringify(lastEntry.detections.sort((a, b) => a.name.localeCompare(b.name))) : null;

        if (currentSignature !== lastSignature) {
          history.push({ timestamp, detections });
          // Keep last 10 entries max
          if (history.length > 10) history.shift();

          chrome.storage.local.set({ [hostname]: history });
        }
      });
    } catch (e) {
      console.error("StackRipper: History save failed", e);
    }
  }

  // Handle messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'DETECTIONS' && sender.tab) {
      const tabId = sender.tab.id;
      const tabUrl = sender.tab.url;

      // Save to Time Machine
      if (tabUrl && !tabUrl.startsWith('chrome://')) {
        saveHistory(tabUrl, message.detections);
      }

      // Update Badge
      const count = message.detections.length;
      if (count > 0) {
        chrome.action.setBadgeText({ text: count.toString(), tabId: tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#ffb7b2', tabId: tabId });
      }

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

// 2. AI Architect: Local Heuristic Engine
function generateCritique(detections) {
  const techs = detections.map(d => d.name.toLowerCase());
  const versionMap = {};
  detections.forEach(d => { if(d.version) versionMap[d.name.toLowerCase()] = d.version; });

  let critique = "Analysis complete. ";
  let issues = [];

  // Rule 1: Mix of UI Libraries
  if (techs.includes('react') && techs.includes('jquery')) {
    issues.push("Mixing Virtual DOM (React) with direct DOM manipulation (jQuery) can lead to performance bottlenecks and header trashing.");
  }
  if (techs.includes('angular') && techs.includes('react')) {
    issues.push("Detected two heavy frontend frameworks (Angular + React). This significantly increases bundle size. Consider standardizing on one.");
  }

  // Rule 2: SEO Check
  if (techs.includes('next.js') || techs.includes('gatsby') || techs.includes('nuxt.js')) {
    issues.push("Excellent architecture for SEO. Server-side rendering detected.");
  } else if (techs.includes('react') && !techs.includes('next.js')) {
    issues.push("Client-side React detected without Next.js. Verify SEO performance using Google Search Console as content may not be fully indexed.");
  }

  // Rule 3: Security / Legacy
  if (techs.includes('bootstrap') && !techs.includes('bootstrap 5')) {
     if (versionMap['bootstrap'] && versionMap['bootstrap'].startsWith('3')) {
        issues.push("Legacy Bootstrap 3 detected. This version is end-of-life and lacks modern flexbox utilities.");
     }
  }

  if (issues.length === 0) {
    critique += "The stack appears consistent. No major architectural conflicts detected.";
  } else {
    critique += issues.join(" ");
  }

  return critique;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_CRITIQUE') {
       const tabId = message.tabId;
       const data = detectedTechs[tabId];
       if (data && data.detections) {
           const text = generateCritique(data.detections);
           sendResponse({ critique: text });
       } else {
           sendResponse({ critique: "No stack data available to analyze yet." });
       }
       return true; 
    }
});
