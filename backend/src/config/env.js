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
  supabaseUrl:process.env.SUPABASE_URL,
  supabaseAnonKey:process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey:process.env.SUPABASE_SERVICE_ROLE_KEY
};
