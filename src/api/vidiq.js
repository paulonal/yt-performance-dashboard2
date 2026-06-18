import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const MCP_URL = import.meta.env.VITE_VIDIQ_MCP_URL || 'https://mcp.vidiq.com/mcp';

/**
 * VidIQ MCP Client for fetching advanced YouTube insights
 */
export class VidIQClient {
  constructor(authToken = null) {
    this.authToken = authToken || import.meta.env.VITE_VIDIQ_MCP_TOKEN || null;
    this.client = null;
    this.transport = null;
  }

  async connect() {
    try {
      // Note: In a real production app, you might need to append /sse or similar
      // and handle headers for authentication.
      const url = new URL(MCP_URL);
      if (this.authToken) {
        url.searchParams.append('token', this.authToken);
      }

      this.transport = new SSEClientTransport(url);
      this.client = new Client(
        {
          name: "yt-performance-dashboard",
          version: "1.0.0",
        },
        {
          capabilities: {},
        }
      );

      await this.client.connect(this.transport);
      console.log("Connected to vidIQ MCP server");
    } catch (error) {
      console.error("Failed to connect to vidIQ MCP:", error);
      throw error;
    }
  }

  async callTool(name, args = {}) {
    if (!this.client) await this.connect();
    return await this.client.callTool({
      name,
      arguments: args,
    });
  }

  /**
   * Fetches keyword research, channel performance, and top video data
   */
  async getAnalysisContext(channelId) {
    try {
      const stats = await this.callTool("channel_stats", { channel_id: channelId });
      
      // Fetch high performing "outlier" videos
      const outliers = await this.callTool("outlier_detection", { 
        channel_id: channelId,
        limit: 3 
      });

      // Fetch latest uploads to check recent performance
      const recentVideos = await this.callTool("channel_videos", { 
        channel_id: channelId,
        limit: 5,
        sort_by: "most_viewed" 
      });

      const keywords = await this.callTool("keyword_research", { 
        query: "youtube growth", 
        limit: 5 
      });

      return {
        stats: stats.content,
        outliers: outliers.content,
        recentVideos: recentVideos.content,
        keywords: keywords.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.warn("vidIQ tool call failed, proceeding with dashboard data only:", error);
      return null;
    }
  }

  async disconnect() {
    if (this.transport) {
      await this.transport.close();
    }
  }
}

export const vidiq = new VidIQClient();
