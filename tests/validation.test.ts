import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { validateRecord } from '../src/lib/validation';
import { dbWrapper } from '../src/lib/dbWrapper';

describe('Validation Engine Tests', () => {
  const appConfig = {
    database: {
      models: [
        {
          name: 'Product',
          fields: [
            { name: 'name', type: 'String', required: true },
            { name: 'price', type: 'Float', required: true },
            { name: 'stock', type: 'Int', required: false, defaultValue: 10 },
            { name: 'sku', type: 'String', unique: true, required: true },
            { name: 'active', type: 'Boolean', defaultValue: true },
            { name: 'releaseDate', type: 'DateTime' }
          ]
        }
      ]
    }
  };

  const appId = 'test-app-id';

  // Mock dbWrapper.getRecords for unique constraints
  let originalGetRecords: any;
  before(() => {
    originalGetRecords = dbWrapper.getRecords;
    dbWrapper.getRecords = async (aId: string, model: string) => {
      if (aId === appId && model.toLowerCase() === 'product') {
        return [
          { id: 'rec-1', data: { name: 'Keyboard', price: 49.99, stock: 5, sku: 'KEY-123', active: true } },
          { id: 'rec-2', data: { name: 'Mouse', price: 19.99, stock: 15, sku: 'MOU-456', active: true } }
        ];
      }
      return [];
    };
  });

  after(() => {
    dbWrapper.getRecords = originalGetRecords;
  });

  it('should validate and sanitize valid data successfully', async () => {
    const data = {
      name: 'Monitor',
      price: '299.99', // should cast to float
      stock: '42', // should cast to int
      sku: 'MON-789',
      active: 'false', // should cast to boolean
      releaseDate: '2026-05-22T12:00:00Z',
      extraField: 'should remain' // extra field should be preserved
    };

    const res = await validateRecord(appId, 'Product', data, appConfig);

    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.errors.length, 0);
    assert.strictEqual(res.sanitizedData.name, 'Monitor');
    assert.strictEqual(res.sanitizedData.price, 299.99);
    assert.strictEqual(res.sanitizedData.stock, 42);
    assert.strictEqual(res.sanitizedData.sku, 'MON-789');
    assert.strictEqual(res.sanitizedData.active, false);
    assert.strictEqual(res.sanitizedData.releaseDate, '2026-05-22T12:00:00.000Z');
    assert.strictEqual(res.sanitizedData.extraField, 'should remain');
  });

  it('should flag errors when required fields are missing and have no default value', async () => {
    const data = {
      price: 29.99,
      sku: 'SKU-000'
      // name is missing
    };

    const res = await validateRecord(appId, 'Product', data, appConfig);

    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.errors.length, 1);
    assert.strictEqual(res.errors[0].field, 'name');
    assert.match(res.errors[0].message, /required/);
  });

  it('should populate default values for missing fields', async () => {
    const data = {
      name: 'Speaker',
      price: 99.99,
      sku: 'SPK-111'
      // stock and active are missing
    };

    const res = await validateRecord(appId, 'Product', data, appConfig);

    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.sanitizedData.stock, 10); // default
    assert.strictEqual(res.sanitizedData.active, true); // default
  });

  it('should fail validation on invalid type casting', async () => {
    const data = {
      name: 'Product A',
      price: 'not-a-float',
      stock: 5,
      sku: 'SKU-A'
    };

    const res = await validateRecord(appId, 'Product', data, appConfig);

    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.errors.length, 1);
    assert.strictEqual(res.errors[0].field, 'price');
    assert.match(res.errors[0].message, /valid float/);
  });

  it('should enforce unique constraints', async () => {
    const data = {
      name: 'New Keyboard',
      price: 54.99,
      sku: 'KEY-123' // duplicate SKU from rec-1
    };

    const res = await validateRecord(appId, 'Product', data, appConfig);

    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.errors.length, 1);
    assert.strictEqual(res.errors[0].field, 'sku');
    assert.match(res.errors[0].message, /unique/);
  });

  it('should allow duplicate unique field if it belongs to the record currently being edited', async () => {
    const data = {
      name: 'Updated Keyboard',
      price: 54.99,
      sku: 'KEY-123' // duplicate SKU, but editing rec-1 itself
    };

    const res = await validateRecord(appId, 'Product', data, appConfig, 'rec-1');

    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.errors.length, 0);
  });

  it('should return isValid=true and empty errors if the model definition is not found in config', async () => {
    const res = await validateRecord(appId, 'NonExistentModel', { any: 'data' }, appConfig);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.errors.length, 0);
  });
});
