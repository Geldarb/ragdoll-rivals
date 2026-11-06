import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { WebSocketServer } from 'ws';
import { RoomManager } from './rooms.js';
import { VERSION } from '../shared/rules.js';
export function createServer(){
 const app=express();app.get('/health',(req,res)=>res.json({ok:true,version:VERSION}));app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)),'../public')));
 const server=http.createServer(app),wss=new WebSocketServer({server,maxPayload:32*1024}),rooms=new RoomManager();
 wss.on('connection',ws=>{ws.on('message',data=>{let m;try{m=JSON.parse(data.toString());}catch{return rooms.error(ws,'Message was not valid JSON.');}if(!m||typeof m.type!=='string')return rooms.error(ws,'Unknown message.');switch(m.type){case'createRoom':rooms.create(ws,m.build);break;case'joinRoom':rooms.join(ws,m.code,m.build);break;case'computer':rooms.computer(ws,m.build);break;case'rematch':rooms.rematch(ws);break;default:rooms.error(ws,'Unknown message.');}});ws.on('close',()=>rooms.close(ws));ws.on('error',()=>{});});
 server.on('close',()=>{for(const ws of wss.clients)ws.terminate();for(const r of rooms.rooms.values()){clearInterval(r.timer);clearTimeout(r.disconnect);}wss.close();});return server;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const port=Number(process.env.PORT)||3000;createServer().listen(port,()=>console.log(`Ragdoll Rivals listening on http://localhost:${port}`));}
