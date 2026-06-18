const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;

export const extractDataFromImage = async (base64Image, mimeType = 'image/jpeg') => {
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured.');
  }

  // Remove the data URI prefix if present (e.g., "data:image/png;base64,")
  const base64Data = base64Image.split(',')[1] || base64Image;


const prompt = `
You are a highly accurate data extraction tool.
I am providing you with a screenshot of YouTube analytics data. It will be either a "Weekly Metrics" spreadsheet, a "Traffic Sources" table, or a "Channel Goals" list.

1. If the image is a Weekly Metrics spreadsheet:
The columns represent different weeks, such as "prev month", "Week 1", "Week 2", "Week 3", "Week 4", "Week 5".
Some weeks might not be in the image. For weeks that are not in the image, or cells that are empty, omit the value or set it to undefined/empty string.
Please extract the tabular data exactly and return it strictly in the JSON format matching Template A below.
Please extract the tabular data exactly and return it strictly in the JSON format matching the template below.
Do not wrap your response in markdown code blocks, just return raw JSON.

Template A structure (Weekly Metrics):
{
  "type": "weekly_metrics",
  "dates": {
    "prev": "Mar 26-Apr01",
    "wk1": "Apr 02-08",
    "wk2": "Apr 09-15",
    "wk3": "Apr 16-22",
    "wk4": "Apr 23-29",
    "wk5": "Apr 30-May06"
  },
  "metricsData": [
  {
    "category": "No. of Uploads",
    "metrics": [
      { "id": "up_full", "name": "Full Vid & 3- min Snippets", "type": "number", "values": { "prev": 2, "wk1": 2, "wk2": 2, "wk3": 2, "wk4": 2, "wk5": 2 } },
      { "id": "up_shorts", "name": "Shorts", "type": "number", "values": { "prev": 1, "wk1": 3, "wk2": 3, "wk3": 3, "wk4": 3, "wk5": 3 } }
    ]
  },
  {
    "category": "Core Metrics",
    "metrics": [
      { "id": "new_subs", "name": "New Subscribers", "type": "number", "highlight": true, "values": { "prev": 21, "wk1": 43, "wk2": 53, "wk3": 24, "wk4": 34, "wk5": 27 } },
      { "id": "views", "name": "Views", "type": "number", "highlight": true, "values": { "prev": 4064, "wk1": 7889, "wk2": 4427, "wk3": 3737, "wk4": 3168, "wk5": 2312 } },
      { "id": "apv", "name": "Average percentage viewed (%)", "type": "percent", "highlight": true, "values": { "prev": 26.9, "wk1": 26.3, "wk2": 26.7, "wk3": 27.5, "wk4": 29.2, "wk5": 28.1 } },
      { "id": "ctr", "name": "Click-Through Rate (CTR)", "type": "percent", "highlight": true, "values": { "prev": 4.1, "wk1": 4.2, "wk2": 4.5, "wk3": 5.4, "wk4": 5.5, "wk5": 5.5 } }
    ]
  },
  {
    "category": "Traffic Source",
    "metrics": [
      { "id": "ts_yt_search_apv", "name": "YouTube Search (Overall APV)", "type": "percent", "highlight": true, "values": { "prev": 25.7, "wk1": 26.6, "wk2": 27.5, "wk3": 27.8, "wk4": 28.4, "wk5": 27.9 } },
      { "id": "ts_yt_search_views", "name": "YouTube Search (Views)", "type": "number", "values": { "prev": 412, "wk1": 430, "wk2": 403, "wk3": 478, "wk4": 388 } },
      { "id": "ts_yt_search_views_pct", "name": "YouTube Search (Views %)", "type": "percent", "values": { "prev": 14.0, "wk1": 13.9, "wk2": 13.8, "wk3": 13.8, "wk4": 13.8 } },
      { "id": "ts_yt_search_ctr", "name": "YouTube Search (Overall CTR)", "type": "percent", "values": { "prev": 6.1, "wk1": 6.0, "wk2": 8.5, "wk3": 8.1, "wk4": 7.4, "wk5": 6.3 } },
      { "id": "ts_yt_search_vid_apv", "name": "YT Search (APV) [Video]", "subMetric": true, "type": "percent", "values": { "prev": 25.1, "wk1": 26.2, "wk2": 26.9, "wk3": 26.3, "wk4": 27.7, "wk5": 27.4 } },
      { "id": "ts_yt_search_vid_ctr", "name": "YT Search (CTR) [Video]", "subMetric": true, "type": "percent", "values": { "prev": 6.8, "wk1": 7.4, "wk2": 11.1, "wk3": 10.0, "wk4": 10.5, "wk5": 7.9 } },
      { "id": "ts_yt_search_shorts_apv", "name": "YT Search (APV) [Shorts]", "subMetric": true, "type": "percent", "values": { "prev": 66.8, "wk1": 59.9, "wk2": 81.6, "wk3": 158.6, "wk4": 78.7, "wk5": 73.9 } },
      { "id": "ts_yt_search_shorts_ctr", "name": "YT Search (CTR) [Shorts]", "subMetric": true, "type": "percent", "values": { "prev": 3.8, "wk1": 2.1, "wk2": 3.0, "wk3": 3.1, "wk4": 1.9, "wk5": 2.1 } },
      { "id": "ts_browse_apv", "name": "Browse Features (APV)", "type": "percent", "values": { "prev": 26.3, "wk1": 24.7, "wk2": 25.5, "wk3": 25.4, "wk4": 26.9, "wk5": 28.2 } },
      { "id": "ts_browse_views", "name": "Browse Features (Views)", "type": "number", "values": { "prev": 1120, "wk1": 1150, "wk2": 1080, "wk3": 1290, "wk4": 1051 } },
      { "id": "ts_browse_views_pct", "name": "Browse Features (Views %)", "type": "percent", "values": { "prev": 38.0, "wk1": 37.1, "wk2": 36.9, "wk3": 37.2, "wk4": 37.3 } },
      { "id": "ts_suggested_apv", "name": "Suggested Videos (APV)", "type": "percent", "highlight": true, "values": { "prev": 24.7, "wk1": 26.3, "wk2": 30.2, "wk3": 37.3, "wk4": 39.9, "wk5": 35.1 } },
      { "id": "ts_suggested_views", "name": "Suggested Videos (Views)", "type": "number", "values": { "prev": 280, "wk1": 304, "wk2": 286, "wk3": 340, "wk4": 275 } },
      { "id": "ts_suggested_views_pct", "name": "Suggested Videos (Views %)", "type": "percent", "values": { "prev": 9.5, "wk1": 9.8, "wk2": 9.8, "wk3": 9.8, "wk4": 9.8 } },
      { "id": "ts_external_apv", "name": "External (APV)", "type": "percent", "values": { "prev": 28.5, "wk1": 27.1, "wk2": 23.1, "wk3": 23.2, "wk4": 25.0, "wk5": 27.7 } },
      { "id": "ts_external_views", "name": "External (Views)", "type": "number", "values": { "prev": 147, "wk1": 145, "wk2": 137, "wk3": 163, "wk4": 132 } },
      { "id": "ts_external_views_pct", "name": "External (Views %)", "type": "percent", "values": { "prev": 5.0, "wk1": 4.7, "wk2": 4.7, "wk3": 4.7, "wk4": 4.7 } },
      { "id": "ts_google_search", "name": "Google Search", "type": "percent", "values": { "prev": 28.2, "wk1": 28.4, "wk2": 22.4, "wk3": 22.9, "wk4": 22.5, "wk5": 20.2 } }
    ]
  },
  {
    "category": "Shorts Feed",
    "metrics": [
      { "id": "shorts_apv", "name": "Shorts Feed (APV)", "type": "percent", "values": { "prev": 108.2, "wk1": 76.7, "wk2": 45.1, "wk3": 41.2, "wk4": 36.5, "wk5": 79.2 } },
      { "id": "shorts_views", "name": "Shorts Feed (Views)", "type": "number", "values": { "prev": 840, "wk1": 883, "wk2": 833, "wk3": 988, "wk4": 803 } },
      { "id": "shorts_views_pct", "name": "Shorts Feed (Views %)", "type": "percent", "values": { "prev": 28.5, "wk1": 28.5, "wk2": 28.5, "wk3": 28.5, "wk4": 28.5 } },
      { "id": "shorts_engaged", "name": "Engaged Views", "type": "number", "values": { "prev": 2790, "wk1": 5547, "wk2": 3861, "wk3": 2650, "wk4": 2562, "wk5": 2069 } },
      { "id": "shorts_viewed", "name": "Viewed", "type": "percent", "values": { "prev": 75.8, "wk1": 65.4, "wk2": 25.0, "wk3": 29.3, "wk4": 34.9, "wk5": 31.5 } },
      { "id": "shorts_swiped", "name": "Swiped away", "type": "percent", "values": { "prev": 24.2, "wk1": 34.6, "wk2": 75.0, "wk3": 70.7, "wk4": 65.1, "wk5": 68.5 } },
      { "id": "shorts_find", "name": "How viewers find your shorts", "type": "text", "values": { "prev": "1.Shorts Feed 92.4%\\n2.Other YT 3.6%\\n3.YT Search 1.8%" } }
    ]
  },
  {
    "category": "Clicks",
    "metrics": [
      { "id": "clicks_visits", "name": "Visits", "type": "number", "values": { "prev": 25, "wk1": 46, "wk2": 29, "wk3": 30, "wk4": 10, "wk5": 36 } },
      { "id": "clicks_unique", "name": "Unique", "type": "number", "values": { "prev": 24, "wk1": 44, "wk2": 28, "wk3": 30, "wk4": 10, "wk5": 32 } },
      { "id": "clicks_website", "name": "Website Clicks", "type": "number", "values": { "prev": 13, "wk1": 26, "wk2": 13, "wk3": 22, "wk4": 6, "wk5": 25 } }
    ]
  },
  {
    "category": "Overall Engagement Metrics",
    "metrics": [
      { "id": "eng_likes", "name": "Likes", "type": "number", "values": { "prev": 36, "wk1": 37, "wk2": 24, "wk3": 35 } },
      { "id": "eng_dislikes", "name": "Dislikes", "type": "number", "values": { "prev": 2, "wk1": 4, "wk2": 3, "wk3": 2 } },
      { "id": "eng_comments", "name": "Comments", "type": "number", "values": { "prev": 8, "wk1": 3, "wk2": 1, "wk3": 5 } },
      { "id": "eng_shares", "name": "Shares", "type": "number", "values": { "prev": 46, "wk1": 26, "wk2": 40, "wk3": 38 } }
    ]
  }
    ]
  }
]
}

2. If the image is a Traffic Sources table:
It will have columns like "Traffic source", "Average percentage viewed", and "Views" (with percentage).
Extract the data and return it strictly in the JSON format matching Template B below. Extract percentage views as a number without the % sign.

Template B structure (Traffic Sources):
{
  "type": "traffic_sources",
  "data": [
    { "name": "String", "apv": 0, "views": 0, "percentage": 0 }
  ]
}

3. If the image is a Channel Goals list:
It will have a title like "CHANNEL GOALS for [Month]" followed by a list of goals with a checkmark or X, showing current and target values.
Extract the data and return it strictly in the JSON format matching Template C below. Extract numeric values as numbers without the % sign or commas.

--- TEMPLATE C (Channel Goals) ---
{
  "type": "channel_goals",
  "month": "String (e.g. May)",
  "goals": [
    { "name": "String", "current": 0, "target": 0, "unit": "String" }
  ]
}

For all numeric fields, extract as numbers. Remove symbols like % or commas. If a value is missing, use null.`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1, // Low temperature for factual extraction
      response_mime_type: "application/json"
    }
  };

  try {
    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to analyze image with Gemini API');
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      throw new Error('Gemini API returned an empty response.');
    }

    // Try to parse the JSON returned
    let jsonData;
    try {
      jsonData = JSON.parse(resultText.trim());
    } catch (parseError) {
      // Fallback in case the model ignored the instructions and wrapped it in code blocks
      const cleaned = resultText.replace(/^\\s*\`\`\`json/i, '').replace(/\`\`\`\\s*$/i, '');
      jsonData = JSON.parse(cleaned.trim());
    }

    return jsonData;
  } catch (error) {
    console.error("Gemini analysis error:", error);
    throw error;
  }
};

/**
 * Generates a textual analysis based on current dashboard data
 */
export const generateDashboardAnalysis = async (displayData, trafficSources, goals, vidiqData = null) => {
  const prompt = `You are an expert YouTube growth consultant and data analyst. 
Analyze the provided dashboard data, specifically focusing on the MOST RECENT period (the "Present" column or the latest date range).

DATA CONTEXT:
- Metrics Table: ${JSON.stringify(displayData)}
- Traffic Sources: ${JSON.stringify(trafficSources)}
- Channel Goals: ${JSON.stringify(goals)}
${vidiqData ? `- vidIQ Supplemental Data: ${JSON.stringify(vidiqData)}` : ''}

SPECIFIC TARGETS:
- Average Percentage Viewed (APV) Target: 30%
- Click-Through Rate (CTR) Target: 6%

YOUR TASK:
Provide a strategic analysis strictly for the LATEST date range. Your response must address the following 4 sections using CONCISE BULLET POINTS:

1. Analysis (What does this mean?):
   - Explain what is happening in the latest period.
   - MANDATORY: Analyze shifts in Traffic Sources. Explain which sources increased/decreased and what likely led to this.
   - MANDATORY: Incorporate data from **High Performing Videos** (titles and stats) if provided. Explain how these specific videos are driving the overall channel metrics.
   - Link these shifts and video performances to the core metrics (Views, APV).

2. Wins (What are the wins?):
   - Highlight metrics that hit or exceeded targets.
   - Mention successful videos by title and their standout stats.
   - Mention successful traffic source performance.

3. Challenges (What are the challenges?):
   - Identify metrics falling below target (APV < 30% or CTR < 6%).
   - Highlight any concerning drops in specific traffic sources or retention.
   - Identify if any high-potential videos underperformed.

4. Action Plan (Steps moving forward):
   - Provide 3-4 clear, tangible actions based on this data.
   - Include a strategy to capitalize on the content style of high-performing videos.

Return ONLY a JSON object with the following structure. Use '\n' for new lines in strings. No markdown:
{
  "analysis": "Bulleted list...",
  "wins": "Bulleted list...",
  "challenges": "Bulleted list...",
  "actionPlan": "Bulleted list..."
}
`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7
    }
  };

  try {
    const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API request failed');
    }

    const result = await response.json();
    let textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error("No response content from Gemini.");
    }

    // Clean markdown if AI included it
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(textResponse);
  } catch (error) {
    console.error("Gemini generation error:", error);
    throw error;
  }
};
