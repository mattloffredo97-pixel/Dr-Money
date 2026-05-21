// ============================================================
// CategoryBreakdown.jsx
// Drop this component into App.jsx (or import it) and use it
// in place of the existing "last 3 months" category bar chart
// in the Matt tab.
//
// Usage:  <CategoryBreakdown transactions={transactions} />
// ============================================================

import { useState, useMemo } from 'react';

// Hash a category name into a consistent HSL color
// (matches the existing auto-color pattern in your app)
function colorForCategory(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

function formatMoney(n) {
  return `$${Math.round(n).toLocaleString()}`;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function CategoryBreakdown({ transactions }) {
  const [period, setPeriod] = useState('thisMonth'); // 'thisMonth' | 'lastMonth' | 'ytd'
  const [selectedCategory, setSelectedCategory] = useState(null);

  // ------------------------------------------------------------
  // Date range math
  // ------------------------------------------------------------
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // ------------------------------------------------------------
  // Filter expenses for the active period
  // (Only expense-type transactions — income & transfers excluded)
  // ------------------------------------------------------------
  const expensesInPeriod = useMemo(() => {
    return transactions.filter((tx) => {
      if (tx.type !== 'expense') return false;
      const d = new Date(tx.date);
      if (period === 'thisMonth') return d >= startOfThisMonth;
      if (period === 'lastMonth') return d >= startOfLastMonth && d <= endOfLastMonth;
      if (period === 'ytd') return d >= startOfYear;
      return false;
    });
  }, [transactions, period]);

  // ------------------------------------------------------------
  // Group by category, sort descending by total
  // ------------------------------------------------------------
  const categoryTotals = useMemo(() => {
    const totals = {};
    expensesInPeriod.forEach((tx) => {
      const cat = tx.category || 'Uncategorized';
      totals[cat] = (totals[cat] || 0) + Number(tx.amount);
    });
    return Object.entries(totals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [expensesInPeriod]);

  const maxTotal = categoryTotals[0]?.total || 1;
  const grandTotal = categoryTotals.reduce((sum, c) => sum + c.total, 0);

  // ------------------------------------------------------------
  // Pace indicator math (only for "This Month")
  // ------------------------------------------------------------
  const lastMonthTotal = useMemo(() => {
    return transactions
      .filter((tx) => {
        if (tx.type !== 'expense') return false;
        const d = new Date(tx.date);
        return d >= startOfLastMonth && d <= endOfLastMonth;
      })
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
  }, [transactions]);

  const pacePercent = lastMonthTotal > 0 ? Math.round((grandTotal / lastMonthTotal) * 100) : 0;
  const expectedPercent = Math.round((dayOfMonth / daysInMonth) * 100);
  const isOverPace = pacePercent > expectedPercent + 5; // 5% tolerance band
  const isUnderPace = pacePercent < expectedPercent - 5;

  // ------------------------------------------------------------
  // Drill-down transactions
  // ------------------------------------------------------------
  const drilldownTxs = useMemo(() => {
    if (!selectedCategory) return [];
    return expensesInPeriod
      .filter((tx) => (tx.category || 'Uncategorized') === selectedCategory)
      .sort((a, b) => Number(b.amount) - Number(a.amount));
  }, [expensesInPeriod, selectedCategory]);

  const drilldownTotal = drilldownTxs.reduce((s, t) => s + Number(t.amount), 0);

  // ------------------------------------------------------------
  // Period label for header
  // ------------------------------------------------------------
  const periodLabel = {
    thisMonth: now.toLocaleDateString('en-US', { month: 'long' }),
    lastMonth: startOfLastMonth.toLocaleDateString('en-US', { month: 'long' }),
    ytd: `${now.getFullYear()} YTD`,
  }[period];

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{ marginTop: 24 }}>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>📊 Spending by Category</h3>
        <span style={{ fontSize: 13, opacity: 0.7 }}>{periodLabel}</span>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'thisMonth', label: 'This Month' },
          { key: 'lastMonth', label: 'Last Month' },
          { key: 'ytd', label: 'YTD' },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => setPeriod(opt.key)}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 20,
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              background: period === opt.key ? '#14b8a6' : 'rgba(127,127,127,0.15)',
              color: period === opt.key ? '#fff' : 'inherit',
              transition: 'background 0.15s',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Pace indicator (only on This Month) */}
      {period === 'thisMonth' && lastMonthTotal > 0 && (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: isOverPace
              ? 'rgba(239,68,68,0.12)'
              : isUnderPace
              ? 'rgba(16,185,129,0.12)'
              : 'rgba(127,127,127,0.10)',
            border: `1px solid ${
              isOverPace ? 'rgba(239,68,68,0.3)' : isUnderPace ? 'rgba(16,185,129,0.3)' : 'rgba(127,127,127,0.2)'
            }`,
            marginBottom: 16,
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          <strong>Day {dayOfMonth} of {daysInMonth}</strong> · You've spent{' '}
          <strong>{formatMoney(grandTotal)}</strong> ({pacePercent}% of last month's {formatMoney(lastMonthTotal)})
          <div style={{ marginTop: 4, opacity: 0.8 }}>
            {isOverPace && `🔥 You're outpacing last month. Ease up.`}
            {isUnderPace && `🧊 You're under pace. Keep it tight.`}
            {!isOverPace && !isUnderPace && `📍 Right on pace with last month.`}
          </div>
        </div>
      )}

      {/* Bar chart */}
      {categoryTotals.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', opacity: 0.6, fontSize: 14 }}>
          No expenses logged for this period yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {categoryTotals.map((cat) => {
            const widthPercent = (cat.total / maxTotal) * 100;
            const color = colorForCategory(cat.name);
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                style={{
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{cat.name}</span>
                  <span style={{ opacity: 0.8 }}>{formatMoney(cat.total)}</span>
                </div>
                <div
                  style={{
                    height: 10,
                    background: 'rgba(127,127,127,0.15)',
                    borderRadius: 6,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${widthPercent}%`,
                      height: '100%',
                      background: color,
                      borderRadius: 6,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Grand total footer */}
      {categoryTotals.length > 0 && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid rgba(127,127,127,0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <span>Total</span>
          <span>{formatMoney(grandTotal)}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* Bottom sheet modal (drill-down)                                */}
      {/* ============================================================ */}
      {selectedCategory && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setSelectedCategory(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 50,
              animation: 'fadeIn 0.2s ease',
            }}
          />

          {/* Sheet */}
          <div
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              background: 'var(--bg, #fff)',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '80vh',
              zIndex: 51,
              boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
              animation: 'slideUp 0.25s ease',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 40, height: 4, background: 'rgba(127,127,127,0.3)', borderRadius: 2 }} />
            </div>

            {/* Header */}
            <div style={{ padding: '8px 20px 16px', borderBottom: '1px solid rgba(127,127,127,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {periodLabel}
                  </div>
                  <h3 style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 700 }}>{selectedCategory}</h3>
                </div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  style={{
                    background: 'rgba(127,127,127,0.15)',
                    border: 'none',
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    fontSize: 16,
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
                {drilldownTxs.length} transaction{drilldownTxs.length === 1 ? '' : 's'} ·{' '}
                <strong>{formatMoney(drilldownTotal)}</strong> total
              </div>
            </div>

            {/* Transaction list (scrollable) */}
            <div style={{ overflow: 'auto', padding: '8px 20px 24px', flex: 1 }}>
              {drilldownTxs.map((tx, i) => (
                <div
                  key={tx.id || i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: i < drilldownTxs.length - 1 ? '1px solid rgba(127,127,127,0.1)' : 'none',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {tx.description || '(no description)'}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
                      {formatDate(tx.date)}
                      {tx.account ? ` · ${tx.account}` : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginLeft: 12 }}>
                    {formatMoney(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inline keyframes */}
          <style>{`
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
          `}</style>
        </>
      )}
    </div>
  );
}
