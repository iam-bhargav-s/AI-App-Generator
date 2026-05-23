import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { triggerWorkflowEvent } from '../src/lib/workflowEngine';
import { dbWrapper } from '../src/lib/dbWrapper';

describe('Workflow Engine Tests', () => {
  const appId = 'app-123';
  const app = {
    id: appId,
    config: {
      workflows: [
        {
          id: 'wf-1',
          name: 'Webhook Notify on Create',
          trigger: {
            event: 'RECORD_CREATED',
            model: 'Customer'
          },
          actions: [
            {
              type: 'SEND_WEBHOOK',
              config: {
                url: 'https://webhook.site/test/{{id}}',
                payload: {
                  client: '{{name}}',
                  action: 'created',
                  nested: {
                    value: '{{email}}'
                  }
                }
              }
            },
            {
              type: 'LOG_EVENT',
              config: {
                message: 'Customer {{name}} was successfully created.'
              }
            }
          ]
        },
        {
          id: 'wf-2',
          name: 'Auto Update on Update',
          trigger: {
            event: 'RECORD_UPDATED',
            model: 'Order'
          },
          actions: [
            {
              type: 'UPDATE_RECORD',
              config: {
                field: 'status',
                value: 'PROCESSED'
              }
            }
          ]
        }
      ]
    }
  };

  let loggedWorkflows: any[] = [];
  let updatedRecords: { id: string; data: any }[] = [];
  let fetchedUrls: { url: string; options: any }[] = [];

  // Mocks
  let originalLogWorkflow: any;
  let originalGetRecord: any;
  let originalUpdateRecord: any;
  let originalFetch: any;

  before(() => {
    originalLogWorkflow = dbWrapper.logWorkflow;
    originalGetRecord = dbWrapper.getRecord;
    originalUpdateRecord = dbWrapper.updateRecord;
    originalFetch = global.fetch;

    dbWrapper.logWorkflow = async (appId, workflowId, name, event, status, logs) => {
      const mockLog = {
        id: 'log-1',
        appId,
        workflowId,
        name,
        event,
        status,
        logs,
        createdAt: new Date().toISOString()
      };
      loggedWorkflows.push(mockLog);
      return mockLog as any;
    };

    dbWrapper.getRecord = async (id) => {
      if (id === 'order-1') {
        return { id: 'order-1', data: { status: 'PENDING', total: 100 } };
      }
      return null;
    };

    dbWrapper.updateRecord = async (id, data) => {
      updatedRecords.push({ id, data });
      return { id, data };
    };

    // Mock global fetch
    global.fetch = async (url: any, options: any) => {
      fetchedUrls.push({ url: String(url), options });
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => 'Success',
        json: async () => ({ success: true })
      } as any;
    };
  });

  after(() => {
    dbWrapper.logWorkflow = originalLogWorkflow;
    dbWrapper.getRecord = originalGetRecord;
    dbWrapper.updateRecord = originalUpdateRecord;
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    loggedWorkflows = [];
    updatedRecords = [];
    fetchedUrls = [];
  });

  it('should ignore event when no matching workflow is registered', async () => {
    const record = { id: 'cust-1', data: { name: 'Alice' } };
    await triggerWorkflowEvent('RECORD_CREATED', 'Product', record, app);
    
    // Wait slightly because workflows run in the background (non-blocking)
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.strictEqual(loggedWorkflows.length, 0);
    assert.strictEqual(fetchedUrls.length, 0);
  });

  it('should trigger SEND_WEBHOOK and LOG_EVENT on matching RECORD_CREATED', async () => {
    const record = {
      id: 'cust-2',
      data: { name: 'Bob', email: 'bob@example.com' },
      createdAt: '2026-05-22T12:00:00Z',
      updatedAt: '2026-05-22T12:00:00Z'
    };

    await triggerWorkflowEvent('RECORD_CREATED', 'Customer', record, app);

    // Wait for the background execution
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify webhook fetch was called and template is interpolated
    assert.strictEqual(fetchedUrls.length, 1);
    assert.strictEqual(fetchedUrls[0].url, 'https://webhook.site/test/cust-2');
    const parsedPayload = JSON.parse(fetchedUrls[0].options.body);
    assert.deepStrictEqual(parsedPayload, {
      client: 'Bob',
      action: 'created',
      nested: {
        value: 'bob@example.com'
      }
    });

    // Verify workflow status was logged as SUCCESS
    assert.strictEqual(loggedWorkflows.length, 1);
    assert.strictEqual(loggedWorkflows[0].status, 'SUCCESS');
    assert.strictEqual(loggedWorkflows[0].workflowId, 'wf-1');
    assert.match(loggedWorkflows[0].logs, /Customer Bob was successfully created/);
  });

  it('should trigger UPDATE_RECORD on matching RECORD_UPDATED', async () => {
    const record = {
      id: 'order-1',
      data: { status: 'PENDING', total: 100 }
    };

    await triggerWorkflowEvent('RECORD_UPDATED', 'Order', record, app);

    // Wait for background execution
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify update was performed
    assert.strictEqual(updatedRecords.length, 1);
    assert.strictEqual(updatedRecords[0].id, 'order-1');
    assert.strictEqual(updatedRecords[0].data.status, 'PROCESSED');
    assert.strictEqual(updatedRecords[0].data.total, 100);

    // Verify status was logged as SUCCESS
    assert.strictEqual(loggedWorkflows.length, 1);
    assert.strictEqual(loggedWorkflows[0].status, 'SUCCESS');
    assert.strictEqual(loggedWorkflows[0].workflowId, 'wf-2');
  });
});
