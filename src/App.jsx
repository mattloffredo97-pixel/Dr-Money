import { useState, useEffect, useRef } from "react";

const MILESTONES = [
  { target:100000,  label:"First $100K",    icon:"🌱" },
  { target:500000,  label:"Half a Million", icon:"🚀" },
  { target:1000000, label:"Millionaire",    icon:"💎" },
];

const ASSET_ACCOUNTS = [
  { id:"checking",     label:"Checking",         icon:"🏦", color:"#60a5fa" },
  { id:"emergency",    label:"Emergency Fund",   icon:"🚑", color:"#fb923c" },
  { id:"hysa",         label:"HYSA",             icon:"💰", color:"#34d399" },
  { id:"investments",  label:"Personal Invest.", icon:"📈", color:"#a78bfa" },
  { id:"joint_invest", label:"Joint Invest.",    icon:"👫", color:"#f472b6" },
  { id:"sharkninja",   label:"Sharkninja Stock", icon:"🦈", color:"#fbbf24" },
  { id:"joint_savings",label:"Joint Savings",    icon:"💑", color:"#38bdf8" },
  { id:"house_fund",   label:"House Fund",       icon:"🏡", color:"#4ade80" },
];

const DEBT_ACCOUNTS = [
  { id:"debt_bofa",  label:"BofA Credit Card",   icon:"💳", color:"#f87171" },
  { id:"debt_chase", label:"Chase Credit Card",  icon:"💳", color:"#fb923c" },
  { id:"debt_lowes", label:"Lowe's Credit Card", icon:"💳", color:"#f472b6" },
  { id:"debt_cap1",  label:"Capital One Card",   icon:"💳", color:"#e879f9" },
];

const CATEGORIES = {
  income:  ["Salary","Freelance","Investment Return","Bonus","Side Hustle","Transfer In","Other Income"],
  expense: ["Rent","Food","Entertainment","Transport","Shopping","Subscriptions","Medical","Utilities","Credit Card Payment","Transfer Out","Other"],
};

const ACHIEVEMENTS = [
  { id:"first_log",    icon:"🩺", title:"First Patient",   desc:"Log your first transaction",    xp:50   },
  { id:"streak_3",     icon:"🔥", title:"3-Day Streak",    desc:"Log for 3 days in a row",        xp:100  },
  { id:"streak_7",     icon:"💎", title:"Week Warrior",    desc:"Log for 7 days in a row",        xp:250  },
  { id:"invested_1k",  icon:"📈", title:"Market Entrant",  desc:"Log $1,000+ in investments",    xp:200  },
  { id:"net_positive", icon:"⚡", title:"In The Green",    desc:"End a day net positive",         xp:75   },
  { id:"debt_zero",    icon:"🧹", title:"Debt Slayer",     desc:"All credit cards at $0",         xp:500  },
  { id:"hysa_50k",     icon:"🏰", title:"HYSA Fortress",   desc:"HYSA hits $50,000",              xp:750  },
  { id:"hit_100k",     icon:"🌱", title:"First $100K",     desc:"Net worth hits $100,000",        xp:1000 },
  { id:"hit_500k",     icon:"🚀", title:"Half a Million",  desc:"Net worth hits $500,000",        xp:2500 },
  { id:"updated_accts",icon:"🔄", title:"Account Updater", desc:"Update your account balances",  xp:25   },
];

const ROASTS = {
  Entertainment:["Really? Entertainment AGAIN? Your future self is WEEPING. 😤","Every fun dollar is not compounding. Just saying.","The stock market doesn't care about your hobbies."],
  Shopping:     ["Oh look who went SHOPPING. Bezos thanks you personally.","Another purchase? The $100K goal just got further away.","This is why we can't have nice things. Like early retirement."],
  Food:         ["$1000/month on food wasn't enough huh? 🍔","Eating your retirement one bite at a time.","Gordon Ramsay better have cooked this personally."],
  default:      ["The Doctor is watching. Always watching. 👀","Every expense is a goal delay. Sleep on that.","Noted. The ledger remembers everything."],
};
const PRAISES = ["YESSS! The Doctor approves! 💊","Income logged. Compound interest does a happy dance. 📈","THAT'S what I'm talking about! 🔥","Beautiful. Absolutely beautiful. 🥹"];

const XP_PER_LEVEL = 500;
const todayStr = () => new Date().toISOString().split("T")[0];
const fmt  = n => (+(n??0)).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtK = n => n>=1000000?`$${(n/1000000).toFixed(2)}M`:n>=1000?`$${(n/1000).toFixed(1)}k`:`$${fmt(n)}`;
const getRoast  = cat => { const a=ROASTS[cat]||ROASTS.default; return a[Math.floor(Math.random()*a.length)]; };
const getPraise = () => PRAISES[Math.floor(Math.random()*PRAISES.length)];

const SKEY = "drMoneyV6";

const EMPTY = {
  transactions: [],
  assets: { checking:2300, emergency:2000, hysa:12747, investments:17465, joint_invest:3790, sharkninja:11947, joint_savings:100, house_fund:15000 },
  debts:  { debt_bofa:0, debt_chase:0, debt_lowes:0, debt_cap1:0 },
  balHistory: [],
  xp:0, achievements:[], streak:0, lastLog:null,
};

const hasLS = (() => { try { localStorage.setItem("__t","1"); localStorage.removeItem("__t"); return true; } catch { return false; } })();
let memStore = null;
const storageRead  = () => { try { return hasLS ? localStorage.getItem(SKEY) : memStore; } catch { return memStore; } };
const storageWrite = (v) => { try { if(hasLS) localStorage.setItem(SKEY,v); memStore = v; return true; } catch { memStore=v; return false; } };

const W="#ffffff", S="#cbd5e1", G="#34d399", R="#f87171", Y="#fbbf24";
const BG="#090b12", CARD="rgba(255,255,255,0.05)", BORDER="rgba(255,255,255,0.12)";

export default function App() {
  const [data, setData]     = useState(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSS] = useState("idle");
  const [storageMode, setSM]= useState("checking");
  const [screen, setScreen] = useState("dashboard");
  const [toast, setToast]   = useState(null);
  const [editA, setEA]      = useState({});
  const [editD, setED]      = useState({});
  const [form, setForm]     = useState({type:"expense",amount:"",category:"Food",note:"",date:todayStr()});
  const saveRef             = useRef(null);
  const isFirst             = useRef(true);

  useEffect(() => {
    try {
      const raw = storageRead();
      if (raw) {
        const parsed = JSON.parse(raw);
        setData({
          ...EMPTY,
          ...parsed,
          assets: { ...EMPTY.assets, ...(parsed.assets||{}) },
          debts:  { ...EMPTY.debts,  ...(parsed.debts||{}) },
          transactions: parsed.transactions || [],
          balHistory:   parsed.balHistory   || [],
          achievements: parsed.achievements || [],
        });
      }
      setSM(hasLS ? "persistent" : "memory");
    } catch(e) {
      console.error("Load error:", e);
      setSM(hasLS ? "persistent" : "memory");
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (isFirst.current) { isFirst.current = false; return; }
    setSS("saving");
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => {
      const ok = storageWrite(JSON.stringify(data));
      setSS(ok ? "saved" : "memonly");
      setTimeout(() => setSS("idle"), 2000);
    }, 400);
    return () => clearTimeout(saveRef.current);
  }, [data, loaded]);

  const patch = (partial) => setData(prev => ({ ...prev, ...partial }));
  const showToast = (msg, type="info") => { setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const tryUnlock = (id, ach, xp) => {
    if (ach.includes(id)) return { ach, xp };
    const a = ACHIEVEMENTS.find(x => x.id === id);
    if (!a) return { ach, xp };
    setTimeout(() => showToast(`🏆 ${a.title} +${a.xp}XP`, "achievement"), 100);
    return { ach: [...ach, id], xp: xp + a.xp };
  };

  const { transactions, assets, debts, balHistory, xp, achievements, streak, lastLog } = data;
  const totalAssets = Object.values(assets).reduce((s,v)=>s+(+v||0),0);
  const totalDebts  = Object.values(debts).reduce((s,v)=>s+(+v||0),0);
  const totalNW     = totalAssets - totalDebts;
  const investTotal = (+(assets.investments)||0)+(+(assets.joint_invest)||0)+(+(assets.sharkninja)||0);
  const cashTotal   = totalAssets - investTotal;

  const activeMilestone = MILESTONES.find(m=>totalNW<m.target)||MILESTONES[MILESTONES.length-1];
  const prevTarget      = MILESTONES[MILESTONES.indexOf(activeMilestone)-1]?.target||0;
  const mProgress       = Math.min(Math.max((totalNW-prevTarget)/(activeMilestone.target-prevTarget)*100,0),100);

  const level    = Math.floor(xp/XP_PER_LEVEL)+1;
  const levelXp  = xp%XP_PER_LEVEL;
  const levelPct = (levelXp/XP_PER_LEVEL)*100;

  const thisMonth = todayStr().slice(0,7);
  const monthTxns = transactions.filter(t=>t.date.startsWith(thisMonth));
  const monthIn   = monthTxns.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const monthOut  = monthTxns.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const todayTxns = transactions.filter(t=>t.date===todayStr());
  const todayIn   = todayTxns.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const todayOut  = todayTxns.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);

  const handleSubmit = () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { showToast("Enter a valid amount. 🙄","error"); return; }
    const tx = { id:Date.now(), ...form, amount:amt };
    const newTx = [tx, ...transactions];
    let newXp  = xp + (form.type==="income"?30:10) + (form.category==="Investment Return"?50:0);
    let newAch = [...achievements];
    let newStr = streak, newLL = lastLog;
    const td = todayStr();
    if (lastLog !== td) {
      const yd = new Date(); yd.setDate(yd.getDate()-1);
      newStr = lastLog===yd.toISOString().split("T")[0] ? streak+1 : 1;
      newLL = td;
    }
    if (newTx.length===1) ({ ach:newAch,xp:newXp } = tryUnlock("first_log",newAch,newXp));
    if (newStr>=3)         ({ ach:newAch,xp:newXp } = tryUnlock("streak_3", newAch,newXp));
    if (newStr>=7)         ({ ach:newAch,xp:newXp } = tryUnlock("streak_7", newAch,newXp));
    if (newTx.filter(t=>t.category==="Investment Return").reduce((s,t)=>s+t.amount,0)>=1000)
      ({ ach:newAch,xp:newXp } = tryUnlock("invested_1k",newAch,newXp));
    const ni=newTx.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
    const ne=newTx.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
    if (ni-ne>0)          ({ ach:newAch,xp:newXp } = tryUnlock("net_positive",newAch,newXp));
    if (totalNW>=100000)  ({ ach:newAch,xp:newXp } = tryUnlock("hit_100k",newAch,newXp));
    if (totalNW>=500000)  ({ ach:newAch,xp:newXp } = tryUnlock("hit_500k",newAch,newXp));
    patch({ transactions:newTx, xp:newXp, achievements:newAch, streak:newStr, lastLog:newLL });
    setForm({type:"expense",amount:"",category:"Food",note:"",date:todayStr()});
    form.type==="expense" ? showToast(getRoast(form.category),"roast") : showToast(getPraise(),"praise");
    setScreen("dashboard");
  };

  const handleBalSave = () => {
    const newA = { ...assets };
    const newD = { ...debts };
    Object.entries(editA).forEach(([k,v])=>{ const n=parseFloat(v); if(!isNaN(n)&&n>=0) newA[k]=n; });
    Object.entries(editD).forEach(([k,v])=>{ const n=parseFloat(v); if(!isNaN(n)&&n>=0) newD[k]=n; });
    const snap = { date:todayStr(), assets:{...newA}, debts:{...newD} };
    const newBH = [snap, ...balHistory].slice(0,90);
    let newXp=xp, newAch=[...achievements];
    ({ ach:newAch,xp:newXp } = tryUnlock("updated_accts",newAch,newXp));
    const nNW = Object.values(newA).reduce((s,v)=>s+(+v||0),0) - Object.values(newD).reduce((s,v)=>s+(+v||0),0);
    if (nNW>=100000) ({ ach:newAch,xp:newXp } = tryUnlock("hit_100k",newAch,newXp));
    if (nNW>=500000) ({ ach:newAch,xp:newXp } = tryUnlock("hit_500k",newAch,newXp));
    if ((+(newA.hysa)||0) >= 50000) ({ ach:newAch,xp:newXp } = tryUnlock("hysa_50k",newAch,newXp));
    if (Object.values(newD).every(v=>(+v||0)===0)) ({ ach:newAch,xp:newXp } = tryUnlock("debt_zero",newAch,newXp));
    patch({ assets:newA, debts:newD, balHistory:newBH, xp:newXp, achievements:newAch });
    setEA({}); setED({});
    showToast("Balances saved! ✅","praise");
  };

  const deleteTx = (id) => patch({ transactions: transactions.filter(t=>t.id!==id) });

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dr-money-backup-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Backup downloaded! 💾","praise");
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        setData({
          ...EMPTY,
          ...parsed,
          assets: { ...EMPTY.assets, ...(parsed.assets||{}) },
          debts:  { ...EMPTY.debts,  ...(parsed.debts||{}) },
        });
        showToast("Backup restored! ✅","praise");
      } catch(err) {
        showToast("Invalid backup file ❌","error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const statusLabel = saveStatus==="saving" ? "💾 SAVING..." : saveStatus==="saved" ? "✅ SAVED" : saveStatus==="memonly" ? "⚠️ MEM ONLY" : "";
  const statusColor = saveStatus==="saving" ? Y : saveStatus==="saved" ? G : saveStatus==="memonly" ? "#fb923c" : S;

  if (!loaded) return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",color:W,fontFamily:"monospace"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:52,marginBottom:14}}>💊</div>
        <div style={{fontSize:16,letterSpacing:"0.2em"}}>LOADING...</div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:BG,color:W,fontFamily:"'Courier New',monospace",paddingBottom:90}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#334155;border-radius:2px}
        .btn{cursor:pointer;border:none;font-family:'Courier New',monospace;transition:all 0.15s;}
        .btn:hover{filter:brightness(1.15);transform:translateY(-1px);}
        .btn:active{transform:translateY(0);}
        input,select{font-family:'Courier New',monospace;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#ffffff;border-radius:8px;padding:10px 12px;width:100%;font-size:13px;outline:none;}
        input:focus,select:focus{border-color:#34d399;box-shadow:0 0 0 2px rgba(52,211,153,0.2);}
        select option{background:#0d1117;color:#ffffff;}
        input[type=date]{color-scheme:dark;}
        input::placeholder{color:#475569;}
        .slide{animation:su 0.22s ease-out;}
        @keyframes su{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}
        .pulse{animation:pu 2s ease-in-out infinite;}
        @keyframes pu{0%,100%{opacity:1}50%{opacity:0.4}}
        .lbl{font-size:9px;color:#94a3b8;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:4px;}
      `}</style>

      {toast&&(
        <div style={{position:"fixed",top:14,left:"50%",transform:"translateX(-50%)",zIndex:9999,
          background:toast.type==="roast"?"#1f0808":toast.type==="praise"?"#061a10":toast.type==="achievement"?"#0d0d1f":"#0f172a",
          border:`1px solid ${toast.type==="roast"?R:toast.type==="praise"?G:toast.type==="achievement"?Y:BORDER}`,
          borderRadius:12,padding:"12px 20px",maxWidth:"90vw",fontSize:12,lineHeight:1.6,color:W,boxShadow:"0 8px 32px rgba(0,0,0,0.7)",textAlign:"center"}} className="slide">
          {toast.msg}
        </div>
      )}

      <div style={{background:"rgba(9,11,18,0.96)",borderBottom:`1px solid ${BORDER}`,padding:"12px 16px",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:520,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:15,fontWeight:900,color:G}}>💊 DR. MONEY</div>
            <div style={{fontSize:9,color:S,letterSpacing:"0.14em"}}>FINANCIAL ASYLUM</div>
          </div>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            {statusLabel&&<div style={{fontSize:9,color:statusColor,fontWeight:700}}>{statusLabel}</div>}
            <div style={{textAlign:"center"}}><div className="lbl">STREAK</div><div style={{fontSize:12,color:"#fb923c",fontWeight:700}}>{streak>0?`🔥${streak}`:"💤0"}</div></div>
            <div style={{textAlign:"center"}}><div className="lbl">LVL</div><div style={{fontSize:12,color:Y,fontWeight:700}}>LV{level}</div></div>
            <div style={{textAlign:"center"}}><div className="lbl">XP</div><div style={{fontSize:12,color:W,fontWeight:700}}>{xp.toLocaleString()}</div></div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:520,margin:"0 auto",padding:"14px 14px 0"}}>

        {storageMode==="memory"&&(
          <div style={{background:"rgba(251,146,60,0.08)",border:"1px solid rgba(251,146,60,0.3)",borderRadius:10,padding:"10px 12px",marginBottom:12}}>
            <div style={{fontSize:11,color:"#fb923c",fontWeight:700,marginBottom:3}}>⚠️ Memory-only mode</div>
            <div style={{fontSize:10,color:W,lineHeight:1.6}}>localStorage is blocked. Data will NOT persist between sessions. Use the EXPORT button to backup manually.</div>
          </div>
        )}

        <div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:W,marginBottom:4}}>
            <span>LV{level}</span><span style={{color:S}}>{levelXp}/{XP_PER_LEVEL} XP</span><span>LV{level+1}</span>
          </div>
          <div style={{height:5,background:"rgba(255,255,255,0.08)",borderRadius:3,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${levelPct}%`,background:"linear-gradient(90deg,#34d399,#60a5fa)",borderRadius:3,transition:"width 0.6s"}}/>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5,marginBottom:14}}>
          {[{id:"dashboard",icon:"📊",label:"HOME"},{id:"accounts",icon:"🏦",label:"ACCTS"},{id:"log",icon:"➕",label:"LOG"},{id:"history",icon:"📋",label:"HIST"},{id:"ranks",icon:"🏆",label:"RANKS"}].map(({id,icon,label})=>(
            <button key={id} onClick={()=>setScreen(id)} className="btn" style={{background:screen===id?"rgba(52,211,153,0.12)":CARD,border:`1px solid ${screen===id?G:BORDER}`,borderRadius:10,padding:"7px 3px",color:screen===id?G:W,fontSize:9}}>
              <div style={{fontSize:16,marginBottom:2}}>{icon}</div>{label}
            </button>
          ))}
        </div>

        {screen==="dashboard"&&(
          <div className="slide">
            <div style={{background:"rgba(52,211,153,0.07)",border:"1px solid rgba(52,211,153,0.25)",borderRadius:16,padding:"18px",marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <div className="lbl">🎯 CURRENT MILESTONE</div>
                  <div style={{fontSize:26,fontWeight:900,color:W}}>{fmtK(totalNW)}</div>
                  <div style={{fontSize:12,color:W,marginTop:3}}>of <span style={{color:G,fontWeight:700}}>{fmtK(activeMilestone.target)}</span> — {activeMilestone.icon} {activeMilestone.label}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:32,fontWeight:900,color:G}}>{mProgress.toFixed(1)}%</div>
                  <div style={{fontSize:10,color:S}}>COMPLETE</div>
                </div>
              </div>
              <div style={{height:10,background:"rgba(255,255,255,0.08)",borderRadius:5,overflow:"hidden",marginBottom:8}}>
                <div style={{height:"100%",width:`${mProgress}%`,background:"linear-gradient(90deg,#34d399,#fbbf24)",borderRadius:5,transition:"width 0.8s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:W}}>
                <span>{fmtK(activeMilestone.target-totalNW)} to go</span>
                <span style={{color:S}}>{((activeMilestone.target-totalNW)/6100/12).toFixed(1)} yrs at $6.1k/mo</span>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
              {MILESTONES.map(m=>{const done=totalNW>=m.target,active=activeMilestone.target===m.target;return(
                <div key={m.target} style={{background:done?"rgba(52,211,153,0.1)":active?"rgba(251,191,36,0.1)":CARD,border:`1px solid ${done?"rgba(52,211,153,0.35)":active?"rgba(251,191,36,0.35)":BORDER}`,borderRadius:10,padding:"10px",textAlign:"center"}}>
                  <div style={{fontSize:20}}>{m.icon}</div>
                  <div style={{fontSize:10,color:W,marginTop:4,fontWeight:700}}>{fmtK(m.target)}</div>
                  <div style={{fontSize:9,color:done?G:active?Y:S,marginTop:2}}>{done?"✅ DONE":active?"◀ NOW":"🔒"}</div>
                </div>
              );})}
            </div>

            {(()=>{
              const hysaBal = +(assets.hysa||0);
              const hysaTarget = 50000;
              const hysaPct = Math.min((hysaBal/hysaTarget)*100, 100);
              const hysaDone = hysaBal >= hysaTarget;
              return(
                <div style={{background:hysaDone?"rgba(52,211,153,0.08)":"rgba(56,189,248,0.06)",border:`1px solid ${hysaDone?"rgba(52,211,153,0.3)":"rgba(56,189,248,0.25)"}`,borderRadius:14,padding:"14px 16px",marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div>
                      <div className="lbl" style={{color:hysaDone?G:"#38bdf8"}}>🏰 HYSA SUB-GOAL</div>
                      <div style={{fontSize:18,fontWeight:900,color:W,marginTop:2}}>${fmt(hysaBal)}</div>
                      <div style={{fontSize:11,color:S,marginTop:2}}>of <span style={{color:hysaDone?G:"#38bdf8",fontWeight:700}}>$50,000</span> HYSA target</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:22,fontWeight:900,color:hysaDone?G:"#38bdf8"}}>{hysaPct.toFixed(1)}%</div>
                      <div style={{fontSize:9,color:S}}>{hysaDone?"COMPLETE ✅":"BUILDING"}</div>
                    </div>
                  </div>
                  <div style={{height:8,background:"rgba(255,255,255,0.08)",borderRadius:4,overflow:"hidden",marginBottom:6}}>
                    <div style={{height:"100%",width:`${hysaPct}%`,background:hysaDone?"linear-gradient(90deg,#34d399,#4ade80)":"linear-gradient(90deg,#38bdf8,#60a5fa)",borderRadius:4,transition:"width 0.8s"}}/>
                  </div>
                  <div style={{fontSize:11,color:W}}>
                    {hysaDone ? <span style={{color:G}}>🎉 Fortress built!</span> : <>${fmt(hysaTarget - hysaBal)} to go · <span style={{color:S}}>emergency + house cushion</span></>}
                  </div>
                </div>
              );
            })()}

            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
              <div style={{background:CARD,border:"1px solid rgba(96,165,250,0.25)",borderRadius:12,padding:"12px"}}>
                <div className="lbl">💵 CASH</div>
                <div style={{fontSize:15,fontWeight:700,color:"#60a5fa"}}>${fmt(cashTotal)}</div>
              </div>
              <div style={{background:CARD,border:"1px solid rgba(167,139,250,0.25)",borderRadius:12,padding:"12px"}}>
                <div className="lbl">📈 INVESTED</div>
                <div style={{fontSize:15,fontWeight:700,color:"#a78bfa"}}>${fmt(investTotal)}</div>
              </div>
              <div style={{background:CARD,border:"1px solid rgba(248,113,113,0.25)",borderRadius:12,padding:"12px"}}>
                <div className="lbl">💳 DEBT</div>
                <div style={{fontSize:15,fontWeight:700,color:R}}>${fmt(totalDebts)}</div>
              </div>
            </div>

            {totalDebts>0&&(
              <div style={{background:"rgba(248,113,113,0.07)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:12,padding:"12px 14px",marginBottom:12}}>
                <div className="lbl" style={{color:R}}>🚨 DEBT SNAPSHOT</div>
                {DEBT_ACCOUNTS.map(acc=>{const b=+(debts[acc.id]||0);if(!b) return null;return(
                  <div key={acc.id} style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                    <span style={{fontSize:11,color:W}}>{acc.icon} {acc.label}</span>
                    <span style={{fontSize:12,color:R,fontWeight:700}}>-${fmt(b)}</span>
                  </div>
                );})}
                <div style={{borderTop:"1px solid rgba(248,113,113,0.15)",marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:11,color:W,fontWeight:700}}>TOTAL DEBT</span>
                  <span style={{fontSize:12,color:R,fontWeight:900}}>-${fmt(totalDebts)}</span>
                </div>
              </div>
            )}

            <div className="lbl" style={{marginBottom:6}}>📅 TODAY — {todayStr()}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
              {[{l:"IN",v:`+$${fmt(todayIn)}`,c:G,b:"rgba(52,211,153,0.2)"},{l:"OUT",v:`-$${fmt(todayOut)}`,c:R,b:"rgba(248,113,113,0.2)"},{l:"NET",v:`${todayIn-todayOut>=0?"+":""}${fmt(todayIn-todayOut)}`,c:todayIn-todayOut>=0?G:R,b:todayIn-todayOut>=0?"rgba(52,211,153,0.2)":"rgba(248,113,113,0.2)"}].map(({l,v,c,b})=>(
                <div key={l} style={{background:CARD,border:`1px solid ${b}`,borderRadius:10,padding:"10px"}}>
                  <div className="lbl">{l}</div>
                  <div style={{fontSize:13,fontWeight:700,color:c}}>{v}</div>
                </div>
              ))}
            </div>

            <div className="lbl" style={{marginBottom:6}}>📆 THIS MONTH — {thisMonth}</div>
            <div style={{background:CARD,border:BORDER,borderRadius:12,padding:"14px",marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <div><div className="lbl">INCOME</div><div style={{fontSize:16,color:G,fontWeight:700}}>+${fmt(monthIn)}</div></div>
                <div style={{textAlign:"center"}}><div className="lbl">NET</div><div style={{fontSize:16,color:monthIn-monthOut>=0?G:R,fontWeight:700}}>{monthIn-monthOut>=0?"+":""}{fmt(monthIn-monthOut)}</div></div>
                <div style={{textAlign:"right"}}><div className="lbl">EXPENSES</div><div style={{fontSize:16,color:R,fontWeight:700}}>-${fmt(monthOut)}</div></div>
              </div>
            </div>

            {transactions.length>0&&(<>
              <div className="lbl" style={{marginBottom:6}}>⚡ RECENT</div>
              {transactions.slice(0,5).map(t=>(
                <div key={t.id} style={{background:CARD,border:`1px solid ${t.type==="income"?"rgba(52,211,153,0.15)":"rgba(248,113,113,0.15)"}`,borderRadius:10,padding:"10px 14px",marginBottom:5,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:12,color:W,fontWeight:600}}>{t.category}{t.note?` · ${t.note}`:""}</div>
                    <div style={{fontSize:9,color:S}}>{t.date}</div>
                  </div>
                  <div style={{fontSize:13,fontWeight:700,color:t.type==="income"?G:R}}>{t.type==="income"?"+":"-"}${fmt(t.amount)}</div>
                </div>
              ))}
            </>)}

            <div style={{background:CARD,border:BORDER,borderRadius:12,padding:"14px",marginTop:14}}>
              <div className="lbl" style={{marginBottom:8}}>🔐 BACKUP & RESTORE</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <button onClick={exportData} className="btn" style={{background:"rgba(52,211,153,0.1)",border:`1px solid ${G}40`,borderRadius:8,padding:"10px",color:G,fontSize:11,fontWeight:700}}>⬇️ EXPORT</button>
                <label className="btn" style={{background:"rgba(96,165,250,0.1)",border:`1px solid #60a5fa40`,borderRadius:8,padding:"10px",color:"#60a5fa",fontSize:11,fontWeight:700,textAlign:"center",display:"block"}}>
                  ⬆️ IMPORT
                  <input type="file" accept=".json" onChange={importData} style={{display:"none"}}/>
                </label>
              </div>
            </div>
          </div>
        )}

        {screen==="accounts"&&(
          <div className="slide">
            <div style={{background:"rgba(52,211,153,0.07)",border:"1px solid rgba(52,211,153,0.25)",borderRadius:14,padding:"16px",marginBottom:14}}>
              <div className="lbl">TRUE NET WORTH</div>
              <div style={{fontSize:24,fontWeight:900,color:W}}>${fmt(totalNW)}</div>
              <div style={{fontSize:11,color:S,marginTop:2}}>Assets − Debt</div>
            </div>

            <div style={{fontSize:12,color:W,fontWeight:700,marginBottom:8}}>💰 ASSET ACCOUNTS</div>
            {ASSET_ACCOUNTS.map(acc=>(
              <div key={acc.id} style={{background:CARD,border:BORDER,borderRadius:12,padding:"12px 14px",marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:20}}>{acc.icon}</span>
                    <div>
                      <div style={{fontSize:12,color:W,fontWeight:700}}>{acc.label}</div>
                      <div style={{fontSize:10,color:S}}>Current: <span style={{color:acc.color,fontWeight:700}}>${fmt(assets[acc.id]||0)}</span></div>
                    </div>
                  </div>
                </div>
                <input type="number" placeholder="Update balance..." value={editA[acc.id]||""} onChange={e=>setEA(p=>({...p,[acc.id]:e.target.value}))} style={{color:acc.color,borderColor:`${acc.color}50`}}/>
              </div>
            ))}

            <div style={{fontSize:12,color:R,fontWeight:700,margin:"16px 0 8px"}}>💳 DEBT ACCOUNTS</div>
            {DEBT_ACCOUNTS.map(acc=>(
              <div key={acc.id} style={{background:"rgba(248,113,113,0.04)",border:"1px solid rgba(248,113,113,0.15)",borderRadius:12,padding:"12px 14px",marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:20}}>{acc.icon}</span>
                    <div>
                      <div style={{fontSize:12,color:W,fontWeight:700}}>{acc.label}</div>
                      <div style={{fontSize:10,color:S}}>Owed: <span style={{color:R,fontWeight:700}}>${fmt(debts[acc.id]||0)}</span></div>
                    </div>
                  </div>
                </div>
                <input type="number" placeholder="Amount owed..." value={editD[acc.id]||""} onChange={e=>setED(p=>({...p,[acc.id]:e.target.value}))} style={{color:R,borderColor:"rgba(248,113,113,0.4)"}}/>
              </div>
            ))}

            <button onClick={handleBalSave} className="btn" style={{width:"100%",padding:"14px",borderRadius:12,background:`linear-gradient(135deg,${G},#60a5fa)`,color:BG,fontSize:13,fontWeight:900,marginTop:4,marginBottom:14}}>💾 SAVE ALL BALANCES</button>
          </div>
        )}

        {screen==="log"&&(
          <div className="slide">
            <div style={{background:CARD,border:BORDER,borderRadius:16,padding:"20px"}}>
              <div style={{fontSize:14,color:W,fontWeight:700,marginBottom:16}}>📝 LOG TRANSACTION</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                {["income","expense"].map(type=>(
                  <button key={type} onClick={()=>setForm(f=>({...f,type,category:CATEGORIES[type][0]}))} className="btn" style={{background:form.type===type?(type==="income"?"rgba(52,211,153,0.15)":"rgba(248,113,113,0.15)"):CARD,border:`1px solid ${form.type===type?(type==="income"?G:R):BORDER}`,borderRadius:10,padding:"10px",color:form.type===type?(type==="income"?G:R):W,fontSize:12,textTransform:"uppercase",fontWeight:700}}>
                    {type==="income"?"💰 Income":"💸 Expense"}
                  </button>
                ))}
              </div>
              <div style={{marginBottom:12}}><div className="lbl">AMOUNT ($)</div><input type="number" placeholder="0.00" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} style={{fontSize:22,fontWeight:700,color:form.type==="income"?G:R}}/></div>
              <div style={{marginBottom:12}}><div className="lbl">CATEGORY</div><select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{CATEGORIES[form.type].map(c=><option key={c}>{c}</option>)}</select></div>
              <div style={{marginBottom:12}}><div className="lbl">DATE</div><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
              <div style={{marginBottom:18}}><div className="lbl">NOTE (optional)</div><input type="text" placeholder="What was this for?" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/></div>
              <button onClick={handleSubmit} className="btn" style={{width:"100%",padding:"14px",borderRadius:12,background:form.type==="income"?`linear-gradient(135deg,${G},#60a5fa)`:`linear-gradient(135deg,${R},#fb923c)`,color:BG,fontSize:13,fontWeight:900}}>
                {form.type==="income"?"⚡ LOG INCOME":"💸 LOG EXPENSE"} +{form.type==="income"?"30":"10"}XP
              </button>
            </div>
          </div>
        )}

        {screen==="history"&&(
          <div className="slide">
            <div style={{fontSize:12,color:W,fontWeight:700,marginBottom:10}}>📋 TRANSACTIONS ({transactions.length})</div>
            {transactions.length===0&&<div style={{textAlign:"center",padding:40,color:W,fontSize:13}}>No transactions yet. 💊</div>}
            {transactions.map(t=>(
              <div key={t.id} style={{background:CARD,border:`1px solid ${t.type==="income"?"rgba(52,211,153,0.15)":"rgba(248,113,113,0.15)"}`,borderRadius:10,padding:"10px 14px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:W,fontWeight:700}}>{t.category}{t.note?` · ${t.note}`:""}</div>
                  <div style={{fontSize:9,color:S}}>{t.date}</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <div style={{fontSize:13,fontWeight:700,color:t.type==="income"?G:R}}>{t.type==="income"?"+":"-"}${fmt(t.amount)}</div>
                  <button onClick={()=>deleteTx(t.id)} className="btn" style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.25)",borderRadius:6,padding:"4px 8px",color:R,fontSize:10}}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {screen==="ranks"&&(
          <div className="slide">
            <div style={{background:"rgba(251,191,36,0.07)",border:"1px solid rgba(251,191,36,0.25)",borderRadius:14,padding:"16px",marginBottom:12,textAlign:"center"}}>
              <div style={{fontSize:38,fontWeight:900,color:Y}}>LV{level}</div>
              <div style={{fontSize:13,color:W,fontWeight:700,marginTop:4}}>{xp.toLocaleString()} total XP</div>
              <div style={{fontSize:11,color:S,marginTop:2}}>{levelXp}/{XP_PER_LEVEL} XP to Level {level+1}</div>
            </div>
            <div style={{fontSize:12,color:W,fontWeight:700,marginBottom:8}}>🏆 ACHIEVEMENTS ({achievements.length}/{ACHIEVEMENTS.length})</div>
            {ACHIEVEMENTS.map(a=>{const done=achievements.includes(a.id);return(
              <div key={a.id} style={{background:done?"rgba(251,191,36,0.06)":CARD,border:`1px solid ${done?"rgba(251,191,36,0.25)":BORDER}`,borderRadius:12,padding:"12px 14px",marginBottom:7,display:"flex",alignItems:"center",gap:12,opacity:done?1:0.5}}>
                <div style={{fontSize:26,filter:done?"none":"grayscale(1)"}}>{a.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,color:done?Y:W,fontWeight:700,marginBottom:2}}>{a.title}</div>
                  <div style={{fontSize:10,color:S}}>{a.desc}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12,color:done?Y:W,fontWeight:700}}>+{a.xp}</div>
                  <div style={{fontSize:9,color:S}}>XP</div>
                </div>
              </div>
            );})}
          </div>
        )}

      </div>
    </div>
  );
}
