const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const creds = JSON.parse(process.env.GOOGLE_CREDS);
const SHEET_ID = '1jE_jJTwH6SYXtoN_KJhNSK0SZ63BXtZVGUzklPHTNEU'; 

async function submitRow(rowData) {
  try {
    // Create auth client
    const authClient = new JWT({
      email: creds.client_email,
      key: creds.private_key.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Initialize document object with auth
    const doc = new GoogleSpreadsheet(SHEET_ID, authClient);

    await doc.loadInfo(); // load sheet info

    const sheet = doc.sheetsByIndex[0]; // first sheet
    await sheet.addRow(rowData);

    console.log('✅ Row added successfully');
  } catch (err) {
    console.error('❌ Error submitting row:', err);
  }
}

module.exports = { submitRow };