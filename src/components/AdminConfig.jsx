import React, { useState, useEffect } from 'react';
import { db } from '../supabaseClient';
import { getFullInitialData } from '../helpers/mockData';
import { Database, Copy, Check, RefreshCw, AlertTriangle, Key, ShieldAlert } from 'lucide-react';

export default function AdminConfig({ onDbReset, currentMode, onModeChange }) {
  const [copiedText, setCopiedText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [isKeySaved, setIsKeySaved] = useState(false);
  
  const isConfigured = db.isConfigured();

  // Load API Key from local storage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('shehr_ai_gemini_api_key') || '';
    setGeminiKey(savedKey);
    if (savedKey) setIsKeySaved(true);
  }, []);

  const handleSaveKey = (e) => {
    e.preventDefault();
    localStorage.setItem('shehr_ai_gemini_api_key', geminiKey.trim());
    setIsKeySaved(true);
    alert('Gemini API key saved to LocalStorage successfully!');
  };

  const handleClearKey = () => {
    localStorage.removeItem('shehr_ai_gemini_api_key');
    setGeminiKey('');
    setIsKeySaved(false);
    alert('Gemini API key cleared.');
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const initialData = getFullInitialData();
      db.seedSandboxData(initialData);
      // Wait a moment for visual feedback
      await new Promise(r => setTimeout(r, 600));
      onDbReset();
      alert("Demo Sandbox database has been successfully re-seeded!");
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  const sqlSchema = `create table union_councils (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  center_lat float not null,
  center_lng float not null
);

create table claimed_collections (
  id uuid primary key default gen_random_uuid(),
  union_council_id uuid references union_councils(id),
  gov_photo_url text,
  claimed_lat float not null,
  claimed_lng float not null,
  claimed_date date not null,
  source text default 'suthra_punjab_mock'
);

create table disputes (
  id uuid primary key default gen_random_uuid(),
  claimed_collection_id uuid references claimed_collections(id),
  union_council_id uuid references union_councils(id),
  citizen_photo_url text,
  report_lat float not null,
  report_lng float not null,
  exif_lat float,
  exif_lng float,
  is_duplicate boolean default false,
  is_gps_mismatch boolean default false,
  ai_verdict text, -- 'VALID DISPUTE' | 'REJECTED DISPUTE'
  ai_reasoning text,
  created_at timestamp default now()
);

create table trust_scores (
  union_council_id uuid primary key references union_councils(id),
  score float default 100,
  is_repeat_offender boolean default false,
  updated_at timestamp default now()
);`;

  const sqlSeeding = `-- Seed Union Councils
insert into union_councils (id, name, center_lat, center_lng) values
('e4b3e8e2-04e8-466d-85f0-6a5814bfb2a5', 'Johar Town Block G', 31.4697, 74.2800),
('3f6b9bb7-4b53-43ef-bf64-3be865b25ad7', 'DHA Phase 5', 31.4621, 74.4087),
('b1be6b5a-35ff-4ab5-bc09-4d691bc13e8b', 'Model Town', 31.4855, 74.3262),
('6f9c464c-35df-4d51-a20c-c603b573e351', 'Gulberg III', 31.5102, 74.3441)
on conflict (id) do nothing;

-- Seed Claimed Collections with Gov Proof Photos
insert into claimed_collections (id, union_council_id, gov_photo_url, claimed_lat, claimed_lng, claimed_date, source) values
('c-johar-1', 'e4b3e8e2-04e8-466d-85f0-6a5814bfb2a5', 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=800&q=80', 31.4699, 74.2798, current_date, 'suthra_punjab_mock'),
('c-johar-2', 'e4b3e8e2-04e8-466d-85f0-6a5814bfb2a5', 'https://images.unsplash.com/photo-1506974210756-8e1b8985d348?auto=format&fit=crop&w=800&q=80', 31.4690, 74.2812, current_date - 1, 'suthra_punjab_mock'),
('c-johar-3', 'e4b3e8e2-04e8-466d-85f0-6a5814bfb2a5', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80', 31.4705, 74.2805, current_date - 2, 'suthra_punjab_mock'),
('c-johar-4', 'e4b3e8e2-04e8-466d-85f0-6a5814bfb2a5', 'https://images.unsplash.com/photo-1549417229-aa67d3263c09?auto=format&fit=crop&w=800&q=80', 31.4688, 74.2790, current_date - 3, 'suthra_punjab_mock'),
('c-dha-1', '3f6b9bb7-4b53-43ef-bf64-3be865b25ad7', 'https://images.unsplash.com/photo-1506974210756-8e1b8985d348?auto=format&fit=crop&w=800&q=80', 31.4625, 74.4080, current_date, 'suthra_punjab_mock'),
('c-dha-2', '3f6b9bb7-4b53-43ef-bf64-3be865b25ad7', 'https://images.unsplash.com/photo-1549417229-aa67d3263c09?auto=format&fit=crop&w=800&q=80', 31.4615, 74.4095, current_date - 1, 'suthra_punjab_mock'),
('c-dha-3', '3f6b9bb7-4b53-43ef-bf64-3be865b25ad7', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80', 31.4630, 74.4085, current_date - 2, 'suthra_punjab_mock'),
('c-model-1', 'b1be6b5a-35ff-4ab5-bc09-4d691bc13e8b', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80', 31.4860, 74.3255, current_date, 'suthra_punjab_mock'),
('c-model-2', 'b1be6b5a-35ff-4ab5-bc09-4d691bc13e8b', 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=800&q=80', 31.4850, 74.3270, current_date - 1, 'suthra_punjab_mock'),
('c-gulberg-1', '6f9c464c-35df-4d51-a20c-c603b573e351', 'https://images.unsplash.com/photo-1549417229-aa67d3263c09?auto=format&fit=crop&w=800&q=80', 31.5105, 74.3435, current_date, 'suthra_punjab_mock'),
('c-gulberg-2', '6f9c464c-35df-4d51-a20c-c603b573e351', 'https://images.unsplash.com/photo-1506974210756-8e1b8985d348?auto=format&fit=crop&w=800&q=80', 31.5098, 74.3448, current_date - 1, 'suthra_punjab_mock')
on conflict (id) do nothing;

-- Seed Disputes
insert into disputes (id, claimed_collection_id, union_council_id, citizen_photo_url, report_lat, report_lng, exif_lat, exif_lng, is_duplicate, is_gps_mismatch, ai_verdict, ai_reasoning, created_at) values
('r-johar-1', 'c-johar-2', 'e4b3e8e2-04e8-466d-85f0-6a5814bfb2a5', 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80', 31.4691, 74.2810, 31.4691, 74.2810, false, false, 'VALID DISPUTE', 'Image B shows multiple green trash bags and scattered plastic cups piled on the pavement, which are not present in the clean government photo. The dispute is verified as valid.', now() - interval '1 day'),
('r-model-1', 'c-model-2', 'b1be6b5a-35ff-4ab5-bc09-4d691bc13e8b', 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80', 31.4852, 74.3268, 31.4853, 74.3269, false, false, 'VALID DISPUTE', 'Image B clearly shows a pile of loose cardboard, packaging waste, and leaves near the wall that was absent in Image A. The dispute is verified as valid.', now() - interval '18 hours'),
('r-gulberg-1', 'c-gulberg-1', '6f9c464c-35df-4d51-a20c-c603b573e351', 'https://images.unsplash.com/photo-1605600611283-c48c6f66dd36?auto=format&fit=crop&w=800&q=80', 31.5107, 74.3433, null, null, false, false, 'VALID DISPUTE', 'Image B contains multiple pieces of litter and discarded waste scattered across the walkway, indicating incomplete collection compared to Image A. The dispute is valid.', now() - interval '4 hours'),
('r-gulberg-2', 'c-gulberg-2', '6f9c464c-35df-4d51-a20c-c603b573e351', 'https://images.unsplash.com/photo-1574974265409-508c96f01c1b?auto=format&fit=crop&w=800&q=80', 31.5097, 74.3450, 31.5096, 74.3451, false, false, 'VALID DISPUTE', 'Image B clearly shows black garbage bags piled against the wall on the side of the road, contradicting the clean photo in Image A. The dispute is valid.', now() - interval '20 hours')
on conflict (id) do nothing;

-- Seed Trust Scores (Johar: 75%, DHA: 100%, Model: 50%, Gulberg: 0% + Repeat Offender)
insert into trust_scores (union_council_id, score, is_repeat_offender, updated_at) values
('e4b3e8e2-04e8-466d-85f0-6a5814bfb2a5', 75.0, false, now()),
('3f6b9bb7-4b53-43ef-bf64-3be865b25ad7', 100.0, false, now()),
('b1be6b5a-35ff-4ab5-bc09-4d691bc13e8b', 50.0, false, now()),
('6f9c464c-35df-4d51-a20c-c603b573e351', 0.0, true, now())
on conflict (union_council_id) do update set score = excluded.score, is_repeat_offender = excluded.is_repeat_offender, updated_at = now();`;

  // Get active Gemini source
  const getGeminiSource = () => {
    if (import.meta.env.VITE_GEMINI_API_KEY) {
      return 'Environment variables (.env.local)';
    }
    if (localStorage.getItem('shehr_ai_gemini_api_key')) {
      return 'LocalStorage Config';
    }
    return 'Not Configured (Using Demo Fallbacks)';
  };

  return (
    <div className="admin-config">
      {/* 1. Gemini API Key configuration card */}
      <div className="admin-card text-left">
        <h2 className="section-title">
          <Key className="inline-icon color-primary" /> Gemini AI Arbitrator Setup
        </h2>
        <p className="admin-desc">
          Shehr AI utilizes Google Gemini 3.5 Flash to automatically arbitrate disputes between government collection claims and citizen photographs.
        </p>

        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">Active Gemini Key:</span>
            <span className={`status-badge ${getGeminiSource() !== 'Not Configured (Using Demo Fallbacks)' ? 'success' : 'info'}`}>
              {getGeminiSource()}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveKey} className="gemini-key-form mt-20">
          <div className="form-group">
            <label className="form-label" htmlFor="gemini-key">Enter Google AI Studio Gemini API Key:</label>
            <div className="flex-row">
              <input
                id="gemini-key"
                type="password"
                className="form-input flex-grow"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary ml-10">Save Key</button>
              {isKeySaved && (
                <button type="button" onClick={handleClearKey} className="btn btn-secondary ml-10">Clear</button>
              )}
            </div>
          </div>
        </form>

        {!import.meta.env.VITE_GEMINI_API_KEY && !isKeySaved && (
          <div className="alert alert-info flex-row mt-15">
            <AlertTriangle className="alert-icon" />
            <div>
              <strong>Demo Safety Net Mode:</strong> If no key is configured, the system automatically uses pre-tested cached verdicts matching the demo cases (Johar Town, DHA, Model Town). This keeps the presentation completely stable!
            </div>
          </div>
        )}
      </div>

      <div className="admin-card text-left mt-20">
        <h2 className="section-title">
          <Database className="inline-icon color-primary" /> Database Connections
        </h2>
        <p className="admin-desc">
          Shehr AI runs in a dual-mode environment. You can test locally using our built-in Sandbox (localStorage) or connect to your own live Supabase PostgreSQL backend.
        </p>

        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">Supabase Config (.env.local):</span>
            {isConfigured ? (
              <span className="status-badge success">Configured</span>
            ) : (
              <span className="status-badge warning">Not Detected</span>
            )}
          </div>
          <div className="status-item">
            <span className="status-label">Active Engine:</span>
            <span className={`status-badge ${currentMode === 'supabase' ? 'success' : 'info'}`}>
              {currentMode === 'supabase' ? 'Live Supabase DB' : 'Demo Sandbox (Local)'}
            </span>
          </div>
        </div>

        {!isConfigured && (
          <div className="alert alert-info flex-row">
            <AlertTriangle className="alert-icon" />
            <div>
              <strong>Pro-Tip:</strong> To test with a live database, create a <code>.env.local</code> file in the project root containing:
              <pre className="inline-pre">VITE_SUPABASE_URL=your_url{"\n"}VITE_SUPABASE_ANON_KEY=your_anon_key</pre>
              and make sure your storage bucket is set to public and named <code>disputes</code>.
            </div>
          </div>
        )}

        {isConfigured && (
          <div className="mode-toggle-section">
            <span className="mode-toggle-label">Switch Environment:</span>
            <button
              onClick={() => onModeChange('sandbox')}
              className={`mode-btn ${currentMode === 'sandbox' ? 'active' : ''}`}
            >
              Demo Sandbox
            </button>
            <button
              onClick={() => onModeChange('supabase')}
              className={`mode-btn ${currentMode === 'supabase' ? 'active' : ''}`}
            >
              Live Supabase
            </button>
          </div>
        )}

        {currentMode === 'sandbox' && (
          <div className="reset-action">
            <h3>Sandbox Controls</h3>
            <p className="sub-text">Reset the local storage state to retrieve the pristine hackathon seed data (4 Union Councils, 11 claims, 4 verified disputes).</p>
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="btn btn-secondary flex-center"
            >
              <RefreshCw className={`btn-icon ${isResetting ? 'spin' : ''}`} />
              {isResetting ? 'Resetting and Re-seeding...' : 'Reset & Seed Local Sandbox'}
            </button>
          </div>
        )}
      </div>

      <div className="admin-card text-left mt-20">
        <h2 className="section-title">Supabase SQL Editor Setup</h2>
        <p className="admin-desc">
          To run live Supabase mode, execute these SQL statements in your Supabase SQL Editor. Also create a <strong>Public Storage Bucket</strong> named <code>disputes</code>.
        </p>

        <div className="sql-box">
          <div className="sql-header">
            <span>1. Create Tables Schema</span>
            <button
              onClick={() => handleCopy(sqlSchema, 'schema')}
              className="copy-btn flex-center"
            >
              {copiedText === 'schema' ? (
                <>
                  <Check className="copy-icon text-success" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="copy-icon" /> Copy SQL
                </>
              )}
            </button>
          </div>
          <pre className="sql-code"><code>{sqlSchema}</code></pre>
        </div>

        <div className="sql-box mt-20">
          <div className="sql-header">
            <span>2. Seed Authentic Lahore Data</span>
            <button
              onClick={() => handleCopy(sqlSeeding, 'seed')}
              className="copy-btn flex-center"
            >
              {copiedText === 'seed' ? (
                <>
                  <Check className="copy-icon text-success" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="copy-icon" /> Copy SQL
                </>
              )}
            </button>
          </div>
          <pre className="sql-code"><code>{sqlSeeding}</code></pre>
        </div>
      </div>
    </div>
  );
}
