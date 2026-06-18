import { useState, useEffect } from 'react';
import { getWeeklyDateRanges, fetchCoreMetrics, fetchTrafficSources, fetchChannelInfo, fetchManagedChannels } from '../api/youtube';
import { metricsData as initialMetricsData } from '../data/spreadsheetMock';
import { ensureDataVersionCurrent, getProfileStorageKey } from '../utils/weekUtils';

export const useYouTubeData = (accessToken, customEndDate = null, manualDateRanges = null) => {
  const [data, setData] = useState(() => {
    // Run migration first — clears stale localStorage if the data version changed
    ensureDataVersionCurrent();
    const saved = localStorage.getItem(getProfileStorageKey('yt_dashboard_metrics'));
    if (!saved) return initialMetricsData;
    
    try {
      const parsedSaved = JSON.parse(saved);
      
      // Deep merge: Ensure all categories and metrics from initialMetricsData exist in parsedSaved
      const mergedData = initialMetricsData.map(initialCat => {
        const savedCat = parsedSaved.find(c => c.category === initialCat.category);
        if (!savedCat) return initialCat;
        
        const mergedMetrics = initialCat.metrics.map(initialMetric => {
          const savedMetric = savedCat.metrics.find(m => m.id === initialMetric.id);
          if (!savedMetric) return initialMetric;
          
          // Preserve existing values: saved values always win.
          // Only fill in keys that are completely absent (undefined) from savedMetric.values.
          const mergedValues = { ...initialMetric.values };
          if (savedMetric.values && typeof savedMetric.values === 'object') {
            Object.entries(savedMetric.values).forEach(([k, v]) => {
              // Saved value wins even if it is 0, false, or empty string
              if (v !== undefined) mergedValues[k] = v;
            });
          }
          return { ...initialMetric, ...savedMetric, values: mergedValues };
        });
        
        return { ...initialCat, ...savedCat, metrics: mergedMetrics };
      });
      
      return mergedData;
    } catch (e) {
      console.error("Failed to parse saved metrics, resetting to template", e);
      return initialMetricsData;
    }
  });



  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [channelInfo, setChannelInfo] = useState(null);
  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState(() => {
    return localStorage.getItem(getProfileStorageKey('yt_selected_channel_id')) || 'UChFqcqBqGL7vM5Qc5N7tqLQ';
  });
  const [contentOwnerId, setContentOwnerId] = useState(null);

  // Persist data changes to localStorage
  useEffect(() => {
    if (data) {
      localStorage.setItem(getProfileStorageKey('yt_dashboard_metrics'), JSON.stringify(data));
    }
  }, [data]);

  useEffect(() => {
    if (selectedChannelId) {
      localStorage.setItem(getProfileStorageKey('yt_selected_channel_id'), selectedChannelId);
    }
  }, [selectedChannelId]);


  useEffect(() => {
    if (!accessToken) return;

    // First, fetch all available channels
    const initChannels = async () => {
      try {
        const channelList = await fetchManagedChannels(accessToken);
        setChannels(channelList);
        
        // Auto-detect content owner if any channel has one
        const coId = localStorage.getItem(getProfileStorageKey('yt_content_owner_id'));
        if (coId) setContentOwnerId(coId);

        if (channelList.length > 0 && !selectedChannelId) {
          setSelectedChannelId(channelList[0].id);
        }
      } catch (err) {
        console.error("Failed to init channels", err);
      }
    };

    initChannels();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !selectedChannelId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🚀 Starting API Fetch for:', selectedChannelId);
        // Use manual ranges if provided and they have all required keys, otherwise calculate from end date
        const weeks = ['w-3', 'w-2', 'w-1', 'present'];
        let dateRanges = manualDateRanges;
        const hasRequiredKeys = dateRanges && typeof dateRanges === 'object' && weeks.every(w => w in dateRanges);
        if (!hasRequiredKeys) {
          dateRanges = getWeeklyDateRanges(customEndDate ? new Date(customEndDate) : new Date());
        }
        
        // We will build a new mapped metrics array based on the mock template
        // Use current data as base if available, otherwise fallback to template
        const baseData = data || initialMetricsData;
        const mappedData = JSON.parse(JSON.stringify(baseData)); // Deep copy current state

        
        // Helper to find and update a metric
        const updateMetric = (categoryName, metricId, weekId, value) => {
          const category = mappedData.find(c => c.category === categoryName);
          if (category) {
            const metric = category.metrics.find(m => m.id === metricId);
            if (metric) {
              metric.values[weekId] = value;
            }
          }
        };

        // Fetch channel info for the selected channel
        fetchChannelInfo(accessToken, selectedChannelId).then(info => {
          if (info) {
            const realId = info.id || selectedChannelId; // Ensure we use the resolved ID
            setChannelInfo(info);
            // If this is a manual addition (or handle), add it to the list if not present
            setChannels(prev => {
              if (!prev.find(c => c.id === realId)) {
                return [...prev, { id: realId, title: info.title, thumbnail: info.thumbnail }];
              }
              return prev;
            });
            // If we searched by handle, switch to the real ID now
            if (selectedChannelId.startsWith('@')) {
              setSelectedChannelId(realId);
            }
          } else {
            setError(`Could not find channel info for: ${selectedChannelId}. Make sure the handle/ID is correct.`);
          }
        }).catch(err => {
          console.error("Manual fetch error", err);
          if (err.message.includes('403') || err.message.includes('permission')) {
            setError(`Permission Denied: Your account doesn't have API access to this channel's analytics. Even if you are a "Manager" in YouTube Studio, the owner must also grant access to this app.`);
          } else {
            setError(`Failed to fetch channel: ${err.message}`);
          }
        });

        // Fetch data for all weeks concurrently
        const weekPromises = weeks.map(async (weekId) => {
          const { startDate, endDate } = dateRanges[weekId];
          console.log(`📊 Fetching week ${weekId}: ${startDate} to ${endDate}`);
          
          try {
            const [core, traffic] = await Promise.all([
              fetchCoreMetrics(accessToken, startDate, endDate, selectedChannelId, contentOwnerId),
              fetchTrafficSources(accessToken, startDate, endDate, selectedChannelId, contentOwnerId)
            ]);
            
            console.log(`✅ Received ${weekId} metrics for ${selectedChannelId}:`, {
              views: core.views,
              subscribers: core.subscribersGained,
              retention: core.averageViewPercentage
            });
            return { weekId, core, traffic };
          } catch (err) {
            console.error(`Failed to fetch data for ${weekId}`, err);
            return { weekId, core: null, traffic: null };
          }
        });

        const results = await Promise.all(weekPromises);

        // Map the results back to our spreadsheet structure
        results.forEach(({ weekId, core, traffic }) => {
          if (core) {
            updateMetric('Core Metrics', 'views', weekId, core.views);
            updateMetric('Core Metrics', 'new_subs', weekId, core.subscribersGained);
            updateMetric('Core Metrics', 'apv', weekId, Number(core.averageViewPercentage.toFixed(1)));
            updateMetric('Core Metrics', 'ctr', weekId, Number(core.ctr.toFixed(2)));
          }

          if (traffic) {
            const totalViews = core ? core.views : 1; // avoid division by zero
            
            // Mapping YouTube Traffic Source Types to Spreadsheet rows
            const ytSearch = traffic['YT_SEARCH'];
            if (ytSearch) {
              updateMetric('Traffic Source', 'ts_yt_search_apv', weekId, Number(ytSearch.averageViewPercentage.toFixed(1)));
              updateMetric('Traffic Source', 'ts_yt_search_views', weekId, ytSearch.views);
              updateMetric('Traffic Source', 'ts_yt_search_views_pct', weekId, Number(((ytSearch.views / totalViews) * 100).toFixed(1)));
            }

            const browse = traffic['BROWSE_FEATURES'] || traffic['FEED'];
            if (browse) {
              updateMetric('Traffic Source', 'ts_browse_apv', weekId, Number(browse.averageViewPercentage.toFixed(1)));
              updateMetric('Traffic Source', 'ts_browse_views', weekId, browse.views);
              updateMetric('Traffic Source', 'ts_browse_views_pct', weekId, Number(((browse.views / totalViews) * 100).toFixed(1)));
            }

            const suggested = traffic['RELATED_VIDEO'];
            if (suggested) {
              updateMetric('Traffic Source', 'ts_suggested_apv', weekId, Number(suggested.averageViewPercentage.toFixed(1)));
              updateMetric('Traffic Source', 'ts_suggested_views', weekId, suggested.views);
              updateMetric('Traffic Source', 'ts_suggested_views_pct', weekId, Number(((suggested.views / totalViews) * 100).toFixed(1)));
            }
            
            const external = traffic['EXT_URL'];
            if (external) {
              updateMetric('Traffic Source', 'ts_external_apv', weekId, Number(external.averageViewPercentage.toFixed(1)));
              updateMetric('Traffic Source', 'ts_external_views', weekId, external.views);
              updateMetric('Traffic Source', 'ts_external_views_pct', weekId, Number(((external.views / totalViews) * 100).toFixed(1)));
            }

            const shorts = traffic['SHORTS'];
            if (shorts) {
              updateMetric('Shorts Feed', 'shorts_apv', weekId, Number(shorts.averageViewPercentage.toFixed(1)));
              updateMetric('Shorts Feed', 'shorts_views', weekId, shorts.views);
              updateMetric('Shorts Feed', 'shorts_views_pct', weekId, Number(((shorts.views / totalViews) * 100).toFixed(1)));
            }
          }

        });

        setData(mappedData);
      } catch (err) {
        console.error("Error in useYouTubeData", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accessToken, selectedChannelId, customEndDate, manualDateRanges]);

  return { data, setData, loading, error, channelInfo, channels, selectedChannelId, setSelectedChannelId };
};
