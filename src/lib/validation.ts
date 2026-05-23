import { dbWrapper } from './dbWrapper';

export interface FieldDefinition {
  name: string;
  type: 'String' | 'Int' | 'Float' | 'Boolean' | 'DateTime';
  required?: boolean;
  unique?: boolean;
  defaultValue?: any;
}

export interface ModelDefinition {
  name: string;
  fields: FieldDefinition[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export async function validateRecord(
  appId: string,
  modelName: string,
  data: any,
  appConfig: any,
  editingRecordId?: string
): Promise<{ isValid: boolean; errors: ValidationError[]; sanitizedData: any }> {
  const errors: ValidationError[] = [];
  const sanitizedData: any = {};

  const models: ModelDefinition[] = appConfig?.database?.models || [];
  const model = models.find((m) => m.name.toLowerCase() === modelName.toLowerCase());

  if (!model) {
    // If the model isn't in config, allow all data to prevent crashes but flag it
    return { isValid: true, errors: [], sanitizedData: data };
  }

  // Get all existing records for unique check
  let existingRecords: any[] = [];
  const hasUniqueField = model.fields.some((f) => f.unique);
  if (hasUniqueField) {
    try {
      existingRecords = await dbWrapper.getRecords(appId, modelName);
    } catch (e) {
      // If we cannot query, skip unique checks to maintain resiliency
    }
  }

  for (const field of model.fields) {
    const rawVal = data[field.name];
    
    // Check required fields
    if (field.required && (rawVal === undefined || rawVal === null || rawVal === '')) {
      if (field.defaultValue !== undefined && field.defaultValue !== '') {
        sanitizedData[field.name] = castValue(field.defaultValue, field.type);
      } else {
        errors.push({ field: field.name, message: `Field '${field.name}' is required.` });
      }
      continue;
    }

    // If optional and missing, set default or skip
    if (rawVal === undefined || rawVal === null || rawVal === '') {
      if (field.defaultValue !== undefined && field.defaultValue !== '') {
        sanitizedData[field.name] = castValue(field.defaultValue, field.type);
      } else {
        sanitizedData[field.name] = null;
      }
      continue;
    }

    // Try to cast type
    try {
      const casted = castValue(rawVal, field.type);
      
      // Check unique
      if (field.unique) {
        const duplicate = existingRecords.find((rec) => {
          if (editingRecordId && rec.id === editingRecordId) return false;
          const recData = rec.data as any;
          return recData && recData[field.name] === casted;
        });

        if (duplicate) {
          errors.push({ field: field.name, message: `Value for field '${field.name}' must be unique. '${casted}' is already taken.` });
        }
      }

      sanitizedData[field.name] = casted;
    } catch (err: any) {
      errors.push({ field: field.name, message: err.message || `Invalid format for type ${field.type}` });
    }
  }

  // Retain extra fields not defined in the schema to ensure resilience (without validation)
  for (const key of Object.keys(data)) {
    if (sanitizedData[key] === undefined) {
      sanitizedData[key] = data[key];
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData,
  };
}

function castValue(val: any, type: string): any {
  if (val === null || val === undefined) return null;

  switch (type) {
    case 'String':
      return String(val);
    case 'Int': {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) throw new Error('Value must be a valid integer.');
      return parsed;
    }
    case 'Float': {
      const parsed = parseFloat(val);
      if (isNaN(parsed)) throw new Error('Value must be a valid float.');
      return parsed;
    }
    case 'Boolean':
      if (val === 'true' || val === true || val === 1 || val === '1') return true;
      if (val === 'false' || val === false || val === 0 || val === '0') return false;
      throw new Error('Value must be a valid boolean.');
    case 'DateTime': {
      const date = new Date(val);
      if (isNaN(date.getTime())) throw new Error('Value must be a valid date.');
      return date.toISOString();
    }
    default:
      return val;
  }
}
