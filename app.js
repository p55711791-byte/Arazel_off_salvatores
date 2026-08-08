const ranks = [
  {id:10, name:"Server Admin", access:"full", teamspeak:false},
  {id:9, name:"Zakhar Asli", access:"full", teamspeak:false},
  {id:8, name:"Boss", access:"full", teamspeak:false},
  {id:7, name:"Moaven", access:"full", teamspeak:false},
  {id:6, name:"Khalf Kar", access:"full", teamspeak:false},
  {id:5, name:"Khon Sard", access:"full", teamspeak:false},
  {id:4, name:"Zorgir", access:"full", teamspeak:false},
  {id:3, name:"Gardan Koloft", access:"low", teamspeak:false},
  {id:2, name:"Lat", access:"low", teamspeak:false},
  {id:1, name:"Noche", access:"low", teamspeak:false}
];

const memberNames = [
  "Ali Error","Papayo yo","Ashraf tak","Kasra ssss","Amir borna",
  "Amir thornador","Ali borna","Sam tsn","Mostafa zamini","Zaki mss"
];

let members = memberNames.map((name, i) => ({
  id:i+1, name, rank:1, online:i % 3 !== 0
}));

let logs = [
  ["20:07:12","Admin","Ali Error","Rank assigned","Noche","Success"],
  ["19:52:44","Admin","Papayo yo","Permission sync","Locker Access","Success"],
  ["19:40:18","Admin","Ashraf tak","Member online","TeamSpeak","Connected"],
  ["19:21:03","Admin","Kasra ssss","Locker access","Main Locker","Granted"],
  ["18:55:39","Admin","Amir borna","Member added","Arazel","Success"]
];

let serverLogs = [
  ["20:07:12","SERVER","Ali Error connected to TeamSpeak","ts://channel/General"],
  ["20:06:58","SERVER","Papayo yo moved to Gang channel","Gang Room"],
  ["20:05:31","ADMIN","Admin changed rank","Ali Error → Noche"],
  ["19:52:44","SERVER","Papayo yo permission sync","Locker Access"],
  ["19:40:18","SERVER","Ashraf tak connected","TeamSpeak"],
  ["19:21:03","ADMIN","Kasra ssss locker access granted","Main Locker"]
];

let gangLogs = [
  ["20:07:12","Ali Error","Rank assigned","Noche","Admin"],
  ["19:52:44","Papayo yo","Permission sync","Locker Access","Admin"],
  ["19:40:18","Ashraf tak","Member online","TeamSpeak","Admin"],
  ["19:21:03","Kasra ssss","Locker access","Main Locker","Admin"],
  ["18:55:39","Amir borna","Member added","Arazel","Admin"]
];

const esc = s => String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

function nowTime(){
  return new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"});
}

function rankById(id){
  return ranks.find(r => r.id === id) || ranks[ranks.length-1];
}

function showView(view){
  document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));
  document.getElementById(view+"View").classList.add("active");
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.view===view));
  const names={
    dashboard:["Dashboard","Arazel command center"],
    members:["Members","10 accounts · rank management"],
    permissions:["Permission Logs","Every permission change is recorded"],
    ganglogs:["Gang / Locker Logs","Activity history for Arazel"],
    serverlogs:["Server Log","TeamSpeak-style live event stream"],
    ranks:["Rank Changes","Assign any rank to any member"]
  };
  document.getElementById("pageTitle").textContent=names[view][0];
  document.getElementById("pageSubtitle").textContent=names[view][1];
  document.getElementById("sidebar").classList.remove("open");
}

document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>showView(b.dataset.view));
document.getElementById("menuBtn").onclick=()=>document.getElementById("sidebar").classList.toggle("open");

function renderMembers(){
  const q=document.getElementById("search").value.toLowerCase();
  const f=document.getElementById("filter").value;
  const rows=members.filter(m=>{
    const r=rankById(m.rank);
    return m.name.toLowerCase().includes(q) &&
      (f==="all" || (f==="high"&&r.access==="full") || (f==="low"&&r.access==="low"));
  }).map(m=>{
    const r=rankById(m.rank);
    return `<tr>
      <td><div class="member"><div class="member-avatar">${esc(m.name.slice(0,2).toUpperCase())}</div><b>${esc(m.name)}</b></div></td>
      <td><span class="rank-pill rank-${r.id}"><strong>#${r.id}</strong> ${esc(r.name)}</span></td>
      <td><span class="access-pill ${r.access==="full"?"full":"locker"}">${r.access==="full"?"Full Access":"Locker Access"}</span></td>
      <td><span class="access-pill ${r.teamspeak?"full":"locker"}">${r.teamspeak?"Allowed":"Denied"}</span></td>
      <td><span class="status-pill ${m.online?"":"offline"}">${m.online?"Online":"Offline"}</span></td>
      <td>
        <div class="actions">
          <select class="rank-select" onchange="setRank(${m.id},this.value)">
            ${ranks.map(x=>`<option value="${x.id}" ${x.id===m.rank?"selected":""}>#${x.id} · ${esc(x.name)}</option>`).join("")}
          </select>
          <button class="action-btn" title="Rank up" onclick="stepRank(${m.id},1)">↑</button>
          <button class="action-btn" title="Rank down" onclick="stepRank(${m.id},-1)">↓</button>
        </div>
      </td>
    </tr>`;
  }).join("");
  document.getElementById("memberRows").innerHTML=rows||'<tr><td colspan="6">No members found.</td></tr>';
}

function setRank(id, newRank){
  const m=members.find(x=>x.id===id);
  if(!m) return;
  const old=rankById(m.rank);
  const next=rankById(Number(newRank));
  if(old.id===next.id) return;
  m.rank=next.id;
  const t=nowTime();
  logs.unshift([t,"Admin",m.name,"Rank Change",`${old.name} → ${next.name}`,"Success"]);
  serverLogs.unshift([t,"ADMIN",`Rank changed for ${m.name}`,`${old.name} → ${next.name}`]);
  gangLogs.unshift([t,m.name,"Rank Change",next.name,"Admin"]);
  renderAll();
  toast(`${m.name}: ${old.name} → ${next.name}`);
}

function stepRank(id, direction){
  const m=members.find(x=>x.id===id);
  const index=ranks.findIndex(r=>r.id===m.rank);
  const nextIndex=Math.max(0,Math.min(ranks.length-1,index+direction));
  setRank(id,ranks[nextIndex].id);
}

function renderLogs(){
  document.getElementById("permissionRows").innerHTML=logs.map(l=>`
    <tr>
      <td class="mono">${esc(l[0])}</td><td>${esc(l[1])}</td><td>${esc(l[2])}</td>
      <td>${esc(l[3])}</td><td>${esc(l[4])}</td>
      <td><span class="status-pill">${esc(l[5])}</span></td>
    </tr>`).join("");

  document.getElementById("gangRows").innerHTML=gangLogs.map(l=>`
    <tr>${l.map((x,i)=>`<td class="${i===0?'mono':''}">${esc(x)}</td>`).join("")}</tr>`).join("");

  document.getElementById("serverRows").innerHTML=serverLogs.map(l=>`
    <tr>
      <td class="mono log-time">${esc(l[0])}</td>
      <td><span class="log-type ${l[1]==="ADMIN"?"admin":"server"}">${esc(l[1])}</span></td>
      <td class="server-message">${esc(l[2])}</td>
      <td class="mono">${esc(l[3])}</td>
    </tr>`).join("");
}

function renderDashboard(){
  const counts=ranks.map(r=>({r,n:members.filter(m=>m.rank===r.id).length})).filter(x=>x.n);
  document.getElementById("rankBars").innerHTML=counts.map(x=>`
    <div class="bar-row">
      <div class="bar-meta"><span>#${x.r.id} · ${esc(x.r.name)}</span><b>${x.n}</b></div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,x.n/members.length*100)}%"></div></div>
    </div>`).join("");

  document.getElementById("activity").innerHTML=serverLogs.slice(0,5).map(l=>`
    <div class="activity-item"><i class="activity-dot"></i><div>
      <b>${esc(l[2])}</b><small>${esc(l[1])} · ${esc(l[0])}</small>
    </div></div>`).join("");

  document.getElementById("totalCount").textContent=members.length;
  document.getElementById("logCount").textContent=logs.length;
  document.getElementById("highCount").textContent=members.filter(m=>rankById(m.rank).access==="full").length;
}

function renderRankGrid(){
  document.getElementById("rankGrid").innerHTML=members.map(m=>{
    const r=rankById(m.rank);
    return `<div class="rank-card">
      <div class="rank-person">
        <div class="member-avatar">${esc(m.name.slice(0,2).toUpperCase())}</div>
        <div><h3>${esc(m.name)}</h3><p><span class="rank-number">#${r.id}</span> ${esc(r.name)} · <span class="ts-inline">TeamSpeak ${r.teamspeak?"✓":"✕"}</span></p></div>
      </div>
      <select class="rank-select wide" onchange="setRank(${m.id},this.value)">
        ${ranks.map(x=>`<option value="${x.id}" ${x.id===m.rank?"selected":""}>#${x.id} · ${esc(x.name)}</option>`).join("")}
      </select>
    </div>`;
  }).join("");
}

function renderAll(){
  renderMembers();
  renderLogs();
  renderDashboard();
  renderRankGrid();
}

function toast(t){
  const el=document.getElementById("toast");
  el.textContent=t;
  el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"),2200);
}

renderAll();
