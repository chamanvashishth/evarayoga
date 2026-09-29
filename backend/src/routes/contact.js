import {Router} from 'express';
import {supabaseAdmin} from '../services/supabase.js';
import {recordContactMessage,isGoogleSheetsConfigured} from '../services/googleSheets.js';

const router=Router();
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';

router.post('/',async(req,res,next)=>{
  try{
    const name=clean(req.body?.name,120);
    const email=clean(req.body?.email,254).toLowerCase();
    const phone=clean(req.body?.phone,40)||null;
    const message=clean(req.body?.message,5000);

    if(!name||!email||!message){
      return res.status(400).json({error:'Name, email and message are required'});
    }
    if(!emailPattern.test(email)){
      return res.status(400).json({error:'A valid email address is required'});
    }

    const {data,error}=await supabaseAdmin
      .from('contact_messages')
      .insert({name,email,phone,message})
      .select('id,created_at')
      .single();

    if(error) throw error;
    if(data&&isGoogleSheetsConfigured()){
      try{
        await recordContactMessage({
          id:data.id,
          name,
          email,
          phone,
          message,
          status:'unread',
          createdAt:data.created_at
        });
      }catch(sheetError){
        console.error('Google Sheets contact logging failed:',sheetError.message);
      }
    }
    res.status(201).json({message:'Message received',data});
  }catch(error){next(error);}
});

export default router;
