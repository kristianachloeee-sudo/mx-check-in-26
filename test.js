const { submitRow } = require('./sheets');

async function test() {
  const row = {
    Name: 'Kiana',
    Email: 'kiana@example.com',
    Status: 'Active',
  };

  await submitRow(row);
}

test();