import { NextRequest, NextResponse } from 'next/server';
import { dbWrapper } from '@/lib/dbWrapper';
import { getCurrentUser } from '@/lib/auth';

// Extremely fast Regex-based NLP Parser for Schema Mutations
function parseInstruction(instruction: string, config: any) {
  const text = instruction.toLowerCase();
  const models = config.database?.models || [];
  
  // E.g. "Add a priority field to the tasks table"
  const addFieldMatch = text.match(/add (?:a |an )?([a-z_]+) field to (?:the )?([a-z_]+)/i);
  if (addFieldMatch) {
    const fieldName = addFieldMatch[1];
    const modelTarget = addFieldMatch[2];
    
    // Find closest model name
    const target = models.find((m: any) => m.name.toLowerCase() === modelTarget.toLowerCase() || m.name.toLowerCase() + 's' === modelTarget.toLowerCase() || modelTarget.toLowerCase() + 's' === m.name.toLowerCase());
    
    if (target) {
      return {
        type: 'add_field',
        model: target.name,
        field: { name: fieldName, type: 'String', required: false }
      };
    }
  }

  // E.g. "remove the status field from deals"
  const removeFieldMatch = text.match(/remove (?:the )?([a-z_]+) field from (?:the )?([a-z_]+)/i);
  if (removeFieldMatch) {
    const fieldName = removeFieldMatch[1];
    const modelTarget = removeFieldMatch[2];
    
    const target = models.find((m: any) => m.name.toLowerCase() === modelTarget.toLowerCase() || m.name.toLowerCase() + 's' === modelTarget.toLowerCase());
    if (target) {
      return {
        type: 'remove_field',
        model: target.name,
        fieldName: fieldName
      };
    }
  }

  // Fallback heuristic: just add a string field to the first model if it says "add X"
  const genericAdd = text.match(/add (?:a |an )?([a-z_]+)/i);
  if (genericAdd && models.length > 0) {
    return {
      type: 'add_field',
      model: models[0].name,
      field: { name: genericAdd[1], type: 'String', required: false }
    };
  }

  return null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ appId: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { instruction } = body;
    const { appId } = await params;

    if (!instruction) {
      return NextResponse.json({ error: 'Instruction is required' }, { status: 400 });
    }

    const app = await dbWrapper.getApp(appId);
    if (!app || app.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const config = typeof app.config === 'string' ? JSON.parse(app.config) : { ...app.config };
    
    // Parse Instruction
    const mutation = parseInstruction(instruction, config);
    
    if (!mutation) {
      return NextResponse.json({ 
        error: 'Could not understand the edit instruction. Try "Add a status field to Deal" or similar.' 
      }, { status: 400 });
    }

    // Preserve History for Undo
    if (!config.history) config.history = [];
    config.history.push(JSON.parse(JSON.stringify(config.database))); // Snapshot DB state before mutation

    // Apply Mutation
    if (mutation.type === 'add_field' && mutation.field) {
      const model = config.database.models.find((m: any) => m.name === mutation.model);
      if (model && !model.fields.find((f: any) => f.name.toLowerCase() === mutation.field!.name.toLowerCase())) {
        model.fields.push(mutation.field);
      }
    } else if (mutation.type === 'remove_field' && mutation.fieldName) {
      const model = config.database.models.find((m: any) => m.name === mutation.model);
      if (model) {
        model.fields = model.fields.filter((f: any) => f.name.toLowerCase() !== mutation.fieldName!.toLowerCase());
      }
    }

    // Bump Version and Log
    config.version = (config.version || 1) + 1;
    if (!config.editHistory) config.editHistory = [];
    config.editHistory.push({
      id: Date.now(),
      text: instruction,
      status: 'success',
      timestamp: new Date().toISOString()
    });

    // Save to DB
    const updatedApp = await dbWrapper.updateApp(appId, { config });

    return NextResponse.json({ 
      success: true, 
      mutation,
      app: updatedApp
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
