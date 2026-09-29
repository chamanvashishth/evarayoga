import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import {env} from './config/env.js';
import classes from './routes/classes.js';
import instructors from './routes/instructors.js';
import testimonials from './routes/testimonials.js';
import contact from './routes/contact.js';
import bookings from './routes/bookings.js';
import admin from './routes/admin.js';
import config from './routes/config.js';
import {errorHandler,notFoundHandler} from './middleware/errorHandler.js';

export const app=express();

if(env.nodeEnv==='production') app.set('trust proxy',1);

app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}}));
app.use(cors({
  origin(origin,callback){
    if(!origin||env.corsOrigins.includes(origin)) return callback(null,true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  methods:['GET','POST','PATCH','OPTIONS'],
  allowedHeaders:['Content-Type','Authorization']
}));
app.use(express.json({limit:'1mb'}));
app.use(morgan(env.nodeEnv==='production'?'combined':'dev'));

app.get('/api/health',(req,res)=>res.json({status:'ok',service:'evara-yoga-backend',environment:env.nodeEnv}));
app.use('/api/classes',classes);
app.use('/api/instructors',instructors);
app.use('/api/testimonials',testimonials);
app.use('/api/contact',contact);
app.use('/api/bookings',bookings);
app.use('/api/admin',admin);
app.use('/api/config',config);
app.use(notFoundHandler);
app.use(errorHandler);
