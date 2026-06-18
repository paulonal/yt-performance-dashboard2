const fs = require('fs');
const readline = require('readline');

async function search() {
  const fileStream = fs.createReadStream('C:/Users/Paul/.gemini/antigravity/brain/fcd46575-43d3-4ced-ad29-4a72b0d621cc/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let index = 0;
  for await (const line of rl) {
    index++;
    if (line.includes('weekly_metrics') || line.includes('new_subs') || line.includes('dates')) {
      // Find JSON strings and print
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === 'CODE_ACTION' || parsed.type === 'VIEW_FILE') {
          continue; // skip file contents
        }
        if (parsed.tool_calls) {
          console.log(`[Step ${parsed.step_index}] Tool Calls:`, JSON.stringify(parsed.tool_calls).substring(0, 300));
        }
        if (parsed.content && parsed.content.includes('weekly_metrics')) {
          console.log(`[Step ${parsed.step_index}] Content snippet:`, parsed.content.substring(0, 500));
        }
      } catch (e) {}
    }
  }
}
search();
