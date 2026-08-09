require("dotenv").config();
const express=require("express");
const sqlite3=require("sqlite3").verbose();
const path=require("path");
const crypto=require("crypto");
const net=require("net");

const app=express();
const PORT=Number(process.env.PORT||3000);
const ADMIN_USER=process.env.ADMIN_USER||"admin";
const ADMIN_PASS=process.env.ADMIN_PASS||"change-me";
const ADMIN_TOKEN=process.env.ADMIN_TOKEN||crypto.randomBytes(32).toString("hex");

app.use(express.json({limit:"1mb"}));
app.use(express.static(path.join(__dirname,"public")));

const db=new sqlite3.Database(path.join(__dirname,"database.db"));

const defaultRanks=[
 {level:14,name:"Arazel Commander"},{level:13,name:"High Commander"},
 {level:12,name:"Commander"},{level:11,name:"Tactical Colonel"},
 {level:10,name:"Colonel"},{level:9,name:"Captain"},
 {level:8,name:"Lieutenant"},{level:7,name:"Elite Sergeant"},
 {level:6,name:"Sergeant"},{level:5,name:"Corporal"},
 {level:4,name:"Specialist"},{level:3,name:"Ranger Trainee"},
 {level:2,name:"Guard Man"},{level:1,name:"Soldier"}
];

db.serialize(()=>{
 db.run(`CREATE TABLE IF NOT EXISTS members(
  id TEXT PRIMARY KEY,name TEXT NOT NULL,rank TEXT,divisions TEXT,
  warn TEXT DEFAULT '0/3',status TEXT DEFAULT 'on-duty',
  offDutyUntil INTEGER,points INTEGER DEFAULT 0
 )`);
 db.run(`CREATE TABLE IF NOT EXISTS tickets(
  id TEXT PRIMARY KEY,type TEXT NOT NULL,playerName TEXT NOT NULL,reason TEXT,
  durationHours REAL,status TEXT DEFAULT 'pending',createdAt INTEGER
 )`);
 db.run(`CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL)`);
 db.run(`CREATE TABLE IF NOT EXISTS activity_logs(
  id TEXT PRIMARY KEY,category TEXT NOT NULL,actor TEXT,subject TEXT,
  action TEXT NOT NULL,details TEXT,createdAt INTEGER
 )`);
 db.get(`SELECT value FROM settings WHERE key='ranks'`,(e,row)=>{
  if(!row) db.run(`INSERT INTO settings(key,value) VALUES('ranks',?)`,[JSON.stringify(defaultRanks)]);
 });
});

function auth(req,res,next){
 if(req.headers["x-admin-token"]!==ADMIN_TOKEN)return res.status(401).json({error:"Unauthorized"});
 next();
}
function log(category,actor,subject,action,details=""){
 db.run(`INSERT INTO activity_logs(id,category,actor,subject,action,details,createdAt) VALUES(?,?,?,?,?,?,?)`,
 [crypto.randomUUID(),category,actor||"system",subject||"",action,details,Date.now()]);
}
function ranks(cb){
 db.get(`SELECT value FROM settings WHERE key='ranks'`,(e,row)=>{
  if(e)return cb(e);
  try{cb(null,row?JSON.parse(row.value):defaultRanks)}catch{x=>cb(null,defaultRanks)}
 });
}

/* Auth */
app.post("/api/login",(req,res)=>{
 const {username,password}=req.body||{};
 if(username===ADMIN_USER&&password===ADMIN_PASS)return res.json({success:true,token:ADMIN_TOKEN});
 res.status(401).json({error:"نام کاربری یا رمز عبور نادرست است"});
});

/* Config */
app.get("/api/config",(req,res)=>{
 ranks((e,r)=>{
  if(e)return res.status(500).json({error:e.message});
  res.json({
   brand:"Arazel",ranks:r.sort((a,b)=>b.level-a.level),
   divisions:["Special Force","Delta Force","Dispatch","Firearms","Diplomat","Air","Head Air",
   "Head Special Force","Head Delta Force","HR","Head HR","Low Special Force","Bypass"]
  });
 });
});
app.get("/api/ts/status",(req,res)=>res.json(tsClient.status()));

/* Ranks */
app.put("/api/settings/ranks",auth,(req,res)=>{
 const r=Array.isArray(req.body?.ranks)?req.body.ranks:[];
 if(!r.length||r.some(x=>!Number.isInteger(Number(x.level))||!String(x.name||"").trim()))
  return res.status(400).json({error:"رنک‌ها نامعتبر هستند"});
 const normalized=r.map(x=>({level:Number(x.level),name:String(x.name).trim()})).sort((a,b)=>b.level-a.level);
 db.run(`INSERT INTO settings(key,value) VALUES('ranks',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
 [JSON.stringify(normalized)],e=>{
  if(e)return res.status(500).json({error:e.message});
  log("system","admin","ranks","update","Rank names updated");
  res.json({success:true,ranks:normalized});
 });
});

/* Members */
app.get("/api/members",(req,res)=>{
 db.all(`SELECT * FROM members`,[],(e,rows)=>{
  if(e)return res.status(500).json({error:e.message});
  const now=Date.now();
  rows.forEach(r=>{
   if(r.status==="off-duty"&&r.offDutyUntil&&r.offDutyUntil<=now){
    r.status="on-duty";r.offDutyUntil=null;
    db.run(`UPDATE members SET status='on-duty',offDutyUntil=NULL WHERE id=?`,[r.id]);
   }
  });
  res.json(rows.map(r=>({...r,divisions:r.divisions?JSON.parse(r.divisions):[],points:r.points||0})));
 });
});
app.post("/api/members",auth,(req,res)=>{
 const {name,rank,divisions,warn}=req.body||{};
 if(!String(name||"").trim())return res.status(400).json({error:"نام الزامی است"});
 const id=crypto.randomUUID();
 db.run(`INSERT INTO members(id,name,rank,divisions,warn,status,points) VALUES(?,?,?,?,?,'on-duty',0)`,
 [id,String(name).trim(),rank||"",JSON.stringify(divisions||[]),warn||"0/3"],e=>{
  if(e)return res.status(500).json({error:e.message});
  log("member","admin",name,"create",rank||"");res.json({success:true,id});
 });
});
app.put("/api/members/:id",auth,(req,res)=>{
 const {name,rank,divisions,warn}=req.body||{};
 db.run(`UPDATE members SET name=?,rank=?,divisions=?,warn=? WHERE id=?`,
 [String(name||"").trim(),rank||"",JSON.stringify(divisions||[]),warn||"0/3",req.params.id],
 function(e){if(e)return res.status(500).json({error:e.message});if(!this.changes)return res.status(404).json({error:"پرسنل پیدا نشد"});log("member","admin",name,"update",rank||"");res.json({success:true})});
});
app.delete("/api/members/:id",auth,(req,res)=>{
 db.get(`SELECT name FROM members WHERE id=?`,[req.params.id],(e,row)=>{
  db.run(`DELETE FROM members WHERE id=?`,[req.params.id],function(x){
   if(x)return res.status(500).json({error:x.message});if(!this.changes)return res.status(404).json({error:"پرسنل پیدا نشد"});
   log("member","admin",row?.name||req.params.id,"delete");res.json({success:true});
  });
 });
});
app.put("/api/members/:id/duty",auth,(req,res)=>{
 const status=req.body?.status;
 if(status==="off-duty"){
  const h=Number(req.body?.hours);if(!h||h<=0)return res.status(400).json({error:"مدت نامعتبر"});
  const until=Date.now()+h*3600000;
  db.run(`UPDATE members SET status='off-duty',offDutyUntil=? WHERE id=?`,[until,req.params.id],function(e){
   if(e)return res.status(500).json({error:e.message});if(!this.changes)return res.status(404).json({error:"پرسنل پیدا نشد"});
   log("member","admin",req.params.id,"off-duty",`${h}h`);res.json({success:true,offDutyUntil:until});
  });
 }else{
  db.run(`UPDATE members SET status='on-duty',offDutyUntil=NULL WHERE id=?`,[req.params.id],function(e){
   if(e)return res.status(500).json({error:e.message});if(!this.changes)return res.status(404).json({error:"پرسنل پیدا نشد"});
   log("member","admin",req.params.id,"on-duty");res.json({success:true});
  });
 }
});
app.put("/api/members/:id/points",auth,(req,res)=>{
 const d=Number.parseInt(req.body?.delta,10);if(!Number.isInteger(d)||d===0)return res.status(400).json({error:"امتیاز نامعتبر"});
 db.get(`SELECT points,name FROM members WHERE id=?`,[req.params.id],(e,row)=>{
  if(e)return res.status(500).json({error:e.message});if(!row)return res.status(404).json({error:"پرسنل پیدا نشد"});
  const p=Math.max(0,(row.points||0)+d);
  db.run(`UPDATE members SET points=? WHERE id=?`,[p,req.params.id],x=>{
   if(x)return res.status(500).json({error:x.message});log("member","admin",row.name,"points",`${d>0?"+":""}${d} => ${p}`);res.json({success:true,points:p});
  });
 });
});

/* Tickets */
app.post("/api/tickets",(req,res)=>{
 const {type,playerName,reason,durationHours}=req.body||{};
 if(!["off-duty","fire"].includes(type)||!String(playerName||"").trim())return res.status(400).json({error:"درخواست نامعتبر"});
 const id=crypto.randomUUID();
 db.run(`INSERT INTO tickets(id,type,playerName,reason,durationHours,status,createdAt) VALUES(?,?,?,?,?,'pending',?)`,
 [id,type,String(playerName).trim(),String(reason||""),type==="off-duty"?Number(durationHours)||null:null,Date.now()],
 e=>{if(e)return res.status(500).json({error:e.message});res.json({success:true,id})});
});
app.get("/api/tickets",auth,(req,res)=>db.all(`SELECT * FROM tickets ORDER BY createdAt DESC`,[],(e,r)=>e?res.status(500).json({error:e.message}):res.json(r)));
app.put("/api/tickets/:id",auth,(req,res)=>{
 const status=req.body?.status;if(!["pending","approved","denied"].includes(status))return res.status(400).json({error:"وضعیت نامعتبر"});
 db.get(`SELECT * FROM tickets WHERE id=?`,[req.params.id],(e,t)=>{
  if(e)return res.status(500).json({error:e.message});if(!t)return res.status(404).json({error:"تیکت پیدا نشد"});
  db.run(`UPDATE tickets SET status=? WHERE id=?`,[status,req.params.id],x=>{
   if(x)return res.status(500).json({error:x.message});
   if(status==="approved"&&t.type==="off-duty"){
    const until=Date.now()+Number(t.durationHours||1)*3600000;
    db.run(`UPDATE members SET status='off-duty',offDutyUntil=? WHERE name=?`,[until,t.playerName]);
   }
   log("ticket","admin",t.playerName,status,t.reason||"");res.json({success:true});
  });
 });
});

/* Logs */
app.get("/api/logs",auth,(req,res)=>{
 const cat=req.query.category,limit=Math.min(500,Math.max(1,Number(req.query.limit)||200));
 const p=[];let sql=`SELECT * FROM activity_logs`;
 if(cat&&["teamspeak","locker","gang","member","ticket","system"].includes(cat)){sql+=` WHERE category=?`;p.push(cat)}
 sql+=` ORDER BY createdAt DESC LIMIT ?`;p.push(limit);
 db.all(sql,p,(e,r)=>e?res.status(500).json({error:e.message}):res.json(r));
});
app.post("/api/logs",auth,(req,res)=>{
 const {category,actor,subject,action,details}=req.body||{};
 if(!["teamspeak","locker","gang"].includes(category)||!String(action||"").trim())return res.status(400).json({error:"لاگ نامعتبر"});
 const id=crypto.randomUUID();
 db.run(`INSERT INTO activity_logs(id,category,actor,subject,action,details,createdAt) VALUES(?,?,?,?,?,?,?)`,
 [id,category,actor||"admin",subject||"",action,details||"",Date.now()],e=>e?res.status(500).json({error:e.message}):res.json({success:true,id}));
});
app.delete("/api/logs/:id",auth,(req,res)=>db.run(`DELETE FROM activity_logs WHERE id=?`,[req.params.id],function(e){
 if(e)return res.status(500).json({error:e.message});if(!this.changes)return res.status(404).json({error:"لاگ پیدا نشد"});res.json({success:true});
}));

/* TeamSpeak ServerQuery client */
function qEscape(v){
 return String(v??"").replace(/\\/g,"\\\\").replace(/ /g,"\\s").replace(/\//g,"\\/").replace(/\|/g,"\\p").replace(/\n/g,"\\n").replace(/\r/g,"\\r");
}
function qUnescape(v){
 return String(v??"").replace(/\\s/g," ").replace(/\\p/g,"|").replace(/\\n/g,"\n").replace(/\\r/g,"\r").replace(/\\//g,"/").replace(/\\\\/g,"\\");
}
function parseTokens(line){
 const out={};
 line.trim().split(" ").forEach(part=>{
  const i=part.indexOf("=");if(i<0)return;
  out[part.slice(0,i)]=qUnescape(part.slice(i+1));
 });
 return out;
}
class TeamSpeakQuery{
 constructor(){
  this.socket=null;this.buffer="";this.connected=false;this.ready=false;this.reconnectTimer=null;this.manual=false;
 }
 status(){return {connected:this.connected,ready:this.ready,host:process.env.TS_HOST||"Tsww.ir",port:Number(process.env.TS_PORT||6360),queryPort:Number(process.env.TS_QUERY_PORT||6360)}}
 start(){this.manual=false;this.connect()}
 connect(){
  if(this.socket)return;
  const host=process.env.TS_HOST||"Tsww.ir",port=Number(process.env.TS_QUERY_PORT||6360);
  this.socket=new net.Socket();this.buffer="";
  this.socket.setTimeout(20000);
  this.socket.connect(port,host);
  this.socket.on("connect",()=>{this.connected=true;this.send("version");});
  this.socket.on("data",d=>this.onData(d.toString()));
  this.socket.on("timeout",()=>this.socket?.destroy());
  this.socket.on("error",()=>{});
  this.socket.on("close",()=>{this.connected=false;this.ready=false;this.socket=null;if(!this.manual)this.schedule()});
 }
 schedule(){clearTimeout(this.reconnectTimer);this.reconnectTimer=setTimeout(()=>this.connect(),5000)}
 send(command){if(this.socket&&this.connected)this.socket.write(command+"\n")}
 onData(data){
  this.buffer+=data;
  const lines=this.buffer.split(/\r?\n/);this.buffer=lines.pop()||"";
  for(const line of lines){if(!line)continue;this.handleLine(line)}
 }
 handleLine(line){
  if(line.startsWith("TS3")||line.startsWith("Welcome"))return;
  if(line.startsWith("error ")){
   const e=parseTokens(line);if(e.id==="0"&&!this.ready){
    this.send(`login client_login_name=${qEscape(process.env.TS_QUERY_USER||"")} client_login_password=${qEscape(process.env.TS_QUERY_PASS||"")}`);
    this.send("use sid=1");
    this.send(`clientupdate client_nickname=${qEscape(process.env.TS_NICKNAME||"Arazel-Logger")}`);
    this.send("servernotifyregister event=server");
    this.ready=true;
   }
   return;
  }
  if(line.startsWith("notifycliententerview ")){
   const x=parseTokens(line);if(x.client_type==="0")log("teamspeak",x.client_nickname||x.client_unique_identifier||"","", "join",`client_id=${x.clid||""} channel=${x.ctid||""}`);
  }else if(line.startsWith("notifyclientleftview ")){
   const x=parseTokens(line);if(x.client_type==="0")log("teamspeak",x.client_nickname||x.client_unique_identifier||"","", "leave",`reasonid=${x.reasonid||""}`);
  }else if(line.startsWith("notifyclientmoved ")){
   const x=parseTokens(line);if(x.client_type==="0")log("teamspeak",x.client_nickname||x.client_unique_identifier||"","", "move",`from=${x.reasonid||""} channel=${x.ctid||""}`);
  }else if(line.startsWith("notifytextmessage ")){
   const x=parseTokens(line);log("teamspeak",x.invokername||"","", "text-message",x.msg||"");
  }
 }
}
const tsClient=new TeamSpeakQuery();
setTimeout(()=>tsClient.start(),1500);

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log(`Arazel running on http://localhost:${PORT}`));
