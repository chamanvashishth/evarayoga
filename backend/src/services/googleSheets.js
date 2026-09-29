import {google} from 'googleapis';
import {env} from '../config/env.js';

const configured=Boolean(env.googleSheetsSpreadsheetId&&env.googleServiceAccountEmail&&env.googleServiceAccountPrivateKey);
const headers=['Client ID','Name','Email','Phone','Signup Date','Last Login','Status'];

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

async function ensureHeader(sheets){
  const result=await sheets.spreadsheets.values.get({
    spreadsheetId:env.googleSheetsSpreadsheetId,
    range:`${env.googleSheetsSheetName}!A1:G1`
  });
  const current=result.data.values?.[0]||[];
  if(current.length===headers.length&&headers.every((value,index)=>current[index]===value)) return;
  await sheets.spreadsheets.values.update({
    spreadsheetId:env.googleSheetsSpreadsheetId,
    range:`${env.googleSheetsSheetName}!A1:G1`,
    valueInputOption:'RAW',
    requestBody:{values:[headers]}
  });
}

export function isGoogleSheetsConfigured(){return configured;}

export async function recordClientSignup({id,name,email,phone,createdAt}){
  const sheets=getSheets();
  if(!sheets) return;
  await ensureHeader(sheets);
  await sheets.spreadsheets.values.append({
    spreadsheetId:env.googleSheetsSpreadsheetId,
    range:`${env.googleSheetsSheetName}!A:G`,
    valueInputOption:'USER_ENTERED',
    insertDataOption:'INSERT_ROWS',
    requestBody:{values:[[id,name,email,phone||'',createdAt,'','Active']]}
  });
}

export async function recordClientLogin({email,lastLogin}){
  const sheets=getSheets();
  if(!sheets) return;
  await ensureHeader(sheets);
  const result=await sheets.spreadsheets.values.get({
    spreadsheetId:env.googleSheetsSpreadsheetId,
    range:`${env.googleSheetsSheetName}!A:G`
  });
  const rows=result.data.values||[];
  const rowIndex=rows.findIndex((row,index)=>index>0&&String(row[2]||'').toLowerCase()===email.toLowerCase());
  if(rowIndex===-1) return;
  await sheets.spreadsheets.values.update({
    spreadsheetId:env.googleSheetsSpreadsheetId,
    range:`${env.googleSheetsSheetName}!F${rowIndex+1}`,
    valueInputOption:'USER_ENTERED',
    requestBody:{values:[[lastLogin]]}
  });
}
