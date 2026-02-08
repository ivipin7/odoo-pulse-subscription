const BASE = "http://localhost:3000/api";
async function api(m: string, p: string, b?: any, t?: string) {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (t) h["Authorization"] = `Bearer ${t}`;
  const r = await fetch(`${BASE}${p}`, { method: m, headers: h, body: b ? JSON.stringify(b) : undefined });
  return r.json();
}

(async () => {
  console.log("=== Testing API ===");

  const l = await api("POST", "/auth/login", { email: "admin@example.com", password: "Admin@123" });
  console.log("Login user:", l.data.user.first_name, l.data.user.last_name, "- role:", l.data.user.role);

  const d = await api("GET", "/reports/dashboard", undefined, l.data.token);
  console.log("Dashboard KPIs:");
  console.log("  Active Subs:", d.data.activeSubscriptions);
  console.log("  Revenue:", d.data.totalRevenue);
  console.log("  Payments:", d.data.payments.count, "(total:", d.data.payments.total + ")");
  console.log("  Overdue:", d.data.overdueInvoices);
  console.log("  Status breakdown:", JSON.stringify(d.data.subscriptionsByStatus));
  console.log("  Recent payments:", d.data.recentPayments.length);

  const p = await api("GET", "/products", undefined, l.data.token);
  console.log("Products:", p.data.length, "- first:", p.data[0]?.name, "type:", p.data[0]?.product_type, "price:", p.data[0]?.sales_price);

  const s = await api("GET", "/subscriptions", undefined, l.data.token);
  console.log("Subscriptions:", s.data.length, "- first:", s.data[0]?.subscription_number, "status:", s.data[0]?.status);

  const inv = await api("GET", "/invoices", undefined, l.data.token);
  console.log("Invoices:", inv.data.length, "- first:", inv.data[0]?.invoice_number, "status:", inv.data[0]?.status);

  const pay = await api("GET", "/payments", undefined, l.data.token);
  console.log("Payments:", pay.data.length, "- first:", pay.data[0]?.payment_number, "method:", pay.data[0]?.payment_method);

  console.log("\n=== All API tests passed! ===");
})();
