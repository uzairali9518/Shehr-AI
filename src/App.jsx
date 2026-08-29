import React, { useState, useEffect, useMemo } from 'react';
import { db } from './supabaseClient';
import { getFullInitialData } from './helpers/mockData';
import Dashboard from './components/Dashboard';
import ReportForm from './components/ReportForm';
import DisputeLogs from './components/DisputeLogs';
import GovAdmin from './components/GovAdmin';
import AdminConfig from './components/AdminConfig';
import { LayoutDashboard, AlertTriangle, ScrollText, Sliders, Building, Loader, Menu, X } from 'lucide-react';
import './App.css';

const TAB_KEYS = {
  DASHBOARD: 'dashboard',
  GOV: 'gov',
  REPORT: 'report',
  LOGS: 'logs',
  ADMIN: 'admin',
};

const VALID_TABS = new Set(Object.values(TAB_KEYS));

const normalizeTab = (value) => {
  return VALID_TABS.has(value) ? value : TAB_KEYS.DASHBOARD;
};

export default function App() {
  const [activeTab, setActiveTab] = useState(TAB_KEYS.DASHBOARD);
  const [unionCouncils, setUnionCouncils] = useState([]);
  const [claimedCollections, setClaimedCollections] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [trustScores, setTrustScores] = useState([]);
  const [dbMode, setDbMode] = useState(db.getMode());
  const [isLoading, setIsLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Initialize and load data
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. If Sandbox Mode and not yet seeded, seed it
      if (db.getMode() === 'sandbox' && !db.isSeeded()) {
        const seed = getFullInitialData();
        db.seedSandboxData(seed);
      }

      // 2. Fetch all collections
      const ucs = await db.getUnionCouncils();
      const claims = await db.getClaimedCollections();
      const reps = await db.getDisputes();
      const scores = await db.getTrustScores();

      // Sort disputes by creation time (most recent first)
      reps.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setUnionCouncils(ucs);
      setClaimedCollections(claims);
      setDisputes(reps);
      setTrustScores(scores);
    } catch (e) {
      console.error("Failed to fetch database tables:", e);
      alert(`Database Read Error: ${e.message || e}. Check console.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dbMode]);

  // Handle environment engine change
  const handleModeChange = (mode) => {
    const success = db.setMode(mode);
    if (success) {
      setDbMode(mode);
    }
  };

  const handleReset = () => {
    loadData();
  };

  const handleTabChange = (tab) => {
    const safeTab = normalizeTab(tab);
    setActiveTab(safeTab);
    setMobileNavOpen(false);
  };

  const normalizedTab = useMemo(() => normalizeTab(activeTab), [activeTab]);

  const renderActiveTab = () => {
    switch (normalizedTab) {
      case TAB_KEYS.DASHBOARD:
        return (
          <Dashboard
            unionCouncils={unionCouncils}
            claimedCollections={claimedCollections}
            reports={disputes}
            trustScores={trustScores}
          />
        );
      case TAB_KEYS.GOV:
        return (
          <GovAdmin
            unionCouncils={unionCouncils}
            onClaimSubmitted={loadData}
          />
        );
      case TAB_KEYS.REPORT:
        return (
          <ReportForm
            unionCouncils={unionCouncils}
            claimedCollections={claimedCollections}
            reports={disputes}
            onReportSubmitted={loadData}
          />
        );
      case TAB_KEYS.LOGS:
        return (
          <DisputeLogs
            reports={disputes}
            unionCouncils={unionCouncils}
            claimedCollections={claimedCollections}
          />
        );
      case TAB_KEYS.ADMIN:
        return (
          <AdminConfig
            onDbReset={handleReset}
            currentMode={dbMode}
            onModeChange={handleModeChange}
          />
        );
      default:
        return (
          <Dashboard
            unionCouncils={unionCouncils}
            claimedCollections={claimedCollections}
            reports={disputes}
            trustScores={trustScores}
          />
        );
    }
  };

  return (
    <div className="shehr-ai-app">
      {/* Header Panel */}
      <header className="main-header flex-between flex-wrap">
        <div className="brand-group text-left">
          <div className="flex-row">
            <span className="logo-icon">🏙️</span>
            <div>
              <h1 className="header-title">Shehr AI</h1>
              <p className="header-subtitle">Lahore Clean City Last-Mile Verification Index</p>
            </div>
          </div>
        </div>

        <div className="header-right-row flex-row">
          <div className="header-meta flex-row">
            <span className="hackathon-tag font-sm">
              🏆 Code for Pakistan Smart City Hackathon 2026
            </span>
            <div className={`mode-indicator ${dbMode}`}>
              <span className="indicator-dot"></span>
              {dbMode === 'supabase' ? 'Supabase Live' : 'Demo Sandbox'}
            </div>
          </div>

          {/* Mobile Nav Toggle */}
          <button
            className="mobile-nav-toggle"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}
          >
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <nav className={`tab-navigation flex-row ${mobileNavOpen ? 'mobile-open' : ''}`}>
        <button
          className={`nav-tab flex-center ${activeTab === TAB_KEYS.DASHBOARD ? 'active' : ''}`}
          onClick={() => handleTabChange(TAB_KEYS.DASHBOARD)}
        >
          <LayoutDashboard size={18} className="tab-icon" />
          <span>UC Standings</span>
        </button>

        <button
          className={`nav-tab flex-center ${activeTab === TAB_KEYS.GOV ? 'active' : ''}`}
          onClick={() => handleTabChange(TAB_KEYS.GOV)}
        >
          <Building size={18} className="tab-icon" />
          <span>Gov Portal</span>
        </button>

        <button
          className={`nav-tab flex-center ${activeTab === TAB_KEYS.REPORT ? 'active' : ''}`}
          onClick={() => handleTabChange(TAB_KEYS.REPORT)}
        >
          <AlertTriangle size={18} className="tab-icon" />
          <span>File Dispute</span>
        </button>

        <button
          className={`nav-tab flex-center ${activeTab === TAB_KEYS.LOGS ? 'active' : ''}`}
          onClick={() => handleTabChange(TAB_KEYS.LOGS)}
        >
          <ScrollText size={18} className="tab-icon" />
          <span>Verification Logs</span>
        </button>

        <button
          className={`nav-tab flex-center ${activeTab === TAB_KEYS.ADMIN ? 'active' : ''}`}
          onClick={() => handleTabChange(TAB_KEYS.ADMIN)}
        >
          <Sliders size={18} className="tab-icon" />
          <span>Setup Config</span>
        </button>
      </nav>

      {/* Main Content Layout */}
      <main className="app-content-container flex-grow">
        {isLoading ? (
          <div className="global-loader flex-col mt-50">
            <Loader className="spin size-40 color-primary" />
            <p className="mt-20 text-muted font-lg">Syncing local audit nodes...</p>
          </div>
        ) : (
          <div className="tab-panel-container" key={normalizedTab}>
            {renderActiveTab()}
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="main-footer mt-40">
        <div className="ticks"></div>
        <div className="footer-content flex-between flex-wrap mt-20">
          <p className="footer-text font-sm text-left">
            <strong>Shehr AI</strong> - Built under the Clean City theme, Problem Statement 1: "Verifying Waste Collection Claims at the Last Mile."
          </p>
          <p className="footer-copyright font-sm text-right">
            © 2026 Smart City Lahore Hackathon.
          </p>
        </div>
      </footer>
    </div>
  );
}
