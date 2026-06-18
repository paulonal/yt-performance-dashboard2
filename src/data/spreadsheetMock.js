export const weeksList = [
  { id: 'w-3', label: '-3 w', subLabel: 'Apr 30-May 06' },
  { id: 'w-2', label: '-2 w', subLabel: 'May 07-13' },
  { id: 'w-1', label: '-1 w', subLabel: 'May 14-20' },
  { id: 'present', label: 'Present', subLabel: 'May 21-27' }
];

export const metricsData = [
  {
    category: 'No. of Uploads',
    metrics: [
      { id: 'up_full', name: 'Full Vid & 3- min Snippets', type: 'number', values: { 'w-3': 2, 'w-2': 2, 'w-1': 3, present: '' } },
      { id: 'up_shorts', name: 'Shorts', type: 'number', values: { 'w-3': 1, 'w-2': 4, 'w-1': 4, present: '' } }
    ]
  },
  {
    category: 'Core Metrics',
    metrics: [
      { id: 'new_subs', name: 'New Subscribers', type: 'number', highlight: true, values: { 'w-3': 35, 'w-2': 39, 'w-1': 21, present: '' } },
      { id: 'views', name: 'Views', type: 'number', highlight: true, values: { 'w-3': 3644, 'w-2': 4643, 'w-1': 3411, present: '' } },
      { id: 'apv', name: 'Average percentage viewed (%)', type: 'percent', highlight: true, values: { 'w-3': 30.5, 'w-2': 31.5, 'w-1': 29.3, present: '' } },
      { id: 'ctr', name: 'Click-Through Rate (CTR)', type: 'percent', highlight: true, values: { 'w-3': 6.3, 'w-2': 6.1, 'w-1': 6.0, present: '' } }
    ]
  },
  {
    category: 'Traffic Source',
    metrics: [
      { id: 'ts_yt_search_apv', name: 'YouTube Search (Overall APV)', type: 'percent', highlight: true, values: { 'w-3': 29.8, 'w-2': 29.8, 'w-1': 26.5, present: '' } },
      { id: 'ts_yt_search_views', name: 'YouTube Search (Views)', type: 'number', values: { 'w-3': 488, 'w-2': 488, 'w-1': 471, present: '' } },
      { id: 'ts_yt_search_views_pct', name: 'YouTube Search (Views %)', type: 'percent', values: { 'w-3': 10.5, 'w-2': 10.5, 'w-1': 13.8, present: '' } },
      { id: 'ts_yt_search_ctr', name: 'YouTube Search (Overall CTR)', type: 'percent', values: { 'w-3': 7.0, 'w-2': 7.0, 'w-1': 6.8, present: '' } },
      { id: 'ts_yt_search_vid_apv', name: 'YT Search (APV) [Video]', subMetric: true, type: 'percent', values: { 'w-3': 29.1, 'w-2': 29.1, 'w-1': 26.0, present: '' } },
      { id: 'ts_yt_search_vid_ctr', name: 'YT Search (CTR) [Video]', subMetric: true, type: 'percent', values: { 'w-3': 8.7, 'w-2': 8.7, 'w-1': 8.4, present: '' } },
      { id: 'ts_yt_search_shorts_apv', name: 'YT Search (APV) [Shorts]', subMetric: true, type: 'percent', values: { 'w-3': 97.9, 'w-2': 97.9, 'w-1': 82.7, present: '' } },
      { id: 'ts_yt_search_shorts_ctr', name: 'YT Search (CTR) [Shorts]', subMetric: true, type: 'percent', values: { 'w-3': 2.0, 'w-2': 2.0, 'w-1': 2.4, present: '' } },
      { id: 'ts_browse_apv', name: 'Browse Features (APV)', type: 'percent', values: { 'w-3': 28.4, 'w-2': 28.4, 'w-1': 28.1, present: '' } },
      { id: 'ts_browse_views', name: 'Browse Features (Views)', type: 'number', values: { 'w-3': 1457, 'w-2': 1457, 'w-1': 1521, present: '' } },
      { id: 'ts_browse_views_pct', name: 'Browse Features (Views %)', type: 'percent', values: { 'w-3': 31.4, 'w-2': 31.4, 'w-1': 44.6, present: '' } },
      { id: 'ts_suggested_apv', name: 'Suggested Videos (APV)', type: 'percent', highlight: true, values: { 'w-3': 47.6, 'w-2': 47.6, 'w-1': 41.6, present: '' } },
      { id: 'ts_suggested_views', name: 'Suggested Videos (Views)', type: 'number', values: { 'w-3': 265, 'w-2': 265, 'w-1': 309, present: '' } },
      { id: 'ts_suggested_views_pct', name: 'Suggested Videos (Views %)', type: 'percent', values: { 'w-3': 5.7, 'w-2': 5.7, 'w-1': 9.1, present: '' } },
      { id: 'ts_external_apv', name: 'External (APV)', type: 'percent', values: { 'w-3': 23.7, 'w-2': 23.7, 'w-1': 28.7, present: '' } },
      { id: 'ts_external_views', name: 'External (Views)', type: 'number', values: { 'w-3': 102, 'w-2': 102, 'w-1': 149, present: '' } },
      { id: 'ts_external_views_pct', name: 'External (Views %)', type: 'percent', values: { 'w-3': 2.2, 'w-2': 2.2, 'w-1': 4.4, present: '' } },
      { id: 'ts_google_search', name: 'Google Search', type: 'percent', values: { 'w-3': 34.5, 'w-2': 34.5, 'w-1': 34.5, present: '' } }
    ]
  },
  {
    category: 'Shorts Feed',
    metrics: [
      { id: 'shorts_apv', name: 'Shorts Feed (APV)', type: 'percent', values: { 'w-3': 71.5, 'w-2': 71.5, 'w-1': 59.3, present: '' } },
      { id: 'shorts_views', name: 'Shorts Feed (Views)', type: 'number', values: { 'w-3': 2101, 'w-2': 2101, 'w-1': 711, present: '' } },
      { id: 'shorts_views_pct', name: 'Shorts Feed (Views %)', type: 'percent', values: { 'w-3': 45.3, 'w-2': 45.3, 'w-1': 20.8, present: '' } },
      { id: 'shorts_engaged', name: 'Engaged Views', type: 'number', values: { 'w-3': 3089, 'w-2': 3089, 'w-1': 2776, present: '' } },
      { id: 'shorts_viewed', name: 'Viewed', type: 'percent', values: { 'w-3': 33.1, 'w-2': 33.1, 'w-1': 26.1, present: '' } },
      { id: 'shorts_swiped', name: 'Swiped away', type: 'percent', values: { 'w-3': 66.9, 'w-2': 66.9, 'w-1': 73.9, present: '' } },
      { id: 'shorts_find', name: 'How viewers find your shorts', type: 'text', values: { 'w-3': '1.Shorts Feed 90%\n2. YT Search 5.8%\n3. Channel pages 2.8%', 'w-2': '1.Shorts Feed 90%\n2. YT Search 5.8%\n3. Channel pages 2.8%', 'w-1': '1.Shorts Feed 78.6%\n2. YT Search 13%\n3. Channel pages 2.4%', present: '' } }
    ]
  },
  {
    category: 'Clicks',
    metrics: [
      { id: 'clicks_visits', name: 'Visits', type: 'number', values: { 'w-3': 21, 'w-2': 21, 'w-1': 22, present: '' } },
      { id: 'clicks_unique', name: 'Unique', type: 'number', values: { 'w-3': 21, 'w-2': 21, 'w-1': 18, present: '' } },
      { id: 'clicks_website', name: 'Website Clicks', type: 'number', values: { 'w-3': 11, 'w-2': 23, 'w-1': 17, present: '' } }
    ]
  },
  {
    category: 'Overall Engagement Metrics',
    metrics: [
      { id: 'eng_likes', name: 'Likes', type: 'number', values: { 'w-3': 52, 'w-2': 52, 'w-1': 38, present: '' } },
      { id: 'eng_dislikes', name: 'Dislikes', type: 'number', values: { 'w-3': 8, 'w-2': 8, 'w-1': 5, present: '' } },
      { id: 'eng_comments', name: 'Comments', type: 'number', values: { 'w-3': 9, 'w-2': 9, 'w-1': 3, present: '' } },
      { id: 'eng_shares', name: 'Shares', type: 'number', values: { 'w-3': 40, 'w-2': 40, 'w-1': 48, present: '' } }
    ]
  }
];

export const analysisData = {
  goals: [
    { text: '3,564 / 3800 Watch time for Monetization data', status: 'fail' },
    { text: '270.8 / 450 Watch Time', status: 'fail' },
    { text: '91 / 180 New Subscribers', status: 'fail' },
    { text: '6.1% / 6% CTR (FV)', status: 'success' },
    { text: '30.4% / 30% APV', status: 'success' },
    { text: '40 / 70 Website Clicks', status: 'fail' }
  ],
  sections: {
    analysis: '',
    wins: '',
    challenges: '',
    actionPlan: ''
  }
};
