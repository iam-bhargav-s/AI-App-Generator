import { describe, it } from 'node:test';
import assert from 'node:assert';
import { scaffoldApp } from '../src/lib/appScaffolder';

describe('App Scaffolder Dynamic Schema Tests', () => {
  it('should parse model name and camelCase exact field names from prompt without using templates', async () => {
    const appConfig = await scaffoldApp(
      'Severity Zero Incident Logger',
      'Severity Zero Incident Logger to log incidents with severity level, description, downtime duration, and report date. Generate an Incident Form and a List View.'
    );

    // Verify model name was singularized/capitalized
    assert.strictEqual(appConfig.database.models.length, 1);
    const model = appConfig.database.models[0];
    assert.strictEqual(model.name, 'Incident');

    // Verify exact field names were parsed and camelCased
    const fieldNames = model.fields.map(f => f.name);
    assert.ok(fieldNames.includes('severityLevel'));
    assert.ok(fieldNames.includes('description'));
    assert.ok(fieldNames.includes('downtimeDuration'));
    assert.ok(fieldNames.includes('reportDate'));

    // Verify type deduction
    const severityField = model.fields.find(f => f.name === 'severityLevel');
    const downtimeField = model.fields.find(f => f.name === 'downtimeDuration');
    const reportDateField = model.fields.find(f => f.name === 'reportDate');

    assert.strictEqual(severityField?.type, 'String');
    assert.strictEqual(downtimeField?.type, 'Float'); // duration detected as Float/Int
    assert.strictEqual(reportDateField?.type, 'String'); // date detected as String

    // Verify minimalist UI views (exactly Incident Form and Incident List pages)
    assert.strictEqual(appConfig.ui.pages.length, 2);
    
    const formPage = appConfig.ui.pages.find(p => p.title.includes('Form'));
    const listPage = appConfig.ui.pages.find(p => p.title.includes('List'));

    assert.ok(formPage);
    assert.ok(listPage);

    assert.strictEqual(formPage.components[0].type, 'Form');
    assert.strictEqual(listPage.components[1].type, 'DataTable');

    // Verify mandatory CSV Import action is present
    const dataTableComponent = listPage.components.find(c => c.type === 'DataTable');
    assert.ok(dataTableComponent);
    assert.ok(dataTableComponent.props.actions?.includes('csv-import'));

    // Verify mandatory event sync workflows are created
    assert.strictEqual(appConfig.workflows.length, 1);
    assert.strictEqual(appConfig.workflows[0].trigger.model, 'Incident');
    assert.strictEqual(appConfig.workflows[0].actions[0].type, 'LOG_EVENT');
  });

  it('should fallback to safety baseline on empty/unparseable prompts and not throw fatal errors', async () => {
    const appConfig = await scaffoldApp('Fallback App', '');
    
    assert.strictEqual(appConfig.database.models.length, 1);
    assert.strictEqual(appConfig.database.models[0].name, 'Fallback');
    assert.strictEqual(appConfig.ui.pages.length, 2); // List + Form
    assert.ok(appConfig.workflows.length >= 1);
  });

  it('should strip parentheses types and modifiers from field names correctly', async () => {
    const appConfig = await scaffoldApp(
      'Asset Tracker',
      'Asset Tracker to log equipment, SerialNumber (String), assignedEmployee (String), and warrantyExpirationDate. Do NOT generate a Kanban board.'
    );

    const model = appConfig.database.models[0];
    assert.strictEqual(model.name, 'Equipment');

    const fieldNames = model.fields.map(f => f.name);
    // Ensure "String" suffix was NOT concatenated to the column names
    assert.ok(fieldNames.includes('serialNumber'));
    assert.ok(fieldNames.includes('assignedEmployee'));
    assert.ok(fieldNames.includes('warrantyExpirationDate'));
    assert.ok(!fieldNames.includes('serialNumberString'));
    assert.ok(!fieldNames.includes('assignedEmployeeString'));

    // Verify types were parsed correctly
    const serialField = model.fields.find(f => f.name === 'serialNumber');
    assert.strictEqual(serialField?.type, 'String');

    // Verify negation constraint: Kanban board must NOT be generated
    const hasKanbanPage = appConfig.ui.pages.some(p => p.title.toLowerCase().includes('board') || p.title.toLowerCase().includes('kanban'));
    assert.strictEqual(hasKanbanPage, false);

    // Verify dynamic metrics (Active Warranties generated due to warrantyExpirationDate field)
    const listPage = appConfig.ui.pages.find(p => p.title.includes('List'));
    assert.ok(listPage);
    const statsGrid = listPage.components.find(c => c.type === 'StatsGrid');
    assert.ok(statsGrid);
    const hasActiveWarranties = statsGrid.props.items?.some(it => it.label === 'Active Warranties');
    assert.strictEqual(hasActiveWarranties, true);
  });
});
