import { editAppSchema } from './src/lib/gemini';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function run() {
  const config = {
    database: {
      models: [
        { name: 'Product', fields: [{ name: 'name', type: 'String' }] }
      ]
    }
  };
  const result = await editAppSchema(config, "add a price field");
  console.log('Result:', result);
}
run();
