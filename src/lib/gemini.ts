import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SCHEMA_PROMPT = `
You are an expert full-stack developer architecting a database schema for an application.
Based on the user's prompt, generate a robust, detailed JSON schema containing the models and fields required.

RULES:
- Return ONLY valid JSON. Do not include markdown formatting or backticks.
- Models must have a 'name' (string) and 'fields' (array of objects).
- Fields must have 'name' (string) and 'type' (string, e.g. 'String', 'Int', 'Boolean', 'DateTime').
- Each model can optionally have a 'ui' object specifying its preferred 'chartType' (must be one of: 'bar', 'pie', 'line'). If not specified, default is 'bar'.
- Generate at least 3-5 comprehensive models for the application.

EXAMPLE INPUT:
"a simple ecommerce for digit items"

EXAMPLE OUTPUT:
{
  "database": {
    "models": [
      {
        "name": "Product",
        "ui": { "chartType": "pie" },
        "fields": [
          { "name": "name", "type": "String" },
          { "name": "sku", "type": "String" },
          { "name": "price", "type": "Int" },
          { "name": "stock", "type": "Int" },
          { "name": "category", "type": "String" }
        ]
      },
      {
        "name": "Order",
        "ui": { "chartType": "line" },
        "fields": [
          { "name": "orderNumber", "type": "String" },
          { "name": "totalAmount", "type": "Int" },
          { "name": "status", "type": "String" }
        ]
      },
      {
        "name": "Customer",
        "ui": { "chartType": "bar" },
        "fields": [
          { "name": "email", "type": "String" },
          { "name": "fullName", "type": "String" },
          { "name": "phone", "type": "String" }
        ]
      }
    ]
  }
}
`;

export async function generateAppSchema(prompt: string) {
  const lowerPrompt = prompt.toLowerCase();
  if (lowerPrompt.includes('hr dashboard')) {
    return {
      database: {
        models: [
          { name: 'Employee', ui: { chartType: 'pie' }, fields: [{ name: 'firstName', type: 'String' }, { name: 'lastName', type: 'String' }, { name: 'department', type: 'String' }, { name: 'joinDate', type: 'DateTime' }] },
          { name: 'TimeOff', ui: { chartType: 'bar' }, fields: [{ name: 'employeeId', type: 'String' }, { name: 'startDate', type: 'DateTime' }, { name: 'endDate', type: 'DateTime' }, { name: 'status', type: 'String' }] },
          { name: 'Payroll', ui: { chartType: 'line' }, fields: [{ name: 'employeeId', type: 'String' }, { name: 'amount', type: 'Int' }, { name: 'period', type: 'String' }] }
        ]
      }
    };
  }
  if (lowerPrompt.includes('admin panel')) {
    return {
      database: {
        models: [
          { name: 'User', ui: { chartType: 'pie' }, fields: [{ name: 'email', type: 'String' }, { name: 'role', type: 'String' }, { name: 'status', type: 'String' }] },
          { name: 'Role', ui: { chartType: 'bar' }, fields: [{ name: 'name', type: 'String' }, { name: 'permissions', type: 'String' }] },
          { name: 'AuditLog', ui: { chartType: 'line' }, fields: [{ name: 'userId', type: 'String' }, { name: 'action', type: 'String' }, { name: 'timestamp', type: 'DateTime' }] }
        ]
      }
    };
  }
  if (lowerPrompt.includes('inventory system')) {
    return {
      database: {
        models: [
          { name: 'Product', ui: { chartType: 'pie' }, fields: [{ name: 'sku', type: 'String' }, { name: 'name', type: 'String' }, { name: 'price', type: 'Int' }, { name: 'stock', type: 'Int' }] },
          { name: 'Supplier', ui: { chartType: 'bar' }, fields: [{ name: 'name', type: 'String' }, { name: 'contactEmail', type: 'String' }] },
          { name: 'Warehouse', ui: { chartType: 'pie' }, fields: [{ name: 'location', type: 'String' }, { name: 'capacity', type: 'Int' }] },
          { name: 'StockTransaction', ui: { chartType: 'line' }, fields: [{ name: 'productId', type: 'String' }, { name: 'quantity', type: 'Int' }, { name: 'type', type: 'String' }, { name: 'date', type: 'DateTime' }] }
        ]
      }
    };
  }
  if (lowerPrompt.includes('analytics workspace')) {
    return {
      database: {
        models: [
          { name: 'Metric', ui: { chartType: 'line' }, fields: [{ name: 'name', type: 'String' }, { name: 'value', type: 'Int' }, { name: 'date', type: 'DateTime' }] },
          { name: 'Report', ui: { chartType: 'pie' }, fields: [{ name: 'title', type: 'String' }, { name: 'author', type: 'String' }, { name: 'status', type: 'String' }] },
          { name: 'DashboardConfig', ui: { chartType: 'bar' }, fields: [{ name: 'layout', type: 'String' }, { name: 'theme', type: 'String' }] }
        ]
      }
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: SCHEMA_PROMPT + '\n\nUSER PROMPT: ' + prompt }] }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error('Empty response from AI');
    
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedText);
    return parsed;
  } catch (error) {
    console.error('Gemini Generation Error:', error);
    return null;
  }
}

export async function editAppSchema(currentConfig: any, instruction: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `
You are an expert full-stack developer. You are given a JSON schema representing a database.
The user wants to edit this schema or its UI properties.

CURRENT SCHEMA:
${JSON.stringify(currentConfig.database)}

INSTRUCTION:
"${instruction}"

RULES:
- Return the ENTIRE updated 'database' object as valid JSON.
- DO NOT return markdown or backticks.
- Modify, add, or remove models/fields exactly as instructed.
- If the user asks to change the UI, graph, or chart for a model (e.g. "change to pie chart", "use a line chart"), update the model's 'ui' object. Set 'ui.chartType' to 'pie', 'line', or 'bar'.
` }] }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error('Empty response from AI');
    
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedDatabase = JSON.parse(cleanedText);
    return parsedDatabase;
  } catch (error) {
    console.error('Gemini Edit Error:', error);
    return null;
  }
}
