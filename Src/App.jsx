import { useState, useEffect } from "react";

const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const today = () => new Date().toISOString().split("T")[0];

const INCOME_CATS  = ["Food Sales", "Beverage Sales", "Room Service", "Event", "Other"];
const EXPENSE_CATS = ["Ingredients", "Staff Salary", "Utilities", "Rent", "Maintenance", "Marketing", "Other"];

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "income",    label: "Income",    icon: "↑" },
  { id: "expenses",  label: "Expenses",  icon: "↓" },
  { id: "report",    label: "Report",    icon: "≡" },
];

const BLANK_IN  = { date: today(), category: "Food Sales",  amount: "", note: "" };
const BLANK_EXP = { date: today(), category: "Ingredients", amount: "", note: "" };

export default function App() {
  const [page, setPage]         = useState("dashboard");
  const [income, setIncome]     = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [form, setForm]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [dbPath, setDbPath]     = useState("");

  useEffect(() => {
    async function load() {
      const p = await window.db.getDbPath();
      setDbPath(p || "Default location");
      const inc = await window.db.getIncome();
      const exp = await window.db.getExpenses();
      setIncome(inc);
      setExpenses(exp);
      setLoading(false);
    }
    load();
  }, []);

  const changeDbPath = async () => {
    const newPath = await window.db.chooseDbPath();
    if (newPath) {
      setDbPath(newPath);
      // Reload data from new DB
      const inc = await window.db.getIncome();
      const exp = await window.db.getExpenses();
      setIncome(inc);
      setExpenses(exp);
    }
  };

  const totalIncome   = income.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpenses = expenses.reduce((s, i) => s + Number(i.amount), 0);
  const profit        = totalIncome - totalExpenses;

  const saveEntry = async () => {
    if (!form.data.amount || !form.data.date) return;
    const entry = { ...form.data, amount: Number(form.data.amount) };
    if (form.type === "income") {
      if (form.editing) {
        await window.db.updateIncome({ ...entry, id: form.editing });
        setIncome(p => p.map(i => i.id === form.editing ? { ...entry, id: form.editing } : i));
      } else {
        const result = await window.db.addIncome(entry);
        setIncome(p => [...p, { ...entry, id: result.lastInsertRowid }]);
      }
    } else {
      if (form.editing) {
        await window.db.updateExpense({ ...entry, id: form.editing });
        setExpenses(p => p.map(i => i.id === form.editing ? { ...entry, id: form.editing } : i));
      } else {
        const result = await window.db.addExpense(entry);
        setExpenses(p => [...p, { ...entry, id: result.lastInsertRowid }]);
      }
    }
    setForm(null);
  };

  const del = async (type, id) => {
    if (type === "income") {
      await window.db.deleteIncome(id);
      setIncome(p => p.filter(i => i.id !== id));
    } else {
      await window.db.deleteExpense(id);
      setExpenses(p => p.filter(i => i.id !== id));
    }
  };

  const edit = (type, item) => setForm({ type, data: { ...item }, editing: item.id });

  const groupBy = (arr, key) => arr.reduce((acc, i) => {
    acc[i[key]] = (acc[i[key]] || 0) + Number(i.amount);
    return acc;
  }, {});

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", color: "#aaa", fontSize: 16 }}>
      Loading...
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#f8f6f1" }}>
      <style>{`
      fontFmaily:"'Playfair Display', serif"
      fontFmaily:"Georgia, serif"
      fontFmaily:"'DM Sans', sans-serif"
      fontFmaily:"Segoe UI, sans-serif"
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 8px; cursor: pointer; border: none; background: none; width: 100%; font-family: inherit; font-size: 14px; color: #888; transition: all 0.15s; text-align: left; }
        .nav-item:hover { background: #f0ece4; color: #333; }
        .nav-item.on { background: #1a1a1a; color: #fff; }
        .card { background: #fff; border-radius: 14px; border: 1px solid #ede9e0; padding: 22px 24px; }
        .btn { padding: 9px 18px; border-radius: 8px; border: none; cursor: pointer; font-family: inherit; font-size: 13.5px; font-weight: 500; transition: all 0.15s; }
        .btn-dark { background: #1a1a1a; color: #fff; }
        .btn-dark:hover { background: #333; }
        .btn-ghost { background: transparent; border: 1px solid #e0dbd0; color: #666; }
        .btn-ghost:hover { border-color: #aaa; color: #333; }
        .btn-red { background: transparent; border: 1px solid #fca5a5; color: #dc2626; }
        .btn-red:hover { background: #fef2f2; }
        .inp { width: 100%; padding: 9px 12px; border: 1.5px solid #e5e0d6; border-radius: 8px; font-size: 13.5px; color: #222; outline: none; font-family: inherit; background: #faf8f4; transition: border 0.15s; }
        .inp:focus { border-color: #1a1a1a; background: #fff; }
        .row { display: flex; align-items: center; padding: 13px 0; border-bottom: 1px solid #f0ece4; gap: 12px; }
        .row:last-child { border-bottom: none; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 500; white-space: nowrap; }
        .badge-green { background: #dcfce7; color: #15803d; }
        .badge-red   { background: #fee2e2; color: #b91c1c; }
        .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(4px); }
        .modal { background: #fff; border-radius: 16px; padding: 28px; width: 420px; }
        .lbl { font-size: 11.5px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px; }
        .fg { margin-bottom: 14px; }
        .db-path { font-size: 10px; color: #bbb; word-break: break-all; margin-top: 4px; line-height: 1.4; }
      `}</style>

      {/* Sidebar */}
      <aside style={{ width: 210, background: "#fff", borderRight: "1px solid #ede9e0", display: "flex", flexDirection: "column", padding: "20px 12px" }}>
        <div style={{ padding: "4px 8px 28px" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Savor</div>
          <div style={{ fontSize: 11, color: "#bbb", marginTop: 1, letterSpacing: 1 }}>ACCOUNTS</div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {NAV.map(n => (
            <button key={n.id} className={`nav-item ${page === n.id ? "on" : ""}`} onClick={() => setPage(n.id)}>
              <span style={{ fontSize: 15, width: 18, textAlign: "center" }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        {/* DB section at bottom */}
        <div style={{ marginTop: "auto", padding: "14px 8px 4px", borderTop: "1px solid #f0ece4" }}>
          <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 500, marginBottom: 4 }}>● Database</div>
          <div className="db-path">{dbPath}</div>
          <button
            className="btn btn-ghost"
            style={{ marginTop: 10, width: "100%", fontSize: 12, padding: "7px 10px", textAlign: "center" }}
            onClick={changeDbPath}
          >
            📁 Change Location
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: "auto", padding: "30px 32px" }}>

        {/* DASHBOARD */}
        {page === "dashboard" && (
          <>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#1a1a1a", marginBottom: 6 }}>Dashboard</h1>
            <p style={{ color: "#aaa", fontSize: 13.5, marginBottom: 26 }}>Overview — {fmtDate(today())}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
              {[
                { label: "Total Income",   value: fmt(totalIncome),   color: "#16a34a", bg: "#f0fdf4" },
                { label: "Total Expenses", value: fmt(totalExpenses), color: "#dc2626", bg: "#fef2f2" },
                { label: "Net Profit",     value: fmt(profit),        color: profit >= 0 ? "#16a34a" : "#dc2626", bg: profit >= 0 ? "#f0fdf4" : "#fef2f2" },
              ].map(s => (
                <div key={s.label} className="card" style={{ background: s.bg, borderColor: "transparent" }}>
                  <div style={{ fontSize: 12, color: "#999", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Recent Income</div>
                  <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 12px" }} onClick={() => setPage("income")}>View all</button>
                </div>
                {income.length === 0 && <div style={{ color: "#ccc", fontSize: 13, padding: "10px 0" }}>No entries yet</div>}
                {income.slice(0, 4).map(i => (
                  <div key={i.id} className="row">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{i.category}</div>
                      <div style={{ fontSize: 11.5, color: "#bbb", marginTop: 2 }}>{i.note || "—"}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#16a34a" }}>{fmt(i.amount)}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Recent Expenses</div>
                  <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 12px" }} onClick={() => setPage("expenses")}>View all</button>
                </div>
                {expenses.length === 0 && <div style={{ color: "#ccc", fontSize: 13, padding: "10px 0" }}>No entries yet</div>}
                {expenses.slice(0, 4).map(i => (
                  <div key={i.id} className="row">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{i.category}</div>
                      <div style={{ fontSize: 11.5, color: "#bbb", marginTop: 2 }}>{i.note || "—"}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#dc2626" }}>{fmt(i.amount)}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* INCOME */}
        {page === "income" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#1a1a1a" }}>Income</h1>
                <p style={{ color: "#aaa", fontSize: 13.5, marginTop: 4 }}>{income.length} entries · Total {fmt(totalIncome)}</p>
              </div>
              <button className="btn btn-dark" onClick={() => setForm({ type: "income", data: { ...BLANK_IN }, editing: null })}>+ Add Income</button>
            </div>
            <div className="card">
              {income.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#ccc" }}>No income entries yet</div>}
              {income.map(i => (
                <div key={i.id} className="row">
                  <div style={{ minWidth: 90, fontSize: 12, color: "#bbb" }}>{fmtDate(i.date)}</div>
                  <span className="badge badge-green">{i.category}</span>
                  <div style={{ flex: 1, fontSize: 13.5, color: "#555" }}>{i.note || "—"}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#16a34a", minWidth: 100, textAlign: "right" }}>{fmt(i.amount)}</div>
                  <button className="btn btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => edit("income", i)}>Edit</button>
                  <button className="btn btn-red"   style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => del("income", i.id)}>✕</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* EXPENSES */}
        {page === "expenses" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#1a1a1a" }}>Expenses</h1>
                <p style={{ color: "#aaa", fontSize: 13.5, marginTop: 4 }}>{expenses.length} entries · Total {fmt(totalExpenses)}</p>
              </div>
              <button className="btn btn-dark" onClick={() => setForm({ type: "expenses", data: { ...BLANK_EXP }, editing: null })}>+ Add Expense</button>
            </div>
            <div className="card">
              {expenses.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#ccc" }}>No expense entries yet</div>}
              {expenses.map(i => (
                <div key={i.id} className="row">
                  <div style={{ minWidth: 90, fontSize: 12, color: "#bbb" }}>{fmtDate(i.date)}</div>
                  <span className="badge badge-red">{i.category}</span>
                  <div style={{ flex: 1, fontSize: 13.5, color: "#555" }}>{i.note || "—"}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#dc2626", minWidth: 100, textAlign: "right" }}>{fmt(i.amount)}</div>
                  <button className="btn btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => edit("expenses", i)}>Edit</button>
                  <button className="btn btn-red"   style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => del("expenses", i.id)}>✕</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* REPORT */}
        {page === "report" && (
          <>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#1a1a1a", marginBottom: 6 }}>Report</h1>
            <p style={{ color: "#aaa", fontSize: 13.5, marginBottom: 26 }}>Profit & Loss summary</p>
            <div className="card" style={{ marginBottom: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <tbody>
                  <tr style={{ borderBottom: "2px solid #f0ece4" }}>
                    <td style={{ padding: "10px 0", fontWeight: 600, fontSize: 15 }}>Total Income</td>
                    <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, color: "#16a34a", fontSize: 15 }}>{fmt(totalIncome)}</td>
                  </tr>
                  <tr style={{ borderBottom: "2px solid #f0ece4" }}>
                    <td style={{ padding: "10px 0", fontWeight: 600, fontSize: 15 }}>Total Expenses</td>
                    <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, color: "#dc2626", fontSize: 15 }}>{fmt(totalExpenses)}</td>
                  </tr>
                  <tr style={{ background: "#f8f6f1" }}>
                    <td style={{ padding: "14px 10px", fontWeight: 700, fontSize: 16 }}>Net Profit</td>
                    <td style={{ padding: "14px 10px", textAlign: "right", fontWeight: 700, fontSize: 22, color: profit >= 0 ? "#16a34a" : "#dc2626", fontFamily: "'Playfair Display', serif" }}>{fmt(profit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div className="card">
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Income by Category</div>
                {Object.entries(groupBy(income, "category")).map(([cat, amt]) => (
                  <div key={cat} className="row">
                    <span className="badge badge-green">{cat}</span>
                    <div style={{ flex: 1 }} />
                    <div style={{ fontWeight: 600, color: "#16a34a", fontSize: 13.5 }}>{fmt(amt)}</div>
                    <div style={{ fontSize: 12, color: "#bbb", minWidth: 36, textAlign: "right" }}>{totalIncome ? Math.round(amt / totalIncome * 100) : 0}%</div>
                  </div>
                ))}
                {income.length === 0 && <div style={{ color: "#ccc", fontSize: 13 }}>No data</div>}
              </div>
              <div className="card">
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Expenses by Category</div>
                {Object.entries(groupBy(expenses, "category")).map(([cat, amt]) => (
                  <div key={cat} className="row">
                    <span className="badge badge-red">{cat}</span>
                    <div style={{ flex: 1 }} />
                    <div style={{ fontWeight: 600, color: "#dc2626", fontSize: 13.5 }}>{fmt(amt)}</div>
                    <div style={{ fontSize: 12, color: "#bbb", minWidth: 36, textAlign: "right" }}>{totalExpenses ? Math.round(amt / totalExpenses * 100) : 0}%</div>
                  </div>
                ))}
                {expenses.length === 0 && <div style={{ color: "#ccc", fontSize: 13 }}>No data</div>}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modal */}
      {form && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setForm(null)}>
          <div className="modal">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700 }}>
                {form.editing ? "Edit" : "Add"} {form.type === "income" ? "Income" : "Expense"}
              </h2>
              <button onClick={() => setForm(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#bbb" }}>✕</button>
            </div>
            <div className="fg">
              <label className="lbl">Date</label>
              <input className="inp" type="date" value={form.data.date} onChange={e => setForm(f => ({ ...f, data: { ...f.data, date: e.target.value } }))} />
            </div>
            <div className="fg">
              <label className="lbl">Category</label>
              <select className="inp" value={form.data.category} onChange={e => setForm(f => ({ ...f, data: { ...f.data, category: e.target.value } }))}>
                {(form.type === "income" ? INCOME_CATS : EXPENSE_CATS).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="lbl">Amount (₹)</label>
              <input className="inp" type="number" min="0" placeholder="0.00" value={form.data.amount} onChange={e => setForm(f => ({ ...f, data: { ...f.data, amount: e.target.value } }))} />
            </div>
            <div className="fg">
              <label className="lbl">Note (optional)</label>
              <input className="inp" placeholder="Brief description…" value={form.data.note} onChange={e => setForm(f => ({ ...f, data: { ...f.data, note: e.target.value } }))} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn btn-dark" onClick={saveEntry}>{form.editing ? "Save" : "Add"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
