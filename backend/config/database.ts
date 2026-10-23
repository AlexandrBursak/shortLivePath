import { defineConfig } from '@adonisjs/lucid'
export default defineConfig({
 connection: 'postgres',
 connections: {
  postgres: {
   client: 'pg',
   connection: {host:process.env.PGHOST,port:Number(process.env.PGPORT ?? 5432),user:process.env.PGUSER,password:process.env.PGPASSWORD,database:process.env.PGDATABASE},
   debug:false,
   pool:{min:0,max:5},
   migrations:{naturalSort:true,paths:['database/migrations']},
  },
 },
})
