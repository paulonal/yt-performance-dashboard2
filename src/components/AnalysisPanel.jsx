import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Target, Trophy, AlertTriangle, ArrowRight, Sparkles, BarChart3, Video, Zap } from 'lucide-react';
import { generateDashboardAnalysis } from '../api/gemini';
import { analysisData } from '../data/spreadsheetMock';
import { vidiq } from '../api/vidiq';
import { getProfileStorageKey } from '../utils/weekUtils';

const AnalysisPanel = ({ data, trafficSources, goals, activeWeeks, selectedChannelId }) => {
  const [analysisText, setAnalysisText] = useState(() => {
    const saved = localStorage.getItem(getProfileStorageKey('yt_analysis_text'));
    return saved !== null ? saved : (analysisData.sections.analysis || '');
  });
  const [winsText, setWinsText] = useState(() => {
    const saved = localStorage.getItem(getProfileStorageKey('yt_wins_text'));
    return saved !== null ? saved : (analysisData.sections.wins || '');
  });
  const [challengesText, setChallengesText] = useState(() => {
    const saved = localStorage.getItem(getProfileStorageKey('yt_challenges_text'));
    return saved !== null ? saved : (analysisData.sections.challenges || '');
  });
  const [actionPlanText, setActionPlanText] = useState(() => {
    const saved = localStorage.getItem(getProfileStorageKey('yt_action_plan_text'));
    return saved !== null ? saved : (analysisData.sections.actionPlan || '');
  });
  const [topVideosText, setTopVideosText] = useState(() => {
    const saved = localStorage.getItem(getProfileStorageKey('yt_top_videos_text'));
    return saved !== null ? saved : '';
  });
  const [weeklyHighlightText, setWeeklyHighlightText] = useState(() => {
    const saved = localStorage.getItem(getProfileStorageKey('yt_weekly_highlight_text'));
    return saved !== null ? saved : '';
  });

  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    localStorage.setItem(getProfileStorageKey('yt_analysis_text'), analysisText);
  }, [analysisText]);

  useEffect(() => {
    localStorage.setItem(getProfileStorageKey('yt_wins_text'), winsText);
  }, [winsText]);

  useEffect(() => {
    localStorage.setItem(getProfileStorageKey('yt_challenges_text'), challengesText);
  }, [challengesText]);

  useEffect(() => {
    localStorage.setItem(getProfileStorageKey('yt_action_plan_text'), actionPlanText);
  }, [actionPlanText]);

  useEffect(() => {
    localStorage.setItem(getProfileStorageKey('yt_top_videos_text'), topVideosText);
  }, [topVideosText]);

  useEffect(() => {
    localStorage.setItem(getProfileStorageKey('yt_weekly_highlight_text'), weeklyHighlightText);
  }, [weeklyHighlightText]);
  const [useVidIQ, setUseVidIQ] = useState(true);

  const generateAIInsights = async () => {
    try {
      setIsGenerating(true);
      
      let vidiqContext = null;
      if (useVidIQ) {
        if (!selectedChannelId) {
          throw new Error("No YouTube channel selected. Please connect your channel or enter a Channel ID first.");
        }
        vidiqContext = await vidiq.getAnalysisContext(selectedChannelId);
      }

      const insights = await generateDashboardAnalysis(data, trafficSources, goals, vidiqContext);
      
      if (insights) {
        setAnalysisText(insights.analysis || '');
        setWinsText(insights.wins || '');
        setChallengesText(insights.challenges || '');
        setActionPlanText(insights.actionPlan || '');
      } else {
        throw new Error("Received empty or invalid data structure from AI.");
      }
    } catch (error) {
      console.error("AI Generation failed:", error);
      alert("AI Generation Error: " + (error.message || "An unexpected error occurred while contacting the AI service."));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
            <BarChart3 size={20} color="var(--accent-primary)" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Latest Period Analysis</h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AI-Powered Growth Strategy</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', cursor: 'pointer', opacity: useVidIQ ? 1 : 0.5 }}>
            <input 
              type="checkbox" 
              checked={useVidIQ} 
              onChange={(e) => setUseVidIQ(e.target.checked)}
              style={{ accentColor: 'var(--accent-primary)' }}
            />
            vidIQ MCP
          </label>
          <button 
            className="btn-secondary" 
            onClick={generateAIInsights} 
            disabled={isGenerating}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Sparkles size={14} />
            {isGenerating ? 'Analyzing...' : 'Generate Insights'}
          </button>
        </div>
      </div>

      {!selectedChannelId && (
        <div style={{ margin: '1.25rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 'bold', fontSize: '0.875rem' }}>
            <AlertTriangle size={16} />
            Channel Not Selected
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            To generate AI insights with vidIQ, you must first connect a YouTube channel or enter a Channel ID in the top menu.
          </p>
        </div>
      )}

      <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        


        {/* Text Areas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>
              <ArrowRight size={14} /> What does this mean? (Analysis)
            </label>
            <textarea 
              value={analysisText}
              onChange={(e) => setAnalysisText(e.target.value)}
              placeholder="Enter overall analysis..."
              style={{ width: '100%', minHeight: '80px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', color: 'var(--text-main)', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--accent-success)' }}>
              <Trophy size={14} /> What are the wins?
            </label>
            <textarea 
              value={winsText}
              onChange={(e) => setWinsText(e.target.value)}
              placeholder="Document successes..."
              style={{ width: '100%', minHeight: '80px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', color: 'var(--text-main)', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--accent-warning)' }}>
              <AlertTriangle size={14} /> What are the challenges?
            </label>
            <textarea 
              value={challengesText}
              onChange={(e) => setChallengesText(e.target.value)}
              placeholder="Document areas for improvement..."
              style={{ width: '100%', minHeight: '80px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', color: 'var(--text-main)', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              <Target size={14} /> Action plan moving forward?
            </label>
            <textarea 
              value={actionPlanText}
              onChange={(e) => setActionPlanText(e.target.value)}
              placeholder="Steps to take..."
              style={{ width: '100%', minHeight: '80px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', color: 'var(--text-main)', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>
              <Video size={14} /> Top Performing Videos
            </label>
            <textarea 
              value={topVideosText}
              onChange={(e) => setTopVideosText(e.target.value)}
              placeholder="Enter top performing videos..."
              style={{ width: '100%', minHeight: '80px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', color: 'var(--text-main)', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--accent-warning)' }}>
              <Zap size={14} /> Weekly Highlight
            </label>
            <textarea 
              value={weeklyHighlightText}
              onChange={(e) => setWeeklyHighlightText(e.target.value)}
              placeholder="Enter weekly highlight..."
              style={{ width: '100%', minHeight: '80px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', color: 'var(--text-main)', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalysisPanel;
