import React, { useState, useEffect, useRef } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { PlayCircle, RefreshCw, LogOut, Settings, Loader2, ChevronDown, Calendar, UploadCloud } from 'lucide-react';
import { extractDataFromImage } from './api/gemini';

import WeeklyComparisonTable from './components/WeeklyComparisonTable';
import AnalysisPanel from './components/AnalysisPanel';
import VisualGraphs from './components/VisualGraphs';
import GlobalOverview from './components/GlobalOverview';
import TrafficSources from './components/TrafficSources';
import ChannelGoals from './components/ChannelGoals';
import { useYouTubeData } from './hooks/useYouTubeData';
import { metricsData as mockData } from './data/spreadsheetMock';
import { getWeeklyDateRanges } from './api/youtube';
import { getCurrentWeeks, mergeNewWeekData, getProfileStorageKey, getActiveProfile, setActiveProfile } from './utils/weekUtils';

const DashboardContent = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [accessToken, setAccessToken] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualId, setManualId] = useState('');
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualDateRanges, setManualDateRanges] = useState(() => {
    const saved = localStorage.getItem(getProfileStorageKey('yt_dashboard_dates'));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && ('present' in parsed || 'w-1' in parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse saved dates", e);
      }
    }
    return null;
  });
  const [editingWeek, setEditingWeek] = useState(null);
  const [tempRange, setTempRange] = useState({ startDate: '', endDate: '' });
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedTrafficSources, setExtractedTrafficSources] = useState(() => {
    const saved = localStorage.getItem(getProfileStorageKey('yt_dashboard_traffic_sources'));
    return saved ? JSON.parse(saved) : null;
  });
  const [extractedGoals, setExtractedGoals] = useState(() => {
    const saved = localStorage.getItem(getProfileStorageKey('yt_dashboard_goals'));
    return saved ? JSON.parse(saved) : null;
  });
  const fileInputRef = useRef(null);
  
  // Custom hook handles API fetching and mapping
  const { data, setData, loading, error, channelInfo, channels, selectedChannelId, setSelectedChannelId } = useYouTubeData(accessToken, customEndDate, manualDateRanges);
  
  // Unified data state from the custom hook
  const displayData = data;
  const setDisplayData = setData;

  // Local storage persistence effects for extracted data
  useEffect(() => {
    if (extractedTrafficSources) {
      localStorage.setItem(getProfileStorageKey('yt_dashboard_traffic_sources'), JSON.stringify(extractedTrafficSources));
    }
  }, [extractedTrafficSources]);

  useEffect(() => {
    if (extractedGoals) {
      localStorage.setItem(getProfileStorageKey('yt_dashboard_goals'), JSON.stringify(extractedGoals));
    }
  }, [extractedGoals]);

  useEffect(() => {
    if (manualDateRanges) {
      localStorage.setItem(getProfileStorageKey('yt_dashboard_dates'), JSON.stringify(manualDateRanges));
    }
  }, [manualDateRanges]);


  
  // If we have an access token but data is null, it means we are truly loading the first time
  const isActuallyLoading = loading || (accessToken && !data);

  const login = useGoogleLogin({
    onSuccess: tokenResponse => {
      console.log('Login Success:', tokenResponse);
      setAccessToken(tokenResponse.access_token);
    },
    onError: error => console.error('Login Failed:', error),
    scope: 'https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/youtube.readonly',
    prompt: 'consent' // Forces the permission screen to show up
  });

  const handleLogout = () => {
    setAccessToken(null);
  };

  const handleAddManualChannel = async () => {
    if (!manualId.trim()) return;
    setManualId('');
    setShowManualInput(false);
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    try {
      setIsExtracting(true);
      
      const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve({ base64Data: reader.result, mimeType: file.type });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Read all files
      const fileDatas = await Promise.all(files.map(readFileAsDataURL));
      
      // Send them to Gemini concurrently
      const extractionPromises = fileDatas.map(fd => extractDataFromImage(fd.base64Data, fd.mimeType));
      const results = await Promise.all(extractionPromises);
      
      let updatedData = JSON.parse(JSON.stringify(displayData));
      let trafficSourcesToSet = extractedTrafficSources;
      let goalsToSet = extractedGoals;
      
      // Process each result based on its type
      results.forEach(extractedData => {
        if (!extractedData) return;
        
        if (extractedData.type === 'traffic_sources') {
          trafficSourcesToSet = extractedData.data;
          
          // Map extracted traffic sources to the 'present' week in the main data table
          extractedData.data.forEach(source => {
            const name = source.name.toLowerCase();
            let prefix = '';
            let category = 'Traffic Source';
            
            if (name.includes('browse')) prefix = 'ts_browse';
            else if (name.includes('search')) prefix = 'ts_yt_search';
            else if (name.includes('suggested')) prefix = 'ts_suggested';
            else if (name.includes('external')) prefix = 'ts_external';
            else if (name.includes('shorts')) {
              prefix = 'shorts';
              category = 'Shorts Feed';
            }
            
            if (prefix) {
              const cat = updatedData.find(c => c.category === category);
              if (cat) {
                const apvMetric = cat.metrics.find(m => m.id === `${prefix}_apv`);
                if (apvMetric) apvMetric.values.present = source.apv;
                
                const viewsMetric = cat.metrics.find(m => m.id === `${prefix}_views`);
                if (viewsMetric) viewsMetric.values.present = source.views;
                
                const pctMetric = cat.metrics.find(m => m.id === `${prefix}_views_pct`);
                if (pctMetric) pctMetric.values.present = source.percentage;
              }
            }
          });
        } else if (extractedData.type === 'channel_goals') {
          goalsToSet = { month: extractedData.month, goals: extractedData.goals };
        } else {
          // It's the weekly metrics spreadsheet – merge into rolling 4-week window
          const newMetrics = extractedData.metricsData || (Array.isArray(extractedData) ? extractedData : null);
          if (newMetrics) {
            const newDates = {};
            if (extractedData.dates) {
              for (const [key, value] of Object.entries(extractedData.dates)) {
                newDates[key] = { rawLabel: value, startDate: '', endDate: '' };
              }
            }
            updatedData = mergeNewWeekData(updatedData, newMetrics, newDates);
          }
        }
      });

      // Update states once at the end
      if (trafficSourcesToSet) setExtractedTrafficSources(trafficSourcesToSet);
      if (goalsToSet) setExtractedGoals(goalsToSet);
      setDisplayData(updatedData);

      // Refresh date ranges from localStorage (mergeNewWeekData persists them)
      const savedDates = localStorage.getItem(getProfileStorageKey('yt_dashboard_dates'));
      if (savedDates) setManualDateRanges(JSON.parse(savedDates));
    } catch (err) {
      console.error("Extraction error:", err);
      alert("Failed to extract data: " + err.message);
    } finally {
      setIsExtracting(false);
      // Reset input so the same files can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openDateEditor = (weekId) => {
    console.log('Opening date editor for:', weekId);
    const currentRanges = manualDateRanges || getWeeklyDateRanges(new Date(customEndDate));
    setEditingWeek(weekId);
    setTempRange(currentRanges[weekId]);
  };

  const handleManualAddWeek = () => {
    // 1. Shift week identifiers in weekUtils format
    const oldWeeks = getCurrentWeeks();
    
    // We want to shift everything: 
    // old w-2 becomes new w-3
    // old w-1 becomes new w-2
    // old present becomes new w-1
    // present becomes empty and new
    const weekKeys = ['present', 'w-1', 'w-2', 'w-3'];
    const shiftedWeeks = weekKeys.map((k, i) => {
      if (k === 'present') {
        return { id: 'present', label: 'New Week', subLabel: 'New Week', rawLabel: 'New Week', startDate: '', endDate: '' };
      } else {
        const oldWeek = oldWeeks[i - 1]; // Shifted index (old 'present' is index 0 -> maps to w-1 at index 1)
        return {
          id: k,
          label: oldWeek?.label || '',
          subLabel: oldWeek?.subLabel || '',
          rawLabel: oldWeek?.rawLabel || '',
          startDate: oldWeek?.startDate || '',
          endDate: oldWeek?.endDate || ''
        };
      }
    });

    localStorage.setItem(getProfileStorageKey('yt_dashboard_weeks'), JSON.stringify(shiftedWeeks));

    // 2. Shift data values in displayData
    const updatedData = displayData.map(category => {
      const updatedMetrics = category.metrics.map(metric => {
        const currentVals = weekKeys.map(k => metric.values?.[k]);
        const newValues = {};
        
        weekKeys.forEach((k, i) => {
          if (k === 'present') {
            // New week starts empty
            newValues[k] = '';
          } else {
            // Shift values (old 'present' (index 0) goes to 'w-1' (index 1), etc.)
            newValues[k] = currentVals[i - 1];
          }
        });
        return { ...metric, values: newValues };
      });
      return { ...category, metrics: updatedMetrics };
    });

    setDisplayData(updatedData);

    // 3. Shift date ranges stored in manualDateRanges
    const oldDates = manualDateRanges || {};
    const newDates = {
      'present': { rawLabel: 'New Week', startDate: '', endDate: '' },
      'w-1': oldDates['present'] || { rawLabel: '', startDate: '', endDate: '' },
      'w-2': oldDates['w-1'] || { rawLabel: '', startDate: '', endDate: '' },
      'w-3': oldDates['w-2'] || { rawLabel: '', startDate: '', endDate: '' }
    };
    setManualDateRanges(newDates);
    localStorage.setItem(getProfileStorageKey('yt_dashboard_dates'), JSON.stringify(newDates));
    
    // Automatically trigger date editor for the new week to let user label it
    openDateEditor('present');
  };

  const saveDateRange = () => {
    const currentRanges = manualDateRanges || getWeeklyDateRanges(new Date(customEndDate));
    const newRanges = {
      ...currentRanges,
      [editingWeek]: tempRange
    };
    setManualDateRanges(newRanges);
    setEditingWeek(null);
  };

  return (
    <div className="app-container">
      {/* 403 Forbidden Error Banner - Moved to Top */}
      {error && error.includes('403') && (
        <div style={{ 
          padding: '1.5rem', 
          background: 'rgba(239, 68, 68, 0.1)', 
          color: '#ef4444', 
          borderRadius: '12px', 
          marginBottom: '2rem', 
          fontSize: '1rem', 
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <strong style={{ fontSize: '1.2rem' }}>⚠️ Manager Permission Required</strong>
          </div>
          <p style={{ margin: 0, opacity: 0.9 }}>
            YouTube is blocking the data because you are a <strong>Manager</strong>. To fix this, you MUST enter your <strong>Content Owner ID</strong>.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <button 
              className="btn-primary" 
              style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              onClick={() => setShowManualInput(true)}
            >
              Click Here to Enter ID
            </button>
            <a 
              href="https://support.google.com/youtube/answer/3070554" 
              target="_blank" 
              rel="noreferrer"
              style={{ color: '#ef4444', textDecoration: 'underline', fontSize: '0.9rem' }}
            >
              How do I find my ID?
            </a>
          </div>
        </div>
      )}

      {editingWeek && (
        <div className="manual-id-overlay" style={{ zIndex: 9999 }}>
          <div className="manual-id-modal glass-panel">
             <h3>Edit Dates for {getCurrentWeeks().find(w => w.id === editingWeek)?.label}</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <label style={{ fontSize: '0.875rem' }}>Custom Label (e.g. May 14-20)</label>
               <input 
                 type="text" 
                 className="modal-input" 
                 placeholder="e.g. May 14-20"
                 value={tempRange.rawLabel || ''}
                 onChange={(e) => setTempRange({...tempRange, rawLabel: e.target.value})}
               />
               <label style={{ fontSize: '0.875rem' }}>Start Date</label>
               <input 
                 type="date" 
                 className="modal-input" 
                 value={tempRange.startDate}
                 onChange={(e) => setTempRange({...tempRange, startDate: e.target.value})}
               />
               <label style={{ fontSize: '0.875rem' }}>End Date</label>
               <input 
                 type="date" 
                 className="modal-input" 
                 value={tempRange.endDate}
                 onChange={(e) => setTempRange({...tempRange, endDate: e.target.value})}
               />
             </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setEditingWeek(null)}>Cancel</button>
              <button className="btn-primary" onClick={saveDateRange}>Save Dates</button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="nav-left">
          <div className="logo-container">
            <div className="logo-icon">
              <PlayCircle size={20} />
            </div>
            <span className="logo-text">YT Performance</span>
          </div>

          {/* Profile Switcher */}
          <div className="profile-switcher" style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.25rem 0.5rem', marginLeft: '1rem', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Profile:</span>
            <select
              value={getActiveProfile()}
              onChange={(e) => {
                setActiveProfile(e.target.value);
                window.location.reload();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ariana" style={{ background: '#121214', color: '#fff' }}>Ariana DeMers</option>
              <option value="caribbean" style={{ background: '#121214', color: '#fff' }}>Caribbean Caterers</option>
            </select>
          </div>
          
          {channelInfo && (
            <div className="channel-selector-wrapper">
              <div className="channel-badge">
                <img src={channelInfo.thumbnail} alt={channelInfo.title} className="channel-avatar" />
                <span className="channel-name">{channelInfo.title}</span>
                <span className="live-status-badge">Live</span>
              </div>
              
              {channels.length > 0 && (
                <div className="custom-select-container">
                  <select 
                    className="channel-select-hidden"
                    value={selectedChannelId || ''} 
                    onChange={(e) => {
                      if (e.target.value === 'ADD_NEW') {
                        setShowManualInput(true);
                      } else {
                        setSelectedChannelId(e.target.value);
                      }
                    }}
                  >
                    <optgroup label="Your Channels">
                      {channels.map(ch => (
                        <option key={ch.id} value={ch.id}>{ch.title}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Options">
                      <option value="ADD_NEW">+ Add Channel by ID...</option>
                    </optgroup>
                  </select>
                  <div className="channel-switch-trigger">
                    <ChevronDown size={14} />
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '2rem' }}>
            <button 
              onClick={() => setActiveTab('Overview')}
              className={`btn-secondary ${activeTab === 'Overview' ? 'active-tab' : ''}`}
              style={activeTab === 'Overview' ? { borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)', background: 'rgba(59, 130, 246, 0.1)' } : {}}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('Data')}
              className={`btn-secondary ${activeTab === 'Data' ? 'active-tab' : ''}`}
              style={activeTab === 'Data' ? { borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)', background: 'rgba(59, 130, 246, 0.1)' } : {}}
            >
              Data
            </button>
          </div>

          {showManualInput && (
            <div className="manual-id-overlay" style={{ 
              zIndex: 10000, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '2rem'
            }}>
              <div className="manual-id-modal glass-panel" style={{ 
                maxWidth: '500px', 
                width: '100%', 
                padding: '2rem', 
                border: '2px solid var(--accent-primary)',
                position: 'relative',
                maxHeight: 'calc(100vh - 4rem)',
                overflowY: 'auto',
                margin: 'auto'
              }}>
                <h2 style={{ marginBottom: '1rem', color: '#fff' }}>Add Ariana's Channel</h2>
                <p style={{ color: '#ccc', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  Paste the full link to the YouTube channel below:
                </p>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <input 
                    type="text" 
                    className="modal-input" 
                    placeholder="https://www.youtube.com/channel/..."
                    style={{ width: '100%', padding: '1rem', fontSize: '1rem', background: 'rgba(0,0,0,0.3)' }}
                    value={manualId}
                    onChange={(e) => {
                      let value = e.target.value.trim();
                      const idMatch = value.match(/(UC[a-zA-Z0-9_-]{22})/);
                      if (idMatch) {
                        setManualId(idMatch[1]);
                      } else {
                        setManualId(value);
                      }
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.2)' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Manager Mode (CMS Only)
                  </label>
                  <p style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '0.75rem' }}>
                    If you are a Manager, enter your <strong>Content Owner ID</strong>:
                  </p>
                  <input 
                    type="text" 
                    className="modal-input" 
                    placeholder="Enter Content Owner ID here"
                    style={{ width: '100%', padding: '0.75rem' }}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      if (val) localStorage.setItem(getProfileStorageKey('yt_content_owner_id'), val);
                      else localStorage.removeItem(getProfileStorageKey('yt_content_owner_id'));
                    }}
                  />
                </div>

                <div className="modal-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button className="btn-secondary" style={{ padding: '0.75rem 1.5rem' }} onClick={() => {
                    setManualId('');
                    setShowManualInput(false);
                  }}>Cancel</button>
                  <button className="btn-primary" style={{ padding: '0.75rem 1.5rem' }} onClick={() => {
                    if (manualId.startsWith('UC') || manualId.startsWith('@')) {
                      setSelectedChannelId(manualId);
                      setManualId('');
                      setShowManualInput(false);
                    } else {
                      alert('Please paste the full YouTube link or the Channel ID.');
                    }
                  }}>Add & Select Channel</button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="nav-right">
          {accessToken && (
            <div className="date-selector">
              <input 
                type="date" 
                className="date-input"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          )}
          {!accessToken ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="file" 
                accept="image/*" 
                multiple
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileUpload} 
              />
              <button 
                className="btn-secondary" 
                onClick={() => {
                  if (window.confirm('This will reset all dashboard data and settings. Are you sure?')) {
                    localStorage.removeItem(getProfileStorageKey('yt_dashboard_metrics'));
                    localStorage.removeItem(getProfileStorageKey('yt_dashboard_traffic_sources'));
                    localStorage.removeItem(getProfileStorageKey('yt_dashboard_goals'));
                    localStorage.removeItem(getProfileStorageKey('yt_dashboard_dates'));
                    localStorage.removeItem(getProfileStorageKey('yt_dashboard_weeks'));
                    localStorage.removeItem(getProfileStorageKey('yt_content_owner_id'));
                    localStorage.removeItem(getProfileStorageKey('yt_analysis_text'));
                    localStorage.removeItem(getProfileStorageKey('yt_wins_text'));
                    localStorage.removeItem(getProfileStorageKey('yt_challenges_text'));
                    localStorage.removeItem(getProfileStorageKey('yt_action_plan_text'));
                    localStorage.removeItem(getProfileStorageKey('yt_top_videos_text'));
                    localStorage.removeItem(getProfileStorageKey('yt_weekly_highlight_text'));
                    localStorage.removeItem(getProfileStorageKey('yt_selected_channel_id'));
                    localStorage.removeItem(getProfileStorageKey('yt_dashboard_data_version'));
                    window.location.reload();
                  }
                }}
                title="Reset all data to defaults"
              >
                Reset
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => window.print()}
                title="Print Dashboard to PDF"
              >
                Print to PDF
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  const activeProfile = getActiveProfile();
                  const stateObj = {};
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.startsWith(`profile_${activeProfile}_`) || key === 'yt_active_profile')) {
                      stateObj[key] = localStorage.getItem(key);
                    }
                  }
                  const appUrl = window.location.origin;
                  const serializedState = JSON.stringify(stateObj);
                  const profileName = activeProfile === 'ariana' ? 'Ariana DeMers' : 'Caribbean Caterers';
                  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>YT Dashboard - ${profileName}</title>
  <style>
    body { background:#0b0f19; color:#f8fafc; font-family:system-ui,sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; text-align:center; }
    .card { background:#131a2a; border:1px solid #232d45; padding:2.5rem; border-radius:16px; box-shadow:0 10px 15px -3px rgba(0,0,0,.5); max-width:500px; width:90%; }
    h1 { color:#ef4444; margin-top:0; font-family:system-ui,sans-serif; }
    p { color:#94a3b8; line-height:1.6; margin-bottom:1.5rem; }
    .btn { background:#3b82f6; color:#fff; padding:.75rem 1.5rem; border-radius:8px; font-weight:600; border:none; cursor:pointer; font-size:1rem; transition:all .2s; display:block; width:100%; margin-bottom:.75rem; }
    .btn:hover { background:#2563eb; }
    .btn.secondary { background:#1a2235; border:1px solid #232d45; color:#94a3b8; }
    .url-row { display:flex; gap:.5rem; margin-top:1rem; }
    .url-input { flex:1; background:#1a2235; border:1px solid #232d45; color:#fff; padding:.5rem .75rem; border-radius:6px; font-size:.85rem; }
    label { font-size:.75rem; color:#94a3b8; display:block; text-align:left; margin-bottom:.25rem; margin-top:1rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>📊 YT Performance Dashboard</h1>
    <p>Shared data for <strong>${profileName}</strong>.<br>Click below to load this profile into the live dashboard.</p>
    <button class="btn" onclick="importAndOpen()">Import &amp; Open Dashboard</button>
    <label>Dashboard URL (edit if needed):</label>
    <input type="text" id="appUrl" class="url-input" value="${appUrl}">
  </div>
  <script>
    const state = ${serializedState};
    function importAndOpen() {
      Object.keys(state).forEach(k => localStorage.setItem(k, state[k]));
      window.location.href = document.getElementById('appUrl').value || '${appUrl}';
    }
  <\/script>
</body>
</html>`;
                  const blob = new Blob([html], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `yt-dashboard-${activeProfile}-${new Date().toISOString().split('T')[0]}.html`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                title="Export dashboard data as a shareable HTML file"
              >
                Share / Export HTML
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtracting}
              >
                {isExtracting ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                {isExtracting ? 'Extracting...' : 'Upload Data'}
              </button>
              <button className="btn-primary" onClick={() => login()}>
                <PlayCircle size={16} />
                Connect YouTube
              </button>
            </div>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => {
                if (window.confirm('This will reset all dashboard data and settings. Are you sure?')) {
                  localStorage.removeItem(getProfileStorageKey('yt_dashboard_metrics'));
                  localStorage.removeItem(getProfileStorageKey('yt_dashboard_traffic_sources'));
                  localStorage.removeItem(getProfileStorageKey('yt_dashboard_goals'));
                  localStorage.removeItem(getProfileStorageKey('yt_dashboard_dates'));
                  localStorage.removeItem(getProfileStorageKey('yt_dashboard_weeks'));
                  localStorage.removeItem(getProfileStorageKey('yt_content_owner_id'));
                  localStorage.removeItem(getProfileStorageKey('yt_analysis_text'));
                  localStorage.removeItem(getProfileStorageKey('yt_wins_text'));
                  localStorage.removeItem(getProfileStorageKey('yt_challenges_text'));
                  localStorage.removeItem(getProfileStorageKey('yt_action_plan_text'));
                  localStorage.removeItem(getProfileStorageKey('yt_top_videos_text'));
                  localStorage.removeItem(getProfileStorageKey('yt_weekly_highlight_text'));
                  localStorage.removeItem(getProfileStorageKey('yt_selected_channel_id'));
                  localStorage.removeItem(getProfileStorageKey('yt_dashboard_data_version'));
                  window.location.reload();
                  }
                }} title="Reset all data to defaults">
                Reset
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => window.print()}
                title="Print Dashboard to PDF"
              >
                Print to PDF
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  const activeProfile = getActiveProfile();
                  const stateObj = {};
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.startsWith(`profile_${activeProfile}_`) || key === 'yt_active_profile')) {
                      stateObj[key] = localStorage.getItem(key);
                    }
                  }
                  const appUrl = window.location.origin;
                  const serializedState = JSON.stringify(stateObj);
                  const profileName = activeProfile === 'ariana' ? 'Ariana DeMers' : 'Caribbean Caterers';
                  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>YT Dashboard - ${profileName}</title>
  <style>
    body { background:#0b0f19; color:#f8fafc; font-family:system-ui,sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; text-align:center; }
    .card { background:#131a2a; border:1px solid #232d45; padding:2.5rem; border-radius:16px; box-shadow:0 10px 15px -3px rgba(0,0,0,.5); max-width:500px; width:90%; }
    h1 { color:#ef4444; margin-top:0; font-family:system-ui,sans-serif; }
    p { color:#94a3b8; line-height:1.6; margin-bottom:1.5rem; }
    .btn { background:#3b82f6; color:#fff; padding:.75rem 1.5rem; border-radius:8px; font-weight:600; border:none; cursor:pointer; font-size:1rem; transition:all .2s; display:block; width:100%; margin-bottom:.75rem; }
    .btn:hover { background:#2563eb; }
    label { font-size:.75rem; color:#94a3b8; display:block; text-align:left; margin-bottom:.25rem; margin-top:1rem; }
    .url-input { width:100%; background:#1a2235; border:1px solid #232d45; color:#fff; padding:.5rem .75rem; border-radius:6px; font-size:.85rem; box-sizing:border-box; }
  </style>
</head>
<body>
  <div class="card">
    <h1>📊 YT Performance Dashboard</h1>
    <p>Shared data for <strong>${profileName}</strong>.<br>Click below to load this profile into the live dashboard.</p>
    <button class="btn" onclick="importAndOpen()">Import &amp; Open Dashboard</button>
    <label>Dashboard URL (edit if needed):</label>
    <input type="text" id="appUrl" class="url-input" value="${appUrl}">
  </div>
  <script>
    const state = ${serializedState};
    function importAndOpen() {
      Object.keys(state).forEach(k => localStorage.setItem(k, state[k]));
      window.location.href = document.getElementById('appUrl').value || '${appUrl}';
    }
  <\/script>
</body>
</html>`;
                  const blob = new Blob([html], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `yt-dashboard-${activeProfile}-${new Date().toISOString().split('T')[0]}.html`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                title="Export dashboard data as a shareable HTML file"
              >
                Share / Export HTML
              </button>
              <button className="btn-secondary" onClick={() => {
                // Force a re-fetch by triggering the hook again (simple trick: toggle token)
                // In a real app, you'd export a refetch function from the hook
                const current = accessToken;
                setAccessToken(null);
                setTimeout(() => setAccessToken(current), 10);
              }}>
                <RefreshCw size={16} /> Refresh Data
              </button>
              <button className="btn-secondary" onClick={() => openDateEditor('present')} title="Manage Week Dates">
                <Calendar size={16} />
              </button>
              <button className="btn-secondary">
                <Settings size={16} />
              </button>
              <button className="btn-secondary" onClick={handleLogout}>
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Main Dashboard Area */}
      <main className="dashboard-layout">
        
        {/* Left/Main Column - Graphs and Table */}
        <div className="main-content">
          
          {/* Previous Month - Simplified to just a label as we fetch it via the hook */}

          {isActuallyLoading || isExtracting ? (
            <div className="glass-panel" style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <Loader2 className="animate-spin" size={48} style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }} />
              <p>{isExtracting ? 'Analyzing image with AI...' : 'Fetching 5 weeks of YouTube Analytics...'}</p>
            </div>
          ) : (
            (() => {
              const allWeeks = getCurrentWeeks();
              const activeWeeks = allWeeks.filter(week => {
                const coreMetrics = displayData.find(c => c.category === 'Core Metrics');
                if (!coreMetrics) return false;
                return coreMetrics.metrics.some(metric => 
                  metric.values && metric.values[week.id] !== undefined && metric.values[week.id] !== null && metric.values[week.id] !== ''
                );
              });
              const rawWeeksList = activeWeeks.length > 0 ? activeWeeks : allWeeks;
              const finalWeeksList = rawWeeksList.map(week => {
                const range = manualDateRanges?.[week.id];
                let displayLabel = week.label;
                if (range) {
                  displayLabel = range.rawLabel || (range.startDate && range.endDate 
                    ? `${range.startDate.split('-').slice(1).join('/')} - ${range.endDate.split('-').slice(1).join('/')}`
                    : week.subLabel || week.label);
                }
                return { ...week, label: displayLabel, subLabel: displayLabel };
              });

              return (
                <>
                  {activeTab === 'Overview' && (
                    <>
                      <GlobalOverview data={displayData} activeWeeks={finalWeeksList} />
                      <ChannelGoals data={extractedGoals} />
                      <VisualGraphs data={displayData} activeWeeks={finalWeeksList} />
                      <TrafficSources data={displayData} activeWeeks={finalWeeksList} extractedTrafficSources={extractedTrafficSources} />
                      <AnalysisPanel 
                        data={displayData} 
                        trafficSources={extractedTrafficSources} 
                        goals={extractedGoals} 
                        activeWeeks={finalWeeksList} 
                        selectedChannelId={selectedChannelId}
                      />
                    </>
                  )}
                  {activeTab === 'Data' && (
                    <WeeklyComparisonTable 
                      data={displayData} 
                      onDataChange={setDisplayData} 
                      manualDateRanges={manualDateRanges}
                      onDateRangeChange={openDateEditor}
                      onAddWeek={handleManualAddWeek}
                    />
                  )}
                </>
              );
            })()
          )}
        </div>

        {/* Right Column - Removed AnalysisPanel from here as it is now at the bottom of Overview */}
        {activeTab === 'Data' && (
          <aside className="side-panel">
            {/* Optional other side content for Data tab */}
          </aside>
        )}

      </main>
    </div>
  );
};

function App() {
  // Read Client ID from .env
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'placeholder-client-id';

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <DashboardContent />
    </GoogleOAuthProvider>
  );
}

export default App;
