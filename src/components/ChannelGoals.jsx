import { getActiveProfile } from '../utils/weekUtils';

const mockGoalsAriana = [
  { name: "Watch time for Monetization data", current: 3480, target: 3800, unit: "" },
  { name: "Watch Time", current: 174.4, target: 450, unit: "" },
  { name: "New Subscribers", current: 70, target: 180, unit: "" },
  { name: "CTR (FV)", current: 6.2, target: 6, unit: "%" },
  { name: "APV", current: 31.1, target: 30, unit: "%" },
  { name: "Website Clicks", current: 23, target: 70, unit: "" }
];

const mockGoalsCaribbean = [
  { name: "Long Form Views", current: 437, target: 500, unit: "" },
  { name: "Shorts Views", current: 1014, target: 1200, unit: "" },
  { name: "CTR", current: 3.8, target: 6, unit: "%" },
  { name: "APV", current: 37.5, target: 30, unit: "%" },
  { name: "Website Clicks", current: 11, target: 10, unit: "" },
  { name: "New Subscribers", current: 1, target: 10, unit: "" }
];

const ChannelGoals = ({ data }) => {
  const profile = getActiveProfile();
  const defaultGoals = profile === 'caribbean' ? mockGoalsCaribbean : mockGoalsAriana;
  const goalsArray = data?.goals || (Array.isArray(data) ? data : defaultGoals);
  const month = data?.month || '';

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)', fontWeight: '500' }}>
        Channel Goals {month && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>for {month}</span>}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }} className="channel-goals-grid">
        {goalsArray.map((goal, idx) => {
          let percentage = (goal.current / goal.target) * 100;
          if (isNaN(percentage)) percentage = 0;
          if (percentage > 100) percentage = 100;
          
          const isComplete = percentage >= 100;

          return (
            <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '500' }}>{goal.name}</span>
                <span style={{ fontSize: '0.85rem', color: isComplete ? 'var(--accent-success)' : 'var(--text-muted)', fontWeight: isComplete ? '600' : 'normal', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{goal.current}{goal.unit} / {goal.target}{goal.unit}</span>
                  <span style={{ background: isComplete ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: isComplete ? 'var(--accent-success)' : '#3b82f6', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {percentage.toFixed(1)}%
                  </span>
                </span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${percentage}%`, 
                    background: isComplete ? 'var(--accent-success)' : '#3b82f6',
                    transition: 'width 0.5s ease-in-out'
                  }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChannelGoals;
