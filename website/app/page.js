import HeroInterface from "../components/HeroInterface";
import ThemeToggle from "../components/ThemeToggle";

export default function Home() {
  return (
    <div id="app">
      <nav className="glass-nav">
        <div className="nav-content">
          <div className="logo-area">
            <img src="/logo.png" alt="StackRipper Logo" className="nav-logo" />
            <span className="logo-text">StackRipper</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <ThemeToggle />
            <a href="/StackRipper_v3.0_Stable.zip" className="btn-primary">Download Zip</a>
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-content">
          <div className="badge">V3.0 "REAL INTEL" RELEASE</div>
          <h1>The Intelligence Layer for <span>Modern Developers</span></h1>
          <p className="hero-subtitle">Rip through technology stacks, analyze architectures, and profile performance with a single click. No mocks, just real engineering data.</p>
          <div className="hero-actions">
            <a href="/StackRipper_v3.0_Stable.zip" className="btn-primary-lg">Download Stable v3.0</a>
            <a href="#install" className="btn-secondary-lg">How to Install</a>
          </div>
        </div>
        <div className="hero-visual">
          <div className="mockup-container">
            <HeroInterface />
          </div>
        </div>
      </header>

      <div className="logo-strip">
        <div className="strip-content">
          <span>PROFILING:</span>
          <span className="tech-tag">Next.js</span>
          <span className="tech-tag">React</span>
          <span className="tech-tag">Tailwind</span>
          <span className="tech-tag">Vite</span>
          <span className="tech-tag">Svelte</span>
          <span className="tech-tag">Node.js</span>
        </div>
      </div>

      <section id="features" className="features">
        <div className="section-header">
          <div className="section-badge">POWERS</div>
          <h2>Built for <span>Architects</span></h2>
          <p>Go beyond simple detection. Deep profile every site you visit with high-fidelity accuracy.</p>
        </div>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="icon-blob">🧠</div>
            <h3>AI Architect</h3>
            <p>Get architectural critiques based on live technology stacks using Gemini Flash. Your personal technical consultant.</p>
          </div>
          <div className="feature-card">
            <div className="icon-blob">🕒</div>
            <h3>Time Machine</h3>
            <p>Track how your competitors' stacks evolve over time with local history logging. Stay ahead of the curve.</p>
          </div>
          <div className="feature-card">
            <div className="icon-blob">🏗️</div>
            <h3>Component Inspector</h3>
            <p>Right-click any element to identify the specific library or component behind it. Reverse engineer with ease.</p>
          </div>
          <div className="feature-card">
            <div className="icon-blob">🛡️</div>
            <h3>Security Audit</h3>
            <p>Instant vulnerability checks against known CVE databases for all detected versions. Ship secure code.</p>
          </div>
        </div>
      </section>

      <section id="install" className="install-section">
        <div className="install-container">
          <div className="install-card">
            <div className="card-glow"></div>
            <h2>Ready to upgrade your <span>workflow?</span></h2>
            <div className="install-steps">
              <div className="step">
                <span className="step-num">01</span>
                <h4>Download</h4>
                <p>Grab the <strong>StackRipper ZIP</strong> package directly from the link above.</p>
              </div>
              <div className="step">
                <span className="step-num">02</span>
                <h4>Enable</h4>
                <p>Go to <code>chrome://extensions</code> and toggle <strong>Developer Mode</strong>.</p>
              </div>
              <div className="step">
                <span className="step-num">03</span>
                <h4>Load</h4>
                <p>Select <strong>Load Unpacked</strong> and pick your extracted folder.</p>
              </div>
            </div>
            <a href="/StackRipper_v3.0_Stable.zip" className="btn-primary-xl">Download Extension Package</a>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img src="/logo.png" alt="StackRipper Logo" className="footer-logo" />
            <span>StackRipper</span>
          </div>
          <p>© 2025 StackRipper. All rights reserved. Built with 🍑 for the community.</p>
          <div className="footer-links">
            <a href="https://github.com/Chaitanyahoon/StackRipper">GitHub</a>
            <a href="https://github.com/Chaitanyahoon/StackRipper/issues">Issues</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
