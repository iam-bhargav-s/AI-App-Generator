import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SCHEMA_PROMPT = `
You are an expert full-stack developer architecting a database schema for an application.
Based on the user's prompt, generate a robust, detailed JSON schema containing the models and fields required.

RULES:
- Return ONLY valid JSON. Do not include markdown formatting or backticks.
- Models must have a 'name' (string) and 'fields' (array of objects).
- Fields must have 'name' (string) and 'type' (string, e.g. 'String', 'Int', 'Boolean', 'DateTime').
- Generate at least 3-5 comprehensive models for the application.

EXAMPLE INPUT:
"a simple ecommerce for digit items"

EXAMPLE OUTPUT:
{
  "database": {
    "models": [
      {
        "name": "Product",
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
        "fields": [
          { "name": "orderNumber", "type": "String" },
          { "name": "totalAmount", "type": "Int" },
          { "name": "status", "type": "String" }
        ]
      },
      {
        "name": "Customer",
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
    
    const parsed = JSON.parse(text);
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
The user wants to edit this schema.

CURRENT SCHEMA:
${JSON.stringify(currentConfig.database)}

INSTRUCTION:
"${instruction}"

RULES:
- Return the ENTIRE updated 'database' object as valid JSON.
- DO NOT return markdown or backticks.
- Modify, add, or remove models/fields exactly as instructed.
` }] }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error('Empty response from AI');
    
    const parsedDatabase = JSON.parse(text);
    return parsedDatabase;
  } catch (error) {
    console.error('Gemini Edit Error:', error);
    return null;
  }
}
