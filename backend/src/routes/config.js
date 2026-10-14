import {Router} from 'express';
import {env} from '../config/env.js';

const router=Router();

router.get('/contact',(req,res)=>{
  res.json({whatsappUrl:env.whatsappUrl});
});

router.get('/whatsapp',(req,res)=>{
  res.redirect(302,env.whatsappUrl);
});

export default router;
