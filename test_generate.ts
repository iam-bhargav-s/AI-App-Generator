import * as fs from 'fs';
import * as path from 'path';

// Manual mock of dotenv since it might not be installed globally
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let key = match[1];
      let value = match[2] || '';
      // Remove quotes
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

import { generateConfigWithLLM } from './src/lib/appScaffolder';

async function test() {
  console.log("GEMINI_API_KEY set?", !!process.env.GEMINI_API_KEY);
  
  const name = "Coding Quiz";
  const desc = "a student friendly quiz app where they can take challenges related to coding and get score and rank at end";
  
  console.log("Starting generation...");
  const config = await generateConfigWithLLM(name, desc);
  
  if (config) {
    console.log("SUCCESS! Generated config models:");
    console.log(JSON.stringify(config.database.models, null, 2));
  } else {
    console.log("FAILED: Returned null.");
  }
}

test();
