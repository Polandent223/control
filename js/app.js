const KEY='micontrol_pro_v2'; // Se mantiene para conservar datos anteriores
const initialCategories=['Comida','Ropa','Compras innecesarias','Transporte','Casa','Servicios','Salud','Deudas','Negocio','Emergencias','Otros'];
const defaultData={config:{owner:'MiControl PRO',currency:'$',pin:'1234',theme:'dark',rate:120},accounts:[{id:crypto.randomUUID(),name:'Efectivo',balance:0},{id:crypto.randomUUID(),name:'Banco',balance:0}],movements:[],goals:[],categories:initialCategories};
let db=JSON.parse(localStorage.getItem(KEY)||'null')||defaultData;
db.config={...defaultData.config,...(db.config||{})};
db.accounts=db.accounts||defaultData.accounts; db.movements=db.movements||[]; db.goals=db.goals||[]; db.categories=[...new Set([...(db.categories||[]),...initialCategories])];
const $=id=>document.getElementById(id);
const rate=()=>Number(db.config.rate||0)||1;
const usd=n=>`$ ${Number(n||0).toFixed(2)}`;
const bs=n=>`Bs ${(Number(n||0)*rate()).toLocaleString('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const money=n=>db.config.currency==='Bs'?bs(n):`${db.config.currency} ${Number(n||0).toFixed(2)}`;
function amountUSD(m){ return Number(m.amountUSD ?? m.amount ?? 0); }
function save(){localStorage.setItem(KEY,JSON.stringify(db));render()}
function total(type){return db.movements.filter(m=>m.type===type).reduce((a,b)=>a+amountUSD(b),0)}
function capitalAgregado(){return total('income')}
function totalGastado(){return total('expense')}
function balance(){return db.accounts.reduce((a,b)=>a+Number(b.balance||0),0)}
function switchTab(name){document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id===name))}
function render(){
  document.body.classList.toggle('light',db.config.theme==='light');
  $('themeBtn').textContent=db.config.theme==='light'?'🌙':'☀️';
  $('ownerName').textContent=db.config.owner;
  $('cfgOwner').value=db.config.owner; $('cfgCurrency').value=db.config.currency; if($('cfgRate'))$('cfgRate').value=db.config.rate||''; if($('quickRate'))$('quickRate').value=db.config.rate||'';
  $('balanceTotal').textContent=usd(balance()); if($('balanceBs'))$('balanceBs').textContent=bs(balance()); if($('rateNow'))$('rateNow').textContent=Number(rate()).toLocaleString('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2});
  $('totalIngresos').textContent=usd(total('income')); $('totalGastos').textContent=usd(total('expense')); $('totalAhorro').textContent=usd(db.goals.reduce((a,g)=>a+Number(g.saved||0),0));
  if($('capitalAgregado')){$('capitalAgregado').textContent=usd(capitalAgregado()); $('capitalAgregadoBs').textContent=bs(capitalAgregado())}
  if($('dineroDisponible')){$('dineroDisponible').textContent=usd(balance()); $('dineroDisponibleBs').textContent=bs(balance())}
  if($('gastadoAcumulado')){$('gastadoAcumulado').textContent=usd(totalGastado()); $('gastadoAcumuladoBs').textContent=bs(totalGastado())}
  let income=capitalAgregado(), h=income?Math.max(0,Math.min(100,Math.round((balance()/income)*100))):0; $('healthScore').textContent=h+'%'; $('healthText').textContent='Disponible del capital agregado '+h+'%';
  renderMovements(); renderAccounts(); renderGoals(); renderCategories(); renderReports();
}
function formatHistorical(m){
  const r=Number(m.rate||db.config.rate||1); const u=amountUSD(m); const original = m.inputCurrency==='BS' ? `Bs ${Number(m.inputAmount||u*r).toLocaleString('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2})}` : `$ ${Number(m.inputAmount||u).toFixed(2)}`;
  return `${original} · ${usd(u)} · tasa ${Number(r).toLocaleString('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2})} Bs`;
}
function prettyDate(d){
  try{return new Date(d+'T12:00:00').toLocaleDateString('es-VE',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}catch{return d}
}
function renderMovements(){
  let q=($('searchMov').value||'').toLowerCase(), f=$('filterType').value;
  let from=$('filterFrom')?.value||'', to=$('filterTo')?.value||'';
  let list=db.movements
    .filter(m=>(f==='all'||m.type===f)
      && (`${m.desc} ${m.category}`.toLowerCase().includes(q))
      && (!from || m.date>=from)
      && (!to || m.date<=to))
    .sort((a,b)=>{
      let d=(b.date||'').localeCompare(a.date||'');
      if(d!==0)return d;
      return String(b.createdAt||'').localeCompare(String(a.createdAt||''));
    });
  if(!list.length){$('movList').innerHTML='<p class="muted">Sin movimientos todavía.</p>';return}
  let html='', last='';
  for(const m of list){
    if(m.date!==last){
      last=m.date;
      let day=list.filter(x=>x.date===m.date);
      let inc=day.filter(x=>x.type==='income').reduce((a,x)=>a+amountUSD(x),0);
      let exp=day.filter(x=>x.type==='expense').reduce((a,x)=>a+amountUSD(x),0);
      html+=`<div class="date-group"><div><b>${prettyDate(m.date)}</b><small>${m.date}</small></div><div><span class="plus">+ ${usd(inc)}</span><span class="minus">- ${usd(exp)}</span></div></div>`;
    }
    html+=`<div class="item"><div><b>${m.desc||m.category}</b><br><small>${m.category} · ${accountName(m.accountId)}</small><br><small>${formatHistorical(m)}</small></div><div><div class="amount ${m.type==='income'?'plus':'minus'}">${m.type==='income'?'+':'-'} ${usd(amountUSD(m))}</div><small>${bs(amountUSD(m))}</small><br><button class="secondary" onclick="delMovement('${m.id}')">Eliminar</button></div></div>`;
  }
  $('movList').innerHTML=html;
}
function renderAccounts(){let opts=db.accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');$('mAccount').innerHTML=opts;$('accountList').innerHTML=db.accounts.map(a=>`<div class="item"><div><b>${a.name}</b><br><small>Saldo disponible</small></div><div><div class="amount plus">${usd(a.balance)}</div><small>${bs(a.balance)}</small><br><button class="secondary" onclick="delAccount('${a.id}')">Eliminar</button></div></div>`).join('')||'<p class="muted">Sin cuentas.</p>';}

function renderCategories(){
  const select=$('mCategory');
  if(select) select.innerHTML=db.categories.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  const quick=['Comida','Ropa','Compras innecesarias','Transporte','Servicios','Salud'];
  if($('quickCategoryChips')) $('quickCategoryChips').innerHTML=quick.map(c=>`<button class="chip" onclick="addCategory('${c.replace(/'/g,"\\'")}')">${escapeHtml(c)}</button>`).join('');
  if($('categoryList')) $('categoryList').innerHTML=db.categories.map(c=>`<div class="item"><div><b>${escapeHtml(c)}</b><br><small>Disponible para registrar gastos y reportes</small></div><button class="secondary" onclick="delCategory('${c.replace(/'/g,"\\'")}')">Eliminar</button></div>`).join('')||'<p class="muted">Sin categorías.</p>';
}
function escapeHtml(t){return String(t||'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]))}
function addCategory(name){
  name=(name||$('newCategoryName')?.value||'').trim();
  if(!name)return alert('Escribe el nombre de la categoría.');
  if(!db.categories.some(c=>c.toLowerCase()===name.toLowerCase())) db.categories.push(name);
  if($('newCategoryName')) $('newCategoryName').value='';
  save();
}
function delCategory(name){
  if(db.movements.some(m=>m.category===name)) return alert('Esta categoría ya tiene movimientos. No la elimino para no dañar el historial.');
  if(db.categories.length<=1)return alert('Debes dejar al menos una categoría.');
  db.categories=db.categories.filter(c=>c!==name);
  save();
}

function renderGoals(){
  $('goalList').innerHTML=db.goals.map(g=>{
    let pct=Math.min(100,Math.round((Number(g.saved||0)/Number(g.target||1))*100));
    return `<div class="item"><div style="width:100%"><b>${escapeHtml(g.name)}</b><br><small>${usd(g.saved)} de ${usd(g.target)} · ${pct}%</small><div class="progress"><div class="bar" style="width:${pct}%"></div></div></div><div class="actions"><button class="secondary" onclick="openGoalEditor('${g.id}')">Editar</button><button class="secondary" onclick="quickAddGoal('${g.id}')">+ Ahorro</button><button class="secondary" onclick="delGoal('${g.id}')">Eliminar</button></div></div>`
  }).join('')||'<p class="muted">Sin metas registradas.</p>';
}
function openGoalEditor(id){
  const g=db.goals.find(x=>x.id===id);
  $('goalFormTitle').textContent=g?'Editar meta':'Nueva meta';
  $('gId').value=g?.id||'';
  $('gName').value=g?.name||'';
  $('gTarget').value=g?.target||'';
  $('gSaved').value=g?.saved||'';
  $('goalModal').showModal();
}
function quickAddGoal(id){
  const g=db.goals.find(x=>x.id===id); if(!g)return;
  const add=Number(prompt('¿Cuánto quieres agregar a esta meta?', '0')||0);
  if(!add || add<=0)return;
  g.saved=Number(g.saved||0)+add;
  save();
}

function renderReports(){let month=new Date().toISOString().slice(0,7);let monthMov=db.movements.filter(m=>m.date.startsWith(month));let mb=monthMov.reduce((a,m)=>a+(m.type==='income'?amountUSD(m):-amountUSD(m)),0);$('monthBalance').textContent=usd(mb);let cats={};monthMov.filter(m=>m.type==='expense').forEach(m=>cats[m.category]=(cats[m.category]||0)+amountUSD(m));let top=Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];$('topCategory').textContent=top?`${top[0]} ${usd(top[1])}`:'-';drawChart(cats)}
function drawChart(cats){let c=$('chart'),ctx=c.getContext('2d'),w=c.width=c.offsetWidth*2,h=c.height=320;ctx.clearRect(0,0,w,h);let entries=Object.entries(cats);if(!entries.length){ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--muted');ctx.font='28px Arial';ctx.fillText('Sin datos de gastos este mes',30,170);return}let max=Math.max(...entries.map(e=>e[1]));entries.slice(0,6).forEach((e,i)=>{let y=35+i*45,bw=(w-220)*(e[1]/max);ctx.fillStyle='#38bdf8';ctx.fillRect(180,y,bw,26);ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--text');ctx.font='22px Arial';ctx.fillText(e[0].slice(0,12),20,y+22);ctx.fillText(usd(e[1]),190+bw,y+22)})}
function accountName(id){return (db.accounts.find(a=>a.id===id)||{}).name||'Sin cuenta'}
function toUSD(input,currency){let n=Number(input||0);return currency==='BS'?n/rate():n}
function delMovement(id){let m=db.movements.find(x=>x.id===id);if(m){let a=db.accounts.find(x=>x.id===m.accountId);if(a)a.balance+=m.type==='income'?-amountUSD(m):amountUSD(m)}db.movements=db.movements.filter(m=>m.id!==id);save()}
function delAccount(id){if(db.accounts.length<=1)return alert('Debes dejar al menos una cuenta.');db.accounts=db.accounts.filter(a=>a.id!==id);save()}
function delGoal(id){db.goals=db.goals.filter(g=>g.id!==id);save()}
$('unlockBtn').onclick=()=>{if($('pinInput').value===db.config.pin){$('lock').classList.add('hidden');$('app').classList.remove('hidden');render()}else alert('PIN incorrecto')};
$('lockBtn').onclick=()=>{$('app').classList.add('hidden');$('lock').classList.remove('hidden');$('pinInput').value=''};$('themeBtn').onclick=()=>{db.config.theme=db.config.theme==='light'?'dark':'light';save()};
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
$('addMovementBtn').onclick=()=>{$('mDate').value=new Date().toISOString().slice(0,10);$('movementModal').showModal()};$('addAccountBtn').onclick=()=>$('accountModal').showModal();$('addGoalBtn').onclick=()=>openGoalEditor();
$('saveMovement').onclick=e=>{e.preventDefault();let inputAmount=Number($('mAmount').value), inputCurrency=$('mCurrency').value;if(!inputAmount)return alert('Coloca un monto.');let amount=toUSD(inputAmount,inputCurrency);let category=$('mCategory').value||'Otros'; if(!db.categories.includes(category)) db.categories.push(category); let m={id:crypto.randomUUID(),type:$('mType').value,amount,amountUSD:amount,inputAmount,inputCurrency,rate:rate(),category,desc:$('mDesc').value||'Movimiento',date:$('mDate').value||new Date().toISOString().slice(0,10),createdAt:new Date().toISOString(),accountId:$('mAccount').value};db.movements.push(m);let a=db.accounts.find(x=>x.id===m.accountId);if(a)a.balance+=m.type==='income'?amount:-amount;['mAmount','mDesc'].forEach(id=>$(id).value='');$('movementModal').close();save()};
$('saveAccount').onclick=e=>{e.preventDefault();let id=crypto.randomUUID();let name=$('aName').value||'Cuenta';let inputAmount=Number($('aBalance').value||0), inputCurrency=$('aCurrency').value;let initial=toUSD(inputAmount,inputCurrency);db.accounts.push({id,name,balance:initial});if(initial>0){db.movements.push({id:crypto.randomUUID(),type:'income',amount:initial,amountUSD:initial,inputAmount,inputCurrency,rate:rate(),category:'Saldo inicial',desc:'Dinero agregado a '+name,date:new Date().toISOString().slice(0,10),createdAt:new Date().toISOString(),accountId:id})}$('aName').value='';$('aBalance').value='';$('accountModal').close();save()};
$('saveGoal').onclick=e=>{
  e.preventDefault();
  const id=$('gId').value;
  const data={name:$('gName').value||'Meta',target:Number($('gTarget').value||0),saved:Number($('gSaved').value||0)};
  if(id){ const g=db.goals.find(x=>x.id===id); if(g) Object.assign(g,data); }
  else db.goals.push({id:crypto.randomUUID(),...data});
  $('gId').value='';$('gName').value='';$('gTarget').value='';$('gSaved').value='';$('goalModal').close();save()
};
$('saveConfig').onclick=()=>{db.config.owner=$('cfgOwner').value||'MiControl PRO';db.config.currency=$('cfgCurrency').value;let r=Number($('cfgRate').value);if(r>0)db.config.rate=r;if($('cfgPin').value)db.config.pin=$('cfgPin').value;$('cfgPin').value='';save();alert('Configuración guardada')};
if($('saveQuickRate')) $('saveQuickRate').onclick=()=>{let r=Number($('quickRate').value);if(!r||r<=0)return alert('Coloca una tasa válida.');db.config.rate=r;save();alert('Tasa actualizada')};
if($('addCategoryBtn')) $('addCategoryBtn').onclick=()=>addCategory(); if($('newCategoryName')) $('newCategoryName').addEventListener('keydown',e=>{if(e.key==='Enter')addCategory()});
$('searchMov').oninput=renderMovements;$('filterType').onchange=renderMovements;if($('filterFrom'))$('filterFrom').onchange=renderMovements;if($('filterTo'))$('filterTo').onchange=renderMovements;if($('clearDateFilters'))$('clearDateFilters').onclick=()=>{$('filterFrom').value='';$('filterTo').value='';renderMovements()};
$('exportCsv').onclick=()=>{let rows=[['Fecha','Tipo','Monto USD','Monto original','Moneda original','Tasa Bs/USD','Categoría','Descripción','Cuenta'],...db.movements.map(m=>[m.date,m.type,amountUSD(m),(m.inputAmount??amountUSD(m)),(m.inputCurrency||'USD'),(m.rate||db.config.rate),m.category,m.desc,accountName(m.accountId)])];download('micontrol_movimientos.csv',rows.map(r=>r.join(';')).join('\n'),'text/csv')};
$('backupBtn').onclick=()=>download('micontrol_respaldo.json',JSON.stringify(db,null,2),'application/json');$('restoreInput').onchange=e=>{let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{db=JSON.parse(r.result);db.config={...defaultData.config,...(db.config||{})};save();alert('Respaldo restaurado')}catch{alert('Archivo inválido')}};r.readAsText(f)};
$('exportPdf').onclick=()=>{let html=`<h1>Reporte MiControl PRO</h1><p>Tasa actual: ${rate()} Bs/USD</p><p>Balance: ${usd(balance())} / ${bs(balance())}</p><p>Ingresos: ${usd(total('income'))}</p><p>Gastos: ${usd(total('expense'))}</p>`;let w=window.open('','_blank');w.document.write(html);w.print()};
function download(name,content,type){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click()} if('serviceWorker'in navigator)navigator.serviceWorker.register('service-worker.js').catch(()=>{});render();
