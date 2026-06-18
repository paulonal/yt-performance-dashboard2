import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Line } from 'recharts';

const TrafficSources = ({ data, activeWeeks }) => {
  const [activeGroup, setActiveGroup] = useState('APV'); // 'APV', 'Views'

  // Helper to get values from the main data set if available
  const getMetricValue = (metricId, weekId) => {
    for (const cat of data) {
      if (cat.metrics) {
        const metric = cat.metrics.find(m => m.id === metricId);
        if (metric && metric.values && metric.values[weekId] !== undefined) {
          const val = parseFloat(metric.values[weekId]);
          return isNaN(val) ? 0 : val;
        }
      }
    }
    return 0;
  };

  // Transform data for Recharts, reversing activeWeeks to show oldest -> newest (left -> right)
  const chronologicalWeeks = [...activeWeeks].reverse();
  const chartData = chronologicalWeeks.map((week) => {
    const dataPoint = { name: week.label };
    
    // Sources mapping
    const sources = [
      { prefix: 'ts_browse', label: 'Browse' },
      { prefix: 'shorts', label: 'Shorts Feed' },
      { prefix: 'ts_yt_search', label: 'YT Search' },
      { prefix: 'ts_suggested', label: 'Suggested' },
      { prefix: 'ts_external', label: 'External' }
    ];

    sources.forEach(s => {
      dataPoint[`${s.label}_APV`] = getMetricValue(`${s.prefix}_apv`, week.id);
      dataPoint[`${s.label}_Views`] = getMetricValue(`${s.prefix}_views`, week.id);
      dataPoint[`${s.label}_Views_pct`] = getMetricValue(`${s.prefix}_views_pct`, week.id);
    });

    return dataPoint;
  });

  const sources = [
    { name: 'Browse', color: '#3b82f6' },
    { name: 'Shorts Feed', color: '#f59e0b' },
    { name: 'YT Search', color: '#ef4444' },
    { name: 'Suggested', color: '#a855f7' },
    { name: 'External', color: '#10b981' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Group by source name
      const groupedData = {};
      payload.forEach(entry => {
        const sourceName = entry.name.replace(' Views', '').replace(' %', '');
        if (!groupedData[sourceName]) {
          groupedData[sourceName] = { color: entry.color || entry.fill };
        }
        if (entry.dataKey.includes('pct') || entry.dataKey.includes('APV')) {
          groupedData[sourceName].pct = entry.value;
        } else {
          groupedData[sourceName].views = entry.value;
        }
      });

      return (
        <div style={{ 
          background: 'rgba(19, 24, 38, 0.95)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: '12px', 
          padding: '1rem', 
          minWidth: '220px',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}>
          <p style={{ margin: '0 0 0.75rem 0', fontWeight: 'bold', color: '#fff', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
            {label}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {Object.entries(groupedData).map(([name, vals], index) => {
              const displayVal = activeGroup === 'APV' 
                ? `${vals.pct.toFixed(1)}%`
                : `${(vals.views || 0).toLocaleString()} (${(vals.pct || 0).toFixed(1)}%)`;

              return (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ color: vals.color, fontSize: '0.85rem' }}>{name}:</span>
                  <span style={{ color: vals.color, fontSize: '0.85rem', fontWeight: '600' }}>{displayVal}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };


  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div className="glass-panel" style={{ padding: '1.5rem', background: '#0f131f', position: 'relative' }}>
        
        {/* Header and Toggles */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.125rem', color: '#fff', fontWeight: '600', margin: 0 }}>
            Traffic Source Trend
          </h3>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
            {[
              { label: 'APV', value: 'APV' },
              { label: 'Views & Views %', value: 'Views' }
            ].map(group => (
              <button
                key={group.value}
                onClick={() => setActiveGroup(group.value)}
                style={{
                  padding: '6px 16px',
                  fontSize: '0.8125rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeGroup === group.value ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: activeGroup === group.value ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: activeGroup === group.value ? '500' : 'normal',
                  transition: 'all 0.2s'
                }}
              >
                {group.label}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ height: '400px', width: '100%' }}>
          <ResponsiveContainer>
            {activeGroup === 'APV' ? (
              <ComposedChart 
                data={chartData} 
                margin={{ top: 20, right: 30, bottom: 10, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis 
                  stroke="rgba(255,255,255,0.1)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  position={{ x: 20, y: 70 }}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '30px', fontSize: '13px' }} iconType="circle" />
                {sources.map(source => (
                  <Bar 
                    key={`${source.name}_APV_Bar`}
                    name={source.name}
                    dataKey={`${source.name}_APV`} 
                    fill={source.color} 
                    radius={[4, 4, 0, 0]}
                    barSize={16}
                    opacity={0.4}
                    legendType="none"
                  />
                ))}
                {sources.map(source => (
                  <Line 
                    key={`${source.name}_APV_Line`}
                    name={source.name}
                    dataKey={`${source.name}_APV`} 
                    stroke={source.color} 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </ComposedChart>
            ) : (
              <ComposedChart 
                data={chartData} 
                margin={{ top: 20, right: 30, bottom: 10, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis 
                  yAxisId="left"
                  stroke="rgba(255,255,255,0.1)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => val.toLocaleString()}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="rgba(255,255,255,0.1)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  position={{ x: 20, y: 70 }} // Fixed position at top left
                />

                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '30px', fontSize: '13px' }} iconType="circle" />
                {sources.map(source => (
                  <Bar 
                    yAxisId="left"
                    key={`${source.name}_Views_Bar`}
                    name={source.name}
                    dataKey={`${source.name}_Views`} 
                    fill={source.color} 
                    opacity={0.3}
                    barSize={24}
                    legendType="none"
                  />
                ))}
                {sources.map(source => (
                  <Line 
                    yAxisId="right"
                    key={`${source.name}_Views_pct`}
                    name={source.name}
                    dataKey={`${source.name}_Views_pct`} 
                    stroke={source.color} 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TrafficSources;


