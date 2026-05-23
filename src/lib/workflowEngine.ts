import { dbWrapper } from './dbWrapper';

export interface WorkflowAction {
  type: 'SEND_WEBHOOK' | 'UPDATE_RECORD' | 'LOG_EVENT';
  config: {
    url?: string;
    payload?: any;
    model?: string;
    field?: string;
    value?: any;
    message?: string;
  };
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  trigger: {
    event: 'RECORD_CREATED' | 'RECORD_UPDATED' | 'RECORD_DELETED';
    model: string;
  };
  actions: WorkflowAction[];
}

// Replaces placeholders like {{field_name}} with actual data values
function interpolateTemplate(template: string | any, data: any): any {
  if (typeof template === 'string') {
    return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      const trimmedKey = key.trim();
      return data[trimmedKey] !== undefined ? String(data[trimmedKey]) : '';
    });
  }

  if (typeof template === 'object' && template !== null) {
    const result: any = Array.isArray(template) ? [] : {};
    for (const key of Object.keys(template)) {
      result[key] = interpolateTemplate(template[key], data);
    }
    return result;
  }

  return template;
}

export async function triggerWorkflowEvent(
  event: 'RECORD_CREATED' | 'RECORD_UPDATED' | 'RECORD_DELETED',
  modelName: string,
  record: any,
  app: any
) {
  const workflows: WorkflowDefinition[] = app?.config?.workflows || [];
  const matchingWorkflows = workflows.filter(
    (w) =>
      w.trigger?.event === event &&
      w.trigger?.model?.toLowerCase() === modelName.toLowerCase()
  );

  if (matchingWorkflows.length === 0) return;

  // Run each matching workflow in the background (non-blocking)
  for (const workflow of matchingWorkflows) {
    runWorkflow(workflow, record, app).catch((err) => {
      console.error(`Workflow ${workflow.name} execution failed:`, err);
    });
  }
}

async function runWorkflow(workflow: WorkflowDefinition, record: any, app: any) {
  const logs: string[] = [];
  logs.push(`[${new Date().toISOString()}] Starting workflow "${workflow.name}"`);
  logs.push(`[${new Date().toISOString()}] Triggered by ${workflow.trigger.event} on model "${workflow.trigger.model}"`);

  let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  const recordContext = {
    id: record.id,
    ...(record.data || {}),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };

  try {
    for (let i = 0; i < workflow.actions.length; i++) {
      const action = workflow.actions[i];
      logs.push(`[${new Date().toISOString()}] [Action ${i + 1}/${workflow.actions.length}] Executing action ${action.type}...`);

      switch (action.type) {
        case 'SEND_WEBHOOK': {
          if (!action.config?.url) {
            logs.push(`[Error] Webhook URL is missing.`);
            status = 'FAILED';
            break;
          }

          const targetUrl = interpolateTemplate(action.config.url, recordContext);
          const payload = interpolateTemplate(action.config.payload || {}, recordContext);

          logs.push(`[Webhook] Sending POST request to ${targetUrl}`);
          logs.push(`[Webhook] Payload: ${JSON.stringify(payload)}`);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

          try {
            const res = await fetch(targetUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            logs.push(`[Webhook] Response status: ${res.status}`);
            if (!res.ok) {
              logs.push(`[Warning] Webhook returned error status: ${res.statusText}`);
            }
          } catch (fetchErr: any) {
            clearTimeout(timeoutId);
            logs.push(`[Error] Webhook request failed: ${fetchErr.message}`);
            // Don't mark workflow failed completely if a webhook errors out, just log it
          }
          break;
        }

        case 'UPDATE_RECORD': {
          const targetField = action.config?.field;
          const targetValue = action.config?.value;

          if (!targetField) {
            logs.push(`[Error] Update field is missing.`);
            status = 'FAILED';
            break;
          }

          // Dynamic field interpolations
          const resolvedValue = typeof targetValue === 'string' 
            ? interpolateTemplate(targetValue, recordContext)
            : targetValue;

          logs.push(`[Data Update] Updating field "${targetField}" to: ${resolvedValue}`);

          // Update record in database
          const currentRecord = await dbWrapper.getRecord(record.id);
          if (currentRecord) {
            const currentData = (currentRecord.data as any) || {};
            currentData[targetField] = resolvedValue;
            await dbWrapper.updateRecord(record.id, currentData);
            logs.push(`[Data Update] Successfully updated field "${targetField}"`);
          } else {
            logs.push(`[Error] Record ${record.id} not found for updates.`);
            status = 'FAILED';
          }
          break;
        }

        case 'LOG_EVENT': {
          const logMsg = interpolateTemplate(action.config?.message || 'Event logged.', recordContext);
          logs.push(`[Logger Action] ${logMsg}`);
          break;
        }

        default:
          logs.push(`[Error] Unknown action type: ${action.type}`);
          status = 'FAILED';
      }

      if (status === 'FAILED') {
        logs.push(`[${new Date().toISOString()}] Workflow stopped due to action failure.`);
        break;
      }
    }
  } catch (error: any) {
    status = 'FAILED';
    logs.push(`[${new Date().toISOString()}] Critical workflow exception: ${error.message || error}`);
  }

  logs.push(`[${new Date().toISOString()}] Workflow finished with status: ${status}`);

  // Write log to DB
  try {
    await dbWrapper.logWorkflow(
      app.id,
      workflow.id,
      workflow.name,
      workflow.trigger.event,
      status,
      logs.join('\n')
    );
  } catch (logErr) {
    console.error('Failed to save workflow logs:', logErr);
  }
}
