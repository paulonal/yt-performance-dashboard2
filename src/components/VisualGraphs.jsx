import React, { useState } from 'react';
import { LineChart, Line, AreaChart, Area, ComposedChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'rgba(19, 26, 42, 0.95)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', boxShadow: 'var(--shadow-md)' }}>
        <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: 'var(--text-main)' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: '0.25rem 0', color: entry.color, fontSize: '0.875rem' }}>
            {entry.name}: {
              typeof entry.value === 'number' 
                ? (entry.name.includes('%') || entry.name.includes('APV') || entry.name.includes('CTR') 
                    ? entry.value.toFixed(2) + (entry.name.includes('%') ? '%' : '') 
                    : entry.value.toLocaleString()) 
                : entry.value
            }
          </p>

        ))}
      </div>
    );
  }
  return null;
};

const VisualGraphs = ({ data, activeWeeks }) => {
  const [activeEngagement, setActiveEngagement] = useState('Likes');
  const [viewsSecondaryMetric, setViewsSecondaryMetric] = useState('APV'); // 'APV', 'CTR', 'Subs', 'Website Clicks'

  // Transform data for Recharts, reversing activeWeeks to show oldest -> newest (left -> right)
  const chronologicalWeeks = [...activeWeeks].reverse();
  const chartData = chronologicalWeeks.map(week => {
    const dataPoint = { 
      name: week.label,
      'Likes': 0, 'Shares': 0, 'Comments': 0, 'Dislikes': 0
    };
    
    // Flatten all metrics into a single object keyed by metric name
    data.forEach(category => {
      if (category.metrics) {
        category.metrics.forEach(metric => {
          // Ensure value is a number, otherwise Recharts won't render
          const rawVal = metric.values ? metric.values[week.id] : 0;
          const numVal = parseFloat(rawVal);
          dataPoint[metric.name] = isNaN(numVal) ? 0 : numVal;
        });
      }
    });

    return dataPoint;
  });

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* ROW 1: Views, APV, CTR */}

        {/* Views Line Chart */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)', fontWeight: '500' }}>Views</h3>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} interval={0} />
                <YAxis 
                  stroke="var(--text-muted)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => value.toLocaleString()} 
                  domain={([dataMin, dataMax]) => {
                    const padding = (dataMax - dataMin) * 0.2 || dataMin * 0.1 || 1;
                    return [Math.max(0, dataMin - padding), dataMax + padding];
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="Views" name="Total Views" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: 'var(--bg-main)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* APV Trend Line Chart */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)', fontWeight: '500' }}>Average Percentage Viewed (APV)</h3>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} interval={0} />
                <YAxis 
                  stroke="var(--text-muted)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}%`} 
                  domain={[10, 40]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="Average percentage viewed (%)" name="APV" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: 'var(--bg-main)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CTR Trend Line Chart */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)', fontWeight: '500' }}>Click-Through Rate (CTR)</h3>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} interval={0} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="Click-Through Rate (CTR)" name="CTR" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: 'var(--bg-main)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROW 2: New Subscribers, Website Clicks, Views Trend */}

        {/* Subscribers Trend Line Chart */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)', fontWeight: '500' }}>New Subscribers Trend</h3>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} interval={0} />
                <YAxis 
                  stroke="var(--text-muted)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="New Subscribers" stroke="var(--accent-success)" strokeWidth={3} dot={{ r: 4, fill: 'var(--bg-main)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Website Clicks Line Chart */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)', fontWeight: '500' }}>Website Clicks</h3>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} interval={0} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="Website Clicks" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: 'var(--bg-main)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Full-width Views Trend Chart (Moved outside the 3-column grid) */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', color: 'var(--text-main)', fontWeight: '600', margin: 0 }}>Views Trend</h3>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px' }}>
              {['APV', 'CTR', 'Subs', 'Website Clicks'].map(metric => (
                <button
                  key={metric}
                  onClick={() => setViewsSecondaryMetric(metric)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    borderRadius: '4px',
                    border: 'none',
                    background: viewsSecondaryMetric === metric ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: viewsSecondaryMetric === metric ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: viewsSecondaryMetric === metric ? '500' : 'normal',
                    transition: 'all 0.2s'
                  }}
                >
                  {metric}
                </button>
              ))}
            </div>
          </div>
        <div style={{ height: '400px', width: '100%' }}>
          <ResponsiveContainer>
            <ComposedChart data={chartData} margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} interval={0} />
                <YAxis 
                  yAxisId="left"
                  stroke="var(--text-muted)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => value.toLocaleString()} 
                  domain={([dataMin, dataMax]) => {
                    const padding = (dataMax - dataMin) * 0.2 || dataMin * 0.1 || 1;
                    return [Math.max(0, dataMin - padding), dataMax + padding];
                  }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="var(--text-muted)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => {
                    if (viewsSecondaryMetric === 'APV' || viewsSecondaryMetric === 'CTR') return `${value.toFixed(2)}%`;
                    return value.toLocaleString();
                  }} 
                  domain={([dataMin, dataMax]) => {
                    const padding = (dataMax - dataMin) * 0.2 || dataMin * 0.1 || 1;
                    return [Math.max(0, dataMin - padding), dataMax + padding];
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="Views" name="Views" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} opacity={0.8} />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey={
                    viewsSecondaryMetric === 'APV' ? 'Average percentage viewed (%)' :
                    viewsSecondaryMetric === 'CTR' ? 'Click-Through Rate (CTR)' :
                    viewsSecondaryMetric === 'Subs' ? 'New Subscribers' : 'Website Clicks'
                  } 
                  name={viewsSecondaryMetric} 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: 'var(--bg-main)', strokeWidth: 2 }} 
                  activeDot={{ r: 6 }} 
                />
              </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
};

export default VisualGraphs;
