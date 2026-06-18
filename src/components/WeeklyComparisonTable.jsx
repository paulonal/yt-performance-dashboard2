import React from 'react';
import { TrendingUp, TrendingDown, Minus, Edit2, Calendar } from 'lucide-react';
import { getCurrentWeeks } from '../utils/weekUtils';

import { Plus } from 'lucide-react';

/**
 * WeeklyComparisonTable renders the editable metrics table.
 * It always shows the four most recent weeks, labeling the newest as "Present"
 * and older weeks as "-1 w", "-2 w", "-3 w".
 */
const WeeklyComparisonTable = ({ data, onDataChange, manualDateRanges, onDateRangeChange, onAddWeek }) => {
  // Obtain the ordered week definitions (present, -1w, -2w, -3w)
  // Obtain the ordered week definitions (present, -1w, -2w, -3w)
  const weeks = getCurrentWeeks().reverse();

  // Use all weeks for rendering, even if they have no data yet
  const activeWeeks = weeks;

  const handleInputChange = (categoryIndex, metricId, weekId, newValue) => {
    const newData = [...data];
    const category = newData[categoryIndex];
    const metricIndex = category.metrics.findIndex(m => m.id === metricId);
    
    if (metricIndex !== -1) {
      const updatedMetrics = [...category.metrics];
      const updatedValues = { ...updatedMetrics[metricIndex].values };
      updatedValues[weekId] = newValue === '' ? '' : Number(newValue);
      
      updatedMetrics[metricIndex] = {
        ...updatedMetrics[metricIndex],
        values: updatedValues
      };
      
      newData[categoryIndex] = {
        ...category,
        metrics: updatedMetrics
      };
      
      onDataChange(newData);
    }
  };

  // Helper to determine status based on previous value
  const getStatus = (current, previous, metric) => {
    if (!metric.highlight) return 'status-neutral';
    if (current === undefined || previous === undefined || current === '' || previous === '') return 'status-neutral';
    if (current > previous) return 'status-positive';
    if (current < previous) return 'status-negative';
    return 'status-neutral';
  };

  const getTrendIcon = (current, previous, metric) => {
    if (!metric.highlight || current === undefined || previous === undefined || current === '' || previous === '') return null;
    if (current > previous) return <TrendingUp size={14} />;
    if (current < previous) return <TrendingDown size={14} />;
    return <Minus size={14} />;
  };

  const formatValue = (val, type) => {
    if (val === undefined || val === null || val === '') return '-';
    if (type === 'percent') return `${val}%`;
    if (type === 'number') return val.toLocaleString();
    if (type === 'text') return val.split('\n').map((line, i) => <div key={i}>{line}</div>);
    return val;
  };

  return (
    <div className="table-container glass-panel">
      <table className="data-table">
        <thead>
          <tr>
            <th>Metrics</th>
            {activeWeeks.map((week) => {
              const currentRange = (manualDateRanges && manualDateRanges[week.id]) || { startDate: '', endDate: '' };
              const displayDate = currentRange.rawLabel || (currentRange.startDate && currentRange.endDate 
                ? `${currentRange.startDate.split('-').slice(1).join('/')} - ${currentRange.endDate.split('-').slice(1).join('/')}`
                : week.subLabel);

              return (
                <th key={week.id}>
                  <button 
                    className="header-date-button"
                    onClick={() => onDateRangeChange(week.id)}
                    title="Click to set exact dates"
                    style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 'bold', 
                      textTransform: 'uppercase', 
                      background: 'transparent', 
                      border: 'none', 
                      color: 'var(--text-main)', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center',
                      margin: '0 auto'
                    }}
                  >
                    <Calendar size={12} style={{ marginRight: '6px', color: 'var(--text-muted)' }} />
                    {displayDate || week.label}
                  </button>
                </th>
              );
            })}
            {onAddWeek && (
              <th style={{ width: '100px', textAlign: 'center', verticalAlign: 'middle' }}>
                <button 
                  onClick={onAddWeek}
                  className="btn-secondary"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--accent-primary)',
                    borderColor: 'var(--accent-primary)',
                    background: 'rgba(59, 130, 246, 0.05)',
                    cursor: 'pointer',
                    margin: '0 auto'
                  }}
                  title="Shift weeks forward and add a new blank week"
                >
                  <Plus size={12} />
                  Add Week
                </button>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((category, catIdx) => (
            <React.Fragment key={catIdx}>
              <tr className="section-header">
                <td colSpan={activeWeeks.length + (onAddWeek ? 2 : 1)}>{category.category}</td>
              </tr>
              {category.metrics.map((metric) => {
                const isEditable = metric.type !== 'text';
                
                return (
                  <tr key={metric.id}>
                    <td>
                      <div className={metric.subMetric ? "metric-name metric-sub" : "metric-name"}>
                        {metric.name}
                        {isEditable && <Edit2 size={12} color="var(--text-muted)" style={{ marginLeft: '4px' }} title="Editable field" />}
                      </div>
                    </td>
                    {activeWeeks.map((week, idx) => {
                      const currentVal = metric.values[week.id];
                      // Compare against previous chronological week (to the left, idx - 1)
                      const prevWeekId = idx > 0 ? activeWeeks[idx - 1].id : null;
                      const prevVal = prevWeekId ? metric.values[prevWeekId] : undefined;
                      
                      const statusClass = getStatus(currentVal, prevVal, metric);

                      return (
                        <td key={`${metric.id}-${week.id}`}>
                          {metric.type === 'text' ? (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {formatValue(currentVal, metric.type)}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {isEditable ? (
                                <input 
                                  type="number" 
                                  value={currentVal === undefined ? '' : currentVal}
                                  onChange={(e) => handleInputChange(catIdx, metric.id, week.id, e.target.value)}
                                  className={`cell-value ${statusClass}`}
                                  style={{ 
                                    background: 'transparent', 
                                    border: '1px solid var(--border-color)', 
                                    color: 'inherit',
                                    fontFamily: 'inherit',
                                    fontSize: '0.875rem',
                                    padding: '4px',
                                    width: '60px',
                                    textAlign: 'center'
                                  }}
                                />
                              ) : (
                                <span className={`cell-value ${statusClass}`}>
                                  {formatValue(currentVal, metric.type)}
                                </span>
                              )}
                              {idx > 0 && (
                                <span style={{ color: `var(--${statusClass === 'status-positive' ? 'accent-success' : statusClass === 'status-negative' ? 'accent-warning' : 'text-muted'})` }}>
                                  {getTrendIcon(currentVal, prevVal, metric)}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    {onAddWeek && (
                      <td style={{ background: 'rgba(255,255,255,0.01)', borderLeft: '1px dashed var(--border-color)' }}></td>
                    )}
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WeeklyComparisonTable;
