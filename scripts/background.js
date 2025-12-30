// StackRipper Background Service Worker
let rules = null;
let cveDB = null;

// Initialize: Load rules AND CVEs
async function loadData() {
  try {
    const rRes = await fetch(chrome.runtime.getURL('data/rules.json'));
    const rData = await rRes.json();
    rules = rData.technologies;

    // CVEs might be missing in initial install, handle gracefully
    try {
      const cRes = await fetch(chrome.runtime.getURL('data/cves.json'));
      const cData = await cRes.json();
      cveDB = cData.cves;
    } catch (e) { console.log("No CVE database found"); }

    console.log('StackRipper: Data loaded');
  } catch (err) {
    console.error('StackRipper: Failed to load data', err);
  }
}

loadData();

// Store detections
const detectedTechs = {};

chrome.tabs.onRemoved.addListener((tabId) => {
  delete detectedTechs[tabId];
  chrome.storage.local.remove(tabId.toString());
});

// Context Menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "inspect-stack", title: "Inspect Component with StackRipper", contexts: ["all"] });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "inspect-stack") {
    chrome.tabs.sendMessage(tab.id, { type: "INSPECT_ELEMENT" });
  }
});

// Reset logic
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && (changeInfo.url || tab.url)) {
    detectedTechs[tabId] = { url: changeInfo.url || tab.url, detections: [], versions: {}, metrics: {} };
    chrome.storage.local.set({ [tabId]: detectedTechs[tabId] });
    updateBadge(tabId);
  }
});

function updateBadge(tabId) {
  const count = detectedTechs[tabId]?.detections?.length || 0;
  chrome.action.setBadgeText({ tabId, text: count > 0 ? count.toString() : '' });
  chrome.action.setBadgeBackgroundColor({ tabId, color: '#ffb7b2' });
}

// Header Detections
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (!rules || details.tabId < 0) return;
    const tabId = details.tabId;
    if (!detectedTechs[tabId]) detectedTechs[tabId] = { detections: [], versions: {}, metrics: {} };

    const headers = details.responseHeaders;
    rules.forEach(tech => {
      const headerPatterns = tech.patterns.headers;
      if (!headerPatterns) return;
      headerPatterns.forEach(pattern => {
        const [pName, pValue] = pattern.split(':').map(s => s.trim().toLowerCase());
        headers.forEach(h => {
          if (h.name.toLowerCase() === pName && (!pValue || (h.value && h.value.toLowerCase().includes(pValue)))) {
            addDetection(tabId, tech, 'Header');
          }
        });
      });
    });
  },
  { urls: ["<all_urls>"] }, ["responseHeaders"]
);

function addDetection(tabId, tech, method = 'Unknown') {
  if (!detectedTechs[tabId]) detectedTechs[tabId] = { detections: [], versions: {}, metrics: {} };
  const d = detectedTechs[tabId];

  if (!d.detections.some(t => t.name === tech.name)) {
    d.detections.push({ name: tech.name, category: tech.category, method });
    chrome.storage.local.set({ [tabId]: d });
    updateBadge(tabId);
    if (d.url) saveHistory(d.url, d.detections);
  }
}

// SECURITY LOGIC
function checkSecurity(name, version) {
  if (!cveDB || !cveDB[name] || !version) return null;
  const issues = [];
  cveDB[name].forEach(vuln => {
    if (isVersionInRange(version, vuln.min, vuln.max)) issues.push(vuln);
  });
  return issues.length > 0 ? issues : null;
}

function isVersionInRange(version, min, max) {
  try {
    const v = parseVersion(version);
    const mn = parseVersion(min);
    const mx = parseVersion(max);
    return compare(v, mn) >= 0 && compare(v, mx) <= 0;
  } catch (e) { return false; }
}

function parseVersion(v) {
  if (!v) return [0, 0, 0];
  return v.split('.').map(x => parseInt(x) || 0);
}

function compare(v1, v2) {
  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const p1 = v1[i] || 0, p2 = v2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

// Time Machine
function saveHistory(url, detections) {
  try {
    const hostname = new URL(url).hostname;
    const timestamp = new Date().toISOString();
    chrome.storage.local.get([hostname], (result) => {
      const history = result[hostname] || [];
      const currentSig = JSON.stringify(detections.map(d => d.name).sort());
      const lastEntry = history[history.length - 1];
      const lastSig = lastEntry ? JSON.stringify(lastEntry.detections.map(d => d.name).sort()) : null;

      if (currentSig !== lastSig) {
        history.push({ timestamp, detections });
        if (history.length > 10) history.shift();
        chrome.storage.local.set({ [hostname]: history });
      }
    });
  } catch (e) { console.error("History save failed", e); }
}

function generateCritique(detections) {
  const techs = detections.map(d => d.name.toLowerCase());
  let issues = [];
  if (techs.includes('react') && techs.includes('jquery')) issues.push("Mixing Virtual DOM (React) with jQuery causes performance issues.");
  if (techs.includes('angular') && techs.includes('react')) issues.push("Two heavy frameworks detected (Angular + React). Consider standardizing.");
  if (techs.includes('next.js')) issues.push("Excellent SEO architecture (Server-Side Rendering).");
  else if (techs.includes('react')) issues.push("Client-side React detected. Ensure SEO is handled.");

  return issues.length ? "Analysis: " + issues.join(" ") : "Stack appears consistent. No major architectural conflicts.";
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'DETECTIONS' && sender.tab) {
    const tabId = sender.tab.id;
    const tabUrl = sender.tab.url;
    if (tabUrl && !tabUrl.startsWith('chrome')) saveHistory(tabUrl, msg.detections);

    msg.detections.forEach(d => {
      const tech = rules.find(t => t.name === d.name);
      if (tech) addDetection(tabId, tech, d.method);
    });
    updateBadge(tabId);
  }

  if (msg.type === 'VERSIONS_UPDATE' && sender.tab) {
    const tabId = sender.tab.id;
    const d = detectedTechs[tabId];
    if (d) {
      d.versions = { ...d.versions, ...msg.versions };
      chrome.storage.local.set({ [tabId]: d });
    }
  }

  if (msg.type === 'GET_DETECTIONS') {
    const tabId = msg.tabId;
    const data = detectedTechs[tabId];
    if (data) {
      // Attach security info dynamically
      const secureDetections = data.detections.map(d => {
        const ver = data.versions[d.name];
        const vulns = checkSecurity(d.name, ver);
        return { ...d, vulnerabilities: vulns };
      });
      sendResponse({ ...data, detections: secureDetections });
    } else {
      sendResponse({ detections: [], versions: {} });
    }
    return true;
  }

  if (msg.type === 'GET_CRITIQUE') {
    const data = detectedTechs[msg.tabId];
    sendResponse({ critique: data ? generateCritique(data.detections) : "No data." });
    return true;
  }

  if (msg.type === 'GET_HISTORY') {
    chrome.storage.local.get(msg.hostname, (res) => sendResponse(res[msg.hostname] || []));
    return true;
  }
});
