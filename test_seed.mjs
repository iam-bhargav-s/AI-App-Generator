import { generateSeedData } from './src/lib/appScaffolder.js';

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

generateSeedData(models, 'Asset Tracker', 'Track equipment').then(console.log).catch(console.error);
