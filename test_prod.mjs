async function run() {
  console.log('1. Creating app on Vercel...');
  const res = await fetch('https://ai-app-generator-weld.vercel.app/api/apps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Prod Test',
      description: 'a simple ecommeerce for digit items like smart phones and laptops'
    })
  });
  
  const data = await res.json();
  console.log('Create app status:', res.status);
  console.log('App ID:', data?.app?.id);
  
  if (data?.app?.id) {
    console.log('2. Generating seed data...');
    const seedRes = await fetch(`https://ai-app-generator-weld.vercel.app/api/apps/${data.app.id}/seed`, {
      method: 'POST'
    });
    const seedData = await seedRes.text();
    console.log('Seed status:', seedRes.status);
    console.log('Seed response:', seedData);
  }
}
run();
