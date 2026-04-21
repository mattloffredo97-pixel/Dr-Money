import { useState, useEffect, useRef } from "react";

const MILESTONES = [
  { target:100000,  label:"First $100K",    icon:"🌱" },
  { target:500000,  label:"Half a Million", icon:"🚀" },
  { target:1000000, label:"Millionaire",    icon:"💎" },
];

const ASSET_ACCOUNTS = [
  { id:"checking",     label:"Checking",         icon:"🏦", color:"#60a5fa", type:"asset" },
  { id:"emergency",    label:"Emergency Fund",   icon:"🚑", color:"#fb923c", type:"asset" },
  { id:"hysa",         label:"HYSA",             icon:"💰", color:"#34d399", type:"asset" },
  { id:"investments",  label:"Personal Invest.", icon:"📈", color:"#a78bfa", type:"asset" },
  { id:"joint_invest", label:"Joint Invest.",    icon:"👫", color:"#f472b6", type:"asset" },
  { id:"sharkninja",   label:"Sharkninja",       icon:"🦈", color:"#fbbf24", type:"asset" },
  { id:"joint_savings",label:"Joint Savings",    icon:"💑", color:"#38bdf8", type:"asset" },
  { id:"house_fund",   label:"House Fund",       icon:"🏡", color:"#4ade80", type:"asset" },
];

const DEBT_ACCOUNTS = [
  { id:"debt_bofa",  label:"BofA CC",    icon:"💳", color:"#f87171", type:"debt" },
  { id:"debt_chase", label:"Chase CC",   icon:"💳", color:"#fb923c", type:"debt" },
  { id:"debt_lowes", label:"Lowe's CC",  icon:"💳", color:"#f472b6", type:"debt" },
  { id:"debt_cap1",  label:"Cap One CC", icon:"💳", color:"#e879f9", type:"debt" },
];

const ALL_ACCOUNTS = [...ASSET_ACCOUNTS, ...DEBT_ACCOUNTS];
const getAccount = (id) => ALL_ACCOUNTS.find(a => a.id === id);

const CATEGORIES = {
  income:  ["Salary","Freelance","Investment Return","Bonus","Side Hustle","Refund","Other Income"],
  expense: ["Food","Rent","Entertainment","Transport","Shopping","Subscriptions","Medical","Utilities","Gas","Other"],
};

const ACHIEVEMENTS = [
  { id:"first_log",    icon:"🩺", title:"First Patient",   desc:"Log your first transaction",    xp:50   },
  { id:"streak_3",     icon:"🔥", title:"3-Day Streak",    desc:"Log for 3 days in a row",        xp:100  },
  { id:"streak_7",     icon:"💎", title:"Week Warrior",    desc:"Log for 7 days in a row",        xp:250  },
  { id:"first_transfer",icon:"💸",title:"Money Mover",     desc:"Log your first transfer",        xp:100  },
  { id:"cc_payment",   icon:"⚔️", title:"Debt Fighter",    desc:"Pay down a credit card",         xp:200  },
  { id:"net_positive", icon:"⚡", title:"In The Green",    desc:"End a day net positive",         xp:75   },
  { id:"debt_zero",    icon:"🧹", title:"Debt Slayer",     desc:"All credit cards at $0",         xp:500  },
  { id:"hysa_50k",     icon:"🏰", title:"HYSA Fortress",   desc:"HYSA hits $50,000",              xp:750  },
  { id:"hit_100k",     icon:"🌱", title:"First $100K",     desc:"Net worth hits $100,000",        xp:1000 },
  { id:"hit_500k",     icon:"🚀", title:"Half a Million",  desc:"Net worth hits $500,000",        xp:2500 },
];

const ROASTS = {
  Entertainment:["Really? Entertainment AGAIN? 😤","Every fun dollar is not compounding.","The market doesn't care about hobbies."],
  Shopping:     ["Oh look who went SHOPPING. Bezos thanks you.","Another purchase? $100K just got further.","This is why we can't have nice things."],
  Food:         ["$1000/mo on food wasn't enough huh? 🍔","Eating your retirement one bite at a time.","Gordon Ramsay better have cooked this."],
  default:      ["The Doctor is watching. 👀","Every expense delays your goal.","Noted. The ledger remembers."],
};
const PRAISES = ["YESSS! 💊","Compound interest dances. 📈","THAT'S what I'm talking about! 🔥","Beautiful. 🥹"];

const XP_PER_LEVEL = 500;
const todayStr = () => new Date().toISOString().split("T")[0];
const fmt  = n => (+(n??0)).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtK = n => n>=1000000?`$${(n/1000000).toFixed(2)}M`:n>=1000?`$${(n/1000).toFixed(1)}k`:`$${fmt(n)}`;
const getRoast  = cat => { const a=ROASTS[cat]||ROASTS.default; return a[Math.floor(Math.random()*a.length)]; };
const getPraise = () => PRAISES[Math.floor(Math.random()*PRAISES.length)];

const SKEY = "drMoneyV7";

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

const W="#ffffff", S="#cbd5e1", G="#34d399", R="#f87171", Y="#fbbf24", B="#60a5fa", P="#a78bfa";
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
  const [form, setForm]     = useState({
    type:"expense", amount:"", category:"Food", note:"", date:todayStr(),
    fromAccount:"checking", toAccount:"checking"
  });
  const saveRef             = useRef(null);
  const isFirst             = useRef(true);

  useEffect(() => {
    try {
      const raw = storageRead();
      if (raw) {
        const parsed = JSON.parse(raw);
        setData({
          ...EMPTY, ...parsed,
          assets: { ...EMPTY.assets, ...(parsed.assets||{}) },
          debts:  { ...EMPTY.debts,  ...(parsed.debts||{}) },
          transactions: parsed.transactions || [],
          balHistory:   parsed.balHistory   || [],
          achievements: parsed.achievements || [],
        });
      }
      setSM(hasLS ? "persistent" : "memory");
    } catch(e) { setSM(hasLS ? "persistent" : "memory"); }
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

  // ── CALCULATOR INPUT ───────────────────────────────────────────────────────
  const onKey = (k) => {
    const curr = form.amount || "";
    if (k === "C") return setForm(f => ({...f, amount: ""}));
    if (k === "⌫") return setForm(f => ({...f, amount: curr.slice(0,-1)}));
    if (k === ".") {
      if (curr.includes(".")) return;
      return setForm(f => ({...f, amount: (curr || "0") + "."}));
    }
    // Prevent more than 2 decimals
    if (curr.includes(".")) {
      const [, dec] = curr.split(".");
      if (dec.length >= 2) return;
    }
    setForm(f => ({...f, amount: curr + k}));
  };

  // ── APPLY TRANSACTION TO BALANCES ─────────────────────────────────────────
  const applyToBalances = (tx, currentAssets, currentDebts) => {
    const newA = {...currentAssets};
    const newD = {...currentDebts};
    const amt = tx.amount;

    if (tx.type === "income") {
      // Income INTO an asset account
      if (newA[tx.toAccount] !== undefined) newA[tx.toAccount] = (+newA[tx.toAccount]||0) + amt;
      else if (newD[tx.toAccount] !== undefined) newD[tx.toAccount] = Math.max(0, (+newD[tx.toAccount]||0) - amt);
    } else if (tx.type === "expense") {
      // Expense FROM an account
      const acc = getAccount(tx.fromAccount);
      if (acc?.type === "asset") newA[tx.fromAccount] = Math.max(0, (+newA[tx.fromAccount]||0) - amt);
      else if (acc?.type === "debt") newD[tx.fromAccount] = (+newD[tx.fromAccount]||0) + amt; // CC purchase = debt grows
    } else if (tx.type === "transfer") {
      // Money leaves fromAccount
      const fromAcc = getAccount(tx.fromAccount);
      const toAcc = getAccount(tx.toAccount);
      if (fromAcc?.type === "asset") newA[tx.fromAccount] = Math.max(0, (+newA[tx.fromAccount]||0) - amt);
      else if (fromAcc?.type === "debt") newD[tx.fromAccount] = (+newD[tx.fromAccount]||0) + amt;
      // Money arrives at toAccount
      if (toAcc?.type === "asset") newA[tx.toAccount] = (+newA[tx.toAccount]||0) + amt;
      else if (toAcc?.type === "debt") newD[tx.toAccount] = Math.max(0, (+newD[tx.toAccount]||0) - amt); // Paying down debt
    }
    return { assets: newA, debts: newD };
  };

  const handleSubmit = () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { showToast("Enter a valid amount. 🙄","error"); return; }
    if (form.type === "transfer" && form.fromAccount === form.toAccount) {
      showToast("From and To must differ. 🙄","error"); return;
    }

    const tx = { id:Date.now(), ...form, amount:amt };
    const newTx = [tx, ...transactions];
    const { assets: newA, debts: newD } = applyToBalances(tx, assets, debts);

    let newXp  = xp + (form.type==="income"?30:form.type==="transfer"?20:10);
    let newAch = [...achievements];
    let newStr = streak, newLL = lastLog;
    const td = todayStr();
    if (lastLog !== td) {
      const yd = new Date(); yd.setDate(yd.getDate()-1);
      newStr = lastLog===yd.toISOString().split("T")[0] ? streak+1 : 1;
      newLL = td;
    }
    if (newTx.length===1)            ({ach:newAch,xp:newXp}=tryUnlock("first_log",newAch,newXp));
    if (newStr>=3)                   ({ach:newAch,xp:newXp}=tryUnlock("streak_3",newAch,newXp));
    if (newStr>=7)                   ({ach:newAch,xp:newXp}=tryUnlock("streak_7",newAch,newXp));
    if (form.type==="transfer")      ({ach:newAch,xp:newXp}=tryUnlock("first_transfer",newAch,newXp));
    if (form.type==="transfer" && getAccount(form.toAccount)?.type==="debt")
                                     ({ach:newAch,xp:newXp}=tryUnlock("cc_payment",newAch,newXp));
    const nNW = Object.values(newA).reduce((s,v)=>s+(+v||0),0) - Object.values(newD).reduce((s,v)=>s+(+v||0),0);
    if (nNW>=100000)                 ({ach:newAch,xp:newXp}=tryUnlock("hit_100k",newAch,newXp));
    if (nNW>=500000)                 ({ach:newAch,xp:newXp}=tryUnlock("hit_500k",newAch,newXp));
    if ((+(newA.hysa)||0)>=50000)    ({ach:newAch,xp:newXp}=tryUnlock("hysa_50k",newAch,newXp));
    if (Object.values(newD).every(v=>(+v||0)===0)) ({ach:newAch,xp:newXp}=tryUnlock("debt_zero",newAch,newXp));

    patch({
      transactions: newTx,
      assets: newA,
      debts: newD,
      xp: newXp,
      achievements: newAch,
      streak: newStr,
      lastLog: newLL,
    });
    setForm({
      type:"expense", amount:"", category:"Food", note:"", date:todayStr(),
      fromAccount:"checking", toAccount:"checking"
    });

    if (form.type==="expense") showToast(getRoast(form.category),"roast");
    else if (form.type==="income") showToast(getPraise(),"praise");
    else showToast(`Transferred $${fmt(amt)} 💸`,"praise");
    setScreen("dashboard");
  };

  const handleBalSave = () => {
    const newA = { ...assets };
    const newD = { ...debts };
    Object.entries(editA).forEach(([k,v])=>{ const n=parseFloat(v); if(!isNaN(n)&&n>=0) newA[k]=n; });
    Object.entries(editD).forEach(([k,v])=>{ const n=parseFloat(v); if(!isNaN(n)&&n>=0) newD[k]=n; });
    const snap = { date:todayStr(), assets:{...newA}, debts:{...newD} };
    const newBH = [snap, ...balHistory].slice(0,90);
    patch({ assets:newA, debts:newD, balHistory:newBH });
    setEA({}); setED({});
    showToast("Balances saved! ✅","praise");
  };

  const deleteTx = (id) => {
    const tx = transactions.find(t=>t.id===id);
    if (!tx) return;
    // Reverse the transaction's balance effects
    const reverseTx = { ...tx, amount: -tx.amount };
    const { assets: newA, debts: newD } = applyToBalances(reverseTx, assets, debts);
    patch({
      transactions: transactions.filter(t=>t.id!==id),
      assets: newA,
      debts: newD,
    });
    showToast("Transaction reversed. 🔄","info");
  };

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
          ...EMPTY, ...parsed,
          assets: { ...EMPTY.assets, ...(parsed.assets||{}) },
          debts:  { ...EMPTY.debts,  ...(parsed.debts||{}) },
        });
        showToast("Backup restored! ✅","praise");
      } catch { showToast("Invalid backup file ❌","error"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const statusLabel = saveStatus==="saving" ? "💾" : saveStatus==="saved" ? "✅" : saveStatus==="memonly" ? "⚠️" : "";
  const statusColor = saveStatus==="saving" ? Y : saveStatus==="saved" ? G : saveStatus==="memonly" ? "#fb923c" : S;

  if (!loaded) return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",color:W,fontFamily:"monospace"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:52,marginBottom:14}}>💊</div>
        <div style={{fontSize:14,letterSpacing:"0.2em"}}>LOADING...</div>
      </div>
    </div>
  );

  // ── ACCOUNT GRID PICKER ────────────────────────────────────────────────────
  const AccountGrid = ({ selectedId, onSelect, filter="all", label }) => {
    const accounts = filter === "asset" ? ASSET_ACCOUNTS : filter === "debt" ? DEBT_ACCOUNTS : ALL_ACCOUNTS;
    return (
      <div>
        <div className="lbl">{label}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
          {accounts.map(acc => {
            const sel = selectedId === acc.id;
            return (
              <button key={acc.id} onClick={()=>onSelect(acc.id)} className="btn" style={{
                background: sel ? `${acc.color}22` : CARD,
                border: `1px solid ${sel ? acc.color : BORDER}`,
                borderRadius: 8, padding: "6px 3px",
                color: sel ? acc.color : W, fontSize: 9,
                display:"flex", flexDirection:"column", alignItems:"center", gap:2,
              }}>
                <span style={{fontSize:14}}>{acc.icon}</span>
                <span style={{fontSize:8, lineHeight:1.1}}>{acc.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{minHeight:"100vh",background:BG,color:W,fontFamily:"'Courier New',monospace",paddingBottom:60}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#334155;border-radius:2px}
        .btn{cursor:pointer;border:none;font-family:'Courier New',monospace;transition:all 0.15s;}
        .btn:hover{filter:brightness(1.15);}
        .btn:active{transform:scale(0.96);}
        input,select{font-family:'Courier New',monospace;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#ffffff;border-radius:8px;padding:9px 11px;width:100%;font-size:13px;outline:none;}
        input:focus,select:focus{border-color:#34d399;box-shadow:0 0 0 2px rgba(52,211,153,0.2);}
        select option{background:#0d1117;color:#ffffff;}
        input[type=date]{color-scheme:dark;}
        input::placeholder{color:#475569;}
        .slide{animation:su 0.22s ease-out;}
        @keyframes su{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}
        .lbl{font-size:9px;color:#94a3b8;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:4px;font-weight:700;}
      `}</style>

      {toast&&(
        <div style={{position:"fixed",top:12,left:"50%",transform:"translateX(-50%)",zIndex:9999,
          background:toast.type==="roast"?"#1f0808":toast.type==="praise"?"#061a10":toast.type==="achievement"?"#0d0d1f":"#0f172a",
          border:`1px solid ${toast.type==="roast"?R:toast.type==="praise"?G:toast.type==="achievement"?Y:BORDER}`,
          borderRadius:12,padding:"10px 16px",maxWidth:"92vw",fontSize:11,lineHeight:1.5,color:W,boxShadow:"0 8px 24px rgba(0,0,0,0.7)",textAlign:"center"}} className="slide">
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div style={{background:"rgba(9,11,18,0.96)",borderBottom:`1px solid ${BORDER}`,padding:"10px 14px",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:500,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:14,fontWeight:900,color:G}}>💊 DR. MONEY {statusLabel&&<span style={{fontSize:10,color:statusColor,marginLeft:4}}>{statusLabel}</span>}</div>
            <div style={{fontSize:8,color:S,letterSpacing:"0.14em"}}>FINANCIAL ASYLUM</div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:8,color:S}}>STR</div><div style={{fontSize:11,color:"#fb923c",fontWeight:700}}>{streak>0?`🔥${streak}`:"0"}</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:8,color:S}}>LVL</div><div style={{fontSize:11,color:Y,fontWeight:700}}>{level}</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:8,color:S}}>XP</div><div style={{fontSize:11,color:W,fontWeight:700}}>{xp}</div></div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:500,margin:"0 auto",padding:"12px 12px 0"}}>

        {storageMode==="memory"&&(
          <div style={{background:"rgba(251,146,60,0.08)",border:"1px solid rgba(251,146,60,0.3)",borderRadius:10,padding:"8px 12px",marginBottom:10}}>
            <div style={{fontSize:10,color:"#fb923c",fontWeight:700}}>⚠️ Memory-only mode — data won't persist. Use EXPORT.</div>
          </div>
        )}

        {/* XP BAR */}
        <div style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:W,marginBottom:3}}>
            <span>LV{level}</span><span style={{color:S}}>{levelXp}/{XP_PER_LEVEL}</span><span>LV{level+1}</span>
          </div>
          <div style={{height:4,background:"rgba(255,255,255,0.08)",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${levelPct}%`,background:"linear-gradient(90deg,#34d399,#60a5fa)",borderRadius:2,transition:"width 0.6s"}}/>
          </div>
        </div>

        {/* NAV */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,marginBottom:12}}>
          {[{id:"dashboard",icon:"📊",label:"HOME"},{id:"accounts",icon:"🏦",label:"ACCTS"},{id:"log",icon:"➕",label:"LOG"},{id:"history",icon:"📋",label:"HIST"},{id:"ranks",icon:"🏆",label:"RANKS"}].map(({id,icon,label})=>(
            <button key={id} onClick={()=>setScreen(id)} className="btn" style={{background:screen===id?"rgba(52,211,153,0.12)":CARD,border:`1px solid ${screen===id?G:BORDER}`,borderRadius:9,padding:"6px 2px",color:screen===id?G:W,fontSize:8}}>
              <div style={{fontSize:14,marginBottom:1}}>{icon}</div>{label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ══ DASHBOARD ══════════════════════════════════════════════════════ */}
        {screen==="dashboard"&&(
          <div className="slide">
            <div style={{background:"rgba(52,211,153,0.07)",border:"1px solid rgba(52,211,153,0.25)",borderRadius:14,padding:"14px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div>
                  <div className="lbl">🎯 MILESTONE</div>
                  <div style={{fontSize:22,fontWeight:900,color:W}}>{fmtK(totalNW)}</div>
                  <div style={{fontSize:11,color:W,marginTop:2}}>of <span style={{color:G,fontWeight:700}}>{fmtK(activeMilestone.target)}</span> {activeMilestone.icon}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:26,fontWeight:900,color:G}}>{mProgress.toFixed(1)}%</div>
                </div>
              </div>
              <div style={{height:8,background:"rgba(255,255,255,0.08)",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${mProgress}%`,background:"linear-gradient(90deg,#34d399,#fbbf24)",borderRadius:4,transition:"width 0.8s"}}/>
              </div>
              <div style={{fontSize:10,color:S,marginTop:6}}>{fmtK(activeMilestone.target-totalNW)} to go</div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10}}>
              {MILESTONES.map(m=>{const done=totalNW>=m.target,active=activeMilestone.target===m.target;return(
                <div key={m.target} style={{background:done?"rgba(52,211,153,0.1)":active?"rgba(251,191,36,0.1)":CARD,border:`1px solid ${done?"rgba(52,211,153,0.35)":active?"rgba(251,191,36,0.35)":BORDER}`,borderRadius:9,padding:"8px 4px",textAlign:"center"}}>
                  <div style={{fontSize:16}}>{m.icon}</div>
                  <div style={{fontSize:9,color:W,marginTop:2,fontWeight:700}}>{fmtK(m.target)}</div>
                  <div style={{fontSize:8,color:done?G:active?Y:S,marginTop:1}}>{done?"✅":active?"◀":"🔒"}</div>
                </div>
              );})}
            </div>

            {(()=>{
              const hysaBal = +(assets.hysa||0);
              const hysaPct = Math.min((hysaBal/50000)*100, 100);
              const hysaDone = hysaBal >= 50000;
              return(
                <div style={{background:hysaDone?"rgba(52,211,153,0.08)":"rgba(56,189,248,0.06)",border:`1px solid ${hysaDone?"rgba(52,211,153,0.3)":"rgba(56,189,248,0.25)"}`,borderRadius:12,padding:"12px",marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <div>
                      <div className="lbl" style={{color:hysaDone?G:"#38bdf8"}}>🏰 HYSA SUB-GOAL</div>
                      <div style={{fontSize:16,fontWeight:900,color:W,marginTop:1}}>${fmt(hysaBal)}</div>
                      <div style={{fontSize:10,color:S}}>of <span style={{color:hysaDone?G:"#38bdf8",fontWeight:700}}>$50,000</span></div>
                    </div>
                    <div style={{fontSize:18,fontWeight:900,color:hysaDone?G:"#38bdf8"}}>{hysaPct.toFixed(1)}%</div>
                  </div>
                  <div style={{height:7,background:"rgba(255,255,255,0.08)",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${hysaPct}%`,background:hysaDone?"linear-gradient(90deg,#34d399,#4ade80)":"linear-gradient(90deg,#38bdf8,#60a5fa)",borderRadius:3,transition:"width 0.8s"}}/>
                  </div>
                </div>
              );
            })()}

            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10}}>
              <div style={{background:CARD,border:"1px solid rgba(96,165,250,0.25)",borderRadius:10,padding:"10px"}}>
                <div className="lbl">💵 CASH</div>
                <div style={{fontSize:13,fontWeight:700,color:B}}>${fmt(cashTotal)}</div>
              </div>
              <div style={{background:CARD,border:"1px solid rgba(167,139,250,0.25)",borderRadius:10,padding:"10px"}}>
                <div className="lbl">📈 INVESTED</div>
                <div style={{fontSize:13,fontWeight:700,color:P}}>${fmt(investTotal)}</div>
              </div>
              <div style={{background:CARD,border:"1px solid rgba(248,113,113,0.25)",borderRadius:10,padding:"10px"}}>
                <div className="lbl">💳 DEBT</div>
                <div style={{fontSize:13,fontWeight:700,color:R}}>${fmt(totalDebts)}</div>
              </div>
            </div>

            {totalDebts>0&&(
              <div style={{background:"rgba(248,113,113,0.07)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:10,padding:"10px 12px",marginBottom:10}}>
                <div className="lbl" style={{color:R}}>🚨 DEBT</div>
                {DEBT_ACCOUNTS.map(acc=>{const b=+(debts[acc.id]||0);if(!b) return null;return(
                  <div key={acc.id} style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
                    <span style={{fontSize:11,color:W}}>{acc.icon} {acc.label}</span>
                    <span style={{fontSize:11,color:R,fontWeight:700}}>-${fmt(b)}</span>
                  </div>
                );})}
              </div>
            )}

            <div className="lbl" style={{marginBottom:5}}>📅 TODAY</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10}}>
              {[{l:"IN",v:`+$${fmt(todayIn)}`,c:G},{l:"OUT",v:`-$${fmt(todayOut)}`,c:R},{l:"NET",v:`${todayIn-todayOut>=0?"+":""}${fmt(todayIn-todayOut)}`,c:todayIn-todayOut>=0?G:R}].map(({l,v,c})=>(
                <div key={l} style={{background:CARD,border:`1px solid ${c}40`,borderRadius:8,padding:"8px"}}>
                  <div className="lbl">{l}</div>
                  <div style={{fontSize:12,fontWeight:700,color:c}}>{v}</div>
                </div>
              ))}
            </div>

            <div className="lbl" style={{marginBottom:5}}>📆 {thisMonth}</div>
            <div style={{background:CARD,border:BORDER,borderRadius:10,padding:"10px 12px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div><div className="lbl">IN</div><div style={{fontSize:14,color:G,fontWeight:700}}>+${fmt(monthIn)}</div></div>
                <div style={{textAlign:"center"}}><div className="lbl">NET</div><div style={{fontSize:14,color:monthIn-monthOut>=0?G:R,fontWeight:700}}>{monthIn-monthOut>=0?"+":""}{fmt(monthIn-monthOut)}</div></div>
                <div style={{textAlign:"right"}}><div className="lbl">OUT</div><div style={{fontSize:14,color:R,fontWeight:700}}>-${fmt(monthOut)}</div></div>
              </div>
            </div>

            {transactions.length>0&&(<>
              <div className="lbl" style={{marginBottom:5}}>⚡ RECENT</div>
              {transactions.slice(0,5).map(t=>{
                const fromAcc = getAccount(t.fromAccount);
                const toAcc = getAccount(t.toAccount);
                const isTransfer = t.type === "transfer";
                const color = t.type==="income"?G:t.type==="transfer"?B:R;
                return(
                <div key={t.id} style={{background:CARD,border:`1px solid ${color}26`,borderRadius:9,padding:"9px 11px",marginBottom:4}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,color:W,fontWeight:600}}>
                        {isTransfer ? `${fromAcc?.icon||""} → ${toAcc?.icon||""} Transfer` : t.category}
                        {t.note?` · ${t.note}`:""}
                      </div>
                      <div style={{fontSize:9,color:S,marginTop:1}}>
                        {t.date} · {isTransfer ? `${fromAcc?.label} → ${toAcc?.label}` : (t.type==="income" ? `→ ${toAcc?.label}` : `← ${fromAcc?.label}`)}
                      </div>
                    </div>
                    <div style={{fontSize:12,fontWeight:700,color}}>
                      {t.type==="income"?"+":t.type==="transfer"?"⇄":"-"}${fmt(t.amount)}
                    </div>
                  </div>
                </div>
              );})}
            </>)}

            {transactions.length===0&&(
              <div style={{textAlign:"center",padding:"24px 16px"}}>
                <div style={{fontSize:38,marginBottom:8}}>💊</div>
                <div style={{fontSize:13,color:W,fontWeight:700,marginBottom:4}}>No transactions yet.</div>
                <div style={{fontSize:11,color:S}}>Hit LOG to begin.</div>
              </div>
            )}

            <div style={{background:CARD,border:BORDER,borderRadius:10,padding:"12px",marginTop:12}}>
              <div className="lbl" style={{marginBottom:6}}>🔐 BACKUP</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                <button onClick={exportData} className="btn" style={{background:"rgba(52,211,153,0.1)",border:`1px solid ${G}40`,borderRadius:7,padding:"8px",color:G,fontSize:10,fontWeight:700}}>⬇️ EXPORT</button>
                <label className="btn" style={{background:"rgba(96,165,250,0.1)",border:`1px solid #60a5fa40`,borderRadius:7,padding:"8px",color:B,fontSize:10,fontWeight:700,textAlign:"center",display:"block"}}>
                  ⬆️ IMPORT
                  <input type="file" accept=".json" onChange={importData} style={{display:"none"}}/>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ══ LOG (THE BIG UPGRADE) ══════════════════════════════════════════ */}
        {screen==="log"&&(
          <div className="slide">

            {/* TYPE SWITCHER — 3 buttons now */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:10}}>
              {[
                {t:"expense", label:"💸 OUT", color:R},
                {t:"income",  label:"💰 IN",  color:G},
                {t:"transfer",label:"⇄ MOVE", color:B},
              ].map(({t,label,color})=>(
                <button key={t} onClick={()=>setForm(f=>({...f,type:t,category:t==="expense"?"Food":t==="income"?"Salary":f.category}))} className="btn" style={{
                  background: form.type===t ? `${color}22` : CARD,
                  border:`1px solid ${form.type===t ? color : BORDER}`,
                  borderRadius:9, padding:"9px",
                  color:form.type===t ? color : W,
                  fontSize:11, fontWeight:700,
                }}>
                  {label}
                </button>
              ))}
            </div>

            {/* CALCULATOR DISPLAY */}
            <div style={{background:"rgba(0,0,0,0.3)",border:`1px solid ${form.type==="income"?G:form.type==="transfer"?B:R}40`,borderRadius:12,padding:"14px",marginBottom:8,textAlign:"right"}}>
              <div className="lbl" style={{textAlign:"left",marginBottom:2}}>AMOUNT</div>
              <div style={{fontSize:34,fontWeight:900,color:form.type==="income"?G:form.type==="transfer"?B:R,lineHeight:1}}>
                ${form.amount||"0"}
                {form.amount && !form.amount.includes(".")?".00":""}
                {form.amount.includes(".") && form.amount.split(".")[1].length===0?"00":""}
                {form.amount.includes(".") && form.amount.split(".")[1].length===1?"0":""}
              </div>
            </div>

            {/* CALCULATOR PAD */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:10}}>
              {["7","8","9","4","5","6","1","2","3",".","0","⌫"].map(k=>{
                const isAction = k==="⌫"||k==="C";
                return(
                  <button key={k} onClick={()=>onKey(k)} className="btn" style={{
                    background: isAction?"rgba(248,113,113,0.1)":"rgba(255,255,255,0.06)",
                    border:`1px solid ${isAction?"rgba(248,113,113,0.25)":"rgba(255,255,255,0.12)"}`,
                    borderRadius:10, padding:"14px 0",
                    color: isAction?R:W, fontSize:20, fontWeight:700,
                  }}>{k}</button>
                );
              })}
            </div>
            <button onClick={()=>onKey("C")} className="btn" style={{width:"100%",background:"rgba(248,113,113,0.06)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:9,padding:"8px",color:R,fontSize:11,fontWeight:700,marginBottom:12,letterSpacing:"0.1em"}}>CLEAR</button>

            {/* ACCOUNT PICKERS */}
            {form.type==="expense"&&(
              <div style={{marginBottom:10}}>
                <AccountGrid selectedId={form.fromAccount} onSelect={id=>setForm(f=>({...f,fromAccount:id}))} filter="all" label="💳 PAID FROM"/>
                {getAccount(form.fromAccount)?.type==="debt" && (
                  <div style={{fontSize:10,color:"#fb923c",marginTop:4,fontStyle:"italic"}}>⚠️ This will add to your {getAccount(form.fromAccount)?.label} debt</div>
                )}
              </div>
            )}
            {form.type==="income"&&(
              <div style={{marginBottom:10}}>
                <AccountGrid selectedId={form.toAccount} onSelect={id=>setForm(f=>({...f,toAccount:id}))} filter="asset" label="🏦 DEPOSIT TO"/>
              </div>
            )}
            {form.type==="transfer"&&(<>
              <div style={{marginBottom:8}}>
                <AccountGrid selectedId={form.fromAccount} onSelect={id=>setForm(f=>({...f,fromAccount:id}))} filter="all" label="📤 FROM"/>
              </div>
              <div style={{marginBottom:10}}>
                <AccountGrid selectedId={form.toAccount} onSelect={id=>setForm(f=>({...f,toAccount:id}))} filter="all" label="📥 TO"/>
                {form.type==="transfer" && getAccount(form.toAccount)?.type==="debt" && (
                  <div style={{fontSize:10,color:G,marginTop:4,fontStyle:"italic"}}>💪 Paying down {getAccount(form.toAccount)?.label}</div>
                )}
              </div>
            </>)}

            {/* CATEGORY — only for expense/income */}
            {form.type!=="transfer"&&(
              <div style={{marginBottom:8}}>
                <div className="lbl">CATEGORY</div>
                <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                  {CATEGORIES[form.type].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            )}

            <div style={{marginBottom:8}}>
              <div className="lbl">DATE</div>
              <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
            </div>

            <div style={{marginBottom:12}}>
              <div className="lbl">NOTE (optional)</div>
              <input type="text" placeholder="What was this for?" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/>
            </div>

            <button onClick={handleSubmit} className="btn" style={{
              width:"100%",padding:"14px",borderRadius:12,
              background:form.type==="income"?`linear-gradient(135deg,${G},${B})`:form.type==="transfer"?`linear-gradient(135deg,${B},${P})`:`linear-gradient(135deg,${R},#fb923c)`,
              color:BG,fontSize:13,fontWeight:900,letterSpacing:"0.08em",
            }}>
              {form.type==="income"?"⚡ LOG INCOME":form.type==="transfer"?"⇄ EXECUTE TRANSFER":"💸 LOG EXPENSE"}
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ══ ACCOUNTS ══════════════════════════════════════════════════════ */}
        {screen==="accounts"&&(
          <div className="slide">
            <div style={{background:"rgba(52,211,153,0.07)",border:"1px solid rgba(52,211,153,0.25)",borderRadius:12,padding:"14px",marginBottom:12}}>
              <div className="lbl">TRUE NET WORTH</div>
              <div style={{fontSize:22,fontWeight:900,color:W}}>${fmt(totalNW)}</div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                <span style={{fontSize:10,color:G}}>+${fmt(totalAssets)}</span>
                <span style={{fontSize:10,color:R}}>−${fmt(totalDebts)}</span>
              </div>
            </div>

            <div style={{fontSize:11,color:W,fontWeight:700,marginBottom:6}}>💰 ASSETS</div>
            {ASSET_ACCOUNTS.map(acc=>(
              <div key={acc.id} style={{background:CARD,border:BORDER,borderRadius:10,padding:"10px 12px",marginBottom:6}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:18}}>{acc.icon}</span>
                    <div>
                      <div style={{fontSize:11,color:W,fontWeight:700}}>{acc.label}</div>
                      <div style={{fontSize:9,color:S}}>Current: <span style={{color:acc.color,fontWeight:700}}>${fmt(assets[acc.id]||0)}</span></div>
                    </div>
                  </div>
                </div>
                <input type="number" placeholder="Adjust..." value={editA[acc.id]||""} onChange={e=>setEA(p=>({...p,[acc.id]:e.target.value}))} style={{color:acc.color,borderColor:`${acc.color}50`}}/>
              </div>
            ))}

            <div style={{fontSize:11,color:R,fontWeight:700,margin:"14px 0 6px"}}>💳 DEBTS</div>
            {DEBT_ACCOUNTS.map(acc=>(
              <div key={acc.id} style={{background:"rgba(248,113,113,0.04)",border:"1px solid rgba(248,113,113,0.15)",borderRadius:10,padding:"10px 12px",marginBottom:6}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:18}}>{acc.icon}</span>
                    <div>
                      <div style={{fontSize:11,color:W,fontWeight:700}}>{acc.label}</div>
                      <div style={{fontSize:9,color:S}}>Owed: <span style={{color:R,fontWeight:700}}>${fmt(debts[acc.id]||0)}</span></div>
                    </div>
                  </div>
                </div>
                <input type="number" placeholder="Adjust..." value={editD[acc.id]||""} onChange={e=>setED(p=>({...p,[acc.id]:e.target.value}))} style={{color:R,borderColor:"rgba(248,113,113,0.4)"}}/>
              </div>
            ))}

            <button onClick={handleBalSave} className="btn" style={{width:"100%",padding:"13px",borderRadius:11,background:`linear-gradient(135deg,${G},#60a5fa)`,color:BG,fontSize:12,fontWeight:900,marginTop:4,marginBottom:10}}>💾 SAVE MANUAL ADJUSTMENTS</button>

            <div style={{background:"rgba(251,191,36,0.05)",border:"1px solid rgba(251,191,36,0.15)",borderRadius:10,padding:"10px 12px"}}>
              <div className="lbl" style={{color:Y}}>🩺 TIP</div>
              <div style={{fontSize:11,color:W,lineHeight:1.6}}>Most balance changes now happen AUTOMATICALLY when you log transactions. Only use manual adjustments for stock price movements, interest earned, or corrections.</div>
            </div>
          </div>
        )}

        {/* ══ HISTORY ══ */}
        {screen==="history"&&(
          <div className="slide">
            <div style={{fontSize:11,color:W,fontWeight:700,marginBottom:8}}>📋 TRANSACTIONS ({transactions.length})</div>
            {transactions.length===0&&<div style={{textAlign:"center",padding:40,color:W,fontSize:12}}>No transactions yet. 💊</div>}
            {transactions.map(t=>{
              const fromAcc = getAccount(t.fromAccount);
              const toAcc = getAccount(t.toAccount);
              const color = t.type==="income"?G:t.type==="transfer"?B:R;
              return(
              <div key={t.id} style={{background:CARD,border:`1px solid ${color}26`,borderRadius:9,padding:"9px 11px",marginBottom:5,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:W,fontWeight:700}}>
                    {t.type==="transfer" ? "⇄ Transfer" : t.category}
                    {t.note?` · ${t.note}`:""}
                  </div>
                  <div style={{fontSize:9,color:S,marginTop:1}}>
                    {t.date} · {t.type==="transfer" ? `${fromAcc?.icon} → ${toAcc?.icon}` : t.type==="income" ? `→ ${toAcc?.icon} ${toAcc?.label}` : `${fromAcc?.icon} ${fromAcc?.label}`}
                  </div>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <div style={{fontSize:12,fontWeight:700,color}}>{t.type==="income"?"+":t.type==="transfer"?"⇄":"-"}${fmt(t.amount)}</div>
                  <button onClick={()=>deleteTx(t.id)} className="btn" style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.25)",borderRadius:5,padding:"3px 7px",color:R,fontSize:10}}>✕</button>
                </div>
              </div>
            );})}
          </div>
        )}

        {/* ══ RANKS ══ */}
        {screen==="ranks"&&(
          <div className="slide">
            <div style={{background:"rgba(251,191,36,0.07)",border:"1px solid rgba(251,191,36,0.25)",borderRadius:12,padding:"14px",marginBottom:10,textAlign:"center"}}>
              <div style={{fontSize:32,fontWeight:900,color:Y}}>LV{level}</div>
              <div style={{fontSize:12,color:W,fontWeight:700,marginTop:2}}>{xp} total XP</div>
              <div style={{fontSize:10,color:S,marginTop:1}}>{levelXp}/{XP_PER_LEVEL} to Level {level+1}</div>
            </div>
            <div style={{fontSize:11,color:W,fontWeight:700,marginBottom:6}}>🏆 ACHIEVEMENTS ({achievements.length}/{ACHIEVEMENTS.length})</div>
            {ACHIEVEMENTS.map(a=>{const done=achievements.includes(a.id);return(
              <div key={a.id} style={{background:done?"rgba(251,191,36,0.06)":CARD,border:`1px solid ${done?"rgba(251,191,36,0.25)":BORDER}`,borderRadius:10,padding:"10px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:10,opacity:done?1:0.5}}>
                <div style={{fontSize:22,filter:done?"none":"grayscale(1)"}}>{a.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:done?Y:W,fontWeight:700}}>{a.title}</div>
                  <div style={{fontSize:9,color:S}}>{a.desc}</div>
                </div>
                <div style={{fontSize:11,color:done?Y:W,fontWeight:700}}>+{a.xp}</div>
              </div>
            );})}
          </div>
        )}

      </div>
    </div>
  );
}
