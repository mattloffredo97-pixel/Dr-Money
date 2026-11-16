import { useState, useEffect, useRef, useMemo } from "react";

const MILESTONES = [
  { target:100000,  label:"First $100K",    icon:"🚗" },
  { target:150000,  label:"$150K",          icon:"🏎️" },
  { target:200000,  label:"$200K",          icon:"✈️" },
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

// WEDDING_ACCOUNT — special virtual account for transfer picker only (tracked separately)
const WEDDING_ACCOUNT = { id:"wedding_fund", label:"Wedding Fund", icon:"💒", color:"#e879f9", type:"wedding" };

const ALL_ACCOUNTS = [...ASSET_ACCOUNTS, ...DEBT_ACCOUNTS];
const getAccount = (id) => {
  if (id === "wedding_fund") return WEDDING_ACCOUNT;
  return ALL_ACCOUNTS.find(a => a.id === id);
};

const CATEGORIES = {
  income:  ["Salary","Freelance","Investment Return","Bonus","Side Hustle","Refund","Other Income"],
  expense: ["Food","Rent","Entertainment","Transport","Shopping","Subscriptions","Medical","Utilities","Gas","Other"],
};

// ═══ DISCRETIONARY BUDGET CONFIG ═══
const DISCRETIONARY_BUDGET = 1733;
const FIXED_CATEGORIES = ["Rent", "Utilities", "Subscriptions"];
// Optional per-month budget overrides (empty by default; every month uses $1,733)
const MONTH_BUDGET_OVERRIDES = {};
const getBaseBudget = (monthKey) => MONTH_BUDGET_OVERRIDES[monthKey] ?? DISCRETIONARY_BUDGET;

const CATEGORY_COLORS = {
  Food: "#34d399", Rent: "#60a5fa", Entertainment: "#f472b6",
  Transport: "#fbbf24", Shopping: "#a78bfa", Subscriptions: "#38bdf8",
  Medical: "#ef4444", Utilities: "#fb923c", Gas: "#facc15", Other: "#94a3b8",
  Pets: "#f97316", "Personal Care": "#ec4899", Travel: "#06b6d4",
  Gifts: "#84cc16", Education: "#8b5cf6", Fitness: "#10b981",
  Charity: "#fbbf24", "Auto Repair": "#71717a", Hobbies: "#c084fc",
  Childcare: "#fb7185", "Home Improvement": "#a3e635",
};

const FALLBACK_PALETTE = ["#60a5fa","#34d399","#fbbf24","#f472b6","#a78bfa","#fb923c","#38bdf8","#f87171","#4ade80","#facc15","#c084fc","#84cc16","#06b6d4","#ec4899","#10b981"];
const colorForCategory = (name) => {
  if (CATEGORY_COLORS[name]) return CATEGORY_COLORS[name];
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
const thisMonthStr = () => todayStr().slice(0,7);
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

// Get next month name for the "resets [Month] 1" message
const nextMonthName = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toLocaleDateString("en-US", { month: "long" });
};

// Get month key for N months ago (0 = this month, 1 = last month, etc.)
const monthKeyOffset = (offset) => {
  const d = new Date();
  d.setDate(1); // avoid month-end rollover issues
  d.setMonth(d.getMonth() - offset);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
};

const SKEY = "drMoneyV12";

const EMPTY = {
  transactions: [],
  assets: { checking:2300, emergency:2000, hysa:12747, investments:17465, joint_invest:3790, sharkninja:11947, joint_savings:100, house_fund:15000 },
  debts:  { debt_bofa:0, debt_chase:0, debt_lowes:0, debt_cap1:0 },
  weddingFund: { total: 0, mattContrib: 0, nicContrib: 0, goal: 60000 },
  balHistory: [],
  streak:0, lastLog:null,
  theme: "deep",
  insightsCache: null,
  chatHistory: [],
  budgetStartMonth: null,  // Set to current month on first load; earlier months don't roll over
};

const hasLS = (() => { try { localStorage.setItem("__t","1"); localStorage.removeItem("__t"); return true; } catch { return false; } })();
let memStore = null;
const storageRead  = () => { try { return hasLS ? localStorage.getItem(SKEY) : memStore; } catch { return memStore; } };
const storageWrite = (v) => { try { if(hasLS) localStorage.setItem(SKEY,v); memStore = v; return true; } catch { memStore=v; return false; } };

// ─── LIQUID GLASS THEMES ─────────────────────────────────────────────────────
// deep = rich night glass, day = light airy glass. Accent colors (G,R,Y,B,P,PK,SKY) must stay 6-digit hex.
const GLASS_BLUR = "blur(24px) saturate(180%)";
// Soft, low-strength color glows tucked toward the screen edges (no outlines)
const blobSet = (c, strength) => [
  { width:460, height:460, top:-160,   left:-180,  opacity:strength, background:`radial-gradient(circle, ${c[0]}, transparent 70%)` },
  { width:420, height:420, top:"30%",  right:-220, opacity:strength, background:`radial-gradient(circle, ${c[1]}, transparent 70%)` },
  { width:400, height:400, top:"62%",  left:-220,  opacity:strength, background:`radial-gradient(circle, ${c[2]}, transparent 70%)` },
  { width:440, height:440, bottom:-200, right:-160, opacity:strength, background:`radial-gradient(circle, ${c[3]}, transparent 70%)` },
];

const THEMES = {
  deep: {
    W: "#ffffff", S: "#cbd5e1", G: "#4ade80", R: "#fb7185", Y: "#fcd34d", B: "#7dd3fc", P: "#c4b5fd", PK: "#f0abfc", SKY: "#7dd3fc",
    BG: "#070b1f",
    CARD: "radial-gradient(120% 60% at 15% -10%, rgba(255,255,255,0.22), transparent 55%), linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04))",
    BORDER: "rgba(255,255,255,0.2)",
    headerBg: "rgba(7,11,31,0.62)",
    inputBg: "rgba(255,255,255,0.08)", inputBorder: "rgba(255,255,255,0.22)",
    placeholderColor: "#6b7aa6",
    selectBg: "#111a3a",
    btnText: "#070b1f",
    secondaryText: "#a5b4d4",
    cardSubtle: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))",
    chartGrid: "rgba(255,255,255,0.1)",
    aeroShadow: "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(255,255,255,0.06), 0 8px 30px rgba(0,0,0,0.35)",
    aeroShadowSubtle: "inset 0 1px 0 rgba(255,255,255,0.28), 0 4px 16px rgba(0,0,0,0.25)",
    blur: GLASS_BLUR,
    blobs: blobSet(["#2f6bff","#8b3dff","#ff3d9a","#00d4c8"], 0.38),
    isDark: true,
    isAero: true,
  },
  day: {
    W: "#0b1430", S: "#3b4766", G: "#059669", R: "#e11d48", Y: "#b45309", B: "#0369a1", P: "#6d28d9", PK: "#be185d", SKY: "#0369a1",
    BG: "#e8f0ff",
    CARD: "radial-gradient(120% 60% at 15% -10%, rgba(255,255,255,0.6), transparent 55%), linear-gradient(135deg, rgba(255,255,255,0.45), rgba(255,255,255,0.18))",
    BORDER: "rgba(255,255,255,0.75)",
    headerBg: "rgba(255,255,255,0.6)",
    inputBg: "rgba(255,255,255,0.5)", inputBorder: "rgba(255,255,255,0.85)",
    placeholderColor: "#7a86a8",
    selectBg: "#ffffff",
    btnText: "#ffffff",
    secondaryText: "#56628a",
    cardSubtle: "linear-gradient(135deg, rgba(255,255,255,0.45), rgba(255,255,255,0.2))",
    chartGrid: "rgba(11,20,48,0.08)",
    aeroShadow: "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(255,255,255,0.25), 0 8px 30px rgba(40,60,120,0.14)",
    aeroShadowSubtle: "inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 16px rgba(40,60,120,0.1)",
    blur: GLASS_BLUR,
    blobs: blobSet(["#3b9bff","#a66bff","#ff6fb0","#2fe0c8"], 0.32),
    isDark: false,
    isAero: true,
  },
};

// Old saved themes (dark / aero / light) map onto the new glass themes
const migrateTheme = (th) => (th === "light" || th === "day") ? "day" : "deep";

const CACHE_HOURS = 6;
const CACHE_MS = CACHE_HOURS * 60 * 60 * 1000;

function CategoryBarChart({ data, t, theme, onBarClick }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value));
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {data.map((d, i) => {
        const pct = max > 0 ? (d.value / max) * 100 : 0;
        const color = colorForCategory(d.label);
        return (
          <button key={i} onClick={() => onBarClick && onBarClick(d.label)} className="btn" style={{background:"transparent",border:"none",padding:0,textAlign:"left",width:"100%",cursor: onBarClick ? "pointer" : "default"}}>
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

// ─── CHART HELPERS ─────────────────────────────────────────────────────────────
const monthShort = (key) => { const [y, m] = key.split("-").map(Number); return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short" }); };
const fmtAxis = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(2)}M` : n >= 1000 ? `$${(n/1000).toFixed(n >= 100000 ? 0 : 1)}k` : `$${Math.round(n)}`;
const niceCeil = (v) => { if (v <= 0) return 100; const p = Math.pow(10, Math.floor(Math.log10(v))); const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(x => x * p >= v); return step * p; };

// ─── INCOME VS EXPENSES CHART (every month + every axis value labeled) ────────
function LineChart({ data, t, height=170 }) {
  if (!data || data.length < 2) return <div style={{padding:24,textAlign:"center",fontSize:11,color:t.S,fontStyle:"italic"}}>Need more data to show this chart 📊</div>;
  const width = 300;
  const pad = { top: 12, right: 14, bottom: 22, left: 42 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;
  const top = niceCeil(Math.max(...data.flatMap(d => [d.income || 0, d.expense || 0])));
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const xStep = cw / (data.length - 1);
  const X = (i) => pad.left + i * xStep;
  const Y = (v) => pad.top + ch - (v / top) * ch;
  const inc = data.map((d, i) => ({ x: X(i), y: Y(d.income || 0) }));
  const exp = data.map((d, i) => ({ x: X(i), y: Y(d.expense || 0) }));
  const line = (pts) => pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = (pts) => `${line(pts)} L ${pts[pts.length-1].x} ${pad.top + ch} L ${pts[0].x} ${pad.top + ch} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{width:"100%",height:"auto",display:"block"}}>
      <defs>
        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.G} stopOpacity="0.35"/><stop offset="100%" stopColor={t.G} stopOpacity="0"/></linearGradient>
        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.R} stopOpacity="0.35"/><stop offset="100%" stopColor={t.R} stopOpacity="0"/></linearGradient>
      </defs>
      {ticks.map((p, i) => (
        <g key={i}>
          <line x1={pad.left} y1={Y(top * p)} x2={width - pad.right} y2={Y(top * p)} stroke={t.chartGrid} strokeWidth="0.6"/>
          <text x={pad.left - 5} y={Y(top * p) + 3} fontSize="8.5" fill={t.S} textAnchor="end" fontFamily="monospace">{fmtAxis(top * p)}</text>
        </g>
      ))}
      <path d={area(inc)} fill="url(#incomeGrad)"/>
      <path d={area(exp)} fill="url(#expenseGrad)"/>
      <path d={line(inc)} fill="none" stroke={t.G} strokeWidth="2"/>
      <path d={line(exp)} fill="none" stroke={t.R} strokeWidth="2"/>
      {inc.map((p, i) => <circle key={`i${i}`} cx={p.x} cy={p.y} r="2.8" fill={t.G} stroke={t.BG} strokeWidth="1"/>)}
      {exp.map((p, i) => <circle key={`e${i}`} cx={p.x} cy={p.y} r="2.8" fill={t.R} stroke={t.BG} strokeWidth="1"/>)}
      {data.map((d, i) => <text key={i} x={X(i)} y={height - 6} fontSize="8.5" fill={t.S} textAnchor="middle" fontFamily="monospace">{monthShort(d.month)}</text>)}
    </svg>
  );
}

// ─── PROJECTION CHART (month-by-month path with milestone lines) ──────────────
function ProjectionChart({ rows, currentNW, t, height=170 }) {
  if (!rows || rows.length === 0) return null;
  const width = 300;
  const pad = { top: 12, right: 14, bottom: 22, left: 44 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;
  const pts = [{ i: 0, short: "Now", value: currentNW }, ...rows];
  const yMin = Math.max(0, Math.floor(currentNW / 10000) * 10000);
  let yMax = Math.ceil(pts[pts.length - 1].value / 10000) * 10000;
  if (yMax <= yMin) yMax = yMin + 10000;
  const Y = (v) => pad.top + ch - ((v - yMin) / (yMax - yMin)) * ch;
  const X = (i) => pad.left + (i / (pts.length - 1)) * cw;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(p => yMin + (yMax - yMin) * p);
  const every = Math.ceil((pts.length - 1) / 6);
  const path = pts.map((p, k) => `${k === 0 ? "M" : "L"} ${X(k)} ${Y(p.value)}`).join(" ");
  const goals = MILESTONES.filter(m => m.target > yMin && m.target <= yMax);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{width:"100%",height:"auto",display:"block"}}>
      <defs><linearGradient id="trajGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.G} stopOpacity="0.3"/><stop offset="100%" stopColor={t.G} stopOpacity="0"/></linearGradient></defs>
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={pad.left} y1={Y(v)} x2={width - pad.right} y2={Y(v)} stroke={t.chartGrid} strokeWidth="0.6"/>
          <text x={pad.left - 5} y={Y(v) + 3} fontSize="8.5" fill={t.S} textAnchor="end" fontFamily="monospace">{fmtAxis(v)}</text>
        </g>
      ))}
      {goals.map(m => (
        <g key={m.target}>
          <line x1={pad.left} y1={Y(m.target)} x2={width - pad.right} y2={Y(m.target)} stroke={t.Y} strokeWidth="1" strokeDasharray="3,3" opacity="0.8"/>
          <text x={pad.left + 3} y={Y(m.target) - 3} fontSize="8" fill={t.Y} fontFamily="monospace">{m.icon} {fmtAxis(m.target)}</text>
        </g>
      ))}
      <path d={`${path} L ${X(pts.length - 1)} ${pad.top + ch} L ${X(0)} ${pad.top + ch} Z`} fill="url(#trajGrad)"/>
      <path d={path} fill="none" stroke={t.G} strokeWidth="2"/>
      {pts.map((p, k) => <circle key={k} cx={X(k)} cy={Y(p.value)} r={k === 0 ? 3.5 : 2.2} fill={t.G} stroke={t.BG} strokeWidth="1"/>)}
      {pts.map((p, k) => (k % every === 0 || k === pts.length - 1) ? <text key={`l${k}`} x={X(k)} y={height - 6} fontSize="8.5" fill={t.S} textAnchor="middle" fontFamily="monospace">{p.short}</text> : null)}
    </svg>
  );
}

// ─── CASH VS INVESTMENTS HISTORY ─────────────────────────────────────────────
// Same split as the HOME pills: investments = Personal + Joint + Sharkninja, cash = every other asset account
const INVEST_IDS = ["investments", "joint_invest", "sharkninja"];
const assetDelta = (tx) => {
  const d = {};
  const add = (id, v) => { if (ASSET_ACCOUNTS.some(a => a.id === id)) d[id] = (d[id] || 0) + v; };
  if (tx.type === "income") add(tx.toAccount, tx.amount);
  else if (tx.type === "expense") add(tx.fromAccount, -tx.amount);
  else if (tx.type === "transfer") { add(tx.fromAccount, -tx.amount); add(tx.toAccount, tx.amount); }
  return d;
};
const splitAssets = (bal) => {
  let cash = 0, invest = 0;
  ASSET_ACCOUNTS.forEach(a => { const v = +(bal[a.id] || 0); if (INVEST_IDS.includes(a.id)) invest += v; else cash += v; });
  return { cash, invest };
};

function BalanceChart({ data, t, height=170 }) {
  if (!data || data.length < 2) return <div style={{padding:24,textAlign:"center",fontSize:11,color:t.S,fontStyle:"italic"}}>Builds up as you log more months 📊</div>;
  const width = 300;
  const pad = { top: 12, right: 14, bottom: 22, left: 44 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;
  const vals = data.flatMap(d => [d.cash, d.invest]);
  const step = 5000;
  const yMin = Math.max(0, Math.floor(Math.min(...vals) * 0.95 / step) * step);
  let yMax = Math.ceil(Math.max(...vals) * 1.03 / step) * step;
  if (yMax <= yMin) yMax = yMin + step;
  const X = (i) => pad.left + (i / (data.length - 1)) * cw;
  const Y = (v) => pad.top + ch - ((v - yMin) / (yMax - yMin)) * ch;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(p => yMin + (yMax - yMin) * p);
  const line = (key) => data.map((d, i) => `${i === 0 ? "M" : "L"} ${X(i)} ${Y(d[key])}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{width:"100%",height:"auto",display:"block"}}>
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={pad.left} y1={Y(v)} x2={width - pad.right} y2={Y(v)} stroke={t.chartGrid} strokeWidth="0.6"/>
          <text x={pad.left - 5} y={Y(v) + 3} fontSize="8.5" fill={t.S} textAnchor="end" fontFamily="monospace">{fmtAxis(v)}</text>
        </g>
      ))}
      <path d={line("cash")} fill="none" stroke={t.B} strokeWidth="2.2"/>
      <path d={line("invest")} fill="none" stroke={t.P} strokeWidth="2.2"/>
      {data.map((d, i) => <circle key={`c${i}`} cx={X(i)} cy={Y(d.cash)} r="2.8" fill={t.B} stroke={t.BG} strokeWidth="1"/>)}
      {data.map((d, i) => <circle key={`v${i}`} cx={X(i)} cy={Y(d.invest)} r="2.8" fill={t.P} stroke={t.BG} strokeWidth="1"/>)}
      {data.map((d, i) => <text key={`m${i}`} x={X(i)} y={height - 6} fontSize="8.5" fill={t.S} textAnchor="middle" fontFamily="monospace">{monthShort(d.month)}</text>)}
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
  const [poleAnimation, setPoleAnimation] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [categoryPeriod, setCategoryPeriod] = useState("thisMonth");
  const [drilldownCategory, setDrilldownCategory] = useState(null);
  const [projAll, setProjAll] = useState(false);
  const [nicAmt, setNicAmt] = useState("");
  const [showNicInput, setShowNicInput] = useState(false);
  
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
          weddingFund: { ...EMPTY.weddingFund, ...(parsed.weddingFund||{}) },
          transactions: parsed.transactions || [],
          balHistory:   parsed.balHistory   || [],
          theme: migrateTheme(parsed.theme),
          insightsCache: parsed.insightsCache || null,
          chatHistory: parsed.chatHistory || [],
          // Initialize budgetStartMonth to current month on first load (fresh start)
          budgetStartMonth: parsed.budgetStartMonth || thisMonthStr(),
        });
      } else {
        // No prior data — set budgetStartMonth to now
        setData(d => ({...d, budgetStartMonth: thisMonthStr()}));
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

  const { transactions, assets, debts, weddingFund, balHistory, streak, lastLog, theme="deep", insightsCache, chatHistory, budgetStartMonth } = data;
  const t = THEMES[theme] || THEMES.deep;
  // Frosted-glass effect applied to every card that carries the theme shadow
  const GL = { backdropFilter: t.blur, WebkitBackdropFilter: t.blur };

  const totalAssets = Object.values(assets).reduce((s,v)=>s+(+v||0),0);
  const totalDebts  = Object.values(debts).reduce((s,v)=>s+(+v||0),0);
  const totalNW     = totalAssets - totalDebts + (+(weddingFund?.mattContrib)||0);
  const investTotal = (+(assets.investments)||0)+(+(assets.joint_invest)||0)+(+(assets.sharkninja)||0);
  const cashTotal   = totalAssets - investTotal;

  const activeMilestone = MILESTONES.find(m=>totalNW<m.target)||MILESTONES[MILESTONES.length-1];
  const prevTarget      = MILESTONES[MILESTONES.indexOf(activeMilestone)-1]?.target||0;
  const mProgress       = Math.min(Math.max((totalNW-prevTarget)/(activeMilestone.target-prevTarget)*100,0),100);

  const thisMonth = todayStr().slice(0,7);
  const monthTxns = transactions.filter(tx=>tx.date.startsWith(thisMonth));
  const monthIn   = monthTxns.filter(tx=>tx.type==="income").reduce((s,tx)=>s+tx.amount,0);
  const monthOut  = monthTxns.filter(tx=>tx.type==="expense").reduce((s,tx)=>s+tx.amount,0);

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

  // ═══════════════════════════════════════════════════════════════════════
  // DISCRETIONARY BUDGET COMPUTATION
  // ═══════════════════════════════════════════════════════════════════════
  const discretionaryBudget = useMemo(() => {
    const startMonth = budgetStartMonth || thisMonth;

    // Helper: get discretionary spend for a given month key
    const getDiscretionarySpend = (monthKey) => {
      return transactions
        .filter(tx =>
          tx.type === "expense" &&
          tx.date?.startsWith(monthKey) &&
          !FIXED_CATEGORIES.includes(tx.category)
        )
        .reduce((s, tx) => s + tx.amount, 0);
    };

    // Walk forward from budgetStartMonth to thisMonth, computing carry-forward budget
    // Cap at 24 iterations for safety
    let currentBudget = getBaseBudget(startMonth);
    let cursor = startMonth;
    let iterations = 0;
    while (cursor < thisMonth && iterations < 24) {
      const spent = getDiscretionarySpend(cursor);
      const surplus = Math.max(0, currentBudget - spent);
      // Advance to next month
      const [y, m] = cursor.split("-").map(Number);
      const nextDate = new Date(y, m, 1); // m is 1-indexed; next month = m
      cursor = `${nextDate.getFullYear()}-${String(nextDate.getMonth()+1).padStart(2,"0")}`;
      currentBudget = getBaseBudget(cursor) + surplus;
      iterations++;
    }

    const thisMonthSpent = getDiscretionarySpend(thisMonth);
    const remaining = currentBudget - thisMonthSpent;
    const pctUsed = currentBudget > 0 ? (thisMonthSpent / currentBudget) * 100 : 0;
    const isOver = thisMonthSpent > currentBudget;

    return {
      budget: currentBudget,
      spent: thisMonthSpent,
      remaining,
      pctUsed,
      isOver,
    };
  }, [transactions, budgetStartMonth, thisMonth]);

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

  const categoryBreakdown = useMemo(() => {
    const totals = {};
    filteredExpenses.forEach(t => {
      const cat = t.category || "Other";
      totals[cat] = (totals[cat] || 0) + t.amount;
    });
    return Object.entries(totals).map(([label, value]) => ({ label, value })).sort((a,b) => b.value - a.value);
  }, [filteredExpenses]);

  const periodTotalSpend = useMemo(() => filteredExpenses.reduce((s, tx) => s + tx.amount, 0), [filteredExpenses]);

  const lastMonthTotalSpend = useMemo(() => {
    const now = new Date();
    const lastMoDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMoKey = `${lastMoDate.getFullYear()}-${String(lastMoDate.getMonth()+1).padStart(2,"0")}`;
    return transactions.filter(tx => tx.type === "expense" && tx.date?.startsWith(lastMoKey)).reduce((s, tx) => s + tx.amount, 0);
  }, [transactions]);

  const drilldownTxns = useMemo(() => {
    if (!drilldownCategory) return [];
    return filteredExpenses.filter(tx => (tx.category || "Other") === drilldownCategory).sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, drilldownCategory]);

  const now = new Date();
  const periodLabel = categoryPeriod === "thisMonth"
    ? now.toLocaleDateString("en-US", { month: "long" }).toUpperCase()
    : categoryPeriod === "lastMonth"
      ? new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString("en-US", { month: "long" }).toUpperCase()
      : `${now.getFullYear()} YTD`;

  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const pacePct = lastMonthTotalSpend > 0 ? Math.round((periodTotalSpend / lastMonthTotalSpend) * 100) : 0;
  const expectedPct = Math.round((dayOfMonth / daysInMonth) * 100);
  const isOverPace = pacePct > expectedPct + 5;
  const isUnderPace = pacePct < expectedPct - 5;

  const ytdCategories = useMemo(() => {
    const year = new Date().getFullYear().toString();
    const totals = {};
    transactions.filter(t => t.type === "expense" && t.date?.startsWith(year)).forEach(t => {
      const cat = t.category || "Other";
      totals[cat] = (totals[cat] || 0) + t.amount;
    });
    return Object.entries(totals).map(([label, value]) => ({ label, value })).sort((a,b) => b.value - a.value).slice(0, 5);
  }, [transactions]);

  const avgMonthlySavings = useMemo(() => {
    const completedMonths = monthlyStats.slice(0, -1);
    const monthsWithData = completedMonths.filter(m => m.income > 0 || m.expense > 0);
    if (monthsWithData.length === 0) return 0;
    const recent = monthsWithData.slice(-3);
    const avg = recent.reduce((s, m) => s + m.net, 0) / recent.length;
    if (avg > 0) return avg;
    const positive = recent.filter(m => m.net > 0);
    if (positive.length > 0) return positive.reduce((s, m) => s + m.net, 0) / positive.length;
    return 0;
  }, [monthlyStats]);

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

  const monthsToGoal = useMemo(() => {
    if (avgMonthlySavings <= 0) return Infinity;
    return Math.ceil((activeMilestone.target - totalNW) / avgMonthlySavings);
  }, [activeMilestone, totalNW, avgMonthlySavings]);

  const projectedDate = useMemo(() => {
    if (!isFinite(monthsToGoal)) return null;
    const d = new Date();
    d.setMonth(d.getMonth() + monthsToGoal);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [monthsToGoal]);

  // Month-end cash vs investments for the last 6 months.
  // Rebuilt from logged transactions, anchored on each balance snapshot saved in ACCTS
  // (that is where investment gains enter). Current month = live balances.
  const balanceHistory = useMemo(() => {
    const snaps = [...(balHistory || [])].filter(x => x && x.date && x.assets).sort((a, b) => a.date < b.date ? -1 : 1);
    const txs = transactions.filter(tx => tx.date);
    const firstData = [...txs.map(tx => tx.date), ...snaps.map(x => x.date)].sort()[0];
    const applyTx = (bal, tx, sign) => { const d = assetDelta(tx); for (const k in d) bal[k] = (+bal[k] || 0) + sign * d[k]; };
    const balanceAt = (T) => {
      const prior = snaps.filter(x => x.date <= T);
      if (prior.length) {
        const snap = prior[prior.length - 1];
        const bal = { ...snap.assets };
        txs.filter(tx => tx.date > snap.date && tx.date <= T).forEach(tx => applyTx(bal, tx, 1));
        return bal;
      }
      const later = snaps.find(x => x.date > T);
      const bal = { ...(later ? later.assets : assets) };
      const until = later ? later.date : "9999-12-31";
      txs.filter(tx => tx.date > T && tx.date <= until).forEach(tx => applyTx(bal, tx, -1));
      return bal;
    };
    const now = new Date();
    const rows = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (i > 0 && firstData && month < firstData.slice(0, 7)) continue;
      const bal = i === 0 ? assets : balanceAt(`${month}-31`);
      const { cash, invest } = splitAssets(bal);
      rows.push({ month, cash, invest, total: cash + invest });
    }
    return rows;
  }, [transactions, balHistory, assets]);

  // Month-by-month projection: at least 12 months, or through the next milestone (max 60)
  const projectionRows = useMemo(() => {
    if (avgMonthlySavings <= 0) return [];
    const n = Math.min(Math.max(12, isFinite(monthsToGoal) ? monthsToGoal : 12), 60);
    const now = new Date();
    const rows = [];
    let prev = totalNW;
    for (let i = 1; i <= n; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = totalNW + avgMonthlySavings * i;
      const next = MILESTONES.find(m => m.target > value);
      rows.push({
        i,
        label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        short: d.getMonth() === 0 ? `Jan '${String(d.getFullYear()).slice(2)}` : d.toLocaleDateString("en-US", { month: "short" }),
        value,
        hit: MILESTONES.filter(m => prev < m.target && value >= m.target),
        next,
      });
      prev = value;
    }
    return rows;
  }, [avgMonthlySavings, monthsToGoal, totalNW]);

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
    return Object.entries(counts).sort((a,b) => b[1].count - a[1].count).slice(0, 6).map(([word, info]) => ({
      emoji: getEmojiForWord(word), word, category: info.category, defaultAccount: info.lastAccount,
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

  const applyToBalances = (tx, currentAssets, currentDebts, currentWeddingFund) => {
    const newA = {...currentAssets};
    const newD = {...currentDebts};
    const newW = {...currentWeddingFund};
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
      else if (fromAcc?.type === "wedding") {
        newW.total = Math.max(0, (+newW.total||0) - amt);
        newW.mattContrib = Math.max(0, (+newW.mattContrib||0) - amt);
      }
      if (toAcc?.type === "asset") newA[tx.toAccount] = (+newA[tx.toAccount]||0) + amt;
      else if (toAcc?.type === "debt") newD[tx.toAccount] = Math.max(0, (+newD[tx.toAccount]||0) - amt);
      else if (toAcc?.type === "wedding") {
        newW.total = (+newW.total||0) + amt;
        newW.mattContrib = (+newW.mattContrib||0) + amt;
      }
    } else if (tx.type === "nic_contribution") {
      newW.total = (+newW.total||0) + amt;
      newW.nicContrib = (+newW.nicContrib||0) + amt;
    }
    return { assets: newA, debts: newD, weddingFund: newW };
  };

  // Jump straight to LOG as an expense, optionally with a preset already chosen
  const quickLog = (preset) => {
    setForm(f => ({
      ...f, type: "expense", amount: "", note: "", date: todayStr(),
      category: preset ? preset.category : "Food",
      description: preset ? preset.word : "",
      fromAccount: (preset && preset.defaultAccount) || f.fromAccount,
    }));
    setScreen("log");
    try { window.scrollTo({ top: 0 }); } catch {}
  };

  const applyPreset = (preset) => {
    setForm(f => ({...f, description: preset.word, category: preset.category, fromAccount: preset.defaultAccount || f.fromAccount}));
  };

  const handleExpenseSubmit = async () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { showToast("Enter an amount. 🙄","error"); return; }
    if (!form.description.trim()) { logExpense(amt, "Other", ""); return; }
    const matchingPreset = dynamicPresets.find(p => p.word.toLowerCase() === form.description.toLowerCase().trim());
    if (matchingPreset) { logExpense(amt, matchingPreset.category, form.description.trim()); return; }
    setCategorizing(true);
    try {
      const existingCats = [...new Set(transactions.filter(tx => tx.type === "expense" && tx.category).map(tx => tx.category))];
      const response = await fetch('/api/mattbot', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userText: `${form.description} (amount: $${amt}, paid from ${getAccount(form.fromAccount)?.label})`,
          accounts: ALL_ACCOUNTS, categories: CATEGORIES, existingCategories: existingCats,
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
    const { assets: newA, debts: newD, weddingFund: newW } = applyToBalances(tx, assets, debts, weddingFund);
    let newStr = streak, newLL = lastLog;
    const td = todayStr();
    if (lastLog !== td) {
      const yd = new Date(); yd.setDate(yd.getDate()-1);
      newStr = lastLog===yd.toISOString().split("T")[0] ? streak+1 : 1;
      newLL = td;
    }
    patch({ transactions: newTx, assets: newA, debts: newD, weddingFund: newW, streak: newStr, lastLog: newLL });
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
    const { assets: newA, debts: newD, weddingFund: newW } = applyToBalances(tx, assets, debts, weddingFund);
    let newStr = streak, newLL = lastLog;
    const td = todayStr();
    if (lastLog !== td) {
      const yd = new Date(); yd.setDate(yd.getDate()-1);
      newStr = lastLog===yd.toISOString().split("T")[0] ? streak+1 : 1;
      newLL = td;
    }
    patch({ transactions: newTx, assets: newA, debts: newD, weddingFund: newW, streak: newStr, lastLog: newLL });
    setForm(f => ({...f, amount:"", description:"", note:""}));
    if (form.type==="income") {
      showToast(getPraise(),"praise");
      setPoleAnimation({ amount: amt });
      setTimeout(() => setPoleAnimation(null), 3500);
    }
    else if (form.toAccount === "wedding_fund") showToast(`💒 $${fmt(amt)} to Wedding Fund!`,"praise");
    else showToast(`Transferred $${fmt(amt)} 💸`,"praise");
  };

  const handleSubmit = () => {
    if (form.type === "expense") handleExpenseSubmit();
    else handleIncomeTransferSubmit();
  };

  const logNicContribution = () => {
    const amt = parseFloat(nicAmt);
    if (!amt || amt <= 0) { showToast("Enter a valid amount. 🙄","error"); return; }
    const tx = {
      id: Date.now(), type: "nic_contribution", amount: amt,
      category: "Nic's Contribution", description: "Nic's contribution to Wedding Fund",
      note: "", date: todayStr(), fromAccount: "", toAccount: "wedding_fund",
    };
    const newTx = [tx, ...transactions];
    const { weddingFund: newW } = applyToBalances(tx, assets, debts, weddingFund);
    patch({ transactions: newTx, weddingFund: newW });
    setNicAmt("");
    setShowNicInput(false);
    showToast(`💒 Nic contributed $${fmt(amt)}! 💕`,"praise");
  };

  const loadInsights = async (forceRefresh = false) => {
    if (!forceRefresh && insightsCache?.timestamp) {
      const age = Date.now() - insightsCache.timestamp;
      if (age < CACHE_MS) return;
    }
    if (transactions.length < 5) {
      setInsightsError("Need at least 5 transactions for insights. Log a few more! 📝");
      return;
    }
    setInsightsLoading(true);
    setInsightsError("");
    try {
      const response = await fetch('/api/mattbot-insights', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: transactions.slice(0, 100),
          netWorth: totalNW, totalAssets, totalDebts,
          monthlyStats, activeMilestone,
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: transactions.slice(0, 100),
          netWorth: totalNW, totalAssets, totalDebts,
          monthlyStats, activeMilestone,
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
    const { assets: newA, debts: newD, weddingFund: newW } = applyToBalances(reverseTx, assets, debts, weddingFund);
    patch({ transactions: transactions.filter(t=>t.id!==id), assets: newA, debts: newD, weddingFund: newW });
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
        setData({
          ...EMPTY, ...parsed,
          assets: { ...EMPTY.assets, ...(parsed.assets||{}) },
          debts: { ...EMPTY.debts, ...(parsed.debts||{}) },
          weddingFund: { ...EMPTY.weddingFund, ...(parsed.weddingFund||{}) },
          budgetStartMonth: parsed.budgetStartMonth || thisMonthStr(),
          theme: migrateTheme(parsed.theme),
        });
        showToast("Backup restored! ✅","praise");
      } catch { showToast("Invalid backup file ❌","error"); }
    };
    reader.readAsText(file); e.target.value = "";
  };

  const toggleTheme = () => {
    patch({ theme: theme === "deep" ? "day" : "deep" });
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
    let accounts;
    if (filter === "asset") accounts = ASSET_ACCOUNTS;
    else if (filter === "debt") accounts = DEBT_ACCOUNTS;
    else if (filter === "transfer") accounts = [...ASSET_ACCOUNTS, WEDDING_ACCOUNT, ...DEBT_ACCOUNTS];
    else accounts = ALL_ACCOUNTS;
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
  const wf = weddingFund || EMPTY.weddingFund;
  const wfPct = Math.min(((wf.total || 0) / (wf.goal || 60000)) * 100, 100);
  const wfDone = (wf.total || 0) >= (wf.goal || 60000);

  // Discretionary budget helpers
  const db = discretionaryBudget;
  const dbCardColor = db.isOver ? t.R : t.G;
  const dbBarColor = db.isOver
    ? "linear-gradient(90deg,#f87171,#dc2626)"
    : `linear-gradient(90deg,${t.G},#4ade80)`;
  const dbNextMonth = nextMonthName();

  return (
    <div style={{minHeight:"100vh",background:t.BG,color:t.W,fontFamily:"'Courier New',monospace",paddingBottom:"calc(80px + env(safe-area-inset-bottom))",transition:"background 0.3s, color 0.3s"}}>
      {/* LIQUID GLASS BACKDROP — colorful shapes the glass cards blur over */}
      <div aria-hidden="true" style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden",background:t.BG,transition:"background 0.3s"}}>
        {t.blobs.map((b,i)=>(<div key={i} style={{position:"absolute",borderRadius:"50%",...b}}/>))}
      </div>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#334155;border-radius:2px}
        .btn{cursor:pointer;border:none;font-family:'Courier New',monospace;transition:all 0.15s;}
        .btn:hover{filter:brightness(${t.isDark?"1.15":"0.96"});}
        .btn:active{transform:scale(0.96);}
        input,select,textarea{font-family:'Courier New',monospace;background:${t.inputBg};border:1px solid ${t.inputBorder};color:${t.W};border-radius:8px;padding:9px 11px;width:100%;font-size:13px;outline:none;}
        input:focus,select:focus,textarea:focus{border-color:${t.G};box-shadow:0 0 0 2px ${t.G}33;}
        select option{background:${t.selectBg};color:${t.W};}
        input[type=date]{color-scheme:${t.isDark?"dark":"light"};}
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
        @keyframes poleSlide { 0% { top:-150px; transform: translateX(-50%) rotateY(0deg); } 15% { top:5%; transform: translateX(-50%) rotateY(90deg); } 80% { top:60%; transform: translateX(-50%) rotateY(720deg); } 100% { top:60%; transform: translateX(-50%) rotateY(720deg); opacity:1; } }
        @keyframes moneyFall { 0% { transform: translateY(-50px) rotate(0deg); opacity:1; } 100% { transform: translateY(100vh) rotate(720deg); opacity:0; } }
        @keyframes poleGlow { 0%,100% { box-shadow:0 0 15px #fbbf24, 0 0 30px #fbbf24aa; } 50% { box-shadow:0 0 25px #fbbf24, 0 0 50px #fbbf24cc; } }
        @keyframes amountPop { 0% { transform: translateX(-50%) scale(0); opacity:0; } 40% { transform: translateX(-50%) scale(1.4); opacity:1; } 60% { transform: translateX(-50%) scale(1); opacity:1; } 100% { transform: translateX(-50%) scale(1); opacity:1; } }
      `}</style>

      {toast&&(
        <div style={{position:"fixed",top:12,left:"50%",transform:"translateX(-50%)",zIndex:9999,
          background:toast.type==="roast"?(t.isDark?"#1f0808":"#fee2e2"):toast.type==="praise"?(t.isDark?"#061a10":"#d1fae5"):toast.type==="achievement"?(t.isDark?"#0d0d1f":"#fef3c7"):(t.isDark?"#0f172a":"#f1f5f9"),
          border:`1px solid ${toast.type==="roast"?t.R:toast.type==="praise"?t.G:toast.type==="achievement"?t.Y:t.BORDER}`,
          borderRadius:12,padding:"10px 16px",maxWidth:"92vw",fontSize:11,lineHeight:1.5,color:t.W,boxShadow:"0 8px 24px rgba(0,0,0,0.3)",textAlign:"center"}} className="slide">
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div style={{background:t.headerBg,borderBottom:`1px solid ${t.BORDER}`,padding:"10px 14px",position:"sticky",top:0,zIndex:100,backdropFilter:t.blur,WebkitBackdropFilter:t.blur}}>
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
            <button onClick={toggleTheme} className="btn" style={{background:t.CARD,border:`1px solid ${t.BORDER}`,borderRadius:18,padding:"6px 10px",fontSize:14,lineHeight:1, ...GL,boxShadow:t.aeroShadowSubtle}}>
              {theme==="deep" ? "🌌" : "☀️"}
            </button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:500,margin:"0 auto",padding:"12px 12px 0",position:"relative",zIndex:1}}>

        {storageMode==="memory"&&(
          <div style={{background:"rgba(251,146,60,0.08)",border:"1px solid rgba(251,146,60,0.3)",borderRadius:10,padding:"8px 12px",marginBottom:10}}>
            <div style={{fontSize:10,color:"#fb923c",fontWeight:700}}>⚠️ Memory-only mode — use EXPORT to backup.</div>
          </div>
        )}

        {/* ══ MATT-BOT TAB ══ */}
        {screen==="mattbot"&&(
          <div className="slide">
            <div style={{textAlign:"center",padding:"10px 0 16px"}}>
              <img src="/matt-idle.png" alt="Matt-bot" className="mbBounce" style={{width:140,height:"auto",maxHeight:170,objectFit:"contain",display:"block",margin:"0 auto"}} onError={(e)=>{e.target.style.display="none"}}/>
              <div style={{fontSize:14,fontWeight:900,color:t.G,marginTop:6}}>🤖 MATT-BOT</div>
              <div style={{fontSize:10,color:t.S,marginTop:2}}>your mathematician & tutor</div>
            </div>

            {/* ═══ NEW: DISCRETIONARY BUDGET CARD ═══ */}
            <div style={{
              background:`linear-gradient(135deg, ${dbCardColor}22, ${dbCardColor}08)`,
              border:`1px solid ${dbCardColor}40`,
              borderRadius:12,
              padding:"14px",
              marginBottom:12,
              ...GL,boxShadow:t.aeroShadow,
            }}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div className="lbl" style={{margin:0,color:dbCardColor}}>🎯 DISCRETIONARY BUDGET</div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:8}}>
                <div>
                  <div style={{fontSize:26,color:t.W,fontWeight:900,letterSpacing:"-0.02em",lineHeight:1}}>${fmt0(db.spent)}</div>
                  <div style={{fontSize:10,color:t.S,marginTop:3}}>of ${fmt0(db.budget)} budget</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:22,color:dbCardColor,fontWeight:900,lineHeight:1}}>{db.pctUsed.toFixed(0)}%</div>
                  <div style={{fontSize:9,color:t.S}}>used</div>
                </div>
              </div>
              <div style={{height:10,background:t.isDark||t.isDark?"rgba(255,255,255,0.08)":"rgba(15,23,42,0.08)",borderRadius:5,overflow:"hidden",marginBottom:8}}>
                <div style={{
                  height:"100%",
                  width:`${Math.min(db.pctUsed, 100)}%`,
                  background:dbBarColor,
                  borderRadius:5,
                  transition:"width 0.8s ease-out",
                  boxShadow:`0 0 8px ${dbCardColor}66`,
                }}/>
              </div>
              <div style={{fontSize:11,color:dbCardColor,fontWeight:700}}>
                {db.isOver
                  ? `🔴 $${fmt0(Math.abs(db.remaining))} OVER · resets ${dbNextMonth} 1`
                  : `🟢 $${fmt0(db.remaining)} remaining`}
              </div>
            </div>

            {/* CATEGORY BREAKDOWN */}
            <div style={{background:t.CARD,border:`1px solid ${t.BORDER}`,borderRadius:12,padding:"14px",marginBottom:12,...GL,boxShadow:t.aeroShadow}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div className="lbl" style={{margin:0}}>📊 SPENDING BY CATEGORY</div>
                <span style={{fontSize:9,color:t.S,letterSpacing:"0.14em",fontWeight:700}}>{periodLabel}</span>
              </div>

              <div style={{display:"flex",gap:5,marginBottom:12}}>
                {[{ key:"thisMonth", label:"THIS MONTH" },{ key:"lastMonth", label:"LAST MONTH" },{ key:"ytd", label:"YTD" }].map(opt => {
                  const active = categoryPeriod === opt.key;
                  return (
                    <button key={opt.key} onClick={() => setCategoryPeriod(opt.key)} className="btn" style={{flex:1,background: active ? `${t.G}22` : t.cardSubtle,border: `1px solid ${active ? t.G : t.BORDER}`,borderRadius: 8,padding: "7px 4px",color: active ? t.G : t.W,fontSize: 9,fontWeight: 700,letterSpacing: "0.08em"}}>
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {categoryPeriod === "thisMonth" && lastMonthTotalSpend > 0 && (
                <div style={{background: isOverPace ? `${t.R}1a` : isUnderPace ? `${t.G}1a` : t.cardSubtle,border: `1px solid ${isOverPace ? t.R : isUnderPace ? t.G : t.BORDER}40`,borderRadius: 9,padding: "9px 11px",marginBottom: 12,fontSize: 11,lineHeight: 1.5,color: t.W}}>
                  <div>
                    <span style={{fontWeight:700}}>Day {dayOfMonth} of {daysInMonth}</span> · spent <span style={{fontWeight:700}}>${fmt0(periodTotalSpend)}</span> ({pacePct}% of last month's ${fmt0(lastMonthTotalSpend)})
                  </div>
                  <div style={{fontSize:10,color:t.S,marginTop:3}}>
                    {isOverPace && "🔥 Outpacing last month. Ease up."}
                    {isUnderPace && "🧊 Under pace. Keep it tight."}
                    {!isOverPace && !isUnderPace && "📍 Right on pace with last month."}
                  </div>
                </div>
              )}

              {categoryBreakdown.length > 0 ? (
                <CategoryBarChart data={categoryBreakdown} t={t} theme={theme} onBarClick={(label) => setDrilldownCategory(label)}/>
              ) : (
                <div style={{fontSize:11,color:t.S,fontStyle:"italic",textAlign:"center",padding:14}}>No expenses logged for this period 📝</div>
              )}

              {categoryBreakdown.length > 0 && (
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10,paddingTop:10,borderTop:`1px solid ${t.BORDER}`,fontSize:11,fontWeight:700,color:t.W}}>
                  <span>TOTAL</span>
                  <span>${fmt0(periodTotalSpend)}</span>
                </div>
              )}
            </div>

            {/* PROJECTION */}
            <div style={{background:`linear-gradient(135deg, ${t.Y}14, ${t.G}08)`,border:`1px solid ${t.Y}40`,borderRadius:14,padding:"14px",marginBottom:12,...GL,boxShadow:t.aeroShadow}}>
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
                    <ProjectionChart rows={projectionRows} currentNW={totalNW} t={t}/>
                  </div>
                  {/* Month-by-month table */}
                  <div style={{marginTop:12,borderTop:`1px solid ${t.BORDER}`,paddingTop:10}}>
                    <div style={{display:"grid",gridTemplateColumns:"1.1fr 1fr 1.2fr",fontSize:9,color:t.S,fontWeight:700,letterSpacing:"0.1em",padding:"0 6px 6px"}}>
                      <span>MONTH</span><span style={{textAlign:"right"}}>NET WORTH</span><span style={{textAlign:"right"}}>TO NEXT GOAL</span>
                    </div>
                    <div>
                      <div style={{display:"grid",gridTemplateColumns:"1.1fr 1fr 1.2fr",fontSize:11,padding:"7px 6px",borderRadius:8,background:t.cardSubtle,marginBottom:3}}>
                        <span style={{color:t.W,fontWeight:700}}>Today</span>
                        <span style={{textAlign:"right",color:t.W,fontWeight:700}}>${fmt0(totalNW)}</span>
                        <span style={{textAlign:"right",color:t.S}}>${fmt0(Math.max(0, activeMilestone.target - totalNW))} {activeMilestone.icon}</span>
                      </div>
                      {(projAll ? projectionRows : projectionRows.slice(0, 12)).map(r => (
                        <div key={r.i} style={{marginBottom:3,padding:"7px 6px",borderRadius:8,background:r.hit.length ? `${t.Y}22` : "transparent",border:r.hit.length ? `1px solid ${t.Y}66` : "1px solid transparent"}}>
                          <div style={{display:"grid",gridTemplateColumns:"1.1fr 1fr 1.2fr",fontSize:11}}>
                            <span style={{color:t.W}}>{r.label}</span>
                            <span style={{textAlign:"right",color:t.G,fontWeight:700}}>${fmt0(r.value)}</span>
                            <span style={{textAlign:"right",color:t.S}}>{r.next ? `$${fmt0(r.next.target - r.value)} ${r.next.icon}` : "🏁"}</span>
                          </div>
                          {r.hit.map(m => <div key={m.target} style={{fontSize:10,color:t.Y,fontWeight:700,marginTop:3}}>{m.icon} {m.label} reached</div>)}
                        </div>
                      ))}
                    </div>
                    {projectionRows.length > 12 && (
                      <button onClick={() => setProjAll(v => !v)} className="btn" style={{width:"100%",marginTop:6,padding:"8px",borderRadius:10,background:t.cardSubtle,border:`1px solid ${t.BORDER}`,color:t.W,fontSize:10,fontWeight:700,letterSpacing:"0.08em"}}>
                        {projAll ? "SHOW LESS ▴" : `SHOW ALL ${projectionRows.length} MONTHS ▾`}
                      </button>
                    )}
                    <div style={{fontSize:9,color:t.S,marginTop:6,fontStyle:"italic",textAlign:"center"}}>Adds ${fmt0(avgMonthlySavings)} each month · investment growth not included</div>
                  </div>
                </>
              ) : (
                <div style={{fontSize:11,color:t.S,marginTop:4,lineHeight:1.5}}>Need at least one savings month to project. Once any completed month shows you saving more than you spent, your projection will appear here. 📈</div>
              )}
            </div>

            {/* INCOME VS EXPENSES */}
            <div style={{background:t.CARD,border:`1px solid ${t.BORDER}`,borderRadius:12,padding:"14px",marginBottom:12,...GL,boxShadow:t.aeroShadow}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div className="lbl">📈 INCOME VS EXPENSES</div>
                <div style={{display:"flex",gap:10,fontSize:9}}>
                  <span style={{color:t.G}}>● income</span>
                  <span style={{color:t.R}}>● expense</span>
                </div>
              </div>
              <LineChart data={monthlyStats} t={t}/>
              {/* Exact numbers, month by month */}
              <div style={{marginTop:12,borderTop:`1px solid ${t.BORDER}`,paddingTop:10}}>
                <div style={{display:"grid",gridTemplateColumns:"0.8fr 1fr 1fr 1fr",fontSize:9,color:t.S,fontWeight:700,letterSpacing:"0.1em",padding:"0 6px 6px"}}>
                  <span>MONTH</span><span style={{textAlign:"right"}}>IN</span><span style={{textAlign:"right"}}>OUT</span><span style={{textAlign:"right"}}>NET</span>
                </div>
                {monthlyStats.map(m => (
                  <div key={m.month} style={{display:"grid",gridTemplateColumns:"0.8fr 1fr 1fr 1fr",fontSize:11,padding:"6px",borderRadius:8,background:m.month===thisMonth?t.cardSubtle:"transparent"}}>
                    <span style={{color:t.W,fontWeight:m.month===thisMonth?700:400}}>{monthShort(m.month)}{m.month===thisMonth?" •":""}</span>
                    <span style={{textAlign:"right",color:t.G}}>${fmt0(m.income)}</span>
                    <span style={{textAlign:"right",color:t.R}}>${fmt0(m.expense)}</span>
                    <span style={{textAlign:"right",color:m.net>=0?t.G:t.R,fontWeight:700}}>{m.net<0?"−":""}${fmt0(Math.abs(m.net))}</span>
                  </div>
                ))}
                {(() => {
                  const n = monthlyStats.length || 1;
                  const aIn = monthlyStats.reduce((a,m)=>a+m.income,0)/n, aOut = monthlyStats.reduce((a,m)=>a+m.expense,0)/n, aNet = aIn - aOut;
                  return (
                    <div style={{display:"grid",gridTemplateColumns:"0.8fr 1fr 1fr 1fr",fontSize:11,padding:"8px 6px 2px",marginTop:4,borderTop:`1px solid ${t.BORDER}`,fontWeight:700}}>
                      <span style={{color:t.S}}>AVG</span>
                      <span style={{textAlign:"right",color:t.G}}>${fmt0(aIn)}</span>
                      <span style={{textAlign:"right",color:t.R}}>${fmt0(aOut)}</span>
                      <span style={{textAlign:"right",color:aNet>=0?t.G:t.R}}>{aNet<0?"−":""}${fmt0(Math.abs(aNet))}</span>
                    </div>
                  );
                })()}
                <div style={{fontSize:9,color:t.S,marginTop:6,fontStyle:"italic",textAlign:"center"}}>• = current month, still in progress</div>
              </div>
            </div>

            {/* CASH VS INVESTMENTS */}
            <div style={{background:t.CARD,border:`1px solid ${t.BORDER}`,borderRadius:12,padding:"14px",marginBottom:12,...GL,boxShadow:t.aeroShadow}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div className="lbl" style={{margin:0}}>💼 CASH VS INVESTMENTS</div>
                <div style={{display:"flex",gap:10,fontSize:9}}>
                  <span style={{color:t.B}}>● cash</span>
                  <span style={{color:t.P}}>● invest</span>
                </div>
              </div>
              <BalanceChart data={balanceHistory} t={t}/>
              <div style={{marginTop:12,borderTop:`1px solid ${t.BORDER}`,paddingTop:10}}>
                <div style={{display:"grid",gridTemplateColumns:"0.8fr 1fr 1fr 1fr",fontSize:9,color:t.S,fontWeight:700,letterSpacing:"0.1em",padding:"0 6px 6px"}}>
                  <span>MONTH</span><span style={{textAlign:"right"}}>CASH</span><span style={{textAlign:"right"}}>INVEST</span><span style={{textAlign:"right"}}>TOTAL</span>
                </div>
                {balanceHistory.map(r => (
                  <div key={r.month} style={{display:"grid",gridTemplateColumns:"0.8fr 1fr 1fr 1fr",fontSize:11,padding:"6px",borderRadius:8,background:r.month===thisMonth?t.cardSubtle:"transparent"}}>
                    <span style={{color:t.W,fontWeight:r.month===thisMonth?700:400}}>{monthShort(r.month)}{r.month===thisMonth?" •":""}</span>
                    <span style={{textAlign:"right",color:t.B}}>${fmt0(r.cash)}</span>
                    <span style={{textAlign:"right",color:t.P}}>${fmt0(r.invest)}</span>
                    <span style={{textAlign:"right",color:t.W,fontWeight:700}}>${fmt0(r.total)}</span>
                  </div>
                ))}
                {balanceHistory.length >= 2 && (() => {
                  const a = balanceHistory[0], b = balanceHistory[balanceHistory.length - 1];
                  const chg = (from, to) => {
                    const diff = to - from;
                    return `${diff >= 0 ? "+" : "−"}$${fmt0(Math.abs(diff))}`;
                  };
                  return (
                    <div style={{marginTop:6,paddingTop:8,borderTop:`1px solid ${t.BORDER}`,fontSize:11}}>
                      <div style={{fontSize:9,color:t.S,fontWeight:700,letterSpacing:"0.1em",marginBottom:6,padding:"0 6px"}}>CHANGE SINCE {monthShort(a.month).toUpperCase()}</div>
                      <div style={{display:"flex",justifyContent:"space-between",padding:"0 6px",marginBottom:4}}>
                        <span style={{color:t.S}}>💵 Cash</span><span style={{color:b.cash>=a.cash?t.G:t.R,fontWeight:700}}>{chg(a.cash, b.cash)}</span>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",padding:"0 6px"}}>
                        <span style={{color:t.S}}>📈 Investments</span><span style={{color:b.invest>=a.invest?t.G:t.R,fontWeight:700}}>{chg(a.invest, b.invest)}</span>
                      </div>
                    </div>
                  );
                })()}
                <div style={{fontSize:9,color:t.S,marginTop:8,fontStyle:"italic",textAlign:"center",lineHeight:1.5}}>Month-end balances · investment gains appear when you update balances in ACCTS</div>
              </div>
            </div>

            {/* CONVERSATIONAL CHAT */}
            <div style={{background:t.CARD,border:`1px solid ${t.BORDER}`,borderRadius:12,padding:"14px",marginBottom:12,...GL,boxShadow:t.aeroShadow}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div className="lbl">💬 ASK MATT-BOT</div>
                {chatHistory.length > 0 && (<button onClick={clearChat} className="btn" style={{background:"transparent",border:"none",color:t.S,fontSize:9,padding:0}}>clear chat</button>)}
              </div>

              {chatHistory.length > 0 && (
                <div style={{maxHeight:300,overflowY:"auto",marginBottom:8,paddingRight:4}}>
                  {chatHistory.map((m, i) => (
                    <div key={i} style={{background: m.role === "user" ? `${t.B}22` : `${t.G}14`,border: `1px solid ${m.role === "user" ? t.B : t.G}40`,borderRadius: 9, padding: "8px 11px", marginBottom: 6,maxWidth: "92%",marginLeft: m.role === "user" ? "auto" : 0,marginRight: m.role === "user" ? 0 : "auto"}}>
                      <div style={{fontSize:8,color:t.S,marginBottom:3,fontWeight:700}}>{m.role === "user" ? "YOU" : "🤖 MATT-BOT"}</div>
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

              {chatHistory.length === 0 && (
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:10,color:t.S,marginBottom:6}}>💡 Try asking:</div>
                  {["How much did I spend on food this month?","When will I hit $100K?","What's my biggest expense category?","Where can I cut to save more?"].map((q, i) => (
                    <button key={i} onClick={()=>setChatInput(q)} className="btn" style={{width:"100%",textAlign:"left",background:t.cardSubtle,border:`1px solid ${t.BORDER}`,borderRadius:7,padding:"7px 10px",marginBottom:4,color:t.S,fontSize:10,fontFamily:"inherit"}}>
                      → {q}
                    </button>
                  ))}
                </div>
              )}

              <div style={{display:"flex",gap:6}}>
                <input type="text" placeholder="ask matt-bot anything..." value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter") sendChatMessage()}} disabled={chatLoading} style={{flex:1}}/>
                <button onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()} className="btn" style={{background: !chatInput.trim() ? t.CARD : `linear-gradient(135deg,${t.G},${t.B})`,border:"none",borderRadius:8,padding:"0 14px",color: !chatInput.trim() ? t.S : t.btnText,fontSize:13, fontWeight:900, opacity: !chatInput.trim() ? 0.5 : 1}}>
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
                <button key={tt} onClick={()=>setForm(f=>({...f,type:tt,category:tt==="expense"?"Food":tt==="income"?"Salary":f.category,description:""}))} className="btn" style={{background: form.type===tt ? `${color}22` : t.CARD,border:`1px solid ${form.type===tt ? color : t.BORDER}`,borderRadius:9, padding:"9px",color:form.type===tt ? color : t.W,fontSize:11, fontWeight:700}}>{label}</button>
              ))}
            </div>

            <div style={{background:t.isDark?"rgba(0,0,0,0.3)":"rgba(15,23,42,0.04)",border:`1px solid ${form.type==="income"?t.G:form.type==="transfer"?t.B:t.R}40`,borderRadius:12,padding:"14px",marginBottom:8,textAlign:"right"}}>
              <div className="lbl" style={{textAlign:"left",marginBottom:2}}>AMOUNT</div>
              <div style={{fontSize:34,fontWeight:900,color:form.type==="income"?t.G:form.type==="transfer"?t.B:t.R,lineHeight:1}}>${form.amount||"0"}</div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:12}}>
              {["7","8","9","4","5","6","1","2","3",".","0","⌫"].map(k=>{
                const isAction = k==="⌫";
                return(<button key={k} onClick={()=>onKey(k)} className="btn" style={{background: isAction ? (t.isDark?"rgba(248,113,113,0.1)":"rgba(220,38,38,0.06)") : t.cardSubtle,border:`1px solid ${isAction?`${t.R}40`:t.BORDER}`,borderRadius:10, padding:"14px 0",color: isAction?t.R:t.W, fontSize:20, fontWeight:700}}>{k}</button>);
              })}
            </div>

            {form.type==="expense"&&(<>
              <div className="lbl">💡 WHAT WAS THIS FOR?</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:8}}>
                {dynamicPresets.map((p, i) => {
                  const isSelected = form.description.toLowerCase().trim() === p.word.toLowerCase();
                  return (<button key={i} onClick={()=>applyPreset(p)} className="btn" style={{background: isSelected ? `${t.G}22` : t.CARD,border:`1px solid ${isSelected ? t.G : t.BORDER}`,borderRadius:9, padding:"8px 4px",color: isSelected ? t.G : t.W, fontSize:10,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                    <span style={{fontSize:18}}>{p.emoji}</span>
                    <span style={{fontSize:9,fontWeight:700}}>{p.word}</span>
                  </button>);
                })}
              </div>
              <input type="text" placeholder="or type: gas, lunch, amazon, doctor..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} style={{marginBottom:10}}/>
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
              <div style={{marginBottom:8}}><AccountGrid selectedId={form.fromAccount} onSelect={id=>setForm(f=>({...f,fromAccount:id}))} filter="transfer" label="📤 FROM"/></div>
              <div style={{marginBottom:10}}>
                <AccountGrid selectedId={form.toAccount} onSelect={id=>setForm(f=>({...f,toAccount:id}))} filter="transfer" label="📥 TO"/>
                {getAccount(form.toAccount)?.type==="debt" && (<div style={{fontSize:10,color:t.G,marginTop:4,fontStyle:"italic"}}>💪 Paying down {getAccount(form.toAccount)?.label}</div>)}
                {form.toAccount==="wedding_fund" && (<div style={{fontSize:10,color:t.PK,marginTop:4,fontStyle:"italic"}}>💒 Contributing to your wedding fund!</div>)}
              </div>
            </>)}

            <div style={{marginBottom:12}}><div className="lbl">DATE</div><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>

            <button onClick={handleSubmit} disabled={isCategorizing} className="btn" style={{width:"100%",padding:"14px",borderRadius:12,background:isCategorizing?t.CARD:form.type==="income"?`linear-gradient(135deg,${t.G},${t.B})`:form.type==="transfer"?`linear-gradient(135deg,${t.B},${t.P})`:`linear-gradient(135deg,${t.R},#fb923c)`,color:isCategorizing?t.S:t.btnText,fontSize:13,fontWeight:900,letterSpacing:"0.08em",opacity:isCategorizing?0.7:1}}>
              {isCategorizing ? <><span className="spin">🤖</span> MATT-BOT IS THINKING...</> : form.type==="income"?"⚡ LOG INCOME":form.type==="transfer"?"⇄ EXECUTE TRANSFER":"💸 LOG EXPENSE"}
            </button>

            {form.type==="expense" && form.description && !dynamicPresets.find(p => p.word.toLowerCase() === form.description.toLowerCase().trim()) && (
              <div style={{fontSize:10,color:t.S,marginTop:6,textAlign:"center",fontStyle:"italic"}}>🤖 Matt-bot will categorize "{form.description}"</div>
            )}
          </div>
        )}

        {/* ══ DASHBOARD ══ */}
        {screen==="dashboard"&&(
          <div className="slide">
            {/* QUICK LOG — one tap to the LOG screen */}
            <button onClick={() => quickLog(null)} className="btn" style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"16px",borderRadius:16,marginBottom:8,background:`linear-gradient(135deg, ${t.R}, #fb923c)`,color:t.btnText,fontSize:15,fontWeight:900,letterSpacing:"0.08em",...GL,boxShadow:`${t.aeroShadow}, 0 6px 20px ${t.R}55`}}>
              <span style={{fontSize:20}}>💸</span> LOG EXPENSE
            </button>
            <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:12,paddingBottom:2,scrollbarWidth:"none"}}>
              {dynamicPresets.map((p, i) => (
                <button key={i} onClick={() => quickLog(p)} className="btn" style={{flex:"0 0 auto",display:"flex",alignItems:"center",gap:5,padding:"8px 11px",borderRadius:999,background:t.CARD,border:`1px solid ${t.BORDER}`,color:t.W,fontSize:11,fontWeight:700,...GL,boxShadow:t.aeroShadowSubtle}}>
                  <span style={{fontSize:15}}>{p.emoji}</span>{p.word}
                </button>
              ))}
            </div>

            <div style={{background: t.isDark ? "linear-gradient(135deg, rgba(52,211,153,0.18), rgba(96,165,250,0.10) 50%, rgba(167,139,250,0.06))" : t.isDark ? "linear-gradient(135deg, rgba(52,211,153,0.1), rgba(96,165,250,0.06))" : "linear-gradient(135deg, rgba(5,150,105,0.08), rgba(37,99,235,0.05))",border:`1px solid ${t.G}40`,borderRadius:16,padding:"18px",marginBottom:12,...GL,boxShadow:t.aeroShadow}}>
              <div className="lbl">NET WORTH</div>
              <div style={{fontSize:32,fontWeight:900,color:t.W,letterSpacing:"-0.02em"}}>${fmt(totalNW)}</div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:t.S,marginTop:6,marginBottom:14}}>
                <span style={{color:t.G}}>+ ${fmt(totalAssets + (wf.mattContrib||0))} assets</span>
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
              <div style={{height:10,background:t.isDark?"rgba(255,255,255,0.08)":"rgba(15,23,42,0.08)",borderRadius:5,overflow:"hidden",marginBottom:6}}>
                <div style={{height:"100%",width:`${mProgress}%`,background:`linear-gradient(90deg,${t.G},${t.Y})`,borderRadius:5,transition:"width 1s ease-out"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:t.S}}>
                <span>{fmtK(prevTarget)}</span>
                <span style={{fontWeight:700,color:t.W}}>{fmtK(activeMilestone.target-totalNW)} to go</span>
                <span>{fmtK(activeMilestone.target)}</span>
              </div>
            </div>

            {(()=>{
              const renderMilestone = (m, larger=false) => {
                const done=totalNW>=m.target;
                const active=activeMilestone.target===m.target;
                const pct = Math.min((totalNW/m.target)*100, 100);
                const iconSize = larger ? 18 : 16;
                const amtSize = larger ? 11 : 10;
                const statusSize = larger ? 9 : 8;
                const pad = larger ? "7px 10px" : "7px 6px";
                const gap = larger ? 8 : 5;
                return(<div key={m.target} style={{background: done ? (t.isDark?"rgba(52,211,153,0.1)":"rgba(5,150,105,0.08)") : active ? (t.isDark?"rgba(251,191,36,0.1)":"rgba(217,119,6,0.08)") : t.CARD,border: `1px solid ${done?t.G:active?t.Y:t.BORDER}`,borderRadius:10, padding:pad, display:"flex", alignItems:"center", gap, ...GL,boxShadow:t.aeroShadow}}>
                  <span style={{fontSize:iconSize,lineHeight:1,flexShrink:0}}>{m.icon}</span>
                  <div style={{flex:1,textAlign:"right",minWidth:0}}>
                    <div style={{fontSize:amtSize,color:t.W,fontWeight:700,lineHeight:1}}>{fmtK(m.target)}</div>
                    <div style={{fontSize:statusSize,color:done?t.G:active?t.Y:t.S,fontWeight:700,marginTop:2}}>{done?"✅ DONE":active?"◀ CURRENT":`${pct.toFixed(0)}%`}</div>
                  </div>
                </div>);
              };
              const firstRow = MILESTONES.slice(0,3);
              const secondRow = MILESTONES.slice(3);
              return (<>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:6}}>
                  {firstRow.map(m => renderMilestone(m, false))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6,marginBottom:12}}>
                  {secondRow.map(m => renderMilestone(m, true))}
                </div>
              </>);
            })()}

            {(()=>{
              const hysaBal = +(assets.hysa||0);
              const hysaPct = Math.min((hysaBal/40000)*100, 100);
              const hysaDone = hysaBal >= 40000;
              return(<div style={{background: hysaDone ? (t.isDark?"rgba(52,211,153,0.08)":"rgba(5,150,105,0.06)") : (t.isDark?"rgba(56,189,248,0.06)":"rgba(37,99,235,0.05)"),border:`1px solid ${hysaDone?t.G:t.SKY}40`,borderRadius:12,padding:"12px 14px",marginBottom:10,...GL,boxShadow:t.aeroShadow}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div>
                    <div className="lbl" style={{color:hysaDone?t.G:t.SKY}}>🏰 HYSA SUB-GOAL</div>
                    <div style={{fontSize:18,fontWeight:900,color:t.W,marginTop:2}}>${fmt(hysaBal)}</div>
                    <div style={{fontSize:10,color:t.S}}>of <span style={{color:hysaDone?t.G:t.SKY,fontWeight:700}}>$40,000</span> target</div>
                  </div>
                  <div style={{fontSize:22,fontWeight:900,color:hysaDone?t.G:t.SKY}}>{hysaPct.toFixed(1)}%</div>
                </div>
                <div style={{height:8,background:t.isDark?"rgba(255,255,255,0.08)":"rgba(15,23,42,0.08)",borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${hysaPct}%`,background:hysaDone?`linear-gradient(90deg,${t.G},#4ade80)`:"linear-gradient(90deg,#38bdf8,#60a5fa)",borderRadius:4,transition:"width 0.8s"}}/>
                </div>
              </div>);
            })()}

            {/* WEDDING FUND SUB-GOAL */}
            <div style={{background: wfDone ? (t.isDark?"rgba(52,211,153,0.08)":t.isDark?"rgba(52,211,153,0.1)":"rgba(5,150,105,0.06)") : (t.isDark?"rgba(232,121,249,0.08)":t.isDark?"rgba(232,121,249,0.1)":"rgba(192,38,211,0.05)"),border:`1px solid ${wfDone?t.G:t.PK}40`,borderRadius:12,padding:"14px",marginBottom:12,...GL,boxShadow:t.aeroShadow}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div>
                  <div className="lbl" style={{color:wfDone?t.G:t.PK}}>💒 WEDDING FUND</div>
                  <div style={{fontSize:18,fontWeight:900,color:t.W,marginTop:2}}>${fmt(wf.total||0)}</div>
                  <div style={{fontSize:10,color:t.S}}>of <span style={{color:wfDone?t.G:t.PK,fontWeight:700}}>${fmt0(wf.goal||60000)}</span> target</div>
                </div>
                <div style={{fontSize:22,fontWeight:900,color:wfDone?t.G:t.PK}}>{wfPct.toFixed(1)}%</div>
              </div>
              <div style={{height:8,background:t.isDark?"rgba(255,255,255,0.08)":"rgba(15,23,42,0.08)",borderRadius:4,overflow:"hidden",marginBottom:10}}>
                <div style={{height:"100%",width:`${wfPct}%`,background:wfDone?`linear-gradient(90deg,${t.G},#4ade80)`:"linear-gradient(90deg,#e879f9,#f472b6)",borderRadius:4,transition:"width 0.8s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:10,padding:"6px 0",borderTop:`1px solid ${t.BORDER}`,borderBottom:`1px solid ${t.BORDER}`}}>
                <div><span style={{color:t.S}}>You: </span><span style={{color:t.G,fontWeight:700}}>${fmt(wf.mattContrib||0)}</span></div>
                <div><span style={{color:t.S}}>Nic: </span><span style={{color:t.PK,fontWeight:700}}>${fmt(wf.nicContrib||0)}</span></div>
                <div><span style={{color:t.S}}>Remaining: </span><span style={{color:t.W,fontWeight:700}}>${fmt(Math.max(0,(wf.goal||60000)-(wf.total||0)))}</span></div>
              </div>
              {showNicInput ? (
                <div style={{display:"flex",gap:6}}>
                  <input type="number" placeholder="Nic's amount..." value={nicAmt} onChange={e=>setNicAmt(e.target.value)} onKeyDown={e=>{if(e.key==="Enter") logNicContribution()}} style={{flex:1,color:t.PK,borderColor:"#e879f966"}} autoFocus/>
                  <button onClick={logNicContribution} className="btn" style={{background:"linear-gradient(135deg,#e879f9,#f472b6)",borderRadius:8,padding:"0 14px",color:t.btnText,fontSize:12,fontWeight:700}}>ADD</button>
                  <button onClick={()=>{setShowNicInput(false);setNicAmt("")}} className="btn" style={{background:t.CARD,border:`1px solid ${t.BORDER}`,borderRadius:8,padding:"0 12px",color:t.S,fontSize:12}}>✕</button>
                </div>
              ) : (
                <button onClick={()=>setShowNicInput(true)} className="btn" style={{width:"100%",background:t.isDark?"rgba(232,121,249,0.1)":t.isDark?"rgba(232,121,249,0.14)":"rgba(192,38,211,0.08)",border:`1px solid #e879f940`,borderRadius:9,padding:"9px",color:t.PK,fontSize:11,fontWeight:700,letterSpacing:"0.06em"}}>
                  💕 LOG NIC'S CONTRIBUTION
                </button>
              )}
              <div style={{fontSize:9,color:t.S,marginTop:6,fontStyle:"italic",textAlign:"center"}}>Only YOUR contributions count toward net worth</div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
              <div style={{background:t.CARD,border:`1px solid ${t.B}40`,borderRadius:12,padding:"12px",...GL,boxShadow:t.aeroShadow}}>
                <div className="lbl">💵 CASH</div>
                <div style={{fontSize:14,fontWeight:700,color:t.B,marginTop:2}}>${fmt(cashTotal)}</div>
              </div>
              <div style={{background:t.CARD,border:`1px solid ${t.P}40`,borderRadius:12,padding:"12px",...GL,boxShadow:t.aeroShadow}}>
                <div className="lbl">📈 INVESTED</div>
                <div style={{fontSize:14,fontWeight:700,color:t.P,marginTop:2}}>${fmt(investTotal)}</div>
              </div>
              <div style={{background:t.CARD,border:`1px solid ${t.R}40`,borderRadius:12,padding:"12px",...GL,boxShadow:t.aeroShadow}}>
                <div className="lbl">💳 DEBT</div>
                <div style={{fontSize:14,fontWeight:700,color:t.R,marginTop:2}}>${fmt(totalDebts)}</div>
              </div>
            </div>

            {totalDebts>0&&(
              <div style={{background:t.isDark?"rgba(248,113,113,0.07)":"rgba(220,38,38,0.05)",border:`1px solid ${t.R}33`,borderRadius:12,padding:"12px 14px",marginBottom:12}}>
                <div className="lbl" style={{color:t.R}}>🚨 DEBT BREAKDOWN</div>
                {DEBT_ACCOUNTS.map(acc=>{const b=+(debts[acc.id]||0);if(!b) return null;return(<div key={acc.id} style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                  <span style={{fontSize:11,color:t.W}}>{acc.icon} {acc.label}</span>
                  <span style={{fontSize:11,color:t.R,fontWeight:700}}>-${fmt(b)}</span>
                </div>);})}
              </div>
            )}

            <div className="lbl" style={{marginBottom:6}}>📆 {thisMonth}</div>
            <div style={{background:t.CARD,border:`1px solid ${t.BORDER}`,borderRadius:12,padding:"14px",marginBottom:12,...GL,boxShadow:t.aeroShadow}}>
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

            <div style={{background:t.CARD,border:`1px solid ${t.BORDER}`,borderRadius:12,padding:"12px",marginTop:6,...GL,boxShadow:t.aeroShadow}}>
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
            <div style={{background: t.isDark ? "linear-gradient(135deg, rgba(52,211,153,0.18), rgba(96,165,250,0.10) 50%, rgba(167,139,250,0.06))" : t.isDark ? "linear-gradient(135deg, rgba(52,211,153,0.1), rgba(96,165,250,0.06))" : "linear-gradient(135deg, rgba(5,150,105,0.08), rgba(37,99,235,0.05))",border:`1px solid ${t.G}40`,borderRadius:12,padding:"14px",marginBottom:12,...GL,boxShadow:t.aeroShadow}}>
              <div className="lbl">TRUE NET WORTH</div>
              <div style={{fontSize:24,fontWeight:900,color:t.W}}>${fmt(totalNW)}</div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                <span style={{fontSize:10,color:t.G}}>+${fmt(totalAssets + (wf.mattContrib||0))}</span>
                <span style={{fontSize:10,color:t.R}}>−${fmt(totalDebts)}</span>
              </div>
            </div>

            <div style={{fontSize:13,color:t.W,fontWeight:700,marginBottom:6}}>💰 ASSETS <span style={{fontSize:9,color:t.G,marginLeft:6,opacity:0.7}}>●</span></div>
            {ASSET_ACCOUNTS.map(acc=>(
              <div key={acc.id} style={{background:t.CARD,border:`1px solid ${t.BORDER}`,borderRadius:10,padding:"12px 14px",marginBottom:8,...GL,boxShadow:t.aeroShadowSubtle}}>
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

            {/* Wedding Fund read-only card */}
            <div style={{background:t.isDark?"rgba(232,121,249,0.06)":t.isDark?"rgba(232,121,249,0.1)":"rgba(192,38,211,0.04)",border:`1px solid #e879f940`,borderRadius:10,padding:"12px 14px",marginBottom:8,marginTop:6,...GL,boxShadow:t.aeroShadowSubtle}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:22}}>💒</span>
                  <div>
                    <div style={{fontSize:13,color:t.W,fontWeight:700}}>Wedding Fund</div>
                    <div style={{fontSize:10,color:t.S,marginTop:1}}>Joint Total</div>
                  </div>
                </div>
                <div style={{fontSize:18,color:t.PK,fontWeight:900,letterSpacing:"-0.01em"}}>${fmt(wf.total||0)}</div>
              </div>
              <div style={{fontSize:10,color:t.S,paddingTop:6,borderTop:`1px solid ${t.BORDER}`,display:"flex",justifyContent:"space-between"}}>
                <span>You: <span style={{color:t.G,fontWeight:700}}>${fmt(wf.mattContrib||0)}</span></span>
                <span>Nic: <span style={{color:t.PK,fontWeight:700}}>${fmt(wf.nicContrib||0)}</span></span>
              </div>
              <div style={{fontSize:9,color:t.S,fontStyle:"italic",textAlign:"center",marginTop:6}}>Update via LOG transfer or HOME's "Log Nic's Contribution"</div>
            </div>

            <div style={{fontSize:13,color:t.R,fontWeight:700,margin:"16px 0 6px"}}>💳 DEBTS</div>
            {DEBT_ACCOUNTS.map(acc=>(
              <div key={acc.id} style={{background:t.isDark?"rgba(248,113,113,0.04)":t.isDark?"rgba(248,113,113,0.06)":"rgba(220,38,38,0.03)",border:`1px solid ${t.R}26`,borderRadius:10,padding:"12px 14px",marginBottom:8,...GL,boxShadow:t.aeroShadowSubtle}}>
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
              const color = tx.type==="income"?t.G:tx.type==="transfer"?t.B:tx.type==="nic_contribution"?t.PK:t.R;
              const typeLabel = tx.type==="transfer" ? "⇄ Transfer" : tx.type==="nic_contribution" ? "💒 Nic's Contribution" : tx.category;
              return(<div key={tx.id} style={{background:t.CARD,border:`1px solid ${color}26`,borderRadius:9,padding:"9px 11px",marginBottom:5,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:t.W,fontWeight:700}}>{typeLabel}{tx.description && tx.type!=="nic_contribution"?` · ${tx.description}`:tx.note?` · ${tx.note}`:""}</div>
                  <div style={{fontSize:9,color:t.S,marginTop:1}}>{tx.date} · {tx.type==="transfer" ? `${fromAcc?.icon||"?"} → ${toAcc?.icon||"?"}` : tx.type==="income" ? `→ ${toAcc?.icon} ${toAcc?.label}` : tx.type==="nic_contribution" ? `→ 💒 Wedding Fund` : `${fromAcc?.icon} ${fromAcc?.label}`}</div>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <div style={{fontSize:12,fontWeight:700,color}}>{tx.type==="income"?"+":tx.type==="transfer"?"⇄":tx.type==="nic_contribution"?"+":"-"}${fmt(tx.amount)}</div>
                  <button onClick={()=>deleteTx(tx.id)} className="btn" style={{background:t.isDark?"rgba(248,113,113,0.1)":"rgba(220,38,38,0.06)",border:`1px solid ${t.R}40`,borderRadius:5,padding:"3px 7px",color:t.R,fontSize:10}}>✕</button>
                </div>
              </div>);
            })}
          </div>
        )}

      </div>

      {/* DRILL-DOWN BOTTOM SHEET */}
      {drilldownCategory && (
        <>
          <div className="sheetBackdrop" onClick={() => setDrilldownCategory(null)} style={{position:"fixed", inset:0,background:"rgba(0,0,0,0.6)",zIndex:200}}/>
          <div className="sheetUp" style={{position:"fixed", left:0, right:0, bottom:0,background:t.BG,borderTopLeftRadius:20, borderTopRightRadius:20,maxHeight:"80vh", zIndex:201,boxShadow:"0 -10px 40px rgba(0,0,0,0.5)",display:"flex", flexDirection:"column",borderTop:`1px solid ${t.BORDER}`}}>
            <div style={{display:"flex",justifyContent:"center",padding:"10px 0 4px"}}>
              <div style={{width:40,height:4,background:t.BORDER,borderRadius:2}}/>
            </div>
            <div style={{padding:"6px 18px 14px",borderBottom:`1px solid ${t.BORDER}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:9,color:t.S,letterSpacing:"0.14em",fontWeight:700}}>{periodLabel}</div>
                  <div style={{fontSize:17,fontWeight:900,color:t.W,marginTop:2,display:"flex",alignItems:"center",gap:8}}>
                    <span style={{color:colorForCategory(drilldownCategory)}}>●</span>
                    {drilldownCategory}
                  </div>
                </div>
                <button onClick={() => setDrilldownCategory(null)} className="btn" style={{background:t.CARD, border:`1px solid ${t.BORDER}`,width:32, height:32, borderRadius:16,color:t.W, fontSize:14, fontWeight:700,flexShrink:0}}>✕</button>
              </div>
              <div style={{marginTop:8,fontSize:11,color:t.S}}>
                {drilldownTxns.length} transaction{drilldownTxns.length === 1 ? "" : "s"} · <span style={{color:t.W,fontWeight:700}}>${fmt(drilldownTxns.reduce((s,tx)=>s+tx.amount,0))}</span> total
              </div>
            </div>
            <div style={{overflowY:"auto",padding:"6px 18px 24px",flex:1}}>
              {drilldownTxns.length === 0 ? (
                <div style={{textAlign:"center",padding:30,fontSize:11,color:t.S,fontStyle:"italic"}}>No transactions in this category for the selected period.</div>
              ) : drilldownTxns.map((tx, i) => {
                const fromAcc = getAccount(tx.fromAccount);
                return (
                  <div key={tx.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom: i < drilldownTxns.length - 1 ? `1px solid ${t.BORDER}` : "none"}}>
                    <div style={{flex:1,minWidth:0,paddingRight:10}}>
                      <div style={{fontSize:12,color:t.W,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tx.description || tx.note || "(no description)"}</div>
                      <div style={{fontSize:10,color:t.S,marginTop:2}}>{tx.date}{fromAcc ? ` · ${fromAcc.icon} ${fromAcc.label}` : ""}</div>
                    </div>
                    <div style={{fontSize:13,fontWeight:700,color:t.R,flexShrink:0}}>-${fmt(tx.amount)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* 🪩 STRIPPER POLE ANIMATION */}
      {poleAnimation && (
        <div style={{position:"fixed", inset:0, zIndex:9999,background:"radial-gradient(ellipse at center, rgba(251,191,36,0.25), rgba(0,0,0,0.85))",overflow:"hidden", pointerEvents:"none"}}>
          <div style={{position:"absolute", top:0, bottom:0, left:"50%",transform:"translateX(-50%)",width:8,background:"linear-gradient(180deg, #fde68a, #fbbf24 50%, #d97706)",borderRadius:4,animation:"poleGlow 1s ease-in-out infinite"}}/>
          <img src="/matt-back.png" alt="" style={{position:"absolute",left:"50%",width:90,height:"auto",transformOrigin:"center center",transformStyle:"preserve-3d",animation:"poleSlide 3s cubic-bezier(0.34, 1.2, 0.64, 1) forwards",imageRendering:"pixelated",filter:"drop-shadow(0 0 12px rgba(251,191,36,0.8))",zIndex:2}}/>
          {Array.from({length:18}).map((_,i)=>{
            const emoji = ["💵","💸","💰","🤑","💲"][i % 5];
            const left = Math.random() * 100;
            const delay = Math.random() * 1.5;
            const duration = 2 + Math.random() * 1.5;
            const size = 22 + Math.random() * 18;
            return (<div key={i} style={{position:"absolute",left:`${left}%`,top:0,fontSize:size,animation:`moneyFall ${duration}s linear ${delay}s forwards`,zIndex:1}}>{emoji}</div>);
          })}
          <div style={{position:"absolute",bottom:"15%",left:"50%",transform:"translateX(-50%)",animation:"amountPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 1s forwards",opacity:0,textAlign:"center",zIndex:3}}>
            <div style={{fontSize:14, color:"#fbbf24", fontFamily:"'Courier New',monospace",fontWeight:700, letterSpacing:"0.2em", marginBottom:4,textShadow:"0 0 10px rgba(251,191,36,0.8)"}}>+ INCOME +</div>
            <div style={{fontSize:42, color:"#34d399", fontFamily:"'Courier New',monospace",fontWeight:900,textShadow:"0 0 15px rgba(52,211,153,0.9), 0 4px 12px rgba(0,0,0,0.6)"}}>${fmt(poleAnimation.amount)}</div>
            <div style={{fontSize:11, color:"#fde68a", fontFamily:"'Courier New',monospace",marginTop:6, letterSpacing:"0.1em"}}>MATT-BOT APPROVES 🪩</div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0, left:0, right:0,background:t.headerBg,borderTop:`1px solid ${t.BORDER}`,backdropFilter:t.blur,WebkitBackdropFilter:t.blur,paddingBottom:"env(safe-area-inset-bottom)",zIndex:100}}>
        <div style={{maxWidth:500, margin:"0 auto",padding:"8px 10px",display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:4}}>
          {[{id:"dashboard",icon:"📊",label:"HOME"},{id:"log", icon:"➕",label:"LOG"},{id:"mattbot", icon:"🤖",label:"MATT"},{id:"accounts", icon:"🏦",label:"ACCTS"},{id:"history", icon:"📋",label:"HIST"}].map(({id,icon,label})=>(
            <button key={id} onClick={()=>setScreen(id)} className="btn" style={{background:screen===id?(t.isDark?"rgba(52,211,153,0.12)":"rgba(5,150,105,0.1)"):"transparent",border:`1px solid ${screen===id?t.G:"transparent"}`,borderRadius:10, padding:"8px 3px",color:screen===id?t.G:t.S,fontSize:9, letterSpacing:"0.06em", fontWeight:700,display:"flex", flexDirection:"column", alignItems:"center", gap:2,transition:"all 0.15s"}}>
              <div style={{fontSize:18, lineHeight:1}}>{icon}</div>
              <div>{label}</div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
