import {google} from 'googleapis';
import {env} from '../config/env.js';

const configured=Boolean(
  env.googleSheetsSpreadsheetId&&
  env.googleServiceAccountEmail&&
  env.googleServiceAccountPrivateKey
);

const tabs={
  clients:{
    name:env.googleSheetsSheetName,
    headers:['Client ID','Name','Email','Phone','Signup Date','Last Login','Status']
  },
  bookings:{
    name:env.googleSheetsBookingsSheetName,
    headers:['Booking ID','Schedule ID','Customer Name','Email','Phone','Notes','Status','Created At']
  },
  contacts:{
    name:env.googleSheetsContactsSheetName,
    headers:['Message ID','Name','Email','Phone','Message','Status','Created At']
  }
};

function getSheets(){
  if(!configured) return null;
  const auth=new google.auth.GoogleAuth({
    credentials:{
      client_email:env.googleServiceAccountEmail,
      private_key:env.googleServiceAccountPrivateKey.replace(/\\n/g,'\n')
    },
    scopes:['https://www.googleapis.com/auth/spreadsheets']
  });
  return google.sheets({version:'v4',auth});
}

async function ensureTab(sheets,tab){
  const spreadsheet=await sheets.spreadsheets.get({
    spreadsheetId:env.googleSheetsSpreadsheetId,
    fields:'sheets.properties'
  });
  const exists=(spreadsheet.data.sheets||[]).some(
    sheet=>sheet.properties?.title===tab.name
  );

  if(!exists){
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId:env.googleSheetsSpreadsheetId,
      requestBody:{requests:[{addSheet:{properties:{title:tab.name}}}]}
    });
  }

  const result=await sheets.spreadsheets.values.get({
    spreadsheetId:env.googleSheetsSpreadsheetId,
    range:`${tab.name}!A1:${String.fromCharCode(64+tab.headers.length)}1`
  });
  const current=result.data.values?.[0]||[];

  if(current.length===tab.headers.length&&tab.headers.every((value,index)=>current[index]===value)) return;

  await sheets.spreadsheets.values.update({
    spreadsheetId:env.googleSheetsSpreadsheetId,
    range:`${tab.name}!A1:${String.fromCharCode(64+tab.headers.length)}1`,
    valueInputOption:'RAW',
    requestBody:{values:[tab.headers]}
  });
}

export function isGoogleSheetsConfigured(){return configured;}

export async function setupGoogleSheets(){
  const sheets=getSheets();
  if(!sheets) return false;
  await ensureTab(sheets,tabs.clients);
  await ensureTab(sheets,tabs.bookings);
  await ensureTab(sheets,tabs.contacts);
  return true;
}

export async function recordClientSignup({id,name,email,phone,createdAt}){
  const sheets=getSheets();
  if(!sheets) return;
  await ensureTab(sheets,tabs.clients);
  await sheets.spreadsheets.values.append({
    spreadsheetId:env.googleSheetsSpreadsheetId,
    range:`${tabs.clients.name}!A:G`,
    valueInputOption:'USER_ENTERED',
    insertDataOption:'INSERT_ROWS',
    requestBody:{values:[[id,name,email,phone||'',createdAt,'','Active']]}
  });
}

export async function recordClientLogin({email,lastLogin}){
  const sheets=getSheets();
  if(!sheets) return;
  await ensureTab(sheets,tabs.clients);

  const result=await sheets.spreadsheets.values.get({
    spreadsheetId:env.googleSheetsSpreadsheetId,
    range:`${tabs.clients.name}!A:G`
  });
  const rows=result.data.values||[];
  const rowIndex=rows.findIndex(
    (row,index)=>index>0&&String(row[2]||'').toLowerCase()===email.toLowerCase()
  );
  if(rowIndex===-1) return;

  await sheets.spreadsheets.values.update({
    spreadsheetId:env.googleSheetsSpreadsheetId,
    range:`${tabs.clients.name}!F${rowIndex+1}`,
    valueInputOption:'USER_ENTERED',
    requestBody:{values:[[lastLogin]]}
  });
}

export async function recordBooking({
  id,scheduleId,customerName,email,phone,notes,status,createdAt
}){
  const sheets=getSheets();
  if(!sheets) return;
  await ensureTab(sheets,tabs.bookings);
  await sheets.spreadsheets.values.append({
    spreadsheetId:env.googleSheetsSpreadsheetId,
    range:`${tabs.bookings.name}!A:H`,
    valueInputOption:'USER_ENTERED',
    insertDataOption:'INSERT_ROWS',
    requestBody:{
      values:[[id,scheduleId,customerName,email,phone||'',notes||'',status,createdAt]]
    }
  });
}

export async function recordContactMessage({
  id,name,email,phone,message,status,createdAt
}){
  const sheets=getSheets();
  if(!sheets) return;
  await ensureTab(sheets,tabs.contacts);
  await sheets.spreadsheets.values.append({
    spreadsheetId:env.googleSheetsSpreadsheetId,
    range:`${tabs.contacts.name}!A:G`,
    valueInputOption:'USER_ENTERED',
    insertDataOption:'INSERT_ROWS',
    requestBody:{
      values:[[id,name,email,phone||'',message,status,createdAt]]
    }
  });
}
