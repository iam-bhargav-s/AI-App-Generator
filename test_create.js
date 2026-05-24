async function test() {
  console.log('Sending request to create app...');
  const res = await fetch('http://localhost:3000/api/apps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Tracker',
      description: 'Track items'
    })
  });
  const data = await res.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}
test();
