import { useState, useEffect, useRef } from "react"

/* ─── TOKENS ─────────────────────────────────────────────────── */
const T = {
  bg:"#F5F0E8", cream:"#EDE6D6", card:"#FAF7F2", border:"#D4C9B0",
  ink:"#1C1A14", dim:"#6B6455", gold:"#B8860B", goldBg:"#FFF8E7",
  red:"#C0392B", green:"#2E7D52", blue:"#1A4A7A",
}
const DAYS  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"]
const DKEYS = ["dom","lun","mar","mie","jue","vie","sab"]
const PALETTE = ["#1A4A7A","#2E7D52","#B8860B","#C0392B","#5B2D8A","#B85000","#1A7A6E","#7A1A4A","#4A6A1A","#2C2C2C"]
const EMOJIS  = ["💼","🌱","🏠","💰","🧘","📚","🎯","🔥","⚡","🏋️","🍎","✈️","🎨","🎵","💡","🤝","📊","🛁","🎮","🌿"]
const LEVELS  = [
  {min:0,    name:"Aprendiz",  icon:"○", index:0},
  {min:100,  name:"Constante", icon:"◐", index:1},
  {min:300,  name:"Enfocado",  icon:"●", index:2},
  {min:600,  name:"Ejecutor",  icon:"◈", index:3},
  {min:1000, name:"Maestro",   icon:"★", index:4},
  {min:2000, name:"Élite",     icon:"✦", index:5},
]
const DEF_CATS = [
  { id:"c1", name:"Laboral",   emoji:"💼", color:"#1A4A7A", pts:15,
    subs:[{id:"s1",name:"Reuniones"},{id:"s2",name:"Proyectos"},{id:"s3",name:"Admin"},{id:"s4",name:"Clientes"}] },
  { id:"c2", name:"Personal",  emoji:"🌱", color:"#2E7D52", pts:10,
    subs:[{id:"s5",name:"Salud"},{id:"s6",name:"Ejercicio"},{id:"s7",name:"Aprendizaje"},{id:"s8",name:"Social"}] },
  { id:"c3", name:"Hogar",     emoji:"🏠", color:"#B85000", pts:8,
    subs:[{id:"s9",name:"Limpieza"},{id:"s10",name:"Compras"},{id:"s11",name:"Mantenimiento"}] },
  { id:"c4", name:"Finanzas",  emoji:"💰", color:"#B8860B", pts:12,
    subs:[{id:"s12",name:"Gastos"},{id:"s13",name:"Inversiones"},{id:"s14",name:"Ahorro"},{id:"s15",name:"Deudas"}] },
  { id:"c5", name:"Bienestar", emoji:"🧘", color:"#5B2D8A", pts:10,
    subs:[{id:"s16",name:"Meditación"},{id:"s17",name:"Lectura"},{id:"s18",name:"Journaling"},{id:"s19",name:"Descanso"}] },
]

/* ─── UTILS ──────────────────────────────────────────────────── */
function useLS(key, def) {
  const [v, set] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def }
    catch { return def }
  })
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)) } catch {} }, [key, v])
  return [v, set]
}
const tKey   = () => new Date().toISOString().split("T")[0]
const lvlOf  = (p) => { for (let i = LEVELS.length-1; i >= 0; i--) if (p >= LEVELS[i].min) return LEVELS[i]; return LEVELS[0] }
const addD   = (s, n) => { const d = new Date(s+"T12:00:00"); d.setDate(d.getDate()+n); return d.toISOString().split("T")[0] }
const wkStart= (d=new Date()) => { const x=new Date(d); x.setDate(x.getDate()-x.getDay()); return x.toISOString().split("T")[0] }
const appears= (t, dk) => {
  if (!t.startDate || dk < t.startDate) return false
  const day = DKEYS[new Date(dk+"T12:00:00").getDay()]
  if (t.recurrence==="none")    return t.startDate===dk
  if (t.recurrence==="daily")   return true
  if (t.recurrence==="monthly") return new Date(t.startDate+"T12:00:00").getDate()===new Date(dk+"T12:00:00").getDate()
  if (t.recurrence==="weekly"||t.recurrence==="custom") return (t.recDays||[]).includes(day)
  return false
}
const pts = (t, cats) => { const c=cats.find(x=>x.id===t.catId); return c ? (t.priority==="alta"?Math.round(c.pts*1.5):c.pts) : 0 }

/* ─── PRIMITIVES ─────────────────────────────────────────────── */
const S = { tap: { WebkitTapHighlightColor:"transparent", cursor:"pointer" } }

function Sheet({ title, onClose, children }) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(28,26,20,0.6)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:300}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.card,borderRadius:"20px 20px 0 0",padding:"24px 20px 40px",width:"100%",maxWidth:520,maxHeight:"92vh",overflowY:"auto",display:"flex",flexDirection:"column",gap:14,animation:"up .25s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:T.ink}}>{title}</span>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:26,color:T.dim,lineHeight:1,...S.tap}}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
const FL = ({c}) => <div style={{fontSize:10,letterSpacing:2,color:T.dim,marginBottom:5}}>{c}</div>
const Input = ({sx,...p}) => <input style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",color:T.ink,fontSize:16,outline:"none",width:"100%",fontFamily:"'DM Sans',sans-serif",WebkitAppearance:"none",...sx}} {...p}/>
const Btn = ({v="primary",sx,disabled,...p}) => {
  const base = {borderRadius:10,padding:"13px 20px",fontSize:15,border:"none",fontFamily:"'DM Sans',sans-serif",fontWeight:600,opacity:disabled?0.4:1,...S.tap,...sx}
  const vr = {primary:{background:T.ink,color:T.bg},ghost:{background:"transparent",border:`1px solid ${T.border}`,color:T.dim}}
  return <button style={{...base,...vr[v]}} disabled={disabled} {...p}/>
}
function DayPicker({val=[],onChange}) {
  return <div style={{display:"flex",gap:5}}>{DKEYS.map((k,i)=>(
    <button key={k} onClick={()=>onChange(val.includes(k)?val.filter(x=>x!==k):[...val,k])} style={{flex:1,height:38,borderRadius:8,border:"1px solid",borderColor:val.includes(k)?T.ink:T.border,background:val.includes(k)?T.ink:"transparent",color:val.includes(k)?T.bg:T.dim,fontSize:10,fontWeight:600,...S.tap}}>{DAYS[i]}</button>
  ))}</div>
}

/* ─── CONFETTI ───────────────────────────────────────────────── */
function Confetti({on}) {
  const ref=useRef(null)
  useEffect(()=>{
    if(!on||!ref.current) return
    const c=ref.current,ctx=c.getContext("2d")
    c.width=window.innerWidth; c.height=window.innerHeight
    const p=Array.from({length:50},()=>({x:Math.random()*c.width,y:-10,vx:(Math.random()-.5)*5,vy:Math.random()*4+2,col:["#B8860B","#2E7D52","#1A4A7A","#5B2D8A","#C0392B"][Math.floor(Math.random()*5)],sz:Math.random()*7+3,r:Math.random()*360}))
    let fr; const draw=()=>{ctx.clearRect(0,0,c.width,c.height);p.forEach(x=>{ctx.save();ctx.translate(x.x,x.y);ctx.rotate(x.r*Math.PI/180);ctx.fillStyle=x.col;ctx.fillRect(-x.sz/2,-x.sz/2,x.sz,x.sz);ctx.restore();x.x+=x.vx;x.y+=x.vy;x.r+=4});fr=requestAnimationFrame(draw)}
    draw(); const t=setTimeout(()=>cancelAnimationFrame(fr),2000)
    return ()=>{cancelAnimationFrame(fr);clearTimeout(t)}
  },[on])
  if(!on) return null
  return <canvas ref={ref} style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:999}}/>
}

/* ─── TOAST ──────────────────────────────────────────────────── */
function Toast({msg,p,done}) {
  useEffect(()=>{const t=setTimeout(done,2600);return()=>clearTimeout(t)},[])
  return <div style={{position:"fixed",bottom:85,left:"50%",transform:"translateX(-50%)",background:T.ink,color:T.bg,borderRadius:12,padding:"13px 20px",fontSize:14,fontFamily:"'Playfair Display',serif",zIndex:998,boxShadow:"0 8px 32px rgba(0,0,0,0.3)",display:"flex",alignItems:"center",gap:10,animation:"tin .3s ease",whiteSpace:"nowrap",maxWidth:"90vw"}}>
    <span>✦</span><span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{msg}</span>
    {p&&<span style={{color:T.gold,fontWeight:700,flexShrink:0}}>+{p} pts</span>}
  </div>
}

/* ─── TASK FORM ──────────────────────────────────────────────── */
function TaskForm({cats,task,onSave,onClose}) {
  const [text,  setTxt]  = useState(task?.text||"")
  const [catId, setCat]  = useState(task?.catId||cats[0]?.id||"")
  const [subId, setSub]  = useState(task?.subId||"")
  const [prio,  setPrio] = useState(task?.priority||"normal")
  const [rec,   setRec]  = useState(task?.recurrence||"none")
  const [days,  setDays] = useState(task?.recDays||[])
  const [start, setStart]= useState(task?.startDate||tKey())
  const [time,  setTime] = useState(task?.time||"")
  const cat = cats.find(c=>c.id===catId)
  const earn = cat ? (prio==="alta"?Math.round(cat.pts*1.5):cat.pts) : 0
  const save = () => {
    if(!text.trim()) return
    onSave({id:task?.id||Date.now(),text,catId,subId,priority:prio,recurrence:rec,recDays:days,startDate:start,time,completions:task?.completions||{}})
    onClose()
  }
  return (
    <Sheet title={task?"Editar tarea":"Nueva tarea"} onClose={onClose}>
      <div><FL c="TAREA"/><Input autoFocus value={text} onChange={e=>setTxt(e.target.value)} placeholder="¿Qué hay que hacer?"/></div>
      <div>
        <FL c="CATEGORÍA"/>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {cats.map(c=><button key={c.id} onClick={()=>{setCat(c.id);setSub("")}} style={{border:"1px solid",borderRadius:20,padding:"7px 13px",fontSize:13,...S.tap,borderColor:catId===c.id?c.color:T.border,background:catId===c.id?c.color+"18":"transparent",color:catId===c.id?c.color:T.dim}}>{c.emoji} {c.name}</button>)}
        </div>
      </div>
      {cat?.subs?.length>0&&<div>
        <FL c="SUBCATEGORÍA"/>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          <button onClick={()=>setSub("")} style={{border:"1px solid",borderRadius:20,padding:"7px 13px",fontSize:13,...S.tap,borderColor:subId===""?T.ink:T.border,background:subId===""?T.ink:"transparent",color:subId===""?T.bg:T.dim}}>—</button>
          {cat.subs.map(s=><button key={s.id} onClick={()=>setSub(s.id)} style={{border:"1px solid",borderRadius:20,padding:"7px 13px",fontSize:13,...S.tap,borderColor:subId===s.id?T.ink:T.border,background:subId===s.id?T.ink:"transparent",color:subId===s.id?T.bg:T.dim}}>{s.name}</button>)}
        </div>
      </div>}
      <div style={{display:"flex",gap:10}}>
        <div style={{flex:1}}>
          <FL c="PRIORIDAD"/>
          <div style={{display:"flex",gap:6}}>
            {[["normal","Normal"],["alta","Alta ×1.5"]].map(([k,l])=><button key={k} onClick={()=>setPrio(k)} style={{flex:1,border:"1px solid",borderRadius:10,padding:"10px 6px",fontSize:12,fontWeight:600,...S.tap,borderColor:prio===k?(k==="alta"?T.red:T.green):T.border,background:prio===k?(k==="alta"?T.red+"18":T.green+"18"):"transparent",color:prio===k?(k==="alta"?T.red:T.green):T.dim}}>{l}</button>)}
          </div>
        </div>
        <div style={{flex:1}}><FL c="HORA"/><Input type="time" value={time} onChange={e=>setTime(e.target.value)}/></div>
      </div>
      <div>
        <FL c="RECURRENCIA"/>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
          {[["none","Una vez"],["daily","Diaria"],["weekly","Semanal"],["monthly","Mensual"],["custom","Días específicos"]].map(([k,l])=><button key={k} onClick={()=>setRec(k)} style={{border:"1px solid",borderRadius:20,padding:"7px 12px",fontSize:12,...S.tap,borderColor:rec===k?T.ink:T.border,background:rec===k?T.ink:"transparent",color:rec===k?T.bg:T.dim}}>{l}</button>)}
        </div>
        {(rec==="weekly"||rec==="custom")&&<><FL c="DÍAS"/><DayPicker val={days} onChange={setDays}/></>}
      </div>
      <div><FL c="FECHA DE INICIO"/><Input type="date" value={start} onChange={e=>setStart(e.target.value)}/></div>
      <div style={{background:T.goldBg,border:`1px solid ${T.gold}44`,borderRadius:10,padding:"11px 14px",fontSize:13,color:T.gold,fontWeight:700}}>Valor: {earn} pts por completar</div>
      <div style={{display:"flex",gap:10}}><Btn v="ghost" sx={{flex:1}} onClick={onClose}>Cancelar</Btn><Btn sx={{flex:1}} onClick={save} disabled={!text.trim()}>{task?"Guardar":"Agregar"}</Btn></div>
    </Sheet>
  )
}

/* ─── TODAY ──────────────────────────────────────────────────── */
function Today({tasks,cats,onToggle,onEdit,onDel,onAdd}) {
  const [fc,setFc]=useState("all")
  const dk=tKey()
  const all=tasks.filter(t=>appears(t,dk))
  const shown=fc==="all"?all:all.filter(t=>t.catId===fc)
  const done=all.filter(t=>t.completions?.[dk]).length
  const pct=all.length?Math.round(done/all.length*100):0
  return (
    <div style={{paddingBottom:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <div style={{fontSize:11,letterSpacing:2,color:T.dim,marginBottom:2}}>HOY</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:T.ink,textTransform:"capitalize"}}>
            {new Date().toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})}
          </div>
        </div>
        <button onClick={onAdd} style={{background:T.ink,border:"none",borderRadius:12,padding:"10px 18px",color:T.bg,fontSize:14,fontWeight:600,...S.tap}}>+ Tarea</button>
      </div>
      <div style={{background:T.cream,borderRadius:8,height:8,marginBottom:6,overflow:"hidden"}}>
        <div style={{height:"100%",borderRadius:8,background:T.gold,width:`${pct}%`,transition:"width .5s"}}/>
      </div>
      <div style={{fontSize:12,color:T.dim,marginBottom:18}}>{done} de {all.length} completadas · {pct}%</div>
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4,marginBottom:16,WebkitOverflowScrolling:"touch"}}>
        {[{id:"all",name:"Todas",emoji:"○",color:T.ink},...cats].map(c=>(
          <button key={c.id} onClick={()=>setFc(c.id)} style={{border:"1px solid",borderRadius:20,padding:"6px 14px",fontSize:12,...S.tap,flexShrink:0,whiteSpace:"nowrap",background:fc===c.id?(c.color||T.ink):"transparent",color:fc===c.id?T.bg:T.dim,borderColor:fc===c.id?(c.color||T.ink):T.border}}>{c.emoji} {c.name}</button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {shown.length===0&&<div style={{textAlign:"center",padding:"48px 20px",color:T.dim,fontSize:14}}><div style={{fontSize:36,marginBottom:8}}>○</div>Sin tareas. Tocá "+ Tarea".</div>}
        {shown.map(t=>{
          const cat=cats.find(c=>c.id===t.catId)
          const sub=cat?.subs?.find(s=>s.id===t.subId)
          const done=!!t.completions?.[dk]
          const earn=pts(t,cats)
          const rl=t.recurrence==="daily"?"Diaria":(t.recurrence==="weekly"||t.recurrence==="custom")?(t.recDays||[]).map(k=>DAYS[DKEYS.indexOf(k)]).join("/"):t.recurrence==="monthly"?"Mensual":null
          return (
            <div key={t.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"13px 12px",display:"flex",alignItems:"flex-start",gap:11,opacity:done?.55:1,borderLeft:`4px solid ${cat?.color||T.border}`}}>
              <button onClick={()=>onToggle(t.id,dk)} style={{width:26,height:26,borderRadius:7,border:`2px solid ${cat?.color||T.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,background:done?(cat?.color||T.border):"transparent",...S.tap}}>
                {done&&<span style={{color:"#fff",fontSize:12,fontWeight:700}}>✓</span>}
              </button>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:done?T.dim:T.ink,textDecoration:done?"line-through":"none",marginBottom:5,lineHeight:1.3}}>{t.text}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,alignItems:"center"}}>
                  {cat&&<span style={{background:cat.color+"18",color:cat.color,borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:600}}>{cat.emoji} {cat.name}</span>}
                  {sub&&<span style={{background:T.cream,color:T.dim,borderRadius:20,padding:"2px 8px",fontSize:11}}>{sub.name}</span>}
                  {t.time&&<span style={{fontSize:11,color:T.dim}}>⏰ {t.time}</span>}
                  {t.priority==="alta"&&<span style={{background:T.red+"18",color:T.red,borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700}}>ALTA</span>}
                  {rl&&<span style={{background:T.blue+"18",color:T.blue,borderRadius:20,padding:"2px 8px",fontSize:10}}>↻ {rl}</span>}
                  <span style={{background:T.goldBg,color:T.gold,borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:700,marginLeft:"auto"}}>+{earn} pts</span>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <button onClick={()=>onEdit(t)} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 8px",fontSize:12,color:T.dim,...S.tap}}>✎</button>
                <button onClick={()=>onDel(t.id)} style={{background:"none",border:"none",fontSize:20,color:T.border,lineHeight:1,...S.tap}}>×</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── WEEK ───────────────────────────────────────────────────── */
function Week({tasks,cats,onToggle,onAdd}) {
  const [ws,setWs]=useState(wkStart())
  const days=Array.from({length:7},(_,i)=>addD(ws,i))
  return (
    <div style={{paddingBottom:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{fontSize:11,letterSpacing:2,color:T.dim,marginBottom:2}}>SEMANA</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.ink}}>
            {new Date(ws+"T12:00:00").toLocaleDateString("es-ES",{day:"numeric",month:"short"})} – {new Date(addD(ws,6)+"T12:00:00").toLocaleDateString("es-ES",{day:"numeric",month:"short"})}
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[["←",()=>setWs(addD(ws,-7))],["•",()=>setWs(wkStart())],["→",()=>setWs(addD(ws,7))]].map(([l,fn])=>(
            <button key={l} onClick={fn} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 11px",fontSize:13,color:T.dim,...S.tap}}>{l}</button>
          ))}
          <button onClick={onAdd} style={{background:T.ink,border:"none",borderRadius:8,padding:"7px 12px",color:T.bg,fontSize:13,fontWeight:600,...S.tap}}>+</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
        {days.map(dk=>{
          const isT=dk===tKey()
          const dt=tasks.filter(t=>appears(t,dk))
          const dn=dt.filter(t=>t.completions?.[dk]).length
          const d=new Date(dk+"T12:00:00")
          return (
            <div key={dk} style={{background:isT?T.goldBg:T.card,border:`1px solid ${isT?T.gold:T.border}`,borderRadius:10,padding:"8px 4px",minHeight:110}}>
              <div style={{fontSize:9,color:isT?T.gold:T.dim,fontWeight:isT?700:400,textAlign:"center",marginBottom:2}}>{DAYS[d.getDay()]}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:isT?T.gold:T.ink,textAlign:"center",marginBottom:4}}>{d.getDate()}</div>
              {dt.length>0&&<div style={{fontSize:9,color:T.dim,textAlign:"center",marginBottom:3}}>{dn}/{dt.length}</div>}
              <div style={{display:"flex",flexDirection:"column",gap:2}}>
                {dt.slice(0,3).map(t=>{
                  const cat=cats.find(c=>c.id===t.catId)
                  const dn2=!!t.completions?.[dk]
                  return <button key={t.id} onClick={()=>onToggle(t.id,dk)} style={{background:dn2?(cat?.color||T.dim)+"33":(cat?.color||T.dim)+"12",border:`1px solid ${dn2?(cat?.color||T.dim):(cat?.color||T.dim)+"44"}`,borderRadius:3,padding:"2px 3px",fontSize:9,color:dn2?(cat?.color||T.dim):T.dim,...S.tap,textDecoration:dn2?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cat?.emoji} {t.text}</button>
                })}
                {dt.length>3&&<div style={{fontSize:9,color:T.dim,textAlign:"center"}}>+{dt.length-3}</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── REWARDS ────────────────────────────────────────────────── */
function Rewards({points,rewards,onAdd,onRedeem,onDel}) {
  const [show,setShow]=useState(false)
  const [name,setName]=useState("")
  const [cost,setCost]=useState(80)
  const [emoji,setEmoji]=useState("🎁")
  const RE=["🎁","🍕","🎬","🧴","👟","✈️","🎮","📚","🍷","🛁","🎶","🏋️","🎨","🌴","🍦","🎭","🏆","💆","🛒","🎪"]
  const sub=()=>{if(!name.trim())return;onAdd({id:Date.now(),name,cost,emoji,redeemed:0});setName("");setCost(80);setShow(false)}
  return (
    <div style={{paddingBottom:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><div style={{fontSize:11,letterSpacing:2,color:T.dim,marginBottom:2}}>TIENDA</div><div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:T.ink}}>Mis Recompensas</div></div>
        <button onClick={()=>setShow(true)} style={{background:T.ink,border:"none",borderRadius:12,padding:"10px 18px",color:T.bg,fontSize:14,fontWeight:600,...S.tap}}>+ Nueva</button>
      </div>
      <div style={{background:`linear-gradient(135deg,${T.ink},#2C2416)`,borderRadius:16,padding:"20px",marginBottom:20,display:"flex",alignItems:"center"}}>
        <div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:2}}>PUNTOS DISPONIBLES</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:42,color:T.gold,fontWeight:700,lineHeight:1.1}}>{points.toLocaleString()}</div>
        </div>
        <div style={{marginLeft:"auto",fontSize:44,opacity:.15}}>✦</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
        {rewards.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:"40px",color:T.dim,fontSize:14}}><div style={{fontSize:32,marginBottom:8}}>🎁</div>Creá tu primera recompensa.</div>}
        {rewards.map(r=>{
          const ok=points>=r.cost
          return (
            <div key={r.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 14px",opacity:ok?1:.72,position:"relative"}}>
              <div style={{fontSize:32,marginBottom:8}}>{r.emoji}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:T.ink,marginBottom:4,lineHeight:1.3}}>{r.name}</div>
              <div style={{fontSize:12,fontWeight:700,color:T.gold,marginBottom:10}}>{r.cost.toLocaleString()} pts</div>
              {r.redeemed>0&&<div style={{fontSize:10,color:T.dim,marginBottom:8}}>Canjeado {r.redeemed}×</div>}
              <button onClick={()=>ok&&onRedeem(r)} disabled={!ok} style={{width:"100%",padding:"9px 6px",borderRadius:8,border:`1px solid ${ok?T.gold:T.border}`,background:ok?T.goldBg:"transparent",color:ok?T.gold:T.dim,fontWeight:700,fontSize:12,...S.tap}}>{ok?"Canjear ✦":`−${(r.cost-points).toLocaleString()}`}</button>
              <button onClick={()=>onDel(r.id)} style={{position:"absolute",top:8,right:8,background:"none",border:"none",color:T.border,fontSize:18,lineHeight:1,...S.tap}}>×</button>
            </div>
          )
        })}
      </div>
      {show&&<Sheet title="Nueva recompensa" onClose={()=>setShow(false)}>
        <div><FL c="ÍCONO"/><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{RE.map(em=><button key={em} onClick={()=>setEmoji(em)} style={{width:38,height:38,borderRadius:8,border:"1px solid",borderColor:emoji===em?T.gold:T.border,background:emoji===em?T.goldBg:"transparent",fontSize:20,...S.tap}}>{em}</button>)}</div></div>
        <div><FL c="NOMBRE"/><Input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="Ej: Delivery, tarde libre..."/></div>
        <div><FL c="COSTO EN PUNTOS"/><Input type="number" value={cost} onChange={e=>setCost(Number(e.target.value))} min={5}/></div>
        <div style={{display:"flex",gap:10}}><Btn v="ghost" sx={{flex:1}} onClick={()=>setShow(false)}>Cancelar</Btn><Btn sx={{flex:1}} onClick={sub} disabled={!name.trim()}>Crear</Btn></div>
      </Sheet>}
    </div>
  )
}

/* ─── STATS ──────────────────────────────────────────────────── */
function Stats({tasks,cats,points,total,streak}) {
  const [ws,setWs]=useState(wkStart())
  const days=Array.from({length:7},(_,i)=>addD(ws,i))
  const lvl=lvlOf(total)
  const nxt=LEVELS[lvl.index+1]
  const ni=nxt?{n:nxt,pct:Math.min((total-lvl.min)/(nxt.min-lvl.min)*100,100),rem:nxt.min-total}:null
  const wkPts=days.reduce((s,dk)=>s+tasks.filter(t=>t.completions?.[dk]).reduce((a,t)=>a+pts(t,cats),0),0)
  const bc=cats.map(c=>({...c,tot:tasks.filter(t=>t.catId===c.id).length,dn:tasks.filter(t=>t.catId===c.id&&t.completions?.[tKey()]).length}))
  return (
    <div style={{paddingBottom:20}}>
      <div style={{fontSize:11,letterSpacing:2,color:T.dim,marginBottom:2}}>ESTADÍSTICAS</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:T.ink,marginBottom:20}}>Mi Progreso</div>
      <div style={{background:`linear-gradient(135deg,${T.ink},#2C2416)`,borderRadius:16,padding:"20px",marginBottom:14,display:"flex",gap:16,alignItems:"center"}}>
        <div style={{fontSize:48,lineHeight:1}}>{lvl.icon}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:2}}>NIVEL</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:T.gold,fontWeight:700}}>{lvl.name}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2}}>{total.toLocaleString()} pts totales</div>
          {ni&&<div style={{marginTop:8}}><div style={{background:"rgba(255,255,255,.1)",borderRadius:4,height:5,overflow:"hidden"}}><div style={{height:"100%",background:T.gold,width:`${ni.pct}%`,borderRadius:4}}/></div><div style={{fontSize:10,color:"rgba(255,255,255,.35)",marginTop:2}}>{ni.rem} pts → "{ni.n.name}"</div></div>}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
        {[{l:"Puntos",v:points.toLocaleString(),ic:"✦",col:T.gold},{l:"Semana",v:`${wkPts}`,ic:"📅",col:T.blue},{l:"Racha",v:`${streak}d`,ic:"🔥",col:T.red}].map(s=>(
          <div key={s.l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 8px",textAlign:"center"}}>
            <div style={{fontSize:18,marginBottom:3}}>{s.ic}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:s.col}}>{s.v}</div>
            <div style={{fontSize:9,color:T.dim,letterSpacing:1}}>{s.l.toUpperCase()}</div>
          </div>
        ))}
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px",marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:11,letterSpacing:2,color:T.dim}}>POR DÍA</div>
          <div style={{display:"flex",gap:5}}>
            {[["←",()=>setWs(addD(ws,-7))],["•",()=>setWs(wkStart())],["→",()=>setWs(addD(ws,7))]].map(([l,fn])=>(
              <button key={l} onClick={fn} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:6,padding:"3px 8px",fontSize:12,color:T.dim,...S.tap}}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:5,alignItems:"flex-end",height:70}}>
          {days.map(dk=>{
            const tot=tasks.filter(t=>appears(t,dk)).length
            const dn=tasks.filter(t=>t.completions?.[dk]).length
            const h=tot?Math.max(8,Math.round(dn/tot*60)):4
            const isT=dk===tKey()
            const d=new Date(dk+"T12:00:00")
            return <div key={dk} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}><div style={{fontSize:9,color:T.dim}}>{dn||""}</div><div style={{width:"100%",height:h,background:isT?T.gold:T.blue+"55",borderRadius:3,minHeight:4}}/><div style={{fontSize:9,color:isT?T.gold:T.dim,fontWeight:isT?700:400}}>{DAYS[d.getDay()]}</div></div>
          })}
        </div>
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px"}}>
        <div style={{fontSize:11,letterSpacing:2,color:T.dim,marginBottom:12}}>POR CATEGORÍA (HOY)</div>
        {bc.map(c=>(
          <div key={c.id} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:13,color:T.ink}}>{c.emoji} {c.name}</span><span style={{fontSize:11,color:T.dim}}>{c.dn}/{c.tot}</span></div>
            <div style={{background:T.cream,borderRadius:4,height:5,overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,background:c.color,width:c.tot?`${c.dn/c.tot*100}%`:"0%",transition:"width .5s"}}/></div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── NOTIFS ─────────────────────────────────────────────────── */
function Notifs({tasks,cats}) {
  const [perm,setPerm]=useState(typeof Notification!=="undefined"?Notification.permission:"default")
  const [rems,setRems]=useLS("ax_rems",[])
  const [show,setShow]=useState(false)
  const [sel,setSel]=useState("")
  const [time,setTime]=useState("08:00")
  const req=async()=>{if(typeof Notification==="undefined")return;setPerm(await Notification.requestPermission())}
  const add=()=>{if(!sel)return;setRems(p=>[...p,{id:Date.now(),taskId:Number(sel),time}]);setSel("");setShow(false)}
  useEffect(()=>{
    if(perm!=="granted")return
    const iv=setInterval(()=>{
      const n=new Date(),hm=`${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`
      rems.forEach(r=>{if(r.time!==hm)return;const t=tasks.find(x=>x.id===r.taskId);if(t&&appears(t,tKey())&&!t.completions?.[tKey()])new Notification("AXIS — Recordatorio",{body:t.text})})
    },60000)
    return()=>clearInterval(iv)
  },[perm,rems,tasks])
  const tl=tasks.filter(t=>appears(t,tKey()))
  return (
    <div style={{paddingBottom:20}}>
      <div style={{fontSize:11,letterSpacing:2,color:T.dim,marginBottom:2}}>RECORDATORIOS</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:T.ink,marginBottom:20}}>Notificaciones</div>
      {perm!=="granted"?<div style={{background:T.goldBg,border:`1px solid ${T.gold}55`,borderRadius:12,padding:"24px",textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:36,marginBottom:8}}>🔔</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:T.ink,marginBottom:8}}>Activar notificaciones</div>
        <div style={{fontSize:13,color:T.dim,marginBottom:16,lineHeight:1.5}}>Recibí alertas en el momento exacto que programes.</div>
        <button onClick={req} style={{background:T.goldBg,border:`1px solid ${T.gold}`,borderRadius:10,padding:"12px 22px",fontSize:14,color:T.gold,fontWeight:700,...S.tap}}>Permitir</button>
      </div>:<div style={{background:"#2E7D5218",border:`1px solid ${T.green}44`,borderRadius:10,padding:"12px 16px",marginBottom:20,display:"flex",gap:10,alignItems:"center"}}>
        <span style={{color:T.green,fontSize:18}}>✓</span><span style={{fontSize:13,color:T.green,fontWeight:600}}>Notificaciones activas</span>
      </div>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:600,color:T.ink}}>Configurados ({rems.length})</div>
        {perm==="granted"&&<button onClick={()=>setShow(true)} style={{background:T.ink,border:"none",borderRadius:10,padding:"9px 16px",color:T.bg,fontSize:13,fontWeight:600,...S.tap}}>+ Agregar</button>}
      </div>
      {rems.length===0?<div style={{textAlign:"center",padding:"36px",color:T.dim,fontSize:14}}><div style={{fontSize:28,marginBottom:8}}>🔕</div>Sin recordatorios.</div>:
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {rems.map(r=>{const t=tasks.find(x=>x.id===r.taskId);const cat=t?cats.find(c=>c.id===t.catId):null
          return <div key={r.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"13px 14px",display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:22}}>⏰</span><div style={{flex:1}}><div style={{fontSize:14,color:T.ink,fontFamily:"'Playfair Display',serif"}}>{t?.text||"Tarea eliminada"}</div><div style={{fontSize:12,color:T.dim,marginTop:2}}>{cat&&`${cat.emoji} ${cat.name} · `}{r.time} hs</div></div><button onClick={()=>setRems(p=>p.filter(x=>x.id!==r.id))} style={{background:"none",border:"none",fontSize:20,color:T.border,lineHeight:1,...S.tap}}>×</button></div>
        })}
      </div>}
      {show&&<Sheet title="Nuevo recordatorio" onClose={()=>setShow(false)}>
        <div><FL c="TAREA"/><select value={sel} onChange={e=>setSel(e.target.value)} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",color:T.ink,fontSize:15,outline:"none",width:"100%",WebkitAppearance:"none"}}><option value="">Seleccioná una tarea...</option>{tl.map(t=>{const cat=cats.find(c=>c.id===t.catId);return <option key={t.id} value={t.id}>{cat?.emoji} {t.text}</option>})}</select></div>
        <div><FL c="HORA"/><Input type="time" value={time} onChange={e=>setTime(e.target.value)}/></div>
        <div style={{display:"flex",gap:10}}><Btn v="ghost" sx={{flex:1}} onClick={()=>setShow(false)}>Cancelar</Btn><Btn sx={{flex:1}} onClick={add} disabled={!sel}>Guardar</Btn></div>
      </Sheet>}
    </div>
  )
}

/* ─── CONFIG ─────────────────────────────────────────────────── */
function Config({cats,setCats}) {
  const [eid,setEid]=useState(null)
  const [asub,setAsub]=useState(null)
  const [sn,setSn]=useState("")
  const [nn,setNn]=useState("")
  const [ne,setNe]=useState("🎯")
  const [nc,setNc]=useState(PALETTE[0])
  const [np,setNp]=useState(10)
  const upd=(id,p)=>setCats(prev=>prev.map(c=>c.id===id?{...c,...p}:c))
  const del=id=>setCats(prev=>prev.filter(c=>c.id!==id))
  const addS=catId=>{if(!sn.trim())return;setCats(prev=>prev.map(c=>c.id===catId?{...c,subs:[...c.subs,{id:"s"+Date.now(),name:sn}]}:c));setSn("");setAsub(null)}
  const delS=(catId,sid)=>setCats(prev=>prev.map(c=>c.id===catId?{...c,subs:c.subs.filter(s=>s.id!==sid)}:c))
  const addC=()=>{if(!nn.trim())return;setCats(prev=>[...prev,{id:"c"+Date.now(),name:nn,emoji:ne,color:nc,pts:np,subs:[]}]);setNn("");setNp(10)}
  return (
    <div style={{paddingBottom:20}}>
      <div style={{fontSize:11,letterSpacing:2,color:T.dim,marginBottom:2}}>CONFIGURACIÓN</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:T.ink,marginBottom:20}}>Categorías</div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
        {cats.map(cat=>(
          <div key={cat.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px",borderLeft:`4px solid ${cat.color}`}}>
              <span style={{fontSize:22}}>{cat.emoji}</span>
              {eid===cat.id?<div style={{flex:1,display:"flex",flexDirection:"column",gap:10}}>
                <div style={{display:"flex",gap:8}}><Input value={cat.name} onChange={e=>upd(cat.id,{name:e.target.value})} sx={{flex:1}}/><Input type="number" value={cat.pts} onChange={e=>upd(cat.id,{pts:Number(e.target.value)})} sx={{width:70}}/></div>
                <div><FL c="COLOR"/><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{PALETTE.map(col=><button key={col} onClick={()=>upd(cat.id,{color:col})} style={{width:26,height:26,borderRadius:"50%",background:col,border:"none",outline:cat.color===col?`2px solid ${T.ink}`:"none",outlineOffset:2,...S.tap}}/>)}</div></div>
                <div><FL c="EMOJI"/><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{EMOJIS.map(em=><button key={em} onClick={()=>upd(cat.id,{emoji:em})} style={{width:34,height:34,borderRadius:6,border:"1px solid",borderColor:cat.emoji===em?T.ink:T.border,background:cat.emoji===em?T.cream:"transparent",fontSize:16,...S.tap}}>{em}</button>)}</div></div>
                <Btn onClick={()=>setEid(null)} sx={{alignSelf:"flex-start",padding:"8px 18px",fontSize:13}}>Listo</Btn>
              </div>:<>
                <div style={{flex:1}}><div style={{fontWeight:600,color:T.ink,fontSize:15}}>{cat.name}</div><div style={{fontSize:12,color:T.dim}}>{cat.pts} pts por tarea</div></div>
                <button onClick={()=>setEid(cat.id)} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 12px",fontSize:12,color:T.dim,...S.tap}}>Editar</button>
                <button onClick={()=>del(cat.id)} style={{background:"none",border:"none",fontSize:20,color:T.border,lineHeight:1,...S.tap}}>×</button>
              </>}
            </div>
            <div style={{padding:"8px 14px 12px 50px",borderTop:`1px solid ${T.border}`,background:T.cream+"66"}}>
              <FL c="SUBCATEGORÍAS"/>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {cat.subs.map(s=><span key={s.id} style={{display:"flex",alignItems:"center",gap:4,background:T.card,border:`1px solid ${T.border}`,borderRadius:20,padding:"4px 10px",fontSize:12,color:T.ink}}>{s.name}<button onClick={()=>delS(cat.id,s.id)} style={{background:"none",border:"none",color:T.dim,fontSize:14,lineHeight:1,...S.tap}}>×</button></span>)}
                {asub===cat.id?<div style={{display:"flex",gap:6}}><Input autoFocus value={sn} onChange={e=>setSn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addS(cat.id)} placeholder="Nombre" sx={{width:120,padding:"5px 10px",fontSize:13}}/><Btn onClick={()=>addS(cat.id)} sx={{padding:"5px 12px",fontSize:13}}>+</Btn><Btn v="ghost" onClick={()=>setAsub(null)} sx={{padding:"5px 10px",fontSize:13}}>✕</Btn></div>:
                <button onClick={()=>{setAsub(cat.id);setSn("")}} style={{background:"transparent",border:`1px dashed ${T.border}`,borderRadius:20,padding:"4px 10px",fontSize:12,color:T.dim,...S.tap}}>+ Sub</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"18px"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.ink,marginBottom:14}}>Nueva categoría</div>
        <div style={{display:"flex",gap:8,marginBottom:12}}><div style={{flex:2}}><FL c="NOMBRE"/><Input value={nn} onChange={e=>setNn(e.target.value)} placeholder="Ej: Deportes"/></div><div style={{width:80}}><FL c="PTS"/><Input type="number" value={np} onChange={e=>setNp(Number(e.target.value))}/></div></div>
        <FL c="EMOJI"/><div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:12}}>{EMOJIS.map(em=><button key={em} onClick={()=>setNe(em)} style={{width:34,height:34,borderRadius:6,border:"1px solid",borderColor:ne===em?T.ink:T.border,background:ne===em?T.cream:"transparent",fontSize:16,...S.tap}}>{em}</button>)}</div>
        <FL c="COLOR"/><div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>{PALETTE.map(col=><button key={col} onClick={()=>setNc(col)} style={{width:26,height:26,borderRadius:"50%",background:col,border:"none",outline:nc===col?`2px solid ${T.ink}`:"none",outlineOffset:2,...S.tap}}/>)}</div>
        <Btn onClick={addC} disabled={!nn.trim()}>Crear categoría</Btn>
      </div>
    </div>
  )
}

/* ─── ROOT ───────────────────────────────────────────────────── */
export default function App() {
  const [tasks,  setTasks]  = useLS("ax_tasks",  [])
  const [cats,   setCats]   = useLS("ax_cats",   DEF_CATS)
  const [rews,   setRews]   = useLS("ax_rews",   [{id:1,name:"Delivery a elección",cost:80,emoji:"🍕",redeemed:0},{id:2,name:"Tarde libre",cost:200,emoji:"🎬",redeemed:0},{id:3,name:"Compra personal",cost:500,emoji:"👟",redeemed:0}])
  const [p,      setP]      = useLS("ax_pts",    0)
  const [total,  setTotal]  = useLS("ax_total",  0)
  const [streak, setStreak] = useLS("ax_streak", 0)
  const [ld,     setLd]     = useLS("ax_ld",     "")
  const [tab,    setTab]    = useState("hoy")
  const [toast,  setToast]  = useState(null)
  const [conf,   setConf]   = useState(false)
  const [modal,  setModal]  = useState(null)

  useEffect(()=>{
    const dk=tKey()
    if(ld!==dk){const y=new Date();y.setDate(y.getDate()-1);const yk=y.toISOString().split("T")[0];setStreak(ld===yk?streak+1:1);setLd(dk)}
  },[])

  const save=t=>setTasks(prev=>{const ex=prev.find(x=>x.id===t.id);return ex?prev.map(x=>x.id===t.id?t:x):[...prev,t]})

  const toggle=(id,dk)=>setTasks(prev=>prev.map(t=>{
    if(t.id!==id)return t
    const was=!!t.completions?.[dk],earn=pts(t,cats)
    if(!was){setP(x=>x+earn);setTotal(x=>x+earn);setToast({msg:t.text.slice(0,32)+(t.text.length>32?"…":""),p:earn});if(Math.random()>.6){setConf(true);setTimeout(()=>setConf(false),2200)}}
    else{setP(x=>Math.max(0,x-earn));setTotal(x=>Math.max(0,x-earn))}
    const c={...t.completions};if(was)delete c[dk];else c[dk]=new Date().toISOString()
    return{...t,completions:c}
  }))

  const delTask=id=>{
    const t=tasks.find(x=>x.id===id)
    if(t){const earn=pts(t,cats)*Object.keys(t.completions||{}).length;setP(x=>Math.max(0,x-earn));setTotal(x=>Math.max(0,x-earn))}
    setTasks(prev=>prev.filter(x=>x.id!==id))
  }

  const redeem=r=>{
    if(p<r.cost)return
    setP(x=>x-r.cost);setRews(prev=>prev.map(x=>x.id===r.id?{...x,redeemed:x.redeemed+1}:x))
    setToast({msg:`¡${r.name} canjeado!`,p:null});setConf(true);setTimeout(()=>setConf(false),2200)
  }

  const lvl=lvlOf(total)
  const NAV=[{id:"hoy",ic:"○",lb:"Hoy"},{id:"semana",ic:"▦",lb:"Semana"},{id:"rewards",ic:"✦",lb:"Premios"},{id:"stats",ic:"◈",lb:"Stats"},{id:"notifs",ic:"🔔",lb:"Alertas"},{id:"config",ic:"⚙",lb:"Config"}]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;overflow:hidden;background:${T.bg};font-family:'DM Sans',sans-serif}
        #root{height:100%;display:flex;flex-direction:column}
        @keyframes up{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes tin{from{transform:translateX(-50%) translateY(20px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}
        input[type=time],input[type=date]{color-scheme:light}
      `}</style>

      <Confetti on={conf}/>
      {toast&&<Toast msg={toast.msg} p={toast.p} done={()=>setToast(null)}/>}

      {/* HEADER */}
      <div style={{background:T.card,borderBottom:`1px solid ${T.border}`,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:T.ink,letterSpacing:1}}>AXIS</div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{background:`linear-gradient(135deg,${T.ink},#2C2416)`,borderRadius:20,padding:"5px 14px",display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:12,color:T.gold}}>✦</span>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.gold,fontWeight:700}}>{p.toLocaleString()}</span>
          </div>
          <span style={{fontSize:12,color:T.dim}}>{lvl.icon} {streak}d 🔥</span>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 16px 0",WebkitOverflowScrolling:"touch"}}>
        {tab==="hoy"     &&<Today   tasks={tasks} cats={cats} onToggle={toggle} onEdit={t=>setModal(t)} onDel={delTask} onAdd={()=>setModal("new")}/>}
        {tab==="semana"  &&<Week    tasks={tasks} cats={cats} onToggle={toggle} onAdd={()=>setModal("new")}/>}
        {tab==="rewards" &&<Rewards points={p} rewards={rews} onAdd={r=>setRews(x=>[...x,r])} onRedeem={redeem} onDel={id=>setRews(x=>x.filter(r=>r.id!==id))}/>}
        {tab==="stats"   &&<Stats   tasks={tasks} cats={cats} points={p} total={total} streak={streak}/>}
        {tab==="notifs"  &&<Notifs  tasks={tasks} cats={cats}/>}
        {tab==="config"  &&<Config  cats={cats} setCats={setCats}/>}
      </div>

      {/* BOTTOM NAV */}
      <div style={{background:T.card,borderTop:`1px solid ${T.border}`,display:"flex",flexShrink:0,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>setTab(n.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"10px 2px",border:"none",background:"transparent",...S.tap,borderTop:`2px solid ${tab===n.id?T.gold:"transparent"}`}}>
            <span style={{fontSize:15,marginBottom:2}}>{n.ic}</span>
            <span style={{fontSize:9,letterSpacing:.5,color:tab===n.id?T.gold:T.dim,fontWeight:tab===n.id?700:400}}>{n.lb.toUpperCase()}</span>
          </button>
        ))}
      </div>

      {modal&&<TaskForm cats={cats} task={modal==="new"?null:modal} onSave={save} onClose={()=>setModal(null)}/>}
    </>
  )
}
