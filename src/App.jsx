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

const CATEGORY_COLORS = {
  Food: "#34d399", Rent: "#60a5fa", Entertainment: "#f472b6",
  Transport: "#fbbf24", Shopping: "#a78bfa", Subscriptions: "#38bdf8",
  Medical: "#ef4444", Utilities: "#fb923c", Gas: "#facc15", Other: "#94a3b8",
  Pets: "#f97316", "Personal Care": "#ec4899", Travel: "#06b6d4",
  Gifts: "#84cc16", Education: "#8b5cf6", Fitness: "#10b981",
  Charity: "#fbbf24", "Auto Repair": "#71717a", Hobbies: "#c084fc",
  Childcare: "#fb7185", "Home Improvement": "#a3e635",
};

// Generate consistent color for any category (including AI-invented ones)
const FALLBACK_PALETTE = ["#60a5fa","#34d399","#fbbf24","#f472b6","#a78bfa","#fb923c","#38bdf8","#f87171","#4ade80","#facc15","#c084fc","#84cc16","#06b6d4","#ec4899","#10b981"];
const colorForCategory = (name) => {
  if (CATEGORY_COLORS[name]) return CATEGORY_COLORS[name];
  // Hash the category name to a stable color
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash) + name.charCodeAt(i);
  return FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length];
};

const ROASTS = {
  Entertainment:["Really? Entertainment AGAIN? 😤","Every fun dollar is not compounding.","The market doesn't care about hobbies."],
  Shopping:     ["Oh look who went SHOPPING. Bezos thanks you.","Another purchase? Goal just got further.","This is why we can't have nice things."],
  Food:         ["$1000/mo on food wasn't enough? 🍔","Eating your retirement one bite at a time.","Gordon Ramsay better have cooked this."],
  default:      ["The Doctor is watching. 👀","Every expense delays your goal.","Noted. The ledger remembers."],
};
const PRAISES = ["YESSS! 💊","Compound interest dances. 📈","THAT'S what I'm talking about! 🔥","Beautiful. 🥹"];

const STARTER_PRESETS = [
  { emoji:"⛽", word:"gas",          category:"Gas" },
  { emoji:"☕", word:"coffee",       category:"Food" },
  { emoji:"🍔", word:"food",         category:"Food" },
  { emoji:"🛒", word:"shopping",     category:"Shopping" },
  { emoji:"📱", word:"subscription", category:"Subscriptions" },
  { emoji:"🚗", word:"transport",    category:"Transport" },
];

const EMOJI_HINTS = {
  gas:"⛽", fuel:"⛽", shell:"⛽", exxon:"⛽",
  coffee:"☕", starbucks:"☕", dunkin:"☕",
  food:"🍔", lunch:"🍔", dinner:"🍴", breakfast:"🥞", restaurant:"🍴", takeout:"🥡",
  groceries:"🛒", grocery:"🛒", whole:"🛒", trader:"🛒", costco:"🛒", target:"🎯",
  amazon:"📦", shopping:"🛍️", clothes:"👕", shoes:"👟",
  netflix:"📺", spotify:"🎵", subscription:"📱", phone:"📱",
  rent:"🏠", mortgage:"🏠", utilities:"💡", electric:"⚡", water:"💧",
  medical:"💊", doctor:"🩺", pharmacy:"💊", cvs:"💊",
  entertainment:"🎬", movie:"🎬", concert:"🎤", bar:"🍺", drinks:"🍻",
  transport:"🚗", car:"🚗", train:"🚆", flight:"✈️", parking:"🅿️", toll:"🛣️",
};

const todayStr = () => new Date().toISOString().split("T")[0];
const fmt  = n => (+(n??0)).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const fmt0 = n => (+(n??0)).toLocaleString("en-US",{maximumFractionDigits:0});
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

const SKEY = "drMoneyV12";

const EMPTY = {
  transactions: [],
  assets: { checking:2300, emergency:2000, hysa:12747, investments:17465, joint_invest:3790, sharkninja:11947, joint_savings:100, house_fund:15000 },
  debts:  { debt_bofa:0, debt_chase:0, debt_lowes:0, debt_cap1:0 },
  balHistory: [],
  streak:0, lastLog:null,
  theme: "dark",
  insightsCache: null,  // {data, timestamp}
  chatHistory: [],      // user/assistant message pairs
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
    chartGrid: "rgba(255,255,255,0.08)",
    aeroShadow: "none",
    aeroShadowSubtle: "none",
    isAero: false,
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
    chartGrid: "rgba(15,23,42,0.06)",
    aeroShadow: "none",
    aeroShadowSubtle: "none",
    isAero: false,
  },
  aero: {
    W: "#ffffff", S: "#cbd5e1", G: "#34d399", R: "#f87171", Y: "#fbbf24", B: "#60a5fa", P: "#a78bfa",
    BG: "linear-gradient(180deg, #0a1628 0%, #142540 50%, #0d1a30 100%)",
    CARD: "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))",
    BORDER: "rgba(255,255,255,0.15)",
    headerBg: "rgba(10,22,40,0.65)",
    inputBg: "linear-gradient(180deg, rgba(0,0,0,0.25), rgba(255,255,255,0.04))",
    inputBorder: "rgba(255,255,255,0.2)",
    placeholderColor: "#5a6b8a",
    selectBg: "#0a1628",
    btnText: "#0a1628",
    secondaryText: "#8aa4c4",
    cardSubtle: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))",
    chartGrid: "rgba(255,255,255,0.08)",
    aeroShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 4px 16px rgba(0,0,0,0.35)",
    aeroShadowSubtle: "inset 0 1px 0 rgba(255,255,255,0.12)",
    isAero: true,
  },
};

const CACHE_HOURS = 6;
const CACHE_MS = CACHE_HOURS * 60 * 60 * 1000;

// ─── HORIZONTAL BAR CHART (CATEGORY BREAKDOWN) ────────────────────────────────
function CategoryBarChart({ data, t, theme, onBarClick }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value));
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {data.map((d, i) => {
        const pct = max > 0 ? (d.value / max) * 100 : 0;
        const color = colorForCategory(d.label);
        return (
          <button
            key={i}
            onClick={() => onBarClick && onBarClick(d.label)}
            className="btn"
            style={{
              background:"transparent", border:"none", padding:0,
              textAlign:"left", width:"100%", cursor: onBarClick ? "pointer" : "default",
            }}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:11,color:t.W,fontWeight:600}}>{d.label}</span>
              <span style={{fontSize:11,color:color,fontWeight:700}}>${fmt0(d.value)}</span>
            </div>
            <div style={{height:7,background:t.chartGrid,borderRadius:4,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${color},${color}cc)`,borderRadius:4,transition:"width 0.8s ease-out",boxShadow:`0 0 8px ${color}66`}}/>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── LINE CHART (TREND OVER TIME) ─────────────────────────────────────────────
function LineChart({ data, t, theme, height=120 }) {
  if (!data || data.length < 2) return <div style={{padding:24,textAlign:"center",fontSize:11,color:t.S,fontStyle:"italic"}}>Need more data to show this chart 📊</div>;
  
  const width = 280;
  const padding = { top: 10, right: 10, bottom: 24, left: 36 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  
  const maxVal = Math.max(...data.flatMap(d => [d.income || 0, d.expense || 0]));
  const minVal = 0;
  
  const xStep = chartW / Math.max(data.length - 1, 1);
  
  const incomePoints = data.map((d, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + chartH - ((d.income - minVal) / (maxVal - minVal || 1)) * chartH,
  }));
  
  const expensePoints = data.map((d, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + chartH - ((d.expense - minVal) / (maxVal - minVal || 1)) * chartH,
  }));
  
  const incomePath = incomePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const expensePath = expensePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{width:"100%",height:"auto",display:"block"}}>
      <defs>
        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t.G} stopOpacity="0.4"/>
          <stop offset="100%" stopColor={t.G} stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t.R} stopOpacity="0.4"/>
          <stop offset="100%" stopColor={t.R} stopOpacity="0"/>
        </linearGradient>
      </defs>
      
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
        <line key={i}
          x1={padding.left} y1={padding.top + chartH * p}
          x2={width - padding.right} y2={padding.top + chartH * p}
          stroke={t.chartGrid} strokeWidth="0.5"/>
      ))}
      
      {/* Y-axis labels */}
      {[0, 0.5, 1].map((p, i) => (
        <text key={i}
          x={padding.left - 4} y={padding.top + chartH * (1 - p) + 3}
          fontSize="8" fill={t.S} textAnchor="end" fontFamily="monospace">
          ${fmt0(maxVal * p)}
        </text>
      ))}
      
      {/* Income area fill */}
      <path d={`${incomePath} L ${incomePoints[incomePoints.length-1].x} ${padding.top + chartH} L ${incomePoints[0].x} ${padding.top + chartH} Z`}
        fill="url(#incomeGrad)"/>
      
      {/* Expense area fill */}
      <path d={`${expensePath} L ${expensePoints[expensePoints.length-1].x} ${padding.top + chartH} L ${expensePoints[0].x} ${padding.top + chartH} Z`}
        fill="url(#expenseGrad)"/>
      
      {/* Income line */}
      <path d={incomePath} fill="none" stroke={t.G} strokeWidth="2" filter={`drop-shadow(0 0 4px ${t.G}88)`}/>
      
      {/* Expense line */}
      <path d={expensePath} fill="none" stroke={t.R} strokeWidth="2" filter={`drop-shadow(0 0 4px ${t.R}88)`}/>
      
      {/* Income points */}
      {incomePoints.map((p, i) => (
        <circle key={`i-${i}`} cx={p.x} cy={p.y} r="2.5" fill={t.G} stroke={t.BG} strokeWidth="1"/>
      ))}
      
      {/* Expense points */}
      {expensePoints.map((p, i) => (
        <circle key={`e-${i}`} cx={p.x} cy={p.y} r="2.5" fill={t.R} stroke={t.BG} strokeWidth="1"/>
      ))}
      
      {/* X-axis labels */}
      {data.map((d, i) => (
        i % Math.ceil(data.length / 4) === 0 || i === data.length - 1 ? (
          <text key={i}
            x={padding.left + i * xStep} y={height - 6}
            fontSize="8" fill={t.S} textAnchor="middle" fontFamily="monospace">
            {d.month.slice(5)}
          </text>
        ) : null
      ))}
    </svg>
  );
}

// ─── TRAJECTORY PROJECTION CHART ──────────────────────────────────────────────
function ProjectionChart({ currentNW, targetNW, monthlySavings, t, theme, monthsToGoal }) {
  const width = 280;
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 24, left: 36 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  
  if (monthlySavings <= 0) {
    return <div style={{padding:24,textAlign:"center",fontSize:11,color:t.S,fontStyle:"italic"}}>Save more than you spend to see projection 📈</div>;
  }
  
  // Build trajectory points: today + projected months
  const totalMonths = Math.min(monthsToGoal + 3, 60);
  const points = [];
  for (let i = 0; i <= totalMonths; i++) {
    const value = currentNW + (monthlySavings * i);
    points.push({
      x: padding.left + (i / totalMonths) * chartW,
      y: padding.top + chartH - ((value / targetNW) * chartH),
      value,
      month: i,
    });
  }
  
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${Math.max(p.y, padding.top)}`).join(' ');
  
  // Find the point where we cross targetNW
  const targetY = padding.top + chartH - chartH;  // top of chart
  
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{width:"100%",height:"auto",display:"block"}}>
      <defs>
        <linearGradient id="trajGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t.Y} stopOpacity="0.5"/>
          <stop offset="100%" stopColor={t.G} stopOpacity="0"/>
        </linearGradient>
      </defs>
      
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
        <line key={i}
          x1={padding.left} y1={padding.top + chartH * p}
          x2={width - padding.right} y2={padding.top + chartH * p}
          stroke={t.chartGrid} strokeWidth="0.5"/>
      ))}
      
      {/* Target line */}
      <line
        x1={padding.left} y1={targetY}
        x2={width - padding.right} y2={targetY}
        stroke={t.Y} strokeWidth="1" strokeDasharray="3,3" opacity="0.6"/>
      <text x={width - padding.right - 4} y={targetY - 3} fontSize="8" fill={t.Y} textAnchor="end" fontFamily="monospace">
        ${fmt0(targetNW)}
      </text>
      
      {/* Y-axis labels */}
      {[0, 1].map((p, i) => (
        <text key={i}
          x={padding.left - 4} y={padding.top + chartH * (1 - p) + 3}
          fontSize="8" fill={t.S} textAnchor="end" fontFamily="monospace">
          ${fmt0(targetNW * p)}
        </text>
      ))}
      
      {/* Trajectory area */}
      <path d={`${path} L ${points[points.length-1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`}
        fill="url(#trajGrad)"/>
      
      {/* Trajectory line */}
      <path d={path} fill="none" stroke={`url(#trajGrad)`} strokeWidth="2"/>
      <path d={path} fill="none" stroke={t.G} strokeWidth="2" filter={`drop-shadow(0 0 6px ${t.G}aa)`}/>
      
      {/* Current point */}
      <circle cx={points[0].x} cy={points[0].y} r="4" fill={t.G} stroke={t.BG} strokeWidth="2"/>
      
      {/* X-axis labels */}
      <text x={padding.left} y={height - 6} fontSize="8" fill={t.S} textAnchor="start" fontFamily="monospace">Now</text>
      <text x={width - padding.right} y={height - 6} fontSize="8" fill={t.S} textAnchor="end" fontFamily="monospace">{totalMonths}mo</text>
    </svg>
  );
}

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
  
  // 🪩 STRIPPER POLE ANIMATION — fires on income logging
  const [poleAnimation, setPoleAnimation] = useState(null); // { amount } or null
  
  // Matt-bot state
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // NEW: Category breakdown filter + drill-down state
  const [categoryPeriod, setCategoryPeriod] = useState("thisMonth"); // "thisMonth" | "lastMonth" | "ytd"
  const [drilldownCategory, setDrilldownCategory] = useState(null);
  
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
          insightsCache: parsed.insightsCache || null,
          chatHistory: parsed.chatHistory || [],
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

  const { transactions, assets, debts, balHistory, streak, lastLog, theme="dark", insightsCache, chatHistory } = data;
  const t = THEMES[theme] || THEMES.dark;

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

  // ─── ANALYTICS COMPUTATIONS (Last 3 months by default, but we use 6 for chart) ──
  const monthlyStats = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const txns = transactions.filter(t => t.date?.startsWith(monthKey));
      const income = txns.filter(t => t.type === "income").reduce((s,t) => s + t.amount, 0);
      const expense = txns.filter(t => t.type === "expense").reduce((s,t) => s + t.amount, 0);
      months.push({ month: monthKey, income, expense, net: income - expense });
    }
    return months;
  }, [transactions]);

  const last3MonthsStats = monthlyStats.slice(-3);

  // ─── NEW: Filtered expense list for the selected category period ──────────
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMo = now.getMonth();
    const lastMoDate = new Date(thisYear, thisMo - 1, 1);
    const lastMoKey = `${lastMoDate.getFullYear()}-${String(lastMoDate.getMonth()+1).padStart(2,"0")}`;
    const thisMoKey = `${thisYear}-${String(thisMo+1).padStart(2,"0")}`;
    const yearKey = String(thisYear);

    return transactions.filter(tx => {
      if (tx.type !== "expense") return false;
      if (!tx.date) return false;
      if (categoryPeriod === "thisMonth") return tx.date.startsWith(thisMoKey);
      if (categoryPeriod === "lastMonth") return tx.date.startsWith(lastMoKey);
      if (categoryPeriod === "ytd") return tx.date.startsWith(yearKey);
      return false;
    });
  }, [transactions, categoryPeriod]);

  // Category breakdown for the selected period
  const categoryBreakdown = useMemo(() => {
    const totals = {};
    filteredExpenses.forEach(t => {
      const cat = t.category || "Other";
      totals[cat] = (totals[cat] || 0) + t.amount;
    });
    return Object.entries(totals)
      .map(([label, value]) => ({ label, value }))
      .sort((a,b) => b.value - a.value);
  }, [filteredExpenses]);

  // Period totals + last month total (for pace indicator)
  const periodTotalSpend = useMemo(() =>
    filteredExpenses.reduce((s, tx) => s + tx.amount, 0),
  [filteredExpenses]);

  const lastMonthTotalSpend = useMemo(() => {
    const now = new Date();
    const lastMoDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMoKey = `${lastMoDate.getFullYear()}-${String(lastMoDate.getMonth()+1).padStart(2,"0")}`;
    return transactions
      .filter(tx => tx.type === "expense" && tx.date?.startsWith(lastMoKey))
      .reduce((s, tx) => s + tx.amount, 0);
  }, [transactions]);

  // Drill-down: transactions in selected category, sorted by amount descending
  const drilldownTxns = useMemo(() => {
    if (!drilldownCategory) return [];
    return filteredExpenses
      .filter(tx => (tx.category || "Other") === drilldownCategory)
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, drilldownCategory]);

  // Period label for display
  const now = new Date();
  const periodLabel = categoryPeriod === "thisMonth"
    ? now.toLocaleDateString("en-US", { month: "long" }).toUpperCase()
    : categoryPeriod === "lastMonth"
      ? new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString("en-US", { month: "long" }).toUpperCase()
      : `${now.getFullYear()} YTD`;

  // Pace indicator math (only used when "This Month" is selected)
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const pacePct = lastMonthTotalSpend > 0 ? Math.round((periodTotalSpend / lastMonthTotalSpend) * 100) : 0;
  const expectedPct = Math.round((dayOfMonth / daysInMonth) * 100);
  const isOverPace = pacePct > expectedPct + 5;
  const isUnderPace = pacePct < expectedPct - 5;

  // YTD top categories
  const ytdCategories = useMemo(() => {
    const year = new Date().getFullYear().toString();
    const totals = {};
    transactions
      .filter(t => t.type === "expense" && t.date?.startsWith(year))
      .forEach(t => {
        const cat = t.category || "Other";
        totals[cat] = (totals[cat] || 0) + t.amount;
      });
    return Object.entries(totals)
      .map(([label, value]) => ({ label, value }))
      .sort((a,b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions]);

  // Average monthly savings rate — uses last 3 COMPLETED months only
  // (excludes current month because it's still in progress and would skew the average)
  // Smart fallback: if overall average is negative but at least one month was positive,
  // use only the positive months (your "achievable pace")
  const avgMonthlySavings = useMemo(() => {
    const completedMonths = monthlyStats.slice(0, -1);
    // Only count months where transactions were actually logged
    const monthsWithData = completedMonths.filter(m => m.income > 0 || m.expense > 0);
    if (monthsWithData.length === 0) return 0;
    const recent = monthsWithData.slice(-3);
    const avg = recent.reduce((s, m) => s + m.net, 0) / recent.length;
    if (avg > 0) return avg;
    // Fallback: average of positive months only — shows projection based on your good months
    const positive = recent.filter(m => m.net > 0);
    if (positive.length > 0) {
      return positive.reduce((s, m) => s + m.net, 0) / positive.length;
    }
    return 0;
  }, [monthlyStats]);

  // Track what data the projection is based on (for transparent UI labeling)
  const projectionBasis = useMemo(() => {
    const completedMonths = monthlyStats.slice(0, -1);
    const monthsWithData = completedMonths.filter(m => m.income > 0 || m.expense > 0);
    if (monthsWithData.length === 0) return { count: 0, isOptimistic: false };
    const recent = monthsWithData.slice(-3);
    const avg = recent.reduce((s, m) => s + m.net, 0) / recent.length;
    if (avg > 0) return { count: recent.length, isOptimistic: false };
    const positive = recent.filter(m => m.net > 0);
    return { count: positive.length, isOptimistic: positive.length > 0 };
  }, [monthlyStats]);

  // Projected months to next milestone
  const monthsToGoal = useMemo(() => {
    if (avgMonthlySavings <= 0) return Infinity;
    return Math.ceil((activeMilestone.target - totalNW) / avgMonthlySavings);
  }, [activeMilestone, totalNW, avgMonthlySavings]);

  // Projected goal date
  const projectedDate = useMemo(() => {
    if (!isFinite(monthsToGoal)) return null;
    const d = new Date();
    d.setMonth(d.getMonth() + monthsToGoal);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [monthsToGoal]);

  // ─── DYNAMIC PRESETS ──────────────────────────────────────────────────────
  const dynamicPresets = useMemo(() => {
    const expenseTxns = transactions.filter(tx => tx.type === "expense");
    if (expenseTxns.length < 10) return STARTER_PRESETS;
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
        word,
        category: info.category,
        defaultAccount: info.lastAccount,
      }));
  }, [transactions]);

  const onKey = (k) => {
    const curr = form.amount || "";
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

  const applyPreset = (preset) => {
    setForm(f => ({
      ...f,
      description: preset.word,
      category: preset.category,
      fromAccount: preset.defaultAccount || f.fromAccount,
    }));
  };

  const handleExpenseSubmit = async () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { showToast("Enter an amount. 🙄","error"); return; }
    if (!form.description.trim()) { logExpense(amt, "Other", ""); return; }
    const matchingPreset = dynamicPresets.find(p => p.word.toLowerCase() === form.description.toLowerCase().trim());
    if (matchingPreset) { logExpense(amt, matchingPreset.category, form.description.trim()); return; }
    setCategorizing(true);
    try {
      // Gather user's existing expense categories so Matt-bot prefers reusing them
      const existingCats = [...new Set(transactions
        .filter(tx => tx.type === "expense" && tx.category)
        .map(tx => tx.category))];
      
      const response = await fetch('/api/mattbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userText: `${form.description} (amount: $${amt}, paid from ${getAccount(form.fromAccount)?.label})`,
          accounts: ALL_ACCOUNTS, categories: CATEGORIES,
          existingCategories: existingCats,
        }),
      });
      if (!response.ok) throw new Error("Matt-bot napping");
      const result = await response.json();
      const tx = result.transactions?.[0];
      logExpense(amt, tx?.category || "Other", tx?.note || form.description.trim());
    } catch (err) {
      logExpense(amt, "Other", form.description.trim());
      showToast("Matt-bot napping, logged as Other.","info");
    }
    setCategorizing(false);
  };

  const logExpense = (amt, category, note) => {
    const tx = {
      id: Date.now(), type: "expense", amount: amt, category,
      description: form.description.trim() || category.toLowerCase(),
      note, date: form.date, fromAccount: form.fromAccount, toAccount: "",
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
    setForm(f => ({...f, amount:"", description:"", note:""}));
    showToast(`🤖 ${category} · ${getRoast(category)}`, "roast");
  };

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
    setForm(f => ({...f, amount:"", description:"", note:""}));
    if (form.type==="income") {
      showToast(getPraise(),"praise");
      // 🪩 TRIGGER THE STRIPPER POLE ANIMATION
      setPoleAnimation({ amount: amt });
      setTimeout(() => setPoleAnimation(null), 3500);
    }
    else showToast(`Transferred $${fmt(amt)} 💸`,"praise");
  };

  const handleSubmit = () => {
    if (form.type === "expense") handleExpenseSubmit();
    else handleIncomeTransferSubmit();
  };

  // ─── PROACTIVE INSIGHTS ───────────────────────────────────────────────────
  const loadInsights = async (forceRefresh = false) => {
    // Check cache
    if (!forceRefresh && insightsCache?.timestamp) {
      const age = Date.now() - insightsCache.timestamp;
      if (age < CACHE_MS) {
        return; // Cache still valid
      }
    }
    
    if (transactions.length < 5) {
      setInsightsError("Need at least 5 transactions for insights. Log a few more! 📝");
      return;
    }
    
    setInsightsLoading(true);
    setInsightsError("");
    try {
      const response = await fetch('/api/mattbot-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: transactions.slice(0, 100),
          netWorth: totalNW,
          totalAssets, totalDebts,
          monthlyStats,
          activeMilestone,
          hysaBalance: +(assets.hysa) || 0,
        }),
      });
      if (!response.ok) throw new Error("Insights service unavailable");
      const result = await response.json();
      patch({ insightsCache: { data: result, timestamp: Date.now() } });
    } catch (err) {
      setInsightsError(err.message);
    }
    setInsightsLoading(false);
  };

  const sendChatMessage = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    
    const newHistory = [...chatHistory, { role: "user", content: msg }];
    patch({ chatHistory: newHistory });
    setChatInput("");
    setChatLoading(true);
    
    try {
      const response = await fetch('/api/mattbot-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: transactions.slice(0, 100),
          netWorth: totalNW,
          totalAssets, totalDebts,
          monthlyStats,
          activeMilestone,
          hysaBalance: +(assets.hysa) || 0,
          userQuestion: msg,
        }),
      });
      if (!response.ok) throw new Error("Matt-bot is napping");
      const result = await response.json();
      patch({ 
        chatHistory: [...newHistory, { 
          role: "assistant", 
          content: result.message || "Hmm, I couldn't analyze that. Try again?",
          highlights: result.highlights || [],
        }],
      });
    } catch (err) {
      patch({ chatHistory: [...newHistory, { role: "assistant", content: "😅 I'm having trouble right now. Try again in a moment." }] });
    }
    setChatLoading(false);
  };

  // Auto-load insights when entering MATT tab
  useEffect(() => {
    if (screen === "mattbot" && loaded && !insightsLoading) {
      const age = insightsCache?.timestamp ? Date.now() - insightsCache.timestamp : Infinity;
      if (age >= CACHE_MS && transactions.length >= 5) {
        loadInsights();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, loaded]);

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

  const toggleTheme = () => {
    const next = theme === "dark" ? "aero" : theme === "aero" ? "light" : "dark";
    patch({ theme: next });
  };

  const clearChat = () => patch({ chatHistory: [] });

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

  const insights = insightsCache?.data?.insights || [];
  const insightAge = insightsCache?.timestamp ? Math.floor((Date.now() - insightsCache.timestamp) / 60000) : null;

  return (
    <div style={{minHeight:"100vh",background:t.BG,color:t.W,fontFamily:"'Courier New',monospace",paddingBottom:"calc(80px + env(safe-area-inset-bottom))",transition:"background 0.3s, color 0.3s"}}>
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
        @keyframes mbBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .spin{animation:spin 1s linear infinite;display:inline-block;}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .pulse{animation:pulse 1.5s ease-in-out infinite;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        .insightCard{transition:transform 0.2s ease;}
        .insightCard:hover{transform:translateY(-1px);}
        .sheetBackdrop{animation:fadeIn 0.2s ease;}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .sheetUp{animation:sheetSlide 0.25s ease-out;}
        @keyframes sheetSlide{from{transform:translateY(100%)}to{transform:translateY(0)}}

        /* 🪩 STRIPPER POLE ANIMATION */
        @keyframes poleSlide {
          0%   { top:-150px; transform: translateX(-50%) rotateY(0deg); }
          15%  { top:5%;     transform: translateX(-50%) rotateY(90deg); }
          80%  { top:60%;    transform: translateX(-50%) rotateY(720deg); }
          100% { top:60%;    transform: translateX(-50%) rotateY(720deg); opacity:1; }
        }
        @keyframes moneyFall {
          0%   { transform: translateY(-50px) rotate(0deg);   opacity:1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity:0; }
        }
        @keyframes poleGlow {
          0%,100% { box-shadow:0 0 15px #fbbf24, 0 0 30px #fbbf24aa; }
          50%     { box-shadow:0 0 25px #fbbf24, 0 0 50px #fbbf24cc; }
        }
        @keyframes amountPop {
          0%   { transform: translateX(-50%) scale(0);   opacity:0; }
          40%  { transform: translateX(-50%) scale(1.4); opacity:1; }
          60%  { transform: translateX(-50%) scale(1);   opacity:1; }
          100% { transform: translateX(-50%) scale(1);   opacity:1; }
        }
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
            <button onClick={toggleTheme} className="btn" style={{background:t.CARD,border:`1px solid ${t.BORDER}`,borderRadius:18,padding:"6px 10px",fontSize:14,lineHeight:1, boxShadow:t.aeroShadowSubtle}}>
              {theme==="dark" ? "🌑" : theme==="aero" ? "💎" : "☀️"}
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

        {/* NAV moved to bottom-fixed bar at end of component */}

        {/* ══ MATT-BOT TAB — THE PROACTIVE DASHBOARD ═════════════════════════ */}
        {screen==="mattbot"&&(
          <div className="slide">
            {/* Avatar header */}
            <div style={{textAlign:"center",padding:"10px 0 16px"}}>
              <img
                src="/matt-idle.png"
                alt="Matt-bot"
                className="mbBounce"
                style={{width:140,height:"auto",maxHeight:170,objectFit:"contain",display:"block",margin:"0 auto"}}
                onError={(e)=>{e.target.style.display="none"}}
              />
              <div style={{fontSize:14,fontWeight:900,color:t.G,marginTop:6}}>🤖 MATT-BOT</div>
              <div style={{fontSize:10,color:t.S,marginTop:2}}>
                {insightsLoading ? "🧠 analyzing your finances..." : "your mathematician & tutor"}
              </div>
            </div>

            {/* PROACTIVE INSIGHTS */}
            {insights.length > 0 && (
              <div style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div className="lbl">💡 MATT-BOT NOTICED</div>
                  <button onClick={()=>loadInsights(true)} disabled={insightsLoading} className="btn" style={{
                    background:t.CARD,border:`1px solid ${t.BORDER}`,borderRadius:14,
                    padding:"3px 8px",color:t.S,fontSize:9,fontWeight:700,
                  }}>
                    {insightsLoading?<span className="spin">🔄</span>:"🔄"} REFRESH
                  </button>
                </div>
                {insights.map((insight, i) => {
                  const accent = insight.type === "alert" ? t.R :
                                insight.type === "praise" ? t.G :
                                insight.type === "projection" ? t.B : t.Y;
                  return (
                    <div key={i} className="insightCard slide" style={{
                      background: `linear-gradient(135deg, ${accent}1a, ${accent}08)`,
                      border: `1px solid ${accent}40`,
                      borderRadius: 12, padding: "12px 14px", marginBottom: 8,
                      animationDelay: `${i * 0.1}s`,
                    }}>
                      <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                        <div style={{fontSize:24,lineHeight:1}}>{insight.icon}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,color:t.W,fontWeight:700,marginBottom:3}}>{insight.title}</div>
                          <div style={{fontSize:11,color:t.S,lineHeight:1.5}}>{insight.body}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {insightAge !== null && (
                  <div style={{fontSize:9,color:t.S,textAlign:"center",fontStyle:"italic",marginTop:2}}>
                    Updated {insightAge < 1 ? "just now" : insightAge < 60 ? `${insightAge}m ago` : `${Math.floor(insightAge/60)}h ago`}
                  </div>
                )}
              </div>
            )}

            {insightsLoading && insights.length === 0 && (
              <div style={{textAlign:"center",padding:30,background:t.CARD,border:`1px solid ${t.BORDER}`,borderRadius:12,marginBottom:14}}>
                <div className="spin" style={{fontSize:32,marginBottom:8}}>🧠</div>
                <div style={{fontSize:11,color:t.S}}>Matt-bot is thinking hard...</div>
              </div>
            )}

            {insightsError && (
              <div style={{background:`${t.R}1a`,border:`1px solid ${t.R}40`,borderRadius:10,padding:"10px 12px",marginBottom:14}}>
                <div style={{fontSize:11,color:t.W}}>{insightsError}</div>
              </div>
            )}

            {/* PROJECTION */}
            <div style={{background:`linear-gradient(135deg, ${t.Y}14, ${t.G}08)`,border:`1px solid ${t.Y}40`,borderRadius:14,padding:"14px",marginBottom:12,boxShadow:t.aeroShadow}}>
              <div className="lbl" style={{color:t.Y}}>🔮 PROJECTION</div>
              {isFinite(monthsToGoal) ? (
                <>
                  <div style={{fontSize:11,color:t.S,marginBottom:4}}>{projectionBasis.isOptimistic ? "At your best recent pace, you'll hit" : "At your current pace, you'll hit"}</div>
                  <div style={{fontSize:14,color:t.W,fontWeight:700,marginBottom:2}}>{activeMilestone.icon} {activeMilestone.label}</div>
                  <div style={{fontSize:18,color:t.Y,fontWeight:900}}>{projectedDate || `~${monthsToGoal} months`}</div>
                  <div style={{fontSize:10,color:t.S,marginTop:4}}>
                    {projectionBasis.isOptimistic
                      ? `Based on your ${projectionBasis.count} savings month${projectionBasis.count===1?"":"s"} · $${fmt0(avgMonthlySavings)}/mo`
                      : `Based on last ${projectionBasis.count} month${projectionBasis.count===1?"":"s"} avg · $${fmt0(avgMonthlySavings)}/mo`}
                  </div>
                  <div style={{marginTop:10}}>
                    <ProjectionChart
                      currentNW={totalNW}
                      targetNW={activeMilestone.target}
                      monthlySavings={avgMonthlySavings}
                      monthsToGoal={monthsToGoal}
                      t={t} theme={theme}
                    />
                  </div>
                </>
              ) : (
                <div style={{fontSize:11,color:t.S,marginTop:4,lineHeight:1.5}}>Need at least one savings month to project. Once any completed month shows you saving more than you spent, your projection will appear here. 📈</div>
              )}
            </div>

            {/* INCOME VS EXPENSES OVER TIME */}
            <div style={{background:t.CARD,border:`1px solid ${t.BORDER}`,borderRadius:12,padding:"14px",marginBottom:12,boxShadow:t.aeroShadow}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div className="lbl">📈 INCOME VS EXPENSES</div>
                <div style={{display:"flex",gap:10,fontSize:9}}>
                  <span style={{color:t.G}}>● income</span>
                  <span style={{color:t.R}}>● expense</span>
                </div>
              </div>
              <LineChart data={monthlyStats} t={t} theme={theme}/>
            </div>

            {/* ════ NEW CATEGORY BREAKDOWN (FILTERED + DRILL-DOWN) ════ */}
            <div style={{background:t.CARD,border:`1px solid ${t.BORDER}`,borderRadius:12,padding:"14px",marginBottom:12,boxShadow:t.aeroShadow}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div className="lbl" style={{margin:0}}>📊 SPENDING BY CATEGORY</div>
                <span style={{fontSize:9,color:t.S,letterSpacing:"0.14em",fontWeight:700}}>{periodLabel}</span>
              </div>

              {/* Filter pills */}
              <div style={{display:"flex",gap:5,marginBottom:12}}>
                {[
                  { key:"thisMonth", label:"THIS MONTH" },
                  { key:"lastMonth", label:"LAST MONTH" },
                  { key:"ytd",       label:"YTD" },
                ].map(opt => {
                  const active = categoryPeriod === opt.key;
                  return (
                    <button key={opt.key}
                      onClick={() => setCategoryPeriod(opt.key)}
                      className="btn"
                      style={{
                        flex:1,
                        background: active ? `${t.G}22` : t.cardSubtle,
                        border: `1px solid ${active ? t.G : t.BORDER}`,
                        borderRadius: 8,
                        padding: "7px 4px",
                        color: active ? t.G : t.W,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                      }}>
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Pace indicator (only on This Month, only if last month had spend) */}
              {categoryPeriod === "thisMonth" && lastMonthTotalSpend > 0 && (
                <div style={{
                  background: isOverPace ? `${t.R}1a` : isUnderPace ? `${t.G}1a` : t.cardSubtle,
                  border: `1px solid ${isOverPace ? t.R : isUnderPace ? t.G : t.BORDER}40`,
                  borderRadius: 9,
                  padding: "9px 11px",
                  marginBottom: 12,
                  fontSize: 11,
                  lineHeight: 1.5,
                  color: t.W,
                }}>
                  <div>
                    <span style={{fontWeight:700}}>Day {dayOfMonth} of {daysInMonth}</span> · spent{" "}
                    <span style={{fontWeight:700}}>${fmt0(periodTotalSpend)}</span>
                    {" "}({pacePct}% of last month's ${fmt0(lastMonthTotalSpend)})
                  </div>
                  <div style={{fontSize:10,color:t.S,marginTop:3}}>
                    {isOverPace && "🔥 Outpacing last month. Ease up."}
                    {isUnderPace && "🧊 Under pace. Keep it tight."}
                    {!isOverPace && !isUnderPace && "📍 Right on pace with last month."}
                  </div>
                </div>
              )}

              {/* Bar chart (clickable) */}
              {categoryBreakdown.length > 0 ? (
                <CategoryBarChart
                  data={categoryBreakdown}
                  t={t}
                  theme={theme}
                  onBarClick={(label) => setDrilldownCategory(label)}
                />
              ) : (
                <div style={{fontSize:11,color:t.S,fontStyle:"italic",textAlign:"center",padding:14}}>
                  No expenses logged for this period 📝
                </div>
              )}

              {/* Period total footer */}
              {categoryBreakdown.length > 0 && (
                <div style={{
                  display:"flex",justifyContent:"space-between",alignItems:"center",
                  marginTop:10,paddingTop:10,borderTop:`1px solid ${t.BORDER}`,
                  fontSize:11,fontWeight:700,color:t.W,
                }}>
                  <span>TOTAL</span>
                  <span>${fmt0(periodTotalSpend)}</span>
                </div>
              )}
            </div>

            {/* CONVERSATIONAL CHAT */}
            <div style={{background:t.CARD,border:`1px solid ${t.BORDER}`,borderRadius:12,padding:"14px",marginBottom:12,boxShadow:t.aeroShadow}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div className="lbl">💬 ASK MATT-BOT</div>
                {chatHistory.length > 0 && (
                  <button onClick={clearChat} className="btn" style={{background:"transparent",border:"none",color:t.S,fontSize:9,padding:0}}>clear chat</button>
                )}
              </div>

              {/* Chat history */}
              {chatHistory.length > 0 && (
                <div style={{maxHeight:300,overflowY:"auto",marginBottom:8,paddingRight:4}}>
                  {chatHistory.map((m, i) => (
                    <div key={i} style={{
                      background: m.role === "user" ? `${t.B}22` : `${t.G}14`,
                      border: `1px solid ${m.role === "user" ? t.B : t.G}40`,
                      borderRadius: 9, padding: "8px 11px", marginBottom: 6,
                      maxWidth: "92%",
                      marginLeft: m.role === "user" ? "auto" : 0,
                      marginRight: m.role === "user" ? 0 : "auto",
                    }}>
                      <div style={{fontSize:8,color:t.S,marginBottom:3,fontWeight:700}}>
                        {m.role === "user" ? "YOU" : "🤖 MATT-BOT"}
                      </div>
                      <div style={{fontSize:11,color:t.W,lineHeight:1.5,whiteSpace:"pre-wrap"}}>{m.content}</div>
                      {m.highlights && m.highlights.length > 0 && (
                        <div style={{marginTop:6,display:"flex",flexWrap:"wrap",gap:4}}>
                          {m.highlights.map((h, j) => (
                            <div key={j} style={{background:t.CARD,border:`1px solid ${t.BORDER}`,borderRadius:6,padding:"3px 7px",fontSize:9}}>
                              <span style={{color:t.S}}>{h.label}: </span>
                              <span style={{color:t.G,fontWeight:700}}>{h.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{background:`${t.G}14`,border:`1px solid ${t.G}40`,borderRadius:9,padding:"8px 11px",marginBottom:6,maxWidth:"92%"}}>
                      <div style={{fontSize:8,color:t.S,marginBottom:3,fontWeight:700}}>🤖 MATT-BOT</div>
                      <div style={{fontSize:11,color:t.S}}><span className="spin">🧠</span> thinking...</div>
                    </div>
                  )}
                </div>
              )}

              {/* Sample questions if empty */}
              {chatHistory.length === 0 && (
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:10,color:t.S,marginBottom:6}}>💡 Try asking:</div>
                  {[
                    "How much did I spend on food this month?",
                    "When will I hit $100K?",
                    "What's my biggest expense category?",
                    "Where can I cut to save more?",
                  ].map((q, i) => (
                    <button key={i} onClick={()=>setChatInput(q)} className="btn" style={{
                      width:"100%",textAlign:"left",
                      background:t.cardSubtle,border:`1px solid ${t.BORDER}`,
                      borderRadius:7,padding:"7px 10px",marginBottom:4,
                      color:t.S,fontSize:10,fontFamily:"inherit",
                    }}>
                      → {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat input */}
              <div style={{display:"flex",gap:6}}>
                <input
                  type="text"
                  placeholder="ask matt-bot anything..."
                  value={chatInput}
                  onChange={e=>setChatInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter") sendChatMessage()}}
                  disabled={chatLoading}
                  style={{flex:1}}
                />
                <button onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()} className="btn" style={{
                  background: !chatInput.trim() ? t.CARD : `linear-gradient(135deg,${t.G},${t.B})`,
                  border:"none",borderRadius:8,padding:"0 14px",
                  color: !chatInput.trim() ? t.S : t.btnText,
                  fontSize:13, fontWeight:900, opacity: !chatInput.trim() ? 0.5 : 1,
                }}>
                  {chatLoading?<span className="spin">🤖</span>:"→"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ LOG ══ */}
        {screen==="log"&&(
          <div className="slide">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:10}}>
              {[{tt:"expense", label:"💸 OUT", color:t.R},{tt:"income", label:"💰 IN", color:t.G},{tt:"transfer",label:"⇄ MOVE", color:t.B}].map(({tt,label,color})=>(
                <button key={tt} onClick={()=>setForm(f=>({...f,type:tt,category:tt==="expense"?"Food":tt==="income"?"Salary":f.category,description:""}))} className="btn" style={{
                  background: form.type===tt ? `${color}22` : t.CARD,
                  border:`1px solid ${form.type===tt ? color : t.BORDER}`,
                  borderRadius:9, padding:"9px",
                  color:form.type===tt ? color : t.W,
                  fontSize:11, fontWeight:700,
                }}>{label}</button>
              ))}
            </div>

            <div style={{background:theme==="dark"?"rgba(0,0,0,0.3)":"rgba(15,23,42,0.04)",border:`1px solid ${form.type==="income"?t.G:form.type==="transfer"?t.B:t.R}40`,borderRadius:12,padding:"14px",marginBottom:8,textAlign:"right"}}>
              <div className="lbl" style={{textAlign:"left",marginBottom:2}}>AMOUNT</div>
              <div style={{fontSize:34,fontWeight:900,color:form.type==="income"?t.G:form.type==="transfer"?t.B:t.R,lineHeight:1}}>
                ${form.amount||"0"}
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:12}}>
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

            {form.type==="expense"&&(<>
              <div className="lbl">💡 WHAT WAS THIS FOR?</div>
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
              <input
                type="text"
                placeholder="or type: gas, lunch, amazon, doctor..."
                value={form.description}
                onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                style={{marginBottom:10}}
              />
              <div style={{marginBottom:10}}>
                <AccountGrid selectedId={form.fromAccount} onSelect={id=>setForm(f=>({...f,fromAccount:id}))} filter="all" label="💳 PAID FROM"/>
                {getAccount(form.fromAccount)?.type==="debt" && (<div style={{fontSize:10,color:"#fb923c",marginTop:4,fontStyle:"italic"}}>⚠️ This adds to your {getAccount(form.fromAccount)?.label} debt</div>)}
              </div>
            </>)}

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

        {/* ══ DASHBOARD ══ */}
        {screen==="dashboard"&&(
          <div className="slide">
            <div style={{
              background: theme==="aero"
                ? "linear-gradient(135deg, rgba(52,211,153,0.18), rgba(96,165,250,0.10) 50%, rgba(167,139,250,0.06))"
                : theme==="dark"
                ? "linear-gradient(135deg, rgba(52,211,153,0.1), rgba(96,165,250,0.06))"
                : "linear-gradient(135deg, rgba(5,150,105,0.08), rgba(37,99,235,0.05))",
              border:`1px solid ${t.G}40`,
              borderRadius:16,padding:"18px",marginBottom:12,
              boxShadow: t.aeroShadow,
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
                    background: done ? (theme==="dark"?"rgba(52,211,153,0.1)":"rgba(5,150,105,0.08)") : active ? (theme==="dark"?"rgba(251,191,36,0.1)":"rgba(217,119,6,0.08)") : t.CARD,
                    border: `1px solid ${done?t.G:active?t.Y:t.BORDER}`,
                    borderRadius:12, padding:"12px 8px", textAlign:"center",
                    boxShadow: t.aeroShadow,
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
                  background: hysaDone ? (theme==="dark"?"rgba(52,211,153,0.08)":"rgba(5,150,105,0.06)") : (theme==="dark"?"rgba(56,189,248,0.06)":"rgba(37,99,235,0.05)"),
                  border:`1px solid ${hysaDone?t.G:"#38bdf8"}40`,
                  borderRadius:12,padding:"12px 14px",marginBottom:12,
                  boxShadow: t.aeroShadow,
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
              <div style={{background:t.CARD,border:`1px solid ${t.B}40`,borderRadius:12,padding:"12px",boxShadow:t.aeroShadow}}>
                <div className="lbl">💵 CASH</div>
                <div style={{fontSize:14,fontWeight:700,color:t.B,marginTop:2}}>${fmt(cashTotal)}</div>
              </div>
              <div style={{background:t.CARD,border:`1px solid ${t.P}40`,borderRadius:12,padding:"12px",boxShadow:t.aeroShadow}}>
                <div className="lbl">📈 INVESTED</div>
                <div style={{fontSize:14,fontWeight:700,color:t.P,marginTop:2}}>${fmt(investTotal)}</div>
              </div>
              <div style={{background:t.CARD,border:`1px solid ${t.R}40`,borderRadius:12,padding:"12px",boxShadow:t.aeroShadow}}>
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
            <div style={{background:t.CARD,border:`1px solid ${t.BORDER}`,borderRadius:12,padding:"14px",marginBottom:12,boxShadow:t.aeroShadow}}>
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

            <div style={{background:t.CARD,border:`1px solid ${t.BORDER}`,borderRadius:12,padding:"12px",marginTop:6,boxShadow:t.aeroShadow}}>
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
              background: theme==="aero" ? "linear-gradient(135deg, rgba(52,211,153,0.18), rgba(96,165,250,0.10) 50%, rgba(167,139,250,0.06))" : theme==="dark" ? "linear-gradient(135deg, rgba(52,211,153,0.1), rgba(96,165,250,0.06))" : "linear-gradient(135deg, rgba(5,150,105,0.08), rgba(37,99,235,0.05))",
              border:`1px solid ${t.G}40`,
              borderRadius:12,padding:"14px",marginBottom:12,
              boxShadow: t.aeroShadow,
            }}>
              <div className="lbl">TRUE NET WORTH</div>
              <div style={{fontSize:24,fontWeight:900,color:t.W}}>${fmt(totalNW)}</div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                <span style={{fontSize:10,color:t.G}}>+${fmt(totalAssets)}</span>
                <span style={{fontSize:10,color:t.R}}>−${fmt(totalDebts)}</span>
              </div>
            </div>

            <div style={{fontSize:13,color:t.W,fontWeight:700,marginBottom:6}}>💰 ASSETS <span style={{fontSize:9,color:t.G,marginLeft:6,opacity:0.7}}>●</span></div>
            {ASSET_ACCOUNTS.map(acc=>(
              <div key={acc.id} style={{background:t.CARD,border:`1px solid ${t.BORDER}`,borderRadius:10,padding:"12px 14px",marginBottom:8,boxShadow:t.aeroShadowSubtle}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:22}}>{acc.icon}</span>
                    <div>
                      <div style={{fontSize:13,color:t.W,fontWeight:700}}>{acc.label}</div>
                      <div style={{fontSize:10,color:t.S,marginTop:1}}>Current Balance</div>
                    </div>
                  </div>
                  <div style={{fontSize:18,color:acc.color,fontWeight:900,letterSpacing:"-0.01em"}}>${fmt(assets[acc.id]||0)}</div>
                </div>
                <input type="number" placeholder="Adjust balance..." value={editA[acc.id]||""} onChange={e=>setEA(p=>({...p,[acc.id]:e.target.value}))} style={{color:acc.color,borderColor:`${acc.color}50`,fontSize:14}}/>
              </div>
            ))}

            <div style={{fontSize:13,color:t.R,fontWeight:700,margin:"16px 0 6px"}}>💳 DEBTS</div>
            {DEBT_ACCOUNTS.map(acc=>(
              <div key={acc.id} style={{background:theme==="dark"?"rgba(248,113,113,0.04)":theme==="aero"?"rgba(248,113,113,0.06)":"rgba(220,38,38,0.03)",border:`1px solid ${t.R}26`,borderRadius:10,padding:"12px 14px",marginBottom:8,boxShadow:t.aeroShadowSubtle}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:22}}>{acc.icon}</span>
                    <div>
                      <div style={{fontSize:13,color:t.W,fontWeight:700}}>{acc.label}</div>
                      <div style={{fontSize:10,color:t.S,marginTop:1}}>Amount Owed</div>
                    </div>
                  </div>
                  <div style={{fontSize:18,color:t.R,fontWeight:900,letterSpacing:"-0.01em"}}>${fmt(debts[acc.id]||0)}</div>
                </div>
                <input type="number" placeholder="Adjust balance..." value={editD[acc.id]||""} onChange={e=>setED(p=>({...p,[acc.id]:e.target.value}))} style={{color:t.R,borderColor:`${t.R}66`,fontSize:14}}/>
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

      {/* ════ DRILL-DOWN BOTTOM SHEET (overlays everything when active) ════ */}
      {drilldownCategory && (
        <>
          <div
            className="sheetBackdrop"
            onClick={() => setDrilldownCategory(null)}
            style={{
              position:"fixed", inset:0,
              background:"rgba(0,0,0,0.6)",
              zIndex:200,
            }}
          />
          <div
            className="sheetUp"
            style={{
              position:"fixed", left:0, right:0, bottom:0,
              background:t.BG,
              borderTopLeftRadius:20, borderTopRightRadius:20,
              maxHeight:"80vh", zIndex:201,
              boxShadow:"0 -10px 40px rgba(0,0,0,0.5)",
              display:"flex", flexDirection:"column",
              borderTop:`1px solid ${t.BORDER}`,
            }}
          >
            {/* Drag handle */}
            <div style={{display:"flex",justifyContent:"center",padding:"10px 0 4px"}}>
              <div style={{width:40,height:4,background:t.BORDER,borderRadius:2}}/>
            </div>

            {/* Header */}
            <div style={{padding:"6px 18px 14px",borderBottom:`1px solid ${t.BORDER}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:9,color:t.S,letterSpacing:"0.14em",fontWeight:700}}>{periodLabel}</div>
                  <div style={{fontSize:17,fontWeight:900,color:t.W,marginTop:2,display:"flex",alignItems:"center",gap:8}}>
                    <span style={{color:colorForCategory(drilldownCategory)}}>●</span>
                    {drilldownCategory}
                  </div>
                </div>
                <button
                  onClick={() => setDrilldownCategory(null)}
                  className="btn"
                  style={{
                    background:t.CARD, border:`1px solid ${t.BORDER}`,
                    width:32, height:32, borderRadius:16,
                    color:t.W, fontSize:14, fontWeight:700,
                    flexShrink:0,
                  }}>
                  ✕
                </button>
              </div>
              <div style={{marginTop:8,fontSize:11,color:t.S}}>
                {drilldownTxns.length} transaction{drilldownTxns.length === 1 ? "" : "s"} ·{" "}
                <span style={{color:t.W,fontWeight:700}}>
                  ${fmt(drilldownTxns.reduce((s,tx)=>s+tx.amount,0))}
                </span> total
              </div>
            </div>

            {/* Transaction list (scrollable, sorted by amount desc) */}
            <div style={{overflowY:"auto",padding:"6px 18px 24px",flex:1}}>
              {drilldownTxns.length === 0 ? (
                <div style={{textAlign:"center",padding:30,fontSize:11,color:t.S,fontStyle:"italic"}}>
                  No transactions in this category for the selected period.
                </div>
              ) : drilldownTxns.map((tx, i) => {
                const fromAcc = getAccount(tx.fromAccount);
                return (
                  <div key={tx.id} style={{
                    display:"flex",justifyContent:"space-between",alignItems:"center",
                    padding:"10px 0",
                    borderBottom: i < drilldownTxns.length - 1 ? `1px solid ${t.BORDER}` : "none",
                  }}>
                    <div style={{flex:1,minWidth:0,paddingRight:10}}>
                      <div style={{fontSize:12,color:t.W,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {tx.description || tx.note || "(no description)"}
                      </div>
                      <div style={{fontSize:10,color:t.S,marginTop:2}}>
                        {tx.date}{fromAcc ? ` · ${fromAcc.icon} ${fromAcc.label}` : ""}
                      </div>
                    </div>
                    <div style={{fontSize:13,fontWeight:700,color:t.R,flexShrink:0}}>
                      -${fmt(tx.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 🪩 THE LEGENDARY STRIPPER POLE INCOME ANIMATION                  */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {poleAnimation && (
        <div style={{
          position:"fixed", inset:0, zIndex:9999,
          background:"radial-gradient(ellipse at center, rgba(251,191,36,0.25), rgba(0,0,0,0.85))",
          overflow:"hidden", pointerEvents:"none",
        }}>
          {/* The pole — vertical golden bar down the center */}
          <div style={{
            position:"absolute", top:0, bottom:0, left:"50%",
            transform:"translateX(-50%)",
            width:8,
            background:"linear-gradient(180deg, #fde68a, #fbbf24 50%, #d97706)",
            borderRadius:4,
            animation:"poleGlow 1s ease-in-out infinite",
          }}/>

          {/* Matt-bot sliding & spinning down the pole */}
          <img
            src="/matt-back.png"
            alt=""
            style={{
              position:"absolute",
              left:"50%",
              width:90,
              height:"auto",
              transformOrigin:"center center",
              transformStyle:"preserve-3d",
              animation:"poleSlide 3s cubic-bezier(0.34, 1.2, 0.64, 1) forwards",
              imageRendering:"pixelated",
              filter:"drop-shadow(0 0 12px rgba(251,191,36,0.8))",
              zIndex:2,
            }}
          />

          {/* Money confetti — 18 emoji raining from the top */}
          {Array.from({length:18}).map((_,i)=>{
            const emoji = ["💵","💸","💰","🤑","💲"][i % 5];
            const left = Math.random() * 100;
            const delay = Math.random() * 1.5;
            const duration = 2 + Math.random() * 1.5;
            const size = 22 + Math.random() * 18;
            return (
              <div key={i} style={{
                position:"absolute",
                left:`${left}%`,
                top:0,
                fontSize:size,
                animation:`moneyFall ${duration}s linear ${delay}s forwards`,
                zIndex:1,
              }}>{emoji}</div>
            );
          })}

          {/* The amount popping up at the bottom */}
          <div style={{
            position:"absolute",
            bottom:"15%",
            left:"50%",
            transform:"translateX(-50%)",
            animation:"amountPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 1s forwards",
            opacity:0,
            textAlign:"center",
            zIndex:3,
          }}>
            <div style={{
              fontSize:14, color:"#fbbf24", fontFamily:"'Courier New',monospace",
              fontWeight:700, letterSpacing:"0.2em", marginBottom:4,
              textShadow:"0 0 10px rgba(251,191,36,0.8)",
            }}>+ INCOME +</div>
            <div style={{
              fontSize:42, color:"#34d399", fontFamily:"'Courier New',monospace",
              fontWeight:900,
              textShadow:"0 0 15px rgba(52,211,153,0.9), 0 4px 12px rgba(0,0,0,0.6)",
            }}>${fmt(poleAnimation.amount)}</div>
            <div style={{
              fontSize:11, color:"#fde68a", fontFamily:"'Courier New',monospace",
              marginTop:6, letterSpacing:"0.1em",
            }}>MATT-BOT APPROVES 🪩</div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 📍 BOTTOM-PINNED NAVIGATION BAR                                   */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div style={{
        position:"fixed",
        bottom:0, left:0, right:0,
        background:t.headerBg,
        borderTop:`1px solid ${t.BORDER}`,
        backdropFilter:"blur(12px)",
        WebkitBackdropFilter:"blur(12px)",
        paddingBottom:"env(safe-area-inset-bottom)",
        zIndex:100,
      }}>
        <div style={{
          maxWidth:500, margin:"0 auto",
          padding:"8px 10px",
          display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:4,
        }}>
          {[
            {id:"dashboard",icon:"📊",label:"HOME"},
            {id:"log",      icon:"➕",label:"LOG"},
            {id:"mattbot",  icon:"🤖",label:"MATT"},
            {id:"accounts", icon:"🏦",label:"ACCTS"},
            {id:"history",  icon:"📋",label:"HIST"},
          ].map(({id,icon,label})=>(
            <button key={id} onClick={()=>setScreen(id)} className="btn" style={{
              background:screen===id?(theme==="dark"?"rgba(52,211,153,0.12)":"rgba(5,150,105,0.1)"):"transparent",
              border:`1px solid ${screen===id?t.G:"transparent"}`,
              borderRadius:10, padding:"8px 3px",
              color:screen===id?t.G:t.S,
              fontSize:9, letterSpacing:"0.06em", fontWeight:700,
              display:"flex", flexDirection:"column", alignItems:"center", gap:2,
              transition:"all 0.15s",
            }}>
              <div style={{fontSize:18, lineHeight:1}}>{icon}</div>
              <div>{label}</div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
