import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const GlobalOverview = ({ data, activeWeeks }) => {
  if (!activeWeeks || activeWeeks.length === 0) return null;

  const latestWeek = activeWeeks[0];
  const prevWeek = activeWeeks.length > 1 ? activeWeeks[1] : null;

  // Helper to safely get value from metric for a specific week
  const getValue = (categoryId, metricId, weekId) => {
    if (!weekId) return 0;
    const category = data.find(c => c.category === categoryId);
    if (category && category.metrics) {
      const metric = category.metrics.find(m => m.id === metricId || m.name === metricId);
      if (metric && metric.values && metric.values[weekId] !== undefined) {
        const val = parseFloat(metric.values[weekId]);
        return isNaN(val) ? 0 : val;
      }
    }
    return 0;
  };

  const calculateChange = (latest, previous) => {
    if (!prevWeek || previous === 0) return null; // Can't calculate meaningful % change
    const diff = latest - previous;
    const percent = (diff / previous) * 100;
    return percent;
  };

  const buildMetric = (title, categoryId, metricId, formatFn = (v) => v, suffix = '') => {
    const latestVal = getValue(categoryId, metricId, latestWeek.id);
    const prevVal = prevWeek ? getValue(categoryId, metricId, prevWeek.id) : null;
    const change = calculateChange(latestVal, prevVal);
    
    return {
      title,
      value: `${formatFn(latestVal)}${suffix}`,
      change
    };
  };

  const formatNumber = (num) => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  // Order: Views, APV, CTR, Subs, Website Clicks, Likes, Share
  const metricsToRender = [
    { ...buildMetric('Views', 'Core Metrics', 'views', formatNumber), icon: '🎬', color: '#ef4444' },
    { ...buildMetric('APV', 'Core Metrics', 'apv', (v) => v.toFixed(1), '%'), icon: '📊', color: '#3b82f6' },
    { ...buildMetric('CTR', 'Core Metrics', 'ctr', (v) => v.toFixed(1), '%'), icon: '🖱️', color: '#10b981' },
    { ...buildMetric('Subs', 'Core Metrics', 'new_subs', formatNumber), icon: '👥', color: '#f59e0b' },
    { ...buildMetric('Website Clicks', 'Clicks', 'clicks_website', formatNumber), icon: '🌐', color: '#8b5cf6' },
    { ...buildMetric('Likes', 'Overall Engagement Metrics', 'eng_likes', formatNumber), icon: '👍', color: '#ec4899' },
    { ...buildMetric('Share', 'Overall Engagement Metrics', 'eng_shares', formatNumber), icon: '🔗', color: '#14b8a6' },
  ];

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-main)', fontWeight: '600' }}>
        Global Overview <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({latestWeek.label})</span>
      </h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
        gap: '1rem' 
      }}>
        {metricsToRender.map((m, i) => (
          <OverviewCard key={i} title={m.title} value={m.value} change={m.change} icon={m.icon} color={m.color} />
        ))}
      </div>
    </div>
  );
};

const OverviewCard = ({ title, value, change, icon, color }) => {
  let changeColor = 'var(--text-muted)';
  let ChangeIcon = Minus;
  let formattedChange = 'N/A';

  if (change !== null) {
    if (change > 0) {
      changeColor = 'var(--accent-success)';
      ChangeIcon = ArrowUpRight;
      formattedChange = `+${change.toFixed(1)}%`;
    } else if (change < 0) {
      changeColor = 'var(--accent-danger)';
      ChangeIcon = ArrowDownRight;
      formattedChange = `${change.toFixed(1)}%`;
    } else {
      formattedChange = '0%';
    }
  }

  return (
    <div className="glass-panel" style={{ 
      padding: '1rem', 
      borderTop: `4px solid ${color}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      position: 'relative'
    }}>
      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>{icon}</span>
        <span>{title}</span>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: changeColor, fontWeight: '500' }}>
        {change !== null && change !== 0 && <ChangeIcon size={12} />}
        <span>{formattedChange}</span>
        <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.65rem' }}>vs prev wk</span>
      </div>
    </div>
  );
};

export default GlobalOverview;
