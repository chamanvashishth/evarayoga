import {Router} from 'express';
import {supabaseAdmin} from '../services/supabase.js';
import {recordBooking,isGoogleSheetsConfigured} from '../services/googleSheets.js';

const router=Router();

const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean=(value,max=500)=>typeof value==='string'?value.trim().slice(0,max):'';

router.get('/schedules',async(req,res,next)=>{
  try{
    const {data,error}=await supabaseAdmin
      .from('class_schedules')
      .select('id,starts_at,ends_at,capacity,booked_count,status,classes(id,title,duration_minutes,price)')
      .eq('status','open')
      .gt('starts_at',new Date().toISOString())
      .order('starts_at');

    if(error) throw error;
    res.json({data});
  }catch(error){next(error);}
});

router.post('/',async(req,res,next)=>{
  try{
    const schedule_id=clean(req.body?.schedule_id,100);
    const customer_name=clean(req.body?.customer_name,120);
    const email=clean(req.body?.email,254).toLowerCase();
    const phone=clean(req.body?.phone,40)||null;
    const notes=clean(req.body?.notes,2000)||null;

    if(!schedule_id||!customer_name||!email){
      return res.status(400).json({error:'schedule_id, customer_name and email are required'});
    }
    if(!emailPattern.test(email)){
      return res.status(400).json({error:'A valid email address is required'});
    }

    // Capacity and schedule state are enforced atomically in PostgreSQL.
    const {data,error}=await supabaseAdmin.rpc('create_booking',{
      p_schedule_id:schedule_id,
      p_customer_name:customer_name,
      p_email:email,
      p_phone:phone,
      p_notes:notes
    });

    if(error){
      if(['P0001','23503'].includes(error.code)){
        return res.status(409).json({error:error.message});
      }
      throw error;
    }

    const booking=Array.isArray(data)?data[0]:data;
    if(booking&&isGoogleSheetsConfigured()){
      try{
        await recordBooking({
          id:booking.id,
          scheduleId:schedule_id,
          customerName:customer_name,
          email,
          phone,
          notes,
          status:booking.status,
          createdAt:booking.created_at
        });
      }catch(sheetError){
        console.error('Google Sheets booking logging failed:',sheetError.message);
      }
    }

    res.status(201).json({message:'Booking request received',data:booking});
  }catch(error){next(error);}
});

export default router;
