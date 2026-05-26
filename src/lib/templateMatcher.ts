export const TEMPLATE_REGISTRY = [
  {
    id: 'crm_template',
    name: 'AI CRM Starter',
    tags: ['sales', 'crm', 'deals', 'customers', 'leads', 'pipeline', 'contacts'],
    schema: {
      ui: {
        layout: 'Sidebar',
        pages: [
          {
            id: 'dashboard', title: 'Sales Dashboard', route: '/dashboard',
            components: [
              { id: 'stats', type: 'StatsGrid', props: { items: [{ label: 'Active Deals', value: '0' }] } },
              { id: 'deals_table', type: 'DataTable', props: { model: 'Deal', title: 'Pipeline' } }
            ]
          },
          {
            id: 'contacts', title: 'Contacts', route: '/contacts',
            components: [
              { id: 'contacts_table', type: 'DataTable', props: { model: 'Contact', title: 'Customers' } }
            ]
          }
        ]
      },
      database: {
        models: [
          {
            name: 'Deal',
            fields: [
              { name: 'title', type: 'String', required: true },
              { name: 'amount', type: 'Float', required: true },
              { name: 'stage', type: 'String', required: true }
            ]
          },
          {
            name: 'Contact',
            fields: [
              { name: 'name', type: 'String', required: true },
              { name: 'email', type: 'String', required: true }
            ]
          }
        ]
      }
    }
  },
  {
    id: 'hr_template',
    name: 'HR Dashboard',
    tags: ['hr', 'employees', 'people', 'onboarding', 'human resources', 'staff'],
    schema: {
      ui: {
        layout: 'Sidebar',
        pages: [
          {
            id: 'dashboard', title: 'HR Overview', route: '/dashboard',
            components: [
              { id: 'stats', type: 'StatsGrid', props: { items: [{ label: 'Total Employees', value: '0' }] } },
              { id: 'emp_table', type: 'DataTable', props: { model: 'Employee', title: 'Staff Directory' } }
            ]
          }
        ]
      },
      database: {
        models: [
          {
            name: 'Employee',
            fields: [
              { name: 'name', type: 'String', required: true },
              { name: 'role', type: 'String', required: true },
              { name: 'status', type: 'String', required: true }
            ]
          }
        ]
      }
    }
  },
  {
    id: 'inventory_template',
    name: 'Inventory System',
    tags: ['inventory', 'stock', 'warehouse', 'products', 'items', 'logistics', 'supply'],
    schema: {
      ui: {
        layout: 'Sidebar',
        pages: [
          {
            id: 'dashboard', title: 'Inventory Overview', route: '/dashboard',
            components: [
              { id: 'stats', type: 'StatsGrid', props: { items: [{ label: 'Low Stock Items', value: '0' }] } },
              { id: 'inv_table', type: 'DataTable', props: { model: 'Product', title: 'Product Catalog' } }
            ]
          }
        ]
      },
      database: {
        models: [
          {
            name: 'Product',
            fields: [
              { name: 'name', type: 'String', required: true },
              { name: 'sku', type: 'String', required: true },
              { name: 'quantity', type: 'Int', required: true }
            ]
          }
        ]
      }
    }
  }
];

export function matchTemplate(prompt: string) {
  if (!prompt) return null;
  
  const words = prompt.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ');
  
  let bestMatch = null;
  let highestScore = 0;
  
  for (const template of TEMPLATE_REGISTRY) {
    let score = 0;
    for (const tag of template.tags) {
      if (words.includes(tag)) {
        score += 2; // Exact word match
      } else if (words.some(w => w.includes(tag) || tag.includes(w) && w.length > 3)) {
        score += 1; // Partial match
      }
    }
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = template;
    }
  }
  
  // Confidence threshold: Must score at least 2 points
  if (highestScore >= 2 && bestMatch) {
    return {
      template: bestMatch,
      confidence: highestScore
    };
  }
  
  return null;
}
