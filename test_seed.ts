import { generateSeedData } from './src/lib/appScaffolder';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const models = [
    {
      name: 'Equipment',
      fields: [
        { name: 'name', type: 'String', required: true },
        { name: 'status', type: 'String', required: true },
        { name: 'cost', type: 'Float', required: false }
      ]
    }
  ];

  console.log('Generating seed data...');
  const res = await generateSeedData(models as any, 'Asset Tracker', 'Track equipment');
  console.log(JSON.stringify(res, null, 2));
}

run();
