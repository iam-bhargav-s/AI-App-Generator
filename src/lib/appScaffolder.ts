export interface ModelField {
  name: string;
  type: 'String' | 'Int' | 'Float' | 'Boolean';
  required: boolean;
  unique?: boolean;
}

export interface DatabaseModel {
  name: string;
  fields: ModelField[];
}

export interface StatsItem {
  label: string;
  value: string;
  change: string;
}

export interface UIComponent {
  id: string;
  type: 'StatsGrid' | 'DataTable' | 'Form' | 'Calculator' | 'Kanban' | 'Calendar' | 'Chart' | 'Checklist' | 'Notes' | 'WizardForm' | 'GalleryGrid' | 'Feed' | 'DetailView';
  props: {
    items?: StatsItem[];
    model?: string;
    columns?: string[];
    actions?: string[];
    fields?: { name: string; label: string; type: string; options?: string[] }[];
  };
}

export interface UIPage {
  id: string;
  title: string;
  route: string;
  components: UIComponent[];
}

export interface AppConfig {
  name: string;
  description: string;
  auth: {
    enabled: boolean;
    userModel?: string;
    roles?: string[];
  };
  database: {
    models: DatabaseModel[];
  };
  ui: {
    layout: string;
    pages: UIPage[];
  };
  apis: any[];
  workflows: any[];
}

// Singularize utility for model names
function singularize(word: string): string {
  const w = word.trim();
  if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.endsWith('es') && !w.endsWith('ees')) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is')) return w.slice(0, -1);
  return w;
}

// Capitalize helper
function capitalize(word: string): string {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export async function generateConfigWithLLM(name: string, description: string): Promise<AppConfig | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const hfKey = process.env.HF_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (geminiKey) {
    try {
      console.log('[Scaffolder] Calling Gemini API for strict schema generation...');
      
      const responseSchema = {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          auth: {
            type: "object",
            properties: {
              enabled: { type: "boolean" },
              userModel: { type: "string" },
              roles: { type: "array", items: { type: "string" } }
            },
            required: ["enabled"]
          },
          database: {
            type: "object",
            properties: {
              models: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    fields: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          type: { type: "string", enum: ["String", "Int", "Float", "Boolean"] },
                          required: { type: "boolean" },
                          unique: { type: "boolean" }
                        },
                        required: ["name", "type", "required"]
                      }
                    }
                  },
                  required: ["name", "fields"]
                }
              }
            },
            required: ["models"]
          },
          ui: {
            type: "object",
            properties: {
              layout: { type: "string" },
              pages: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    route: { type: "string" },
                    components: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          type: { type: "string", enum: ["StatsGrid", "DataTable", "Form", "Calculator", "Kanban", "Calendar", "Chart", "Checklist", "Notes", "WizardForm", "GalleryGrid", "Feed", "DetailView"] },
                          props: {
                            type: "object",
                            properties: {
                              model: { type: "string" },
                              columns: { type: "array", items: { type: "string" } },
                              actions: { type: "array", items: { type: "string" } },
                              fields: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    name: { type: "string" },
                                    label: { type: "string" },
                                    type: { type: "string" },
                                    options: { type: "array", items: { type: "string" } }
                                  },
                                  required: ["name", "label", "type"]
                                }
                              }
                            }
                          }
                        },
                        required: ["id", "type", "props"]
                      }
                    }
                  },
                  required: ["id", "title", "route", "components"]
                }
              }
            },
            required: ["layout", "pages"]
          },
          workflows: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                trigger: {
                  type: "object",
                  properties: {
                    event: { type: "string" },
                    model: { type: "string" }
                  },
                  required: ["event", "model"]
                },
                actions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["SEND_WEBHOOK", "LOG_EVENT", "UPDATE_RECORD"] },
                      config: { type: "object" }
                    },
                    required: ["type", "config"]
                  }
                }
              },
              required: ["id", "name", "trigger", "actions"]
            }
          }
        },
        required: ["name", "description", "auth", "database", "ui", "workflows"]
      };

      const systemPrompt = `You are a software generator. You must generate a clean application configuration in JSON format based on the user's request.
CRITICAL INSTRUCTIONS:
1. Strict Schema Generation: Parse and use the exact nouns, column names, and entities from the user's prompt. If they ask for 'Severity Levels' and 'Downtime Logs', name your database models and fields EXACTLY like that (e.g. model 'Incident' or 'DowntimeLog', fields 'severityLevel', 'downtimeDuration'). Do not map to generic fields like 'Priority' or 'Task'.
2. Separate Names from Types: Do not append type strings (like 'String' or 'Int') to field names. If a user asks for 'SerialNumber (String)' or 'SerialNumber:String', the field name must be 'serialNumber' (camelCase) and the database field type must be 'String'.
3. Generalized UI Selection: Select the most appropriate UI widget for the idea requested:
   - Use 'WizardForm' for Quizzes, Multi-step Surveys, and Onboarding.
   - Use 'GalleryGrid' for E-commerce products, Media Portfolios, and Menus.
   - Use 'Feed' for Social media timelines, Activity logs, Comment threads.
   - Use 'DetailView' for reading Blog posts, viewing User Profiles, or single product pages.
   - Use 'Kanban', 'Calendar', 'DataTable', 'Form' for standard CRM, ticketing, and scheduling tools.
4. Dynamic Stats Summary Metrics: Summary cards in the StatsGrid component must dynamically reflect model fields and prompt context. For example, if there is a warranty expiration field, generate a summary card for 'Active Warranties' or 'Expired Warranties'. If there is a price field, generate 'Total Value' or 'Average Cost'. If there is a downtime field, generate 'System Downtime'. Do not hardcode 'System Status' unless there are no relevant fields.
5. Preserve Mandatory Features:
   - Any DataTable component MUST include 'csv-import' in its actions array props (e.g. actions: ['create', 'edit', 'delete', 'csv-import']).
   - You MUST generate a default workflow in the workflows array that triggers LOG_EVENT when a record is created or updated, to ensure E2E validation passes.
6. Clean Output: Do not include any AI markers, system prompts, or references to the generator itself (like "LLM-generated" or "Antigravity").
7. Return JSON conforming to the requested schema.`;

      const userMessage = `App Name: "${name}"\nPrompt: "${description}"`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemPrompt },
                  { text: userMessage }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: responseSchema
            }
          })
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[Scaffolder] Gemini API error response:', errorText);
        return null;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.error('[Scaffolder] Gemini returned empty response parts');
        return null;
      }

      const config = JSON.parse(text) as AppConfig;
      console.log('[Scaffolder] Gemini API config successfully generated!');
      return config;
    } catch (e) {
      console.error('[Scaffolder] Gemini API invocation crashed:', e);
      return null;
    }
  }

  if (openaiKey) {
    try {
      console.log('[Scaffolder] Calling OpenAI API for strict schema generation...');
      
      const systemPrompt = `You are a software generator. You must generate a clean application configuration in JSON format based on the user's request.
CRITICAL INSTRUCTIONS:
1. Strict Schema Generation: Parse and use the exact nouns, column names, and entities from the user's prompt. If they ask for 'Severity Levels' and 'Downtime Logs', name your database models and fields EXACTLY like that (e.g. model 'Incident' or 'DowntimeLog', fields 'severityLevel', 'downtimeDuration'). Do not map to generic fields like 'Priority' or 'Task'.
2. Separate Names from Types: Do not append type strings (like 'String' or 'Int') to field names. If a user asks for 'SerialNumber (String)' or 'SerialNumber:String', the field name must be 'serialNumber' (camelCase) and the database field type must be 'String'.
3. Minimalist UI Sidebar & Negation Handling: Only generate pages/views requested by the user. If they ask for 'an Incident Form and a List View', your ui.pages must only contain these two pages (a Form component page and a DataTable component page). If the user explicitly negates a view (e.g. 'do NOT generate a Kanban board' or 'no calendar'), you must absolutely omit it. If no specific views are mentioned, default to exactly two pages: a List View (DataTable) and a Submit Form (Form).
4. Dynamic Stats Summary Metrics: Summary cards in the StatsGrid component must dynamically reflect model fields and prompt context. For example, if there is a warranty expiration field, generate a summary card for 'Active Warranties' or 'Expired Warranties'. If there is a price field, generate 'Total Value' or 'Average Cost'. If there is a downtime field, generate 'System Downtime'. Do not hardcode 'System Status' unless there are no relevant fields.
5. Preserve Mandatory Features:
   - Any DataTable component MUST include 'csv-import' in its actions array props (e.g. actions: ['create', 'edit', 'delete', 'csv-import']).
   - You MUST generate a default workflow in the workflows array that triggers LOG_EVENT when a record is created or updated, to ensure E2E validation passes.
6. Clean Output: Do not include any AI markers, system prompts, or references to the generator itself (like "LLM-generated" or "Antigravity").
7. Return JSON conforming to the requested schema.`;

      const userMessage = `App Name: "${name}"\nPrompt: "${description}"`;

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[Scaffolder] OpenAI API error response:', errorText);
        return null;
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        console.error('[Scaffolder] OpenAI returned empty message content');
        return null;
      }

      const config = JSON.parse(text) as AppConfig;
      console.log('[Scaffolder] OpenAI API config successfully generated!');
      return config;
    } catch (e) {
      console.error('[Scaffolder] OpenAI API invocation crashed:', e);
      return null;
    }
  }

  if (hfKey) {
    try {
      console.log('[Scaffolder] Calling Hugging Face API for strict schema generation...');
      
      const systemPrompt = `You are a software generator. You must generate a clean application configuration in JSON format based on the user's request.
CRITICAL INSTRUCTIONS:
1. Strict Schema Generation: Parse and use the exact nouns, column names, and entities from the user's prompt. If they ask for 'Severity Levels' and 'Downtime Logs', name your database models and fields EXACTLY like that (e.g. model 'Incident' or 'DowntimeLog', fields 'severityLevel', 'downtimeDuration'). Do not map to generic fields like 'Priority' or 'Task'.
2. Separate Names from Types: Do not append type strings (like 'String' or 'Int') to field names. If a user asks for 'SerialNumber (String)' or 'SerialNumber:String', the field name must be 'serialNumber' (camelCase) and the database field type must be 'String'.
3. Minimalist UI Sidebar & Negation Handling: Only generate pages/views requested by the user. If they ask for 'an Incident Form and a List View', your ui.pages must only contain these two pages (a Form component page and a DataTable component page). If the user explicitly negates a view (e.g. 'do NOT generate a Kanban board' or 'no calendar'), you must absolutely omit it. If no specific views are mentioned, default to exactly two pages: a List View (DataTable) and a Submit Form (Form).
4. Dynamic Stats Summary Metrics: Summary cards in the StatsGrid component must dynamically reflect model fields and prompt context. For example, if there is a warranty expiration field, generate a summary card for 'Active Warranties' or 'Expired Warranties'. If there is a price field, generate 'Total Value' or 'Average Cost'. If there is a downtime field, generate 'System Downtime'. Do not hardcode 'System Status' unless there are no relevant fields.
5. Preserve Mandatory Features:
   - Any DataTable component MUST include 'csv-import' in its actions array props (e.g. actions: ['create', 'edit', 'delete', 'csv-import']).
   - You MUST generate a default workflow in the workflows array that triggers LOG_EVENT when a record is created or updated, to ensure E2E validation passes.
6. Clean Output: Do not include any AI markers, system prompts, or references to the generator itself (like "LLM-generated" or "Antigravity").
7. Return strictly valid JSON conforming exactly to the requested structure.`;

      const userMessage = `App Name: "${name}"\nPrompt: "${description}"\n\nGenerate the JSON.`;

      const res = await fetch('https://api-inference.huggingface.co/models/Qwen/Qwen2.5-Coder-32B-Instruct/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${hfKey}`
        },
        body: JSON.stringify({
          model: 'Qwen/Qwen2.5-Coder-32B-Instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[Scaffolder] Hugging Face API error response:', errorText);
        return null;
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        console.error('[Scaffolder] Hugging Face returned empty message content');
        return null;
      }

      // HF models sometimes wrap json in markdown
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const config = JSON.parse(cleanText) as AppConfig;
      console.log('[Scaffolder] Hugging Face API config successfully generated!');
      return config;
    } catch (e) {
      console.error('[Scaffolder] Hugging Face API invocation crashed:', e);
      return null;
    }
  }

  if (groqKey) {
    try {
      console.log('[Scaffolder] Calling Groq API for strict schema generation...');
      
      const systemPrompt = `You are a software generator. You must generate a clean application configuration in JSON format based on the user's request.
CRITICAL INSTRUCTIONS:
1. Strict Schema Generation: Parse and use the exact nouns, column names, and entities from the user's prompt. If they ask for 'Severity Levels' and 'Downtime Logs', name your database models and fields EXACTLY like that (e.g. model 'Incident' or 'DowntimeLog', fields 'severityLevel', 'downtimeDuration'). Do not map to generic fields like 'Priority' or 'Task'.
2. Separate Names from Types: Do not append type strings (like 'String' or 'Int') to field names. If a user asks for 'SerialNumber (String)' or 'SerialNumber:String', the field name must be 'serialNumber' (camelCase) and the database field type must be 'String'.
3. Minimalist UI Sidebar & Negation Handling: Only generate pages/views requested by the user. If they ask for 'an Incident Form and a List View', your ui.pages must only contain these two pages (a Form component page and a DataTable component page). If the user explicitly negates a view (e.g. 'do NOT generate a Kanban board' or 'no calendar'), you must absolutely omit it. If no specific views are mentioned, default to exactly two pages: a List View (DataTable) and a Submit Form (Form).
4. Dynamic Stats Summary Metrics: Summary cards in the StatsGrid component must dynamically reflect model fields and prompt context. For example, if there is a warranty expiration field, generate a summary card for 'Active Warranties' or 'Expired Warranties'. If there is a price field, generate 'Total Value' or 'Average Cost'. If there is a downtime field, generate 'System Downtime'. Do not hardcode 'System Status' unless there are no relevant fields.
5. Preserve Mandatory Features:
   - Any DataTable component MUST include 'csv-import' in its actions array props (e.g. actions: ['create', 'edit', 'delete', 'csv-import']).
   - You MUST generate a default workflow in the workflows array that triggers LOG_EVENT when a record is created or updated, to ensure E2E validation passes.
6. Clean Output: Do not include any AI markers, system prompts, or references to the generator itself (like "LLM-generated" or "Antigravity").
7. Return strictly valid JSON conforming exactly to the requested structure.`;

      const userMessage = `App Name: "${name}"\nPrompt: "${description}"\n\nGenerate the JSON.`;

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[Scaffolder] Groq API error response:', errorText);
        return null;
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        console.error('[Scaffolder] Groq returned empty message content');
        return null;
      }

      const config = JSON.parse(text) as AppConfig;
      console.log('[Scaffolder] Groq API config successfully generated!');
      return config;
    } catch (e) {
      console.error('[Scaffolder] Groq API invocation crashed:', e);
      return null;
    }
  }

  return null;
}

function toCamelCase(str: string): string {
  const cleaned = str.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  if (!cleaned) return '';
  
  if (cleaned.includes(' ')) {
    return cleaned
      .split(/\s+/)
      .map((word, idx) => idx === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  } else {
    return cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
  }
}

function getSafetyBaseline(name: string, description: string): AppConfig {
  return {
    name: name || 'Simple Application',
    description: description || '',
    auth: { enabled: true, userModel: 'User', roles: ['Admin', 'Member'] },
    database: {
      models: [
        {
          name: 'Item',
          fields: [
            { name: 'name', type: 'String', required: true },
            { name: 'description', type: 'String', required: false }
          ]
        }
      ]
    },
    ui: {
      layout: 'Sidebar',
      pages: [
        {
          id: 'items-list-page',
          title: 'Item List',
          route: '/items-list',
          components: [
            {
              id: 'items-stats',
              type: 'StatsGrid',
              props: {
                items: [
                  { label: 'Total Items', value: '0', change: 'Live records' }
                ]
              }
            },
            {
              id: 'items-table',
              type: 'DataTable',
              props: {
                model: 'Item',
                columns: ['name', 'description'],
                actions: ['create', 'edit', 'delete', 'csv-import']
              }
            }
          ]
        },
        {
          id: 'item-form-page',
          title: 'Item Form',
          route: '/item-form',
          components: [
            {
              id: 'item-form',
              type: 'Form',
              props: {
                model: 'Item',
                fields: [
                  { name: 'name', label: 'Name', type: 'text' },
                  { name: 'description', label: 'Description', type: 'text' }
                ]
              }
            }
          ]
        }
      ]
    },
    apis: [],
    workflows: [
      {
        id: 'wf-item-sync',
        name: 'Item Sync Logger',
        trigger: { event: 'RECORD_CREATED', model: 'Item' },
        actions: [
          {
            type: 'LOG_EVENT',
            config: { message: 'New Item record was created.' }
          }
        ]
      }
    ]
  };
}

function isFeatureRequested(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  // Check globally for strong explicit negations like "do not generate a kanban"
  for (const kw of keywords) {
    if (lowerText.includes(`no ${kw}`) || lowerText.includes(`without ${kw}`) || lowerText.includes(`not generate a ${kw}`)) {
      return false;
    }
  }

  return keywords.some(keyword => {
    const index = lowerText.indexOf(keyword);
    if (index === -1) return false;
    
    // Look back to the start of the sentence for negations
    const startOfSentence = Math.max(0, lowerText.lastIndexOf('.', index), lowerText.lastIndexOf(',', index));
    const context = lowerText.slice(startOfSentence, index);
    
    const negationRegex = /\b(?:no|not|don't|dont|do not|never|without|exclude|avoid|no-)\b/i;
    return !negationRegex.test(context);
  });
}

function scaffoldAppFallback(name: string, description: string): AppConfig {
  try {
    const fullText = `${name.toLowerCase()} ${description.toLowerCase()}`;

    // 1. Identify Model Name
    let modelName = 'Item';
    
    // Check if bracket definition exists: e.g. "Incident (title, severity, downtimeDuration)"
    const bracketRegex = /(\w+)\s*\(([^)]+)\)/;
    const bracketMatch = bracketRegex.exec(fullText);
    
    let fields: ModelField[] = [];
    const fieldsAdded = new Set<string>();

    const addField = (fieldName: string, type: 'String' | 'Int' | 'Float' | 'Boolean', required = false, unique = false) => {
      const cleanName = fieldName.trim();
      if (cleanName && !fieldsAdded.has(cleanName)) {
        fields.push({ name: cleanName, type, required, unique });
        fieldsAdded.add(cleanName);
      }
    };

    const isModelBracket = bracketMatch && 
      !/^(?:string|int|integer|number|float|double|boolean|bool|required|unique)$/i.test(bracketMatch[2].trim());

    if (isModelBracket && bracketMatch) {
      modelName = capitalize(singularize(bracketMatch[1]));
      const fieldsStr = bracketMatch[2];
      
      fieldsStr.split(',').forEach(f => {
        const parts = f.trim().split(':');
        const fieldName = parts[0].trim();
        let type: 'String' | 'Int' | 'Float' | 'Boolean' = 'String';
        
        if (parts[1]) {
          const t = parts[1].trim().toLowerCase();
          if (t === 'int' || t === 'number' || t === 'integer') type = 'Int';
          else if (t === 'float' || t === 'double') type = 'Float';
          else if (t === 'boolean' || t === 'bool') type = 'Boolean';
        } else {
          const lowerF = fieldName.toLowerCase();
          if (lowerF.includes('age') || lowerF.includes('count') || lowerF.includes('quantity') || lowerF.includes('number')) {
            type = 'Int';
          } else if (lowerF.includes('price') || lowerF.includes('amount') || lowerF.includes('value') || lowerF.includes('fee')) {
            type = 'Float';
          }
        }
        
        addField(fieldName, type, fieldName.toLowerCase() === 'name' || fieldName.toLowerCase() === 'title' || fieldName.toLowerCase().includes('id'));
      });
    } else {
      // General NLP-like parser:
      // Try to match model name after nouns
      const modelRegexes = [
        /(?:log|manage|track|register|system for|app for|database of|catalog of|tracking)\s+([a-zA-Z]+)/i
      ];
      
      for (const regex of modelRegexes) {
        const match = regex.exec(description);
        if (match && match[1]) {
          const cand = capitalize(singularize(match[1]));
          if (cand && cand.length > 2 && !['App', 'System', 'Manager', 'Database', 'Tracker', 'Record'].includes(cand)) {
            modelName = cand;
            break;
          }
        }
      }

      if (modelName === 'Item') {
        // Look at app name
        const nameWords = name.split(/\s+/);
        for (const w of nameWords) {
          const cleanWord = w.replace(/[^a-zA-Z]/g, '');
          if (cleanWord.length > 2) {
            const cand = capitalize(singularize(cleanWord));
            if (cand && !['App', 'System', 'Manager', 'Database', 'Tracker', 'Record', 'Creator', 'Builder', 'Generator', 'Logger'].includes(cand)) {
              modelName = cand;
              break;
            }
          }
        }
      }

      // Extract fields:
      let fieldListText = '';
      const fieldListRegexes = [
        /(?:with|logging|registering|tracking|having|fields|columns)\s+([^.]+)/i,
        /(?:log|manage|track|register|system for|app for|database of|catalog of|tracking)\s+[a-zA-Z]+s?,\s+([^.]+)/i,
        /(?:showing|displaying|storing|containing)\s+([^.]+)/i
      ];

      for (const regex of fieldListRegexes) {
        const match = regex.exec(description);
        if (match && match[1]) {
          fieldListText = match[1];
          break;
        }
      }
      
      if (fieldListText) {
        const rawFields = fieldListText.split(/,|\band\b/);
        rawFields.forEach(rawF => {
          const cleaned = rawF.trim();
          if (!cleaned) return;
          
          let fieldName = cleaned;
          let type: 'String' | 'Int' | 'Float' | 'Boolean' | null = null;
          let required = false;
          let unique = false;

          // 1. Check for modifiers/types inside parentheses: e.g. "SerialNumber (String)" or "Name (Required)"
          const parentheticalRegex = /\(([^)]+)\)/g;
          let pMatch;
          while ((pMatch = parentheticalRegex.exec(fieldName)) !== null) {
            const inner = pMatch[1].trim().toLowerCase();
            if (inner === 'string') type = 'String';
            else if (inner === 'int' || inner === 'integer' || inner === 'number') type = 'Int';
            else if (inner === 'float' || inner === 'double') type = 'Float';
            else if (inner === 'boolean' || inner === 'bool') type = 'Boolean';
            else if (inner === 'required') required = true;
            else if (inner === 'unique') unique = true;
          }
          // Remove parentheses contents from the fieldName
          fieldName = fieldName.replace(/\([^)]*\)/g, '').trim();

          // 2. Check for type annotation with colon: e.g. "serialNumber:String"
          if (fieldName.includes(':')) {
            const parts = fieldName.split(':');
            fieldName = parts[0].trim();
            const t = parts[1].trim().toLowerCase();
            if (t === 'int' || t === 'number' || t === 'integer') type = 'Int';
            else if (t === 'float' || t === 'double') type = 'Float';
            else if (t === 'boolean' || t === 'bool') type = 'Boolean';
            else if (t === 'required') required = true;
            else if (t === 'unique') unique = true;
          }

          // 3. Remove trailing/separated type keywords like "string", "int", "integer", "float", "boolean", "bool"
          const typeKeywords = /\b(?:string|int|integer|number|float|double|boolean|bool|required|unique)\b/gi;
          const matchKeywords = fieldName.match(typeKeywords);
          if (matchKeywords) {
            matchKeywords.forEach(kw => {
              const lowerKw = kw.toLowerCase();
              if (lowerKw === 'string') type = 'String';
              else if (lowerKw === 'int' || lowerKw === 'integer' || lowerKw === 'number') type = 'Int';
              else if (lowerKw === 'float' || lowerKw === 'double') type = 'Float';
              else if (lowerKw === 'boolean' || lowerKw === 'bool') type = 'Boolean';
              else if (lowerKw === 'required') required = true;
              else if (lowerKw === 'unique') unique = true;
            });
            // Strip them
            fieldName = fieldName.replace(typeKeywords, '').trim();
          }

          // 4. Fallback type deduction from content of the remaining word
          if (type === null) {
            const lowerF = fieldName.toLowerCase();
            if (lowerF.includes('age') || lowerF.includes('count') || lowerF.includes('quantity') || lowerF.includes('number') || lowerF.includes('stock')) {
              type = 'Int';
            } else if (lowerF.includes('price') || lowerF.includes('amount') || lowerF.includes('value') || lowerF.includes('fee') || lowerF.includes('cost') || lowerF.includes('duration') || lowerF.includes('score')) {
              type = 'Float';
            } else if (lowerF.includes('completed') || lowerF.includes('done') || lowerF.includes('active') || lowerF.includes('checked') || lowerF.includes('isvalid')) {
              type = 'Boolean';
            } else {
              type = 'String';
            }
          }

          // Convert label to camelCase
          const camelName = toCamelCase(fieldName);
          if (camelName) {
            addField(camelName, type, required, unique);
          }
        });
      }
    }

    // Default primary field if none added
    let mainField = 'title';
    const lowerModel = modelName.toLowerCase();
    if (lowerModel.includes('member') || lowerModel.includes('student') || lowerModel.includes('user') || lowerModel.includes('customer') || lowerModel.includes('lead') || lowerModel.includes('guest') || lowerModel.includes('client') || lowerModel.includes('employee')) {
      mainField = 'fullName';
    } else if (lowerModel.includes('product') || lowerModel.includes('item') || lowerModel.includes('equipment') || lowerModel.includes('asset') || lowerModel.includes('inventory')) {
      mainField = 'name';
    }
    
    if (fields.length === 0) {
      addField(mainField, 'String', true);
      addField('description', 'String');
    } else {
      // Ensure at least one field is marked required without forcing a fallback column.
      if (!fields.some(f => f.required)) {
        fields[0].required = true;
      }
    }

    const database = {
      models: [{ name: modelName, fields }]
    };

    // 2. Identify UI Pages
    const pages: UIPage[] = [];
    const pageId = modelName.toLowerCase() + 's';

    // Parse exact view limitations
    const exactPagesRegex = /(?:exactly|only)\s+(one|two|three|four|\d+)\s+(?:pages|views|screens|tabs)/i;
    const exactMatch = exactPagesRegex.exec(fullText);
    const hasExactLimit = exactMatch !== null;
    const isStrictTwo = hasExactLimit && (exactMatch[1].toLowerCase() === 'two' || exactMatch[1] === '2');
    
    // Detect requested views using isFeatureRequested (supporting negations)
    let hasForm = isFeatureRequested(fullText, ['form', 'input', 'creator', 'logger', 'builder', 'submit']);
    let hasList = isFeatureRequested(fullText, ['list', 'table', 'records', 'database', 'grid', 'log view']);
    let hasKanban = isFeatureRequested(fullText, ['kanban', 'board']);
    let hasCalendar = isFeatureRequested(fullText, ['calendar', 'schedule', 'scheduler', 'booking']);
    let hasChart = isFeatureRequested(fullText, ['chart', 'graph', 'analytics']);
    let hasChecklist = isFeatureRequested(fullText, ['checklist', 'todo']);
    let hasNotes = isFeatureRequested(fullText, ['notes', 'scratchpad']);

    if (isStrictTwo) {
      hasKanban = false;
      hasCalendar = false;
      hasChart = false;
      hasChecklist = false;
      hasNotes = false;
      hasForm = true;
      hasList = true;
    }

    // Helper: generate columns list for components
    const columnsList = fields.map(f => f.name);

    if (hasForm || (!hasForm && !hasList && !hasKanban && !hasCalendar && !hasChart && !hasChecklist && !hasNotes)) {
      // Create Form Page
      pages.push({
        id: `${modelName.toLowerCase()}-form-page`,
        title: `${modelName} Form`,
        route: `/${modelName.toLowerCase()}-form`,
        components: [{
          id: `${modelName.toLowerCase()}-form`,
          type: 'Form',
          props: {
            model: modelName,
            fields: fields.map(f => ({
              name: f.name,
              label: capitalize(f.name.replace(/([A-Z])/g, ' $1')),
              type: f.type === 'Int' || f.type === 'Float' ? 'number' : (f.type === 'Boolean' ? 'select' : 'text'),
              ...(f.type === 'Boolean' ? { options: ['true', 'false'] } : {})
            }))
          }
        }]
      });
    }

    if (hasList || (!hasForm && !hasList && !hasKanban && !hasCalendar && !hasChart && !hasChecklist && !hasNotes)) {
      // Generate dynamic summary metric cards
      const statsGridItems = [];
      
      // Look for stats keywords:
      const statsPhraseRegex = /(?:metrics|stats|statistics|summary|cards|track)\s+(?:like|for|of|showing)?\s+([^.]+)/i;
      const statsMatch = statsPhraseRegex.exec(description);
      
      if (statsMatch && statsMatch[1]) {
        const candidates = statsMatch[1].split(/,|\band\b/);
        candidates.forEach(c => {
          const label = c.trim();
          if (label && label.length > 2 && label.length < 35 && !label.toLowerCase().includes('form') && !label.toLowerCase().includes('view') && !label.toLowerCase().includes('board')) {
            statsGridItems.push({
              label: capitalize(label),
              value: '0',
              change: 'Live tracking'
            });
          }
        });
      }
      
      if (statsGridItems.length === 0) {
        // Fallback dynamically from model fields
        statsGridItems.push({ label: `Total ${modelName}s`, value: '0', change: 'Live records' });
        
        const intFields = fields.filter(f => f.type === 'Int');
        const floatFields = fields.filter(f => f.type === 'Float');

        if (intFields.length > 0) {
          statsGridItems.push({ label: `Total ${capitalize(intFields[0].name.replace(/([A-Z])/g, ' $1').trim())}`, value: '0', change: 'Live count' });
        } else if (floatFields.length > 0) {
          statsGridItems.push({ label: `Average ${capitalize(floatFields[0].name.replace(/([A-Z])/g, ' $1').trim())}`, value: '0.00', change: 'Calculated metric' });
        } else {
          // General semantic fallbacks based on strings
          const hasStatus = fields.some(f => f.name === 'status' || f.name.toLowerCase().includes('stage'));
          if (hasStatus) {
            statsGridItems.push({ label: 'Pending Actions', value: '0', change: 'Requires review' });
          }
        }
      }

      // Create List View Page
      pages.push({
        id: `${pageId}-list-page`,
        title: `${modelName} List`,
        route: `/${pageId}-list`,
        components: [
          {
            id: `${pageId}-stats`,
            type: 'StatsGrid',
            props: {
              items: statsGridItems
            }
          },
          {
            id: `${pageId}-table`,
            type: 'DataTable',
            props: {
              model: modelName,
              columns: columnsList,
              actions: ['create', 'edit', 'delete', 'csv-import']
            }
          }
        ]
      });
    }

    if (hasKanban) {
      pages.push({
        id: `${pageId}-kanban-page`,
        title: `${modelName} Board`,
        route: `/${pageId}-kanban`,
        components: [{
          id: `${pageId}-kanban`,
          type: 'Kanban',
          props: {
            model: modelName,
            columns: columnsList
          }
        }]
      });
    }

    if (hasCalendar) {
      pages.push({
        id: `${pageId}-calendar-page`,
        title: `${modelName} Calendar`,
        route: `/${pageId}-calendar`,
        components: [{
          id: `${pageId}-calendar`,
          type: 'Calendar',
          props: {
            model: modelName,
            columns: columnsList
          }
        }]
      });
    }

    if (hasChart) {
      pages.push({
        id: `${pageId}-chart-page`,
        title: `${modelName} Analytics`,
        route: `/${pageId}-chart`,
        components: [{
          id: `${pageId}-chart`,
          type: 'Chart',
          props: {
            model: modelName,
            columns: columnsList
          }
        }]
      });
    }

    if (hasChecklist) {
      pages.push({
        id: `${pageId}-checklist-page`,
        title: `${modelName} Checklist`,
        route: `/${pageId}-checklist`,
        components: [{
          id: `${pageId}-checklist`,
          type: 'Checklist',
          props: {
            model: modelName,
            columns: columnsList
          }
        }]
      });
    }

    if (hasNotes) {
      pages.push({
        id: `${pageId}-notes-page`,
        title: `${modelName} Notes`,
        route: `/${pageId}-notes`,
        components: [{
          id: `${pageId}-notes`,
          type: 'Notes',
          props: {}
        }]
      });
    }

    return {
      name,
      description,
      auth: { enabled: true, userModel: 'User', roles: ['Admin', 'Member'] },
      database,
      ui: { layout: 'Sidebar', pages },
      apis: [],
      workflows: [{
        id: `wf-${modelName.toLowerCase()}-sync`,
        name: `${modelName} Sync Logger`,
        trigger: { event: 'RECORD_CREATED', model: modelName },
        actions: [{
          type: 'LOG_EVENT',
          config: { message: `New ${modelName} record was created.` }
        }]
      }]
    };
  } catch (err) {
    console.error('[Scaffolder] Fallback parser crashed, returning safety baseline:', err);
    return getSafetyBaseline(name, description);
  }
}


function postProcessConfig(config: AppConfig, prompt: string): AppConfig {
  if (!config) return config;

  const promptLower = (prompt || '').toLowerCase();
  const hasExplicitKanban = promptLower.includes('kanban') || promptLower.includes('board');

  if (config.ui && config.ui.pages) {
    config.ui.pages = config.ui.pages.map(page => {
      if (page.components) {
        page.components = page.components.map(comp => {
          if (comp.type === 'StatsGrid' && comp.props && comp.props.items) {
            comp.props.items = comp.props.items.map(item => {
              if (item.label) {
                item.label = item.label.replace(/^["']|["']$/g, '').trim();
              }
              return item;
            });
          }
          if (comp.type === 'Kanban' && !hasExplicitKanban) {
            return null;
          }
          return comp;
        }).filter(c => c !== null);
      }
      return page;
    });

    config.ui.pages = config.ui.pages.filter(page => {
      if (!page.components || page.components.length === 0) {
        return false;
      }
      if (!hasExplicitKanban) {
        const titleLower = (page.title || '').toLowerCase();
        const idLower = (page.id || '').toLowerCase();
        if (titleLower.includes('kanban') || titleLower.includes('board') || idLower.includes('kanban') || idLower.includes('board')) {
          return false;
        }
      }
      return true;
    });
  }

  return config;
}

export async function scaffoldApp(name: string, description: string): Promise<AppConfig> {
  // 1. Try LLM generation if API Key is present
  const llmConfig = await generateConfigWithLLM(name, description);
  if (llmConfig) {
    return postProcessConfig(llmConfig, description);
  }
  
  // 2. Fall back to the highly robust NLP-like heuristic parser
  const fallbackConfig = scaffoldAppFallback(name, description);
  return postProcessConfig(fallbackConfig, description);
}

export async function generateSeedData(models: DatabaseModel[], appName: string, description: string): Promise<Record<string, any[]> | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || models.length === 0) return null;

  try {
    console.log('[Scaffolder] Generating seed data with Gemini API...');
    
    // Create a dynamic schema based on the provided models
    const properties: any = {};
    const requiredModels: string[] = [];
    
    for (const model of models) {
      if (model.name === 'User' || model.name.includes('Activity') || model.name.includes('Log')) continue; // Skip auth and logs
      properties[model.name] = {
        type: "array",
        items: {
          type: "object",
          properties: {},
          required: []
        }
      };
      requiredModels.push(model.name);
      
      for (const field of model.fields) {
        if (field.name === 'id' || field.name === 'createdAt' || field.name === 'updatedAt') continue;
        properties[model.name].items.properties[field.name] = {
          type: field.type === 'Int' || field.type === 'Float' ? 'number' : field.type === 'Boolean' ? 'boolean' : 'string'
        };
        if (field.required) {
          properties[model.name].items.required.push(field.name);
        }
      }
      
      if (properties[model.name].items.required.length === 0) {
        delete properties[model.name].items.required;
      }
    }

    if (Object.keys(properties).length === 0) return null;

    const responseSchema = {
      type: "object",
      properties,
      required: requiredModels
    };

    const systemPrompt = `You are a mock data generator for a new application.
Application Name: ${appName}
Description: ${description}

CRITICAL INSTRUCTIONS:
1. Generate realistic, high-quality seed data for the provided database models.
2. Generate exactly 3 to 5 records per model.
3. Use realistic names, titles, descriptions, and values that match the context of the application.
4. For text fields, use coherent sentences, not gibberish.
5. Do not include markdown formatting or markdown code blocks in the response. Return pure JSON.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: systemPrompt }, { text: "Generate seed data in JSON format." }] }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema
          }
        })
      }
    );

    if (!res.ok) {
      console.error('[Scaffolder] Gemini API error during seed data generation:', res.statusText);
      return null;
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    return JSON.parse(text);
  } catch (error) {
    console.error('[Scaffolder] Error generating seed data:', error);
    return null;
  }
}
