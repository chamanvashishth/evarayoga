import {Router} from 'express';
import {supabaseAdmin,supabasePublic} from '../services/supabase.js';
import {requireAuth} from '../middleware/auth.js';
import {recordClientLogin,recordClientSignup,isGoogleSheetsConfigured} from '../services/googleSheets.js';

const router=Router();
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';

router.post('/signup',async(req,res,next)=>{
  try{
    const name=clean(req.body?.name,120);
    const email=clean(req.body?.email,254).toLowerCase();
    const phone=clean(req.body?.phone,40)||null;
    const password=typeof req.body?.password==='string'?req.body.password:'';
    if(!name||!email||!password)return res.status(400).json({error:'Name, email and password are required'});
    if(!emailPattern.test(email))return res.status(400).json({error:'A valid email address is required'});
    if(password.length<8)return res.status(400).json({error:'Password must be at least 8 characters'});

    const {data,error}=await supabasePublic.auth.signUp({email,password,options:{data:{name,phone}}});
    if(error)return res.status(400).json({error:error.message});
    if(!data.user)return res.status(400).json({error:'Unable to create account'});

    const {data:profile,error:profileError}=await supabaseAdmin.from('profiles')
      .insert({id:data.user.id,name,email,phone,role:'client'})
      .select('id,name,email,phone,role,created_at').single();
    if(profileError){
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);
      throw profileError;
    }

    try{
      await recordClientSignup({id:profile.id,name:profile.name,email:profile.email,phone:profile.phone,createdAt:profile.created_at});
    }catch(sheetError){console.error('Google Sheets signup logging failed:',sheetError.message);}

    res.status(201).json({
      message:data.session?'Account created successfully':'Account created. Check your email to verify your account.',
      session:data.session,user:data.user,profile,googleSheetsConfigured:isGoogleSheetsConfigured()
    });
  }catch(error){next(error);}
});

router.post('/signin',async(req,res,next)=>{
  try{
    const email=clean(req.body?.email,254).toLowerCase();
    const password=typeof req.body?.password==='string'?req.body.password:'';
    if(!email||!password)return res.status(400).json({error:'Email and password are required'});
    if(!emailPattern.test(email))return res.status(400).json({error:'A valid email address is required'});

    const {data,error}=await supabasePublic.auth.signInWithPassword({email,password});
    if(error||!data.user||!data.session)return res.status(401).json({error:error?.message||'Invalid email or password'});
    const {data:profile,error:profileError}=await supabaseAdmin.from('profiles')
      .select('id,name,email,phone,role,created_at').eq('id',data.user.id).single();
    if(profileError||!profile)return res.status(403).json({error:'Account profile is missing. Please contact Evara Yoga.'});
    try{await recordClientLogin({email,lastLogin:new Date().toISOString()});}
    catch(sheetError){console.error('Google Sheets login logging failed:',sheetError.message);}
    res.json({message:'Signed in successfully',session:data.session,user:data.user,profile});
  }catch(error){next(error);}
});

router.get('/me',requireAuth,async(req,res,next)=>{
  try{
    const {data,error}=await supabaseAdmin.from('profiles').select('id,name,email,phone,role,created_at').eq('id',req.user.id).single();
    if(error||!data)return res.status(404).json({error:'Profile not found'});
    res.json({user:req.user,profile:data});
  }catch(error){next(error);}
});

export default router;
