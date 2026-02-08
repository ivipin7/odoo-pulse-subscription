const BASE = "http://localhost:3000/api";
async function api(m: string, p: string, b?: any, t?: string) {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (t) h["Authorization"] = `Bearer ${t}`;
  const r = await fetch(`${BASE}${p}`, { method: m, headers: h, body: b ? JSON.stringify(b) : undefined });
  return r.json();
}

(async () => {
  const l = await api("POST", "/auth/login", { email: "admin@example.com", password: "Admin@123" });
  const t = l.data.token;
  const inv = await api("GET", "/invoices?limit=10", undefined, t);
  const invoices = inv.data || [];
  console.log("Found", invoices.length, "invoices");
  const methods = ["CREDIT_CARD", "BANK_TRANSFER", "CASH"];
  for (let i = 0; i < invoices.length; i++) {
    const iv = invoices[i];
    console.log(`  Invoice ${iv.invoice_number}: status=${iv.status}, total=${iv.total}`);
    if (iv.status === "CONFIRMED") {
      const r = await api("POST", "/payments", {
        invoice_id: iv.id,
        amount: Number(iv.total),
        payment_method: methods[i % 3],
        notes: `Payment for ${iv.invoice_number}`,
      }, t);
      if (r.data) console.log(`    -> Paid: ${iv.invoice_number} - Rs ${iv.total}`);
      else console.log(`    -> FAILED:`, r.error?.message);
    }
  }
})();
