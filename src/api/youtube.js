/**
 * YouTube API Utilities
 */

const BASE_ANALYTICS_URL = 'https://youtubeanalytics.googleapis.com/v2/reports';

/**
 * Helper to calculate the start and end dates for a given number of days ago.
 * @param {number} daysAgo 
 * @param {number} duration 
 * @returns {object} { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
 */
export const getDateRange = (daysAgo, duration = 7, baseDate = new Date()) => {
  const end = new Date(baseDate);
  end.setDate(end.getDate() - daysAgo);
  
  const start = new Date(end);
  start.setDate(start.getDate() - (duration - 1));

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
};

/**
 * Generates the date ranges for Week 1 to Week 5, and previous month.
 * This simulates the spreadsheet's week-over-week structure.
 */
export const getWeeklyDateRanges = (baseDate = new Date()) => {
  return {
    'present': getDateRange(2, 7, baseDate),
    'w-1': getDateRange(9, 7, baseDate),
    'w-2': getDateRange(16, 7, baseDate),
    'w-3': getDateRange(23, 7, baseDate)
  };
};

export const fetchAnalyticsReport = async (accessToken, startDate, endDate, metrics, dimensions = '', filters = '', channelId = 'MINE', contentOwnerId = null) => {
  const params = new URLSearchParams({
    startDate,
    endDate,
    metrics,
  });

  // If we have a specific channel ID, use it. 
  if (channelId.startsWith('UC')) {
    params.append('ids', `channel==${channelId}`);
  } else {
    params.append('ids', `channel==${channelId}`); // usually 'MINE'
  }

  if (dimensions) params.append('dimensions', dimensions);
  if (filters) params.append('filters', filters);

  // Use provided ID or fallback to localStorage
  const coId = contentOwnerId || localStorage.getItem('yt_content_owner_id');
  if (coId) {
    params.append('onBehalfOfContentOwner', coId);
  }

  try {
    const response = await fetch(`${BASE_ANALYTICS_URL}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Analytics API Error Response:', errText);
      throw new Error(`Analytics API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
};

/**
 * Fetch core metrics for a specific date range
 */
export const fetchCoreMetrics = async (accessToken, startDate, endDate, channelId, contentOwnerId = null) => {
  // Use standard metrics that are always available
  const data = await fetchAnalyticsReport(
    accessToken,
    startDate,
    endDate,
    'views,subscribersGained,averageViewPercentage,averageViewDuration,estimatedMinutesWatched',
    '',
    '',
    channelId,
    contentOwnerId
  );
  
  if (data.rows && data.rows.length > 0) {
    const row = data.rows[0];
    return {
      views: row[0] || 0,
      subscribersGained: row[1] || 0,
      averageViewPercentage: row[2] || 0,
      ctr: 0, 
      impressions: row[4] || 0 
    };
  }
  
  return { views: 0, subscribersGained: 0, averageViewPercentage: 0, ctr: 0, impressions: 0 };
};

/**
 * Fetch traffic sources for a specific date range
 */
export const fetchTrafficSources = async (accessToken, startDate, endDate, channelId, contentOwnerId = null) => {
  const data = await fetchAnalyticsReport(
    accessToken,
    startDate,
    endDate,
    'views,averageViewPercentage',
    'insightTrafficSourceType',
    '',
    channelId,
    contentOwnerId
  );
  
  const sources = {};
  if (data.rows) {
    data.rows.forEach(row => {
      // row[0] = source type (e.g. 'YT_SEARCH', 'RELATED_VIDEO', 'SUBSCRIBER')
      // row[1] = views
      // row[2] = averageViewPercentage
      sources[row[0]] = {
        views: row[1] || 0,
        averageViewPercentage: row[2] || 0
      };
    });
  }
  return sources;
};

/**
 * Fetch all channels the user owns or manages
 */
export const fetchManagedChannels = async (accessToken) => {
  try {
    console.log('Fetching managed channels...');
    const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&maxResults=50', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch managed channels');
    
    const data = await response.json();
    console.log('Channels found (mine=true):', data.items?.length || 0, data.items);
    
    const channels = data.items?.map(item => ({
      id: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.default.url,
      type: 'owned'
    })) || [];

    // Also try to see if they have Content Owner access
    try {
      const cmsResponse = await fetch('https://youtube.googleapis.com/youtube/v3/contentOwners?mine=true', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });
      if (cmsResponse.ok) {
        const cmsData = await cmsResponse.json();
        console.log('Content Owners found:', cmsData.items?.length || 0, cmsData.items);
        if (cmsData.items && cmsData.items.length > 0) {
          const coId = cmsData.items[0].id;
          localStorage.setItem('yt_content_owner_id', coId);
          
          // Now fetch channels for this Content Owner
          const coChannelsResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&onBehalfOfContentOwner=${coId}&managedByMe=true&maxResults=50`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          });
          
          if (coChannelsResponse.ok) {
            const coChannelsData = await coChannelsResponse.json();
            const coChannels = coChannelsData.items?.map(item => ({
              id: item.id,
              title: item.snippet.title,
              thumbnail: item.snippet.thumbnails.default.url,
              type: 'managed'
            })) || [];
            
            // Merge with owned channels
            coChannels.forEach(cc => {
              if (!channels.find(c => c.id === cc.id)) {
                channels.push(cc);
              }
            });
          }
        }
      }
    } catch (e) {
      console.log('Not a Content Owner or failed to fetch CMS info');
    }

    return channels;
  } catch (error) {
    console.error('Error fetching managed channels:', error);
    return [];
  }
};

/**
 * Fetch channel basic info (name, thumbnail)
 */
export const fetchChannelInfo = async (accessToken, channelId = 'MINE') => {
  try {
    let url = '';
    if (channelId === 'MINE' || !channelId) {
      url = 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true';
    } else if (channelId.startsWith('@')) {
      // Handle searching by handle
      url = `https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=${channelId.substring(1)}`;
    } else {
      url = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}`;
    }

    console.log(`Fetching info for channel: ${channelId || 'MINE'}`);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch channel info');
    }
    
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const channel = data.items[0];
      return {
        id: channel.id,
        title: channel.snippet.title,
        thumbnail: channel.snippet.thumbnails.default.url
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching channel info:', error);
    throw error; // Throw the actual error so the hook can catch it
  }
};
