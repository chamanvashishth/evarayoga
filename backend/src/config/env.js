import 'dotenv/config';

const required=['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY'];
for(const key of required){
  if(!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

const port=Number(process.env.PORT||4000);
if(!Number.isInteger(port)||port<1||port>65535) throw new Error('PORT must be a valid TCP port');

const nodeEnv=process.env.NODE_ENV||'development';
const corsOrigins=(process.env.CORS_ORIGIN||'http://localhost:3000,http://127.0.0.1:5500')
  .split(',')
  .map(value=>value.trim())
  .filter(Boolean);

if(nodeEnv==='production'&&corsOrigins.includes('*')){
  throw new Error('CORS_ORIGIN cannot be * in production');
}

const whatsappUrl=process.env.WHATSAPP_URL||'https://wa.me/919105144413';

export const env={
  port,
  nodeEnv,
  corsOrigins,
  whatsappUrl,
  googleSheetsSpreadsheetId:process.env.GOOGLE_SHEETS_SPREADSHEET_ID||'',
  googleSheetsSheetName:process.env.GOOGLE_SHEETS_SHEET_NAME||'Clients',
  googleSheetsBookingsSheetName:process.env.GOOGLE_SHEETS_BOOKINGS_SHEET_NAME||'Bookings',
  googleSheetsContactsSheetName:process.env.GOOGLE_SHEETS_CONTACTS_SHEET_NAME||'Contacts',
  googleServiceAccountEmail:process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL||'',
  googleServiceAccountPrivateKey:process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY||'',
  supabaseUrl:process.env.SUPABASE_URL,
  supabaseAnonKey:process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey:process.env.SUPABASE_SERVICE_ROLE_KEY
};
