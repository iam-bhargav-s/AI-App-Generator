import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SCHEMA_PROMPT = `
You are an expert full-stack developer and product manager architecting an application.
Based on the user's prompt, design a robust, feature-rich workspace application. If the prompt is brief (e.g. "ecommerce" or "bakery shop"), expand it internally into a complete, professional application specification.

RULES:
- Return ONLY valid JSON. Do not include markdown formatting or backticks.
- The root object must contain three keys:
  1. "expandedDescription" (string): A detailed, 3-4 sentence product specification explaining the expanded features, models, and design of the application you designed.
  2. "database" (object): The database models.
  3. "prebuiltSeedData" (object): Mock records for each model.
- "database" must contain "models" (array of objects).
- Models must have a 'name' (string) and 'fields' (array of objects).
- Fields must have 'name' (string) and 'type' (string, e.g. 'String', 'Int', 'Boolean', 'DateTime').
- Each model can optionally have a 'ui' object specifying its preferred 'chartType' (must be one of: 'bar', 'pie', 'line'). If not specified, default is 'bar'.
- Generate at least 3-5 comprehensive models for the application.
- "prebuiltSeedData" must contain mock data mapped to each model's name. You MUST generate 8-10 mock data records for each model.
- Make sure each record includes all fields defined in the model, with mock values matching the field's data type (e.g. realistic strings for 'String', integers/floats for 'Int', boolean true/false for 'Boolean', and ISO date strings for 'DateTime').

EXAMPLE INPUT:
"a simple ecommerce for digital items"

EXAMPLE OUTPUT:
{
  "expandedDescription": "A comprehensive digital marketplace and e-commerce application allowing authors and creators to upload products, track order pipelines, manage customers, and monitor total sales metrics over time.",
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
  },
  "prebuiltSeedData": {
    "Product": [
      { "name": "E-Book: Guide to Next.js", "sku": "DIG-PROD-001", "price": 29, "stock": 100, "category": "Books" },
      { "name": "React Dashboard Template", "sku": "DIG-PROD-002", "price": 49, "stock": 50, "category": "Templates" },
      { "name": "SVG Icon Pack", "sku": "DIG-PROD-003", "price": 12, "stock": 250, "category": "Icons" },
      { "name": "UI Kit Figma Library", "sku": "DIG-PROD-004", "price": 79, "stock": 80, "category": "Design" },
      { "name": "SaaS Boilerplate", "sku": "DIG-PROD-005", "price": 149, "stock": 30, "category": "Boilerplates" }
    ],
    "Order": [
      { "orderNumber": "ORD-001", "totalAmount": 29, "status": "Completed" },
      { "orderNumber": "ORD-002", "totalAmount": 128, "status": "Completed" },
      { "orderNumber": "ORD-003", "totalAmount": 12, "status": "Pending" },
      { "orderNumber": "ORD-004", "totalAmount": 79, "status": "Completed" },
      { "orderNumber": "ORD-005", "totalAmount": 149, "status": "Failed" }
    ],
    "Customer": [
      { "email": "john@example.com", "fullName": "John Doe", "phone": "555-0199" },
      { "email": "jane@example.com", "fullName": "Jane Smith", "phone": "555-0188" },
      { "email": "alice@example.com", "fullName": "Alice Johnson", "phone": "555-0177" },
      { "email": "bob@example.com", "fullName": "Bob Miller", "phone": "555-0166" },
      { "email": "charlie@example.com", "fullName": "Charlie Brown", "phone": "555-0155" }
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
    return { success: true, data: parsedDatabase };
  } catch (error: any) {
    console.error('Gemini Edit Error:', error);
    return { success: false, error: error.message || 'Unknown parsing error' };
  }
}

export async function expandUserPrompt(name: string, description: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{
            text: `You are an expert product manager and software architect.
A user wants to generate an application.
App Name: "${name}"
Brief Description: "${description}"

Based on this brief name and description, expand it into a detailed, comprehensive software specification.
Specify:
1. The overall purpose of the application.
2. 3 to 5 key database models that this application will require, detailing the exact fields, data types (String, Int, Float, Boolean, DateTime), and relationships.
3. The preferred chart/visualization for each model (e.g. bar chart, line chart, pie chart) to represent the metrics of these models.
4. Specific mock data scenarios that would make this app look fully functional and realistic.

Make the description highly detailed, precise, and structured so a code generator can build a complete, production-ready schema and seed data from it. Keep the response text concise but comprehensive.`
          }]
        }
      ]
    });
    return response.text || description || name;
  } catch (error) {
    console.error('Failed to expand prompt:', error);
    return description || name;
  }
}
