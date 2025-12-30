"use client";

import React, { useState, useEffect } from 'react';

export default function HeroInterface() {
    const [isScanning, setIsScanning] = useState(false);
    const [scanState, setScanState] = useState('idle'); // idle, scanning, result
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const startScan = () => {
        if (scanState === 'scanning') return;

        setIsScanning(true);
        setScanState('scanning');

        // Simulate scan steps
        setTimeout(() => {
            setScanState('result');
            setIsScanning(false);
        }, 2000);
    };

    // Hydration Fix: Prevent mismatch by only rendering on client
    if (!mounted) return <div className="interface-placeholder" style={{ height: '400px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }} />;

    return (
        <div className="interface-wrapper" onClick={startScan}>
            <div className={`interface-card ${isScanning ? 'scanning-mode' : ''}`}>

                {/* Scan Overlay */}
                {isScanning && (
                    <div className="scan-line"></div>
                )}

                {/* Header */}
                <div className="interface-header">
                    <div className="window-controls">
                        <span className="dot red"></span>
                        <span className="dot yellow"></span>
                        <span className="dot green"></span>
                    </div>
                    <div className="browser-bar">
                        {scanState === 'idle' ? 'react.dev' : 'vulnerable-site.com'}
                    </div>
                </div>

                {/* Content */}
                <div className="interface-body">
                    <div className="app-header">
                        <div className="app-logo">SR</div>
                        <div className="app-title">{isScanning ? 'Scanning Target...' : 'StackRipper'}</div>
                    </div>

                    <div className="stack-list">
                        {scanState === 'idle' && (
                            <>
                                <StackItem name="React" type="Frontend" version="18.2.0" color="var(--primary-peach)" />
                                <StackItem name="Next.js" type="Framework" version="14.0.0" color="#aaa" />
                                <StackItem name="Tailwind" type="Styling" version="3.3.0" color="#38bdf8" />
                                <div className="cta-hint">👆 Click to Run Live Scan</div>
                            </>
                        )}

                        {scanState === 'scanning' && (
                            <div className="scanning-placeholder">
                                <div className="scan-text">Analyzing DOM Tree...</div>
                                <div className="scan-text">Checking CVE Database...</div>
                                <div className="scan-text">Profiling Render Performance...</div>
                            </div>
                        )}

                        {scanState === 'result' && (
                            <>
                                <StackItem name="React" type="Frontend" version="16.8.0" color="#e11d48" warning="CVE-2024-XXXX" />
                                <StackItem name="jQuery" type="Legacy" version="2.1.0" color="#eab308" warning="Deprecated" />
                                <div className="security-alert">
                                    <span className="alert-icon">⚠️</span>
                                    <div className="alert-content">
                                        <strong>Critical Vulnerability Found</strong>
                                        <p>React 16.8 contains known XSS vectors. Upgrade immediately.</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="summary-footer">
                        <div className="count-badge">
                            {scanState === 'result' ? '2 Issues Found' : '4 Techs Detected'}
                        </div>
                        <button className="export-btn">
                            {scanState === 'result' ? 'Download Security Report' : 'Export Report'}
                        </button>
                    </div>
                </div>
            </div>

            <div className={`ambient-glow ${scanState === 'result' ? 'alert-glow' : ''}`}></div>
        </div>
    );
}

function StackItem({ name, type, version, color, warning }) {
    return (
        <div className={`stack-item ${warning ? 'warning-item' : ''}`}>
            <div className="stack-info-group">
                <div className="stack-info">
                    <span className="stack-name" style={{ color: color === '#aaa' ? 'var(--text-main)' : color }}>{name}</span>
                    <span className="stack-type">{type}</span>
                </div>
            </div>
            <div className="stack-right">
                {warning && <span className="warning-badge">{warning}</span>}
                <div className="stack-version">{version}</div>
            </div>
        </div>
    );
}
