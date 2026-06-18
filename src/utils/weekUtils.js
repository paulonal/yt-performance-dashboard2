/* src/utils/weekUtils.js */

/**
 * Week handling utilities for the YouTube Performance Dashboard.
 * Stores the ordering/labels of the last four weeks in localStorage so that
 * the UI can display a rotating window labelled "Present", "-1 w", "-2 w", "-3 w".
 */

// Ordered identifiers for the four weeks we retain
export const WEEK_KEYS = ['present', 'w-1', 'w-2', 'w-3'];

// Bump this string whenever the week window shifts, so stale localStorage is cleared.
const DATA_VERSION = 'v3-2026-05-26';

/** Retrieve the current week definitions (id, label, subLabel).
 *  If the user has previously stored a custom ordering/labels they are loaded
 *  from localStorage; otherwise a default set is returned.
 */
export function getActiveProfile() {
  return localStorage.getItem('yt_active_profile') || 'ariana';
}

export function setActiveProfile(profile) {
  localStorage.setItem('yt_active_profile', profile);
}

export function getProfilePrefix() {
  const profile = getActiveProfile();
  return `profile_${profile}_`;
}

export function getProfileStorageKey(key) {
  return `${getProfilePrefix()}${key}`;
}

/** Run this before reading any yt_dashboard_* localStorage keys.
 *  If the data version has changed (i.e. the week window shifted), all stale
 *  keys are cleared so the app uses the fresh mock defaults instead.
 *  Returns true if a migration was performed.
 */
export function ensureDataVersionCurrent() {
  const versionKey = getProfileStorageKey('yt_dashboard_data_version');
  const storedVersion = localStorage.getItem(versionKey);
  if (storedVersion !== DATA_VERSION) {
    console.info(`weekUtils: data version changed (${storedVersion} → ${DATA_VERSION}). Resetting localStorage to fresh defaults.`);
    localStorage.removeItem(getProfileStorageKey('yt_dashboard_weeks'));
    localStorage.removeItem(getProfileStorageKey('yt_dashboard_dates'));
    localStorage.removeItem(getProfileStorageKey('yt_dashboard_metrics'));
    localStorage.setItem(versionKey, DATA_VERSION);
    return true;
  }
  return false;
}

export function getCurrentWeeks() {
  // Version migration: if the stored version doesn't match, clear all week/metric
  // localStorage so the fresh mock data (with the new week window) is used instead.
  const migrated = ensureDataVersionCurrent();
  if (!migrated) {
    const stored = localStorage.getItem(getProfileStorageKey('yt_dashboard_weeks'));
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === 4 && parsed.every(w => WEEK_KEYS.includes(w.id))) {
          return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse stored weeks list, falling back to defaults');
      }
    }
  }
  // Default week definitions for the current 4-week window
  return [
    { id: 'present', label: 'May 21-27', subLabel: 'May 21-27', rawLabel: 'May 21-27', startDate: '', endDate: '' },
    { id: 'w-1', label: 'May 14-20', subLabel: 'May 14-20', rawLabel: 'May 14-20', startDate: '', endDate: '' },
    { id: 'w-2', label: 'May 07-13', subLabel: 'May 07-13', rawLabel: 'May 07-13', startDate: '', endDate: '' },
    { id: 'w-3', label: 'Apr 30-May 06', subLabel: 'Apr 30-May 06', rawLabel: 'Apr 30-May 06', startDate: '', endDate: '' },
  ];
}

/** Persist a custom week list back to localStorage.
 *  Used after we shift weeks when a new spreadsheet is uploaded.
 */
export function setCurrentWeeks(weeks) {
  localStorage.setItem(getProfileStorageKey('yt_dashboard_weeks'), JSON.stringify(weeks));
}

/** Merge a newly‑uploaded week of metrics into the existing dashboard data.
 *
 * @param {Array} existingData   Current metricsData (array of category objects).
 * @param {Array} newMetricsData New metricsData extracted from the uploaded image.
 * @param {Object} newDates      Mapping of week ids to rawLabel/startDate/endDate.
 * @returns {Array} Updated metricsData ready to be set in state.
 */
export function mergeNewWeekData(existingData, newMetricsData, newDates) {
  // Chronological order defined by Gemini's prompt template
  const geminiOrder = ['prev', 'wk1', 'wk2', 'wk3', 'wk4', 'wk5'];
  
  // Try to find keys from extracted dates
  let foundKeys = geminiOrder.filter(k => newDates && newDates[k]);
  
  // Fallback: if no dates extracted, check metric values directly
  if (foundKeys.length === 0 && newMetricsData && newMetricsData.length > 0) {
     const firstCategory = newMetricsData.find(c => c && c.metrics && c.metrics.length > 0);
     if (firstCategory) {
       const firstMetric = firstCategory.metrics[0];
       if (firstMetric && firstMetric.values) {
         foundKeys = geminiOrder.filter(k => firstMetric.values[k] !== undefined);
       }
     }
  }

  // If still empty, assume 'wk1'
  if (foundKeys.length === 0) {
    foundKeys = ['wk1'];
  }

  // Reverse to get newest first (e.g. ['wk4', 'wk3', 'wk2', 'wk1', 'prev'])
  const newestFirstUploaded = foundKeys.reverse();
  const numUploaded = newestFirstUploaded.length;

  // Build the updated categories array
  const updatedCategories = existingData.map((category, catIdx) => {
    const newCategory = newMetricsData && newMetricsData.find(c => c && c.category && c.category.toLowerCase() === category.category.toLowerCase()) || (newMetricsData ? newMetricsData[catIdx] : null);
    if (!newCategory) return category; // safety fallback

    const updatedMetrics = category.metrics.map(metric => {
      const newMetric = newCategory.metrics
        ? (newCategory.metrics.find(m => m.id === metric.id) ||
           newCategory.metrics.find(m => m.name && m.name.toLowerCase() === metric.name.toLowerCase()))
        : null;
      const currentVals = WEEK_KEYS.map(k => metric.values?.[k]);
      
      const newValues = {};
      WEEK_KEYS.forEach((k, i) => {
        if (i < numUploaded) {
          // Fill from uploaded data
          const sourceKey = newestFirstUploaded[i];
          newValues[k] = newMetric ? newMetric.values?.[sourceKey] : undefined;
        } else {
          // Fill from shifted existing data
          const shiftedIndex = i - numUploaded;
          newValues[k] = currentVals[shiftedIndex];
        }
      });
      return { ...metric, values: newValues };
    });

    return { ...category, metrics: updatedMetrics };
  });

  // Retrieve current weeks to shift their labels/dates forward
  const currentWeeks = getCurrentWeeks();

  // Update the persisted week definitions (labels & dates)
  const newWeeks = WEEK_KEYS.map((k, i) => {
    let rawLabel = '';
    let startDate = '';
    let endDate = '';
    
    if (i < numUploaded) {
      const sourceKey = newestFirstUploaded[i];
      rawLabel = newDates?.[sourceKey]?.rawLabel || '';
      startDate = newDates?.[sourceKey]?.startDate || '';
      endDate = newDates?.[sourceKey]?.endDate || '';
    } else {
      // Shift dates forward from previous weeks
      const shiftedIndex = i - numUploaded;
      const oldWeek = currentWeeks[shiftedIndex];
      rawLabel = oldWeek?.rawLabel || oldWeek?.label || '';
      startDate = oldWeek?.startDate || '';
      endDate = oldWeek?.endDate || '';
    }

    const defaultLabels = {
      'present': 'May 07-13',
      'w-1': 'Apr 30-May 06',
      'w-2': 'Apr 23-29',
      'w-3': 'Apr 16-22'
    };

    const fallbackLabel = rawLabel || defaultLabels[k] || `Week ${k === 'present' ? 4 : 4 - parseInt(k.split('-')[1])}`;

    return {
      id: k,
      label: rawLabel || fallbackLabel,
      subLabel: rawLabel || fallbackLabel,
      rawLabel,
      startDate,
      endDate
    };
  });
  
  setCurrentWeeks(newWeeks);

  // Persist the date ranges for the UI (used by WeeklyComparisonTable)
  const datesObj = {};
  newWeeks.forEach(w => {
    datesObj[w.id] = { rawLabel: w.rawLabel, startDate: w.startDate, endDate: w.endDate };
  });
  localStorage.setItem(getProfileStorageKey('yt_dashboard_dates'), JSON.stringify(datesObj));

  return updatedCategories;
}
