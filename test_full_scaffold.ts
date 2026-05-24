import { scaffoldApp, generateSeedData } from './src/lib/appScaffolder';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const name = "Ecommerce Website";
  const desc = "a simple ecommeerce for digit items like smart phones and laptops";
  
  console.log('1. Scaffolding app...');
  const appConfig = await scaffoldApp(name, desc);
  console.log('Models generated:', appConfig.database.models.map((m: any) => m.name));
  
  console.log('2. Generating seed data...');
  const seedData = await generateSeedData(appConfig.database.models, name, desc);
  console.log('Seed data keys:', seedData ? Object.keys(seedData) : 'null');
  
  if (seedData) {
    for (const model of appConfig.database.models) {
      if (model.name === 'User' || model.name.includes('Activity') || model.name.includes('Log')) continue;
      
      let records = seedData[model.name];
      if (!records) {
        const key = Object.keys(seedData).find(k => k.toLowerCase() === model.name.toLowerCase());
        if (key) records = seedData[key];
      }
      if (!records) {
        const key = Object.keys(seedData).find(k => k.toLowerCase().includes(model.name.toLowerCase().replace(/s$/, '')) || model.name.toLowerCase().includes(k.toLowerCase().replace(/s$/, '')));
        if (key) records = seedData[key];
      }
      console.log(`Matched model ${model.name} to records:`, records ? records.length : 0);
    }
  }
}

run().catch(console.error);
