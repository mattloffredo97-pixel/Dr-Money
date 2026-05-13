import { useState, useEffect, useRef, useMemo } from "react";

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

const ROASTS = {
  Entertainment:["Really? Entertainment AGAIN? 😤","Every fun dollar is not compounding.","The market doesn't care about hobbies."],
  Shopping:     ["Oh look who went SHOPPING. Bezos thanks you.","Another purchase? Goal just got further.","This is why we can't have nice things."],
  Food:         ["$1000/mo on food wasn't enough? 🍔","Eating your retirement one bite at a time.","Gordon Ramsay better have cooked this."],
  default:      ["The Doctor is watching. 👀","Every expense delays your goal.","Noted. The ledger remembers."],
};
const PRAISES = ["YESSS! 💊","Compound interest dances. 📈","THAT'S what I'm talking about! 🔥","Beautiful. 🥹"];

// ─── STARTER PRESETS (used until user has 10+ transactions) ──────────────────
const STARTER_PRESETS = [
  { emoji:"⛽", word:"gas",          category:"Gas" },
  { emoji:"☕", word:"coffee",       category:"Food" },
  { emoji:"🍔", word:"food",         category:"Food" },
  { emoji:"🛒", word:"shopping",     category:"Shopping" },
  { emoji:"📱", word:"subscription", category:"Subscriptions" },
  { emoji:"🚗", word:"transport",    category:"Transport" },
];

// ─── EMOJI MAP for guessing emojis on dynamic presets ────────────────────────
const EMOJI_HINTS = {
  gas:"⛽", fuel:"⛽", shell:"⛽", exxon:"⛽",
  coffee:"☕", starbucks:"☕", dunkin:"☕",
  food:"🍔", lunch:"🍔", dinner:"🍴", breakfast:"🥞", restaurant:"🍴", takeout:"🥡", grub:"🍔", uber:"🚗", lyft:"🚗",
  groceries:"🛒", grocery:"🛒", whole:"🛒", trader:"🛒", costco:"🛒", target:"🎯",
  amazon:"📦", shopping:"🛍️", clothes:"👕", shoes:"👟",
  netflix:"📺", spotify:"🎵", subscription:"📱", phone:"📱", verizon:"📱", att:"📱",
  rent:"🏠", mortgage:"🏠", utilities:"💡", electric:"⚡", water:"💧", gas_bill:"🔥",
  medical:"💊", doctor:"🩺", pharmacy:"💊", cvs:"💊",
  entertainment:"🎬", movie:"🎬", concert:"🎤", bar:"🍺", drinks:"🍻",
  transport:"🚗", car:"🚗", train:"🚆", flight:"✈️", parking:"🅿️", toll:"🛣️",
};

const todayStr = () => new Date().toISOString().split("T")[0];
const fmt  = n => (+(n??0)).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtK = n => n>=1000000?`$${(n/1000000).toFixed(2)}M`:n>=1000?`$${(n/1000).toFixed(1)}k`:`$${fmt(n)}`;
const getRoast  = cat => { const a=ROASTS[cat]||ROASTS.default; return a[Math.floor(Math.random()*a.length)]; };
const getPraise = () => PRAISES[Math.floor(Math.random()*PRAISES.length)];

const getEmojiForWord = (word) => {
  const lower = word.toLowerCase().trim();
  if (EMOJI_HINTS[lower]) return EMOJI_HINTS[lower];
  for (const key in EMOJI_HINTS) {
    if (lower.includes(key) || key.includes(lower)) return EMOJI_HINTS[key];
  }
  return "📝";
};

const SKEY = "drMoneyV11";

const EMPTY = {
  transactions: [],
  assets: { checking:2300, emergency:2000, hysa:12747, investments:17465, joint_invest:3790, sharkninja:11947, joint_savings:100, house_fund:15000 },
  debts:  { debt_bofa:0, debt_chase:0, debt_lowes:0, debt_cap1:0 },
  balHistory: [],
  streak:0, lastLog:null,
  theme: "dark",
};

const hasLS = (() => { try { localStorage.setItem("__t","1"); localStorage.removeItem("__t"); return true; } catch { return false; } })();
let memStore = null;
const storageRead  = () => { try { return hasLS ? localStorage.getItem(SKEY) : memStore; } catch { return memStore; } };
const storageWrite = (v) => { try { if(hasLS) localStorage.setItem(SKEY,v); memStore = v; return true; } catch { memStore=v; return false; } };

const THEMES = {
  dark: {
    W: "#ffffff", S: "#cbd5e1", G: "#34d399", R: "#f87171", Y: "#fbbf24", B: "#60a5fa", P: "#a78bfa",
    BG: "#090b12", CARD: "rgba(255,255,255,0.05)", BORDER: "rgba(255,255,255,0.12)",
    headerBg: "rgba(9,11,18,0.96)",
    inputBg: "rgba(255,255,255,0.08)", inputBorder: "rgba(255,255,255,0.2)",
    placeholderColor: "#475569",
    selectBg: "#0d1117",
    btnText: "#090b12",
    secondaryText: "#94a3b8",
    cardSubtle: "rgba(255,255,255,0.06)",
  },
  light: {
    W: "#0f172a", S: "#475569", G: "#059669", R: "#dc2626", Y: "#d97706", B: "#2563eb", P: "#7c3aed",
    BG: "#f8fafc", CARD: "rgba(15,23,42,0.04)", BORDER: "rgba(15,23,42,0.12)",
    headerBg: "rgba(248,250,252,0.96)",
    inputBg: "rgba(15,23,42,0.04)", inputBorder: "rgba(15,23,42,0.15)",
    placeholderColor: "#94a3b8",
    selectBg: "#ffffff",
    btnText: "#ffffff",
    secondaryText: "#64748b",
    cardSubtle: "rgba(15,23,42,0.05)",
  },
};

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
    type:"expense", amount:"", category:"Food", description:"", note:"", date:todayStr(),
    fromAccount:"checking", toAccount:"checking"
  });
  const [isCategorizing, setCategorizing] = useState(false);
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
          theme: parsed.theme || "dark",
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

  const { transactions, assets, debts, balHistory, streak, lastLog, theme="dark" } = data;
  const t = THEMES[theme];

  const totalAssets = Object.values(assets).reduce((s,v)=>s+(+v||0),0);
  const totalDebts  = Object.values(debts).reduce((s,v)=>s+(+v||0),0);
  const totalNW     = totalAssets - totalDebts;
  const investTotal = (+(assets.investments)||0)+(+(assets.joint_invest)||0)+(+(assets.sharkninja)||0);
  const cashTotal   = totalAssets - investTotal;

  const activeMilestone = MILESTONES.find(m=>totalNW<m.target)||MILESTONES[MILESTONES.length-1];
  const prevTarget      = MILESTONES[MILESTONES.indexOf(activeMilestone)-1]?.target||0;
  const mProgress       = Math.min(Math.max((totalNW-prevTarget)/(activeMilestone.target-prevTarget)*100,0),100);

  const thisMonth = todayStr().slice(0,7);
  const monthTxns = transactions.filter(tx=>tx.date.startsWith(thisMonth));
  const monthIn   = monthTxns.filter(tx=>tx.type==="income").reduce((s,tx)=>s+tx.amount,0);
  const monthOut  = monthTxns.filter(tx=>tx.type==="expense").reduce((s,tx)=>s+tx.amount,0);

  // ─── DYNAMIC PRESETS LOGIC ────────────────────────────────────────────────
  const dynamicPresets = useMemo(() => {
    const expenseTxns = transactions.filter(tx => tx.type === "expense");
    if (expenseTxns.length < 10) return STARTER_PRESETS;

    // Count occurrences of each description/category
    const counts = {};
    expenseTxns.forEach(tx => {
      const key = (tx.description || tx.note || tx.category).toLowerCase().trim().split(" ")[0];
      if (!key) return;
      if (!counts[key]) counts[key] = { count:0, category:tx.category, lastAccount:tx.fromAccount };
      counts[key].count++;
      counts[key].lastAccount = tx.fromAccount;
    });

    return Object.entries(counts)
      .sort((a,b) => b[1].count - a[1].count)
      .slice(0, 6)
      .map(([word, info]) => ({
        emoji: getEmojiForWord(word),
        word: word,
        category: info.category,
        defaultAccount: info.lastAccount,
      }));
  }, [transactions]);

  const onKey = (k) => {
    const curr = form.amount || "";
    if (k === "C") return setForm(f => ({...f, amount: ""}));
    if (k === "⌫") return setForm(f => ({...f, amount: curr.slice(0,-1)}));
    if (k === ".") {
      if (curr.includes(".")) return;
      return setForm(f => ({...f, amount: (curr || "0") + "."}));
    }
    if (curr.includes(".")) {
      const [, dec] = curr.split(".");
      if (dec.length >= 2) return;
    }
    setForm(f => ({...f, amount: curr + k}));
  };

  const applyToBalances = (tx, currentAssets, currentDebts) => {
    const newA = {...currentAssets};
    const newD = {...currentDebts};
    const amt = tx.amount;
    if (tx.type === "income") {
      if (newA[tx.toAccount] !== undefined) newA[tx.toAccount] = (+newA[tx.toAccount]||0) + amt;
      else if (newD[tx.toAccount] !== undefined) newD[tx.toAccount] = Math.max(0, (+newD[tx.toAccount]||0) - amt);
    } else if (tx.type === "expense") {
      const acc = getAccount(tx.fromAccount);
      if (acc?.type === "asset") newA[tx.fromAccount] = Math.max(0, (+newA[tx.fromAccount]||0) - amt);
      else if (acc?.type === "debt") newD[tx.fromAccount] = (+newD[tx.fromAccount]||0) + amt;
    } else if (tx.type === "transfer") {
      const fromAcc = getAccount(tx.fromAccount);
      const toAcc = getAccount(tx.toAccount);
      if (fromAcc?.type === "asset") newA[tx.fromAccount] = Math.max(0, (+newA[tx.fromAccount]||0) - amt);
      else if (fromAcc?.type === "debt") newD[tx.fromAccount] = (+newD[tx.fromAccount]||0) + amt;
      if (toAcc?.type === "asset") newA[tx.toAccount] = (+newA[tx.toAccount]||0) + amt;
      else if (toAcc?.type === "debt") newD[tx.toAccount] = Math.max(0, (+newD[tx.toAccount]||0) - amt);
    }
    return { assets: newA, debts: newD };
  };

  // ─── PRESET TAP: instant log, no AI call ────────────────────────────────────
  const applyPreset = (preset) => {
    setForm(f => ({
      ...f,
      description: preset.word,
      category: preset.category,
      fromAccount: preset.defaultAccount || f.fromAccount,
    }));
  };

  // ─── EXPENSE SUBMIT: uses AI if text description, instant if preset/empty ───
  const handleExpenseSubmit = async () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { showToast("Enter an amount. 🙄","error"); return; }

    // If no description, use category "Other"
    if (!form.description.trim()) {
      logExpense(amt, "Other", "");
      return;
    }

    // Check if the description EXACTLY matches a preset word (instant, no AI)
    const matchingPreset = dynamicPresets.find(p => p.word.toLowerCase() === form.description.toLowerCase().trim());
    if (matchingPreset) {
      logExpense(amt, matchingPreset.category, form.description.trim());
      return;
    }

    // Otherwise, send to Matt-bot for categorization
    setCategorizing(true);
    try {
      const response = await fetch('/api/mattbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userText: `${form.description} (amount: $${amt}, paid from ${getAccount(form.fromAccount)?.label})`,
          accounts: ALL_ACCOUNTS,
          categories: CATEGORIES,
        }),
      });
      if (!response.ok) throw new Error("Matt-bot is napping");
      const result = await response.json();
      const tx = result.transactions?.[0];
      const category = tx?.category || "Other";
      const note = tx?.note || form.description.trim();
      logExpense(amt, category, note);
    } catch (err) {
      // On error, fall back to logging with the raw description
      logExpense(amt, "Other", form.description.trim());
      showToast("Matt-bot napping, logged as Other.","info");
    }
    setCategorizing(false);
  };

  const logExpense = (amt, category, note) => {
    const tx = {
      id: Date.now(),
      type: "expense",
      amount: amt,
      category: category,
      description: form.description.trim() || category.toLowerCase(),
      note: note,
      date: form.date,
      fromAccount: form.fromAccount,
      toAccount: "",
    };
    const newTx = [tx, ...transactions];
    const { assets: newA, debts: newD } = applyToBalances(tx, assets, debts);
    let newStr = streak, newLL = lastLog;
    const td = todayStr();
    if (lastLog !== td) {
      const yd = new Date(); yd.setDate(yd.getDate()-1);
      newStr = lastLog===yd.toISOString().split("T")[0] ? streak+1 : 1;
      newLL = td;
    }
    patch({ transactions: newTx, assets: newA, debts: newD, streak: newStr, lastLog: newLL });
    setForm({type:"expense", amount:"", category:"Food", description:"", note:"", date:todayStr(), fromAccount:"checking", toAccount:"checking"});
    showToast(`🤖 ${category} · ${getRoast(category)}`, "roast");
    setScreen("dashboard");
  };

  // ─── INCOME / TRANSFER SUBMIT: no AI needed ────────────────────────────────
  const handleIncomeTransferSubmit = () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { showToast("Enter an amount. 🙄","error"); return; }
    if (form.type === "transfer" && form.fromAccount === form.toAccount) {
      showToast("From and To must differ. 🙄","error"); return;
    }
    const tx = { id:Date.now(), ...form, amount:amt };
    const newTx = [tx, ...transactions];
    const { assets: newA, debts: newD } = applyToBalances(tx, assets, debts);
    let newStr = streak, newLL = lastLog;
    const td = todayStr();
    if (lastLog !== td) {
      const yd = new Date(); yd.setDate(yd.getDate()-1);
      newStr = lastLog===yd.toISOString().split("T")[0] ? streak+1 : 1;
      newLL = td;
    }
    patch({ transactions: newTx, assets: newA, debts: newD, streak: newStr, lastLog: newLL });
    setForm({type:"expense", amount:"", category:"Food", description:"", note:"", date:todayStr(), fromAccount:"checking", toAccount:"checking"});
    if (form.type==="income") showToast(getPraise(),"praise");
    else showToast(`Transferred $${fmt(amt)} 💸`,"praise");
    setScreen("dashboard");
  };

  const handleSubmit = () => {
    if (form.type === "expense") handleExpenseSubmit();
    else handleIncomeTransferSubmit();
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
    const reverseTx = { ...tx, amount: -tx.amount };
    const { assets: newA, debts: newD } = applyToBalances(reverseTx, assets, debts);
    patch({ transactions: transactions.filter(t=>t.id!==id), assets: newA, debts: newD });
    showToast("Reversed. 🔄","info");
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `dr-money-backup-${todayStr()}.json`;
    a.click(); URL.revokeObjectURL(url);
    showToast("Backup downloaded! 💾","praise");
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        setData({...EMPTY, ...parsed, assets: { ...EMPTY.assets, ...(parsed.assets||{}) }, debts: { ...EMPTY.debts, ...(parsed.debts||{}) }});
        showToast("Backup restored! ✅","praise");
      } catch { showToast("Invalid backup file ❌","error"); }
    };
    reader.readAsText(file); e.target.value = "";
  };

  const toggleTheme = () => patch({ theme: theme === "dark" ? "light" : "dark" });

  const statusLabel = saveStatus==="saving" ? "💾" : saveStatus==="saved" ? "✅" : saveStatus==="memonly" ? "⚠️" : "";
  const statusColor = saveStatus==="saving" ? t.Y : saveStatus==="saved" ? t.G : saveStatus==="memonly" ? "#fb923c" : t.S;

  if (!loaded) return (
    <div style={{minHeight:"100vh",background:t.BG,display:"flex",alignItems:"center",justifyContent:"center",color:t.W,fontFamily:"monospace"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:52,marginBottom:14}}>💊</div>
        <div style={{fontSize:14,letterSpacing:"0.2em"}}>LOADING...</div>
      </div>
    </div>
  );

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
                background: sel ? `${acc.color}22` : t.CARD,
                border: `1px solid ${sel ? acc.color : t.BORDER}`,
                borderRadius: 8, padding: "6px 3px",
                color: sel ? acc.color : t.W, fontSize: 9,
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
    <div style={{minHeight:"100vh",background:t.BG,color:t.W,fontFamily:"'Courier New',monospace",paddingBottom:60,transition:"background 0.3s, color 0.3s"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#334155;border-radius:2px}
        .btn{cursor:pointer;border:none;font-family:'Courier New',monospace;transition:all 0.15s;}
        .btn:hover{filter:brightness(${theme==="dark"?"1.15":"0.96"});}
        .btn:active{transform:scale(0.96);}
        input,select,textarea{font-family:'Courier New',monospace;background:${t.inputBg};border:1px solid ${t.inputBorder};color:${t.W};border-radius:8px;padding:9px 11px;width:100%;font-size:13px;outline:none;}
        input:focus,select:focus,textarea:focus{border-color:${t.G};box-shadow:0 0 0 2px ${t.G}33;}
        select option{background:${t.selectBg};color:${t.W};}
        input[type=date]{color-scheme:${theme};}
        input::placeholder,textarea::placeholder{color:${t.placeholderColor};}
        .slide{animation:su 0.22s ease-out;}
        @keyframes su{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}
        .lbl{font-size:9px;color:${t.secondaryText};letter-spacing:0.14em;text-transform:uppercase;margin-bottom:4px;font-weight:700;}
        .mbBounce{animation:mbBounce 2s ease-in-out infinite;}
        @keyframes mbBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .spin{animation:spin 1s linear infinite;display:inline-block;}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      {toast&&(
        <div style={{position:"fixed",top:12,left:"50%",transform:"translateX(-50%)",zIndex:9999,
          background:toast.type==="roast"?(theme==="dark"?"#1f0808":"#fee2e2"):toast.type==="praise"?(theme==="dark"?"#061a10":"#d1fae5"):toast.type==="achievement"?(theme==="dark"?"#0d0d1f":"#fef3c7"):(theme==="dark"?"#0f172a":"#f1f5f9"),
          border:`1px solid ${toast.type==="roast"?t.R:toast.type==="praise"?t.G:toast.type==="achievement"?t.Y:t.BORDER}`,
          borderRadius:12,padding:"10px 16px",maxWidth:"92vw",fontSize:11,lineHeight:1.5,color:t.W,boxShadow:"0 8px 24px rgba(0,0,0,0.3)",textAlign:"center"}} className="slide">
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div style={{background:t.headerBg,borderBottom:`1px solid ${t.BORDER}`,padding:"10px 14px",position:"sticky",top:0,zIndex:100,backdropFilter:"blur(12px)"}}>
        <div style={{maxWidth:500,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:14,fontWeight:900,color:t.G}}>💊 DR. MONEY {statusLabel&&<span style={{fontSize:10,color:statusColor,marginLeft:4}}>{statusLabel}</span>}</div>
            <div style={{fontSize:8,color:t.S,letterSpacing:"0.14em"}}>FINANCIAL ASYLUM</div>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{textAlign:"center"}}>
              <div className="lbl">STREAK</div>
              <div style={{fontSize:11,color:"#fb923c",fontWeight:700}}>{streak>0?`🔥${streak}`:"💤0"}</div>
            </div>
            <button onClick={toggleTheme} className="btn" style={{
              background: t.CARD, border:`1px solid ${t.BORDER}`, borderRadius:18,
              padding:"6px 10px", fontSize:14, lineHeight:1,
            }}>
              {theme==="dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:500,margin:"0 auto",padding:"12px 12px 0"}}>

        {storageMode==="memory"&&(
          <div style={{background:"rgba(251,146,60,0.08)",border:"1px solid rgba(251,146,60,0.3)",borderRadius:10,padding:"8px 12px",marginBottom:10}}>
            <div style={{fontSize:10,color:"#fb923c",fontWeight:700}}>⚠️ Memory-only mode — use EXPORT to backup.</div>
          </div>
        )}

        {/* NAV — 5 tabs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,marginBottom:12}}>
          {[
            {id:"dashboard",icon:"📊",label:"HOME"},
            {id:"log",      icon:"➕",label:"LOG"},
            {id:"mattbot", icon:"🤖",label:"MATT"},
            {id:"accounts", icon:"🏦",label:"ACCTS"},
            {id:"history",  icon:"📋",label:"HIST"},
          ].map(({id,icon,label})=>(
            <button key={id} onClick={()=>setScreen(id)} className="btn" style={{
              background:screen===id?(theme==="dark"?"rgba(52,211,153,0.12)":"rgba(5,150,105,0.1)"):t.CARD,
              border:`1px solid ${screen===id?t.G:t.BORDER}`,
              borderRadius:10,padding:"7px 3px",
              color:screen===id?t.G:t.W,
              fontSize:9,letterSpacing:"0.06em",
            }}>
              <div style={{fontSize:14,marginBottom:1}}>{icon}</div>{label}
            </button>
          ))}
        </div>

        {/* ══ LOG (HYBRID — NEW!) ═════════════════════════════════════════════ */}
        {screen==="log"&&(
          <div className="slide">
            {/* TYPE SWITCHER */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:10}}>
              {[{tt:"expense", label:"💸 OUT", color:t.R},{tt:"income", label:"💰 IN", color:t.G},{tt:"transfer",label:"⇄ MOVE", color:t.B}].map(({tt,label,color})=>(
                <button key={tt} onClick={()=>setForm(f=>({...f,type:tt,category:tt==="expense"?"Food":tt==="income"?"Salary":f.category,description:""}))} className="btn" style={{
                  background: form.type===tt ? `${color}22` : t.CARD,
                  border:`1px solid ${form.type===tt ? color : t.BORDER}`,
                  borderRadius:9, padding:"9px",
                  color:form.type===tt ? color : t.W,
                  fontSize:11, fontWeight:700,
                }}>
                  {label}
                </button>
              ))}
            </div>

            {/* CALCULATOR DISPLAY */}
            <div style={{background:theme==="dark"?"rgba(0,0,0,0.3)":"rgba(15,23,42,0.04)",border:`1px solid ${form.type==="income"?t.G:form.type==="transfer"?t.B:t.R}40`,borderRadius:12,padding:"14px",marginBottom:8,textAlign:"right"}}>
              <div className="lbl" style={{textAlign:"left",marginBottom:2}}>AMOUNT</div>
              <div style={{fontSize:34,fontWeight:900,color:form.type==="income"?t.G:form.type==="transfer"?t.B:t.R,lineHeight:1}}>
                ${form.amount||"0"}
                {form.amount && !form.amount.includes(".")?".00":""}
                {form.amount.includes(".") && form.amount.split(".")[1].length===0?"00":""}
                {form.amount.includes(".") && form.amount.split(".")[1].length===1?"0":""}
              </div>
            </div>

            {/* CALCULATOR PAD */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:10}}>
              {["7","8","9","4","5","6","1","2","3",".","0","⌫"].map(k=>{
                const isAction = k==="⌫";
                return(
                  <button key={k} onClick={()=>onKey(k)} className="btn" style={{
                    background: isAction
                      ? (theme==="dark"?"rgba(248,113,113,0.1)":"rgba(220,38,38,0.06)")
                      : t.cardSubtle,
                    border:`1px solid ${isAction?`${t.R}40`:t.BORDER}`,
                    borderRadius:10, padding:"14px 0",
                    color: isAction?t.R:t.W, fontSize:20, fontWeight:700,
                  }}>{k}</button>
                );
              })}
            </div>
            <button onClick={()=>onKey("C")} className="btn" style={{width:"100%",background:theme==="dark"?"rgba(248,113,113,0.06)":"rgba(220,38,38,0.04)",border:`1px solid ${t.R}33`,borderRadius:9,padding:"8px",color:t.R,fontSize:11,fontWeight:700,marginBottom:12,letterSpacing:"0.1em"}}>CLEAR</button>

            {/* EXPENSE-ONLY: SMART CATEGORIZATION ROW */}
            {form.type==="expense"&&(<>
              <div className="lbl">💡 WHAT WAS THIS FOR?</div>

              {/* DYNAMIC PRESETS */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:8}}>
                {dynamicPresets.map((p, i) => {
                  const isSelected = form.description.toLowerCase().trim() === p.word.toLowerCase();
                  return (
                    <button key={i} onClick={()=>applyPreset(p)} className="btn" style={{
                      background: isSelected ? `${t.G}22` : t.CARD,
                      border:`1px solid ${isSelected ? t.G : t.BORDER}`,
                      borderRadius:9, padding:"8px 4px",
                      color: isSelected ? t.G : t.W, fontSize:10,
                      display:"flex",flexDirection:"column",alignItems:"center",gap:2,
                    }}>
                      <span style={{fontSize:18}}>{p.emoji}</span>
                      <span style={{fontSize:9,fontWeight:700}}>{p.word}</span>
                    </button>
                  );
                })}
              </div>

              {/* DESCRIPTION TEXT INPUT */}
              <input
                type="text"
                placeholder="or type: gas, lunch, amazon, doctor..."
                value={form.description}
                onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                style={{marginBottom:10}}
              />

              {/* PAID FROM ACCOUNT */}
              <div style={{marginBottom:10}}>
                <AccountGrid selectedId={form.fromAccount} onSelect={id=>setForm(f=>({...f,fromAccount:id}))} filter="all" label="💳 PAID FROM"/>
                {getAccount(form.fromAccount)?.type==="debt" && (<div style={{fontSize:10,color:"#fb923c",marginTop:4,fontStyle:"italic"}}>⚠️ This adds to your {getAccount(form.fromAccount)?.label} debt</div>)}
              </div>
            </>)}

            {/* INCOME-ONLY: CATEGORY DROPDOWN + ACCOUNT */}
            {form.type==="income"&&(<>
              <div style={{marginBottom:8}}>
                <div className="lbl">CATEGORY</div>
                <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                  {CATEGORIES.income.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{marginBottom:10}}>
                <AccountGrid selectedId={form.toAccount} onSelect={id=>setForm(f=>({...f,toAccount:id}))} filter="asset" label="🏦 DEPOSIT TO"/>
              </div>
            </>)}

            {/* TRANSFER-ONLY: FROM/TO ACCOUNTS */}
            {form.type==="transfer"&&(<>
              <div style={{marginBottom:8}}><AccountGrid selectedId={form.fromAccount} onSelect={id=>setForm(f=>({...f,fromAccount:id}))} filter="all" label="📤 FROM"/></div>
              <div style={{marginBottom:10}}>
                <AccountGrid selectedId={form.toAccount} onSelect={id=>setForm(f=>({...f,toAccount:id}))} filter="all" label="📥 TO"/>
                {getAccount(form.toAccount)?.type==="debt" && (<div style={{fontSize:10,color:t.G,marginTop:4,fontStyle:"italic"}}>💪 Paying down {getAccount(form.toAccount)?.label}</div>)}
              </div>
            </>)}

            <div style={{marginBottom:12}}><div className="lbl">DATE</div><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>

            <button onClick={handleSubmit} disabled={isCategorizing} className="btn" style={{
              width:"100%",padding:"14px",borderRadius:12,
              background:isCategorizing?t.CARD:form.type==="income"?`linear-gradient(135deg,${t.G},${t.B})`:form.type==="transfer"?`linear-gradient(135deg,${t.B},${t.P})`:`linear-gradient(135deg,${t.R},#fb923c)`,
              color:isCategorizing?t.S:t.btnText,fontSize:13,fontWeight:900,letterSpacing:"0.08em",
              opacity:isCategorizing?0.7:1,
            }}>
              {isCategorizing ? <><span className="spin">🤖</span> MATT-BOT IS THINKING...</> :
               form.type==="income"?"⚡ LOG INCOME":form.type==="transfer"?"⇄ EXECUTE TRANSFER":"💸 LOG EXPENSE"}
            </button>

            {form.type==="expense" && form.description && !dynamicPresets.find(p => p.word.toLowerCase() === form.description.toLowerCase().trim()) && (
              <div style={{fontSize:10,color:t.S,marginTop:6,textAlign:"center",fontStyle:"italic"}}>
                🤖 Matt-bot will categorize "{form.description}"
              </div>
            )}
          </div>
        )}

        {/* ══ MATT-BOT TAB ═════════════════════════════════════════════════════ */}
        {screen==="mattbot"&&(
          <div className="slide">
            <div style={{textAlign:"center",padding:"20px 0",marginBottom:12}}>
              <img
                src="/matt-idle.png"
                alt="Matt-bot"
                className="mbBounce"
                style={{width:180,height:"auto",maxHeight:220,objectFit:"contain",display:"block",margin:"0 auto"}}
                onError={(e)=>{e.target.style.display="none"}}
              />
              <div style={{fontSize:16,fontWeight:900,color:t.G,marginTop:10}}>🤖 MATT-BOT</div>
              <div style={{fontSize:10,color:t.S,marginTop:2,maxWidth:280,margin:"4px auto 0"}}>
                The Mathematician & Tutor — coming soon. I'll show you charts, projections, and proactive insights without you asking.
              </div>
            </div>

            <div style={{background:t.CARD,border:`1px solid ${t.BORDER}`,borderRadius:12,padding:"16px",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:8}}>🔮</div>
              <div style={{fontSize:12,color:t.W,fontWeight:700,marginBottom:6}}>Coming in Phase 2B</div>
              <div style={{fontSize:10,color:t.S,lineHeight:1.6}}>
                📊 Auto-generated charts<br/>
                💡 Proactive AI insights<br/>
                🔮 FIRE projections<br/>
                💬 Conversational queries<br/>
                🎯 Smart alerts
              </div>
            </div>

            <div style={{fontSize:10,color:t.S,marginTop:12,textAlign:"center",fontStyle:"italic"}}>
              Meanwhile, Matt-bot is already categorizing your expenses in the LOG tab! 🎯
            </div>
          </div>
        )}

        {/* ══ DASHBOARD ══ */}
        {screen==="dashboard"&&(
          <div className="slide">
            <div style={{
              background: theme==="dark"
                ? "linear-gradient(135deg, rgba(52,211,153,0.1), rgba(96,165,250,0.06))"
                : "linear-gradient(135deg, rgba(5,150,105,0.08), rgba(37,99,235,0.05))",
              border:`1px solid ${t.G}40`,
              borderRadius:16,padding:"18px",marginBottom:12,
            }}>
              <div className="lbl">NET WORTH</div>
              <div style={{fontSize:32,fontWeight:900,color:t.W,letterSpacing:"-0.02em"}}>${fmt(totalNW)}</div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:t.S,marginTop:6,marginBottom:14}}>
                <span style={{color:t.G}}>+ ${fmt(totalAssets)} assets</span>
                <span style={{color:t.R}}>− ${fmt(totalDebts)} debt</span>
              </div>

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:8}}>
                <div>
                  <div className="lbl">🎯 NEXT MILESTONE</div>
                  <div style={{fontSize:14,color:t.W,fontWeight:700}}>{activeMilestone.icon} {activeMilestone.label}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:24,fontWeight:900,color:t.G,lineHeight:1}}>{mProgress.toFixed(1)}%</div>
                  <div style={{fontSize:9,color:t.S}}>complete</div>
                </div>
              </div>
              <div style={{height:10,background:theme==="dark"?"rgba(255,255,255,0.08)":"rgba(15,23,42,0.08)",borderRadius:5,overflow:"hidden",marginBottom:6}}>
                <div style={{height:"100%",width:`${mProgress}%`,background:`linear-gradient(90deg,${t.G},${t.Y})`,borderRadius:5,transition:"width 1s ease-out"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:t.S}}>
                <span>{fmtK(prevTarget)}</span>
                <span style={{fontWeight:700,color:t.W}}>{fmtK(activeMilestone.target-totalNW)} to go</span>
                <span>{fmtK(activeMilestone.target)}</span>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
              {MILESTONES.map(m=>{
                const done=totalNW>=m.target;
                const active=activeMilestone.target===m.target;
                const pct = Math.min((totalNW/m.target)*100, 100);
                return(
                  <div key={m.target} style={{
                    background: done ? (theme==="dark"?"rgba(52,211,153,0.1)":"rgba(5,150,105,0.08)")
                              : active ? (theme==="dark"?"rgba(251,191,36,0.1)":"rgba(217,119,6,0.08)")
                              : t.CARD,
                    border: `1px solid ${done?t.G:active?t.Y:t.BORDER}`,
                    borderRadius:12, padding:"12px 8px", textAlign:"center",
                  }}>
                    <div style={{fontSize:22,marginBottom:2}}>{m.icon}</div>
                    <div style={{fontSize:11,color:t.W,fontWeight:700}}>{fmtK(m.target)}</div>
                    <div style={{fontSize:9,color:done?t.G:active?t.Y:t.S,marginTop:2,fontWeight:700}}>
                      {done?"✅ DONE":active?"◀ CURRENT":`${pct.toFixed(0)}%`}
                    </div>
                  </div>
                );
              })}
            </div>

            {(()=>{
              const hysaBal = +(assets.hysa||0);
              const hysaPct = Math.min((hysaBal/50000)*100, 100);
              const hysaDone = hysaBal >= 50000;
              return(
                <div style={{
                  background: hysaDone
                    ? (theme==="dark"?"rgba(52,211,153,0.08)":"rgba(5,150,105,0.06)")
                    : (theme==="dark"?"rgba(56,189,248,0.06)":"rgba(37,99,235,0.05)"),
                  border:`1px solid ${hysaDone?t.G:"#38bdf8"}40`,
                  borderRadius:12,padding:"12px 14px",marginBottom:12,
                }}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <div>
                      <div className="lbl" style={{color:hysaDone?t.G:"#38bdf8"}}>🏰 HYSA SUB-GOAL</div>
                      <div style={{fontSize:18,fontWeight:900,color:t.W,marginTop:2}}>${fmt(hysaBal)}</div>
                      <div style={{fontSize:10,color:t.S}}>of <span style={{color:hysaDone?t.G:"#38bdf8",fontWeight:700}}>$50,000</span> target</div>
                    </div>
                    <div style={{fontSize:22,fontWeight:900,color:hysaDone?t.G:"#38bdf8"}}>{hysaPct.toFixed(1)}%</div>
                  </div>
                  <div style={{height:8,background:theme==="dark"?"rgba(255,255,255,0.08)":"rgba(15,23,42,0.08)",borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${hysaPct}%`,background:hysaDone?`linear-gradient(90deg,${t.G},#4ade80)`:"linear-gradient(90deg,#38bdf8,#60a5fa)",borderRadius:4,transition:"width 0.8s"}}/>
                  </div>
                </div>
              );
            })()}

            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
              <div style={{background:t.CARD,border:`1px solid ${t.B}40`,borderRadius:12,padding:"12px"}}>
                <div className="lbl">💵 CASH</div>
                <div style={{fontSize:14,fontWeight:700,color:t.B,marginTop:2}}>${fmt(cashTotal)}</div>
              </div>
              <div style={{background:t.CARD,border:`1px solid ${t.P}40`,borderRadius:12,padding:"12px"}}>
                <div className="lbl">📈 INVESTED</div>
                <div style={{fontSize:14,fontWeight:700,color:t.P,marginTop:2}}>${fmt(investTotal)}</div>
              </div>
              <div style={{background:t.CARD,border:`1px solid ${t.R}40`,borderRadius:12,padding:"12px"}}>
                <div className="lbl">💳 DEBT</div>
                <div style={{fontSize:14,fontWeight:700,color:t.R,marginTop:2}}>${fmt(totalDebts)}</div>
              </div>
            </div>

            {totalDebts>0&&(
              <div style={{background:theme==="dark"?"rgba(248,113,113,0.07)":"rgba(220,38,38,0.05)",border:`1px solid ${t.R}33`,borderRadius:12,padding:"12px 14px",marginBottom:12}}>
                <div className="lbl" style={{color:t.R}}>🚨 DEBT BREAKDOWN</div>
                {DEBT_ACCOUNTS.map(acc=>{const b=+(debts[acc.id]||0);if(!b) return null;return(
                  <div key={acc.id} style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                    <span style={{fontSize:11,color:t.W}}>{acc.icon} {acc.label}</span>
                    <span style={{fontSize:11,color:t.R,fontWeight:700}}>-${fmt(b)}</span>
                  </div>
                );})}
              </div>
            )}

            <div className="lbl" style={{marginBottom:6}}>📆 {thisMonth}</div>
            <div style={{background:t.CARD,border:`1px solid ${t.BORDER}`,borderRadius:12,padding:"14px",marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div>
                  <div className="lbl">INCOME</div>
                  <div style={{fontSize:16,color:t.G,fontWeight:700}}>+${fmt(monthIn)}</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <div className="lbl">NET</div>
                  <div style={{fontSize:16,color:monthIn-monthOut>=0?t.G:t.R,fontWeight:700}}>{monthIn-monthOut>=0?"+":""}{fmt(monthIn-monthOut)}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div className="lbl">EXPENSES</div>
                  <div style={{fontSize:16,color:t.R,fontWeight:700}}>-${fmt(monthOut)}</div>
                </div>
              </div>
            </div>

            <div style={{background:t.CARD,border:`1px solid ${t.BORDER}`,borderRadius:12,padding:"12px",marginTop:6}}>
              <div className="lbl" style={{marginBottom:8}}>🔐 BACKUP & RESTORE</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <button onClick={exportData} className="btn" style={{background:`${t.G}1a`,border:`1px solid ${t.G}40`,borderRadius:8,padding:"9px",color:t.G,fontSize:11,fontWeight:700}}>⬇️ EXPORT</button>
                <label className="btn" style={{background:`${t.B}1a`,border:`1px solid ${t.B}40`,borderRadius:8,padding:"9px",color:t.B,fontSize:11,fontWeight:700,textAlign:"center",display:"block"}}>
                  ⬆️ IMPORT
                  <input type="file" accept=".json" onChange={importData} style={{display:"none"}}/>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ══ ACCOUNTS ══ */}
        {screen==="accounts"&&(
          <div className="slide">
            <div style={{
              background:theme==="dark"
                ? "linear-gradient(135deg, rgba(52,211,153,0.1), rgba(96,165,250,0.06))"
                : "linear-gradient(135deg, rgba(5,150,105,0.08), rgba(37,99,235,0.05))",
              border:`1px solid ${t.G}40`,
              borderRadius:12,padding:"14px",marginBottom:12,
            }}>
              <div className="lbl">TRUE NET WORTH</div>
              <div style={{fontSize:24,fontWeight:900,color:t.W}}>${fmt(totalNW)}</div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                <span style={{fontSize:10,color:t.G}}>+${fmt(totalAssets)}</span>
                <span style={{fontSize:10,color:t.R}}>−${fmt(totalDebts)}</span>
              </div>
            </div>

            <div style={{fontSize:11,color:t.W,fontWeight:700,marginBottom:6}}>💰 ASSETS</div>
            {ASSET_ACCOUNTS.map(acc=>(
              <div key={acc.id} style={{background:t.CARD,border:`1px solid ${t.BORDER}`,borderRadius:10,padding:"10px 12px",marginBottom:6}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:18}}>{acc.icon}</span>
                    <div>
                      <div style={{fontSize:11,color:t.W,fontWeight:700}}>{acc.label}</div>
                      <div style={{fontSize:9,color:t.S}}>Current: <span style={{color:acc.color,fontWeight:700}}>${fmt(assets[acc.id]||0)}</span></div>
                    </div>
                  </div>
                </div>
                <input type="number" placeholder="Adjust..." value={editA[acc.id]||""} onChange={e=>setEA(p=>({...p,[acc.id]:e.target.value}))} style={{color:acc.color,borderColor:`${acc.color}50`}}/>
              </div>
            ))}

            <div style={{fontSize:11,color:t.R,fontWeight:700,margin:"14px 0 6px"}}>💳 DEBTS</div>
            {DEBT_ACCOUNTS.map(acc=>(
              <div key={acc.id} style={{background:theme==="dark"?"rgba(248,113,113,0.04)":"rgba(220,38,38,0.03)",border:`1px solid ${t.R}26`,borderRadius:10,padding:"10px 12px",marginBottom:6}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:18}}>{acc.icon}</span>
                    <div>
                      <div style={{fontSize:11,color:t.W,fontWeight:700}}>{acc.label}</div>
                      <div style={{fontSize:9,color:t.S}}>Owed: <span style={{color:t.R,fontWeight:700}}>${fmt(debts[acc.id]||0)}</span></div>
                    </div>
                  </div>
                </div>
                <input type="number" placeholder="Adjust..." value={editD[acc.id]||""} onChange={e=>setED(p=>({...p,[acc.id]:e.target.value}))} style={{color:t.R,borderColor:`${t.R}66`}}/>
              </div>
            ))}

            <button onClick={handleBalSave} className="btn" style={{width:"100%",padding:"13px",borderRadius:11,background:`linear-gradient(135deg,${t.G},${t.B})`,color:t.btnText,fontSize:12,fontWeight:900,marginTop:4,marginBottom:10}}>💾 SAVE MANUAL ADJUSTMENTS</button>
          </div>
        )}

        {/* ══ HISTORY ══ */}
        {screen==="history"&&(
          <div className="slide">
            <div style={{fontSize:11,color:t.W,fontWeight:700,marginBottom:8}}>📋 TRANSACTIONS ({transactions.length})</div>
            {transactions.length===0&&<div style={{textAlign:"center",padding:40,color:t.W,fontSize:12}}>No transactions yet. 💊</div>}
            {transactions.map(tx=>{
              const fromAcc = getAccount(tx.fromAccount); const toAcc = getAccount(tx.toAccount);
              const color = tx.type==="income"?t.G:tx.type==="transfer"?t.B:t.R;
              return(
              <div key={tx.id} style={{background:t.CARD,border:`1px solid ${color}26`,borderRadius:9,padding:"9px 11px",marginBottom:5,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:t.W,fontWeight:700}}>{tx.type==="transfer" ? "⇄ Transfer" : tx.category}{tx.description?` · ${tx.description}`:tx.note?` · ${tx.note}`:""}</div>
                  <div style={{fontSize:9,color:t.S,marginTop:1}}>{tx.date} · {tx.type==="transfer" ? `${fromAcc?.icon} → ${toAcc?.icon}` : tx.type==="income" ? `→ ${toAcc?.icon} ${toAcc?.label}` : `${fromAcc?.icon} ${fromAcc?.label}`}</div>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <div style={{fontSize:12,fontWeight:700,color}}>{tx.type==="income"?"+":tx.type==="transfer"?"⇄":"-"}${fmt(tx.amount)}</div>
                  <button onClick={()=>deleteTx(tx.id)} className="btn" style={{background:theme==="dark"?"rgba(248,113,113,0.1)":"rgba(220,38,38,0.06)",border:`1px solid ${t.R}40`,borderRadius:5,padding:"3px 7px",color:t.R,fontSize:10}}>✕</button>
                </div>
              </div>
            );})}
          </div>
        )}

      </div>
    </div>
  );
}
