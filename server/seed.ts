// Seed script: inserts sample data via HTTP API calls
const BASE = "http://localhost:3000/api";

async function api(method: string, path: string, body?: any, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`  FAILED ${method} ${path}:`, data?.error?.message || res.statusText);
    return null;
  }
  return data;
}

async function main() {
  console.log("=== Seeding Subscription Management System ===\n");

  // 1. Login as admin
  console.log("1. Logging in as admin...");
  const loginRes = await api("POST", "/auth/login", { email: "admin@example.com", password: "Admin@123" });
  if (!loginRes) { console.error("Cannot login as admin. Aborting."); return; }
  const adminToken = loginRes.data.token;
  console.log("   Admin logged in.\n");

  // 2. Create customer users
  console.log("2. Creating customer users...");
  const customers = [
    { email: "alice@example.com", password: "Alice@123", first_name: "Alice", last_name: "Johnson", role: "PORTAL" },
    { email: "bob@example.com", password: "Bob@1234", first_name: "Bob", last_name: "Smith", role: "PORTAL" },
    { email: "charlie@example.com", password: "Charlie@1", first_name: "Charlie", last_name: "Brown", role: "PORTAL" },
  ];
  const customerIds: string[] = [];
  for (const c of customers) {
    const res = await api("POST", "/users", c, adminToken);
    if (res) {
      customerIds.push(res.data.id);
      console.log(`   Created: ${c.first_name} ${c.last_name} (${c.email})`);
    }
  }

  // 3. Create taxes
  console.log("\n3. Creating taxes...");
  const taxes = [
    { name: "GST 18%", tax_computation: "PERCENTAGE", amount: 18 },
    { name: "GST 12%", tax_computation: "PERCENTAGE", amount: 12 },
    { name: "GST 5%", tax_computation: "PERCENTAGE", amount: 5 },
    { name: "Service Charge", tax_computation: "FIXED", amount: 50 },
  ];
  const taxIds: string[] = [];
  for (const t of taxes) {
    const res = await api("POST", "/taxes", t, adminToken);
    if (res) {
      taxIds.push(res.data.id);
      console.log(`   Created: ${t.name}`);
    }
  }

  // 4. Create discounts
  console.log("\n4. Creating discounts...");
  const discounts = [
    { name: "Early Bird 10%", discount_type: "PERCENTAGE", value: 10, min_purchase: 500 },
    { name: "Bulk Discount 15%", discount_type: "PERCENTAGE", value: 15, min_quantity: 5 },
    { name: "Flat ₹100 Off", discount_type: "FIXED", value: 100, min_purchase: 1000 },
    { name: "Loyalty 20%", discount_type: "PERCENTAGE", value: 20, min_purchase: 2000, start_date: "2025-01-01", end_date: "2025-12-31" },
  ];
  const discountIds: string[] = [];
  for (const d of discounts) {
    const res = await api("POST", "/discounts", d, adminToken);
    if (res) {
      discountIds.push(res.data.id);
      console.log(`   Created: ${d.name}`);
    }
  }

  // 5. Create products
  console.log("\n5. Creating products...");
  const products = [
    { name: "Cloud Hosting Basic", product_type: "SERVICE", sales_price: 999, cost_price: 400, description: "Basic cloud hosting plan", tax_id: taxIds[0] || undefined },
    { name: "Cloud Hosting Pro", product_type: "SERVICE", sales_price: 2499, cost_price: 1000, description: "Professional cloud hosting with SSD", tax_id: taxIds[0] || undefined },
    { name: "Cloud Hosting Enterprise", product_type: "SERVICE", sales_price: 4999, cost_price: 2000, description: "Enterprise-grade cloud hosting", tax_id: taxIds[0] || undefined },
    { name: "SSL Certificate", product_type: "SERVICE", sales_price: 499, cost_price: 200, description: "SSL/TLS certificate for websites" },
    { name: "Domain Registration", product_type: "SERVICE", sales_price: 799, cost_price: 300, description: "Domain name registration (.com, .in)" },
    { name: "Email Suite", product_type: "SERVICE", sales_price: 199, cost_price: 80, description: "Professional email hosting per user", tax_id: taxIds[1] || undefined },
    { name: "Backup Storage 100GB", product_type: "CONSUMABLE", sales_price: 399, cost_price: 150, description: "Cloud backup storage 100GB" },
    { name: "CDN Bandwidth 1TB", product_type: "CONSUMABLE", sales_price: 599, cost_price: 250, description: "CDN bandwidth allocation 1TB" },
  ];
  const productIds: string[] = [];
  for (const p of products) {
    const res = await api("POST", "/products", p, adminToken);
    if (res) {
      productIds.push(res.data.id);
      console.log(`   Created: ${p.name} (₹${p.sales_price})`);
    }
  }

  // 6. Create recurring plans
  console.log("\n6. Creating recurring plans...");
  const plans = [
    { name: "Weekly Plan", billing_period: "WEEKLY", billing_interval: 1, description: "Billed every week" },
    { name: "Yearly Plan", billing_period: "YEARLY", billing_interval: 1, description: "Billed annually with best value" },
    { name: "Daily Plan", billing_period: "DAILY", billing_interval: 1, description: "Billed daily for pay-as-you-go" },
  ];
  const planIds: string[] = [];
  for (const p of plans) {
    const res = await api("POST", "/recurring-plans", p, adminToken);
    if (res) {
      planIds.push(res.data.id);
      console.log(`   Created: ${p.name}`);
    }
  }

  // Also fetch existing monthly plan
  const plansRes = await api("GET", "/recurring-plans", undefined, adminToken);
  const allPlans = plansRes?.data || [];
  const monthlyPlan = allPlans.find((p: any) => p.billing_period === "MONTHLY");
  if (monthlyPlan) planIds.unshift(monthlyPlan.id);
  console.log(`   Total plans: ${allPlans.length}`);

  // 7. Create subscriptions
  console.log("\n7. Creating subscriptions...");
  if (customerIds.length >= 3 && productIds.length >= 4 && planIds.length >= 1) {
    const subscriptions = [
      {
        customer_id: customerIds[0],
        recurring_plan_id: planIds[0], // Monthly
        payment_terms: "NET_30",
        start_date: "2025-01-15",
        notes: "Alice's cloud hosting subscription",
        lines: [
          { product_id: productIds[0], quantity: 1, unit_price: 999, tax_id: taxIds[0] || undefined },
          { product_id: productIds[3], quantity: 1, unit_price: 499 },
          { product_id: productIds[5], quantity: 5, unit_price: 199, tax_id: taxIds[1] || undefined },
        ],
      },
      {
        customer_id: customerIds[1],
        recurring_plan_id: planIds[0], // Monthly
        payment_terms: "NET_15",
        start_date: "2025-02-01",
        notes: "Bob's pro hosting package",
        lines: [
          { product_id: productIds[1], quantity: 1, unit_price: 2499, tax_id: taxIds[0] || undefined, discount_id: discountIds[0] || undefined },
          { product_id: productIds[6], quantity: 2, unit_price: 399 },
        ],
      },
      {
        customer_id: customerIds[2],
        recurring_plan_id: planIds.length > 1 ? planIds[planIds.length - 1] : planIds[0], // Yearly or first
        payment_terms: "IMMEDIATE",
        start_date: "2025-03-01",
        notes: "Charlie's enterprise annual deal",
        lines: [
          { product_id: productIds[2], quantity: 1, unit_price: 4999, tax_id: taxIds[0] || undefined, discount_id: discountIds[2] || undefined },
          { product_id: productIds[3], quantity: 1, unit_price: 499 },
          { product_id: productIds[7], quantity: 3, unit_price: 599, tax_id: taxIds[2] || undefined },
        ],
      },
    ];

    const subIds: string[] = [];
    for (let i = 0; i < subscriptions.length; i++) {
      const res = await api("POST", "/subscriptions", subscriptions[i], adminToken);
      if (res) {
        subIds.push(res.data.id);
        console.log(`   Created subscription for customer ${i + 1}: ${res.data.subscription_number}`);

        // Advance status: DRAFT → QUOTATION → CONFIRMED → ACTIVE
        const statuses = ["QUOTATION", "CONFIRMED", "ACTIVE"];
        for (const st of statuses) {
          await api("PATCH", `/subscriptions/${res.data.id}/status`, { status: st }, adminToken);
        }
        console.log(`   → Advanced to ACTIVE`);
      }
    }

    // 8. Generate invoices from active subscriptions
    console.log("\n8. Generating invoices...");
    const invoiceIds: string[] = [];
    for (const sid of subIds) {
      const invRes = await api("POST", "/invoices/generate", { subscription_id: sid }, adminToken);
      if (invRes) {
        invoiceIds.push(invRes.data.id);
        console.log(`   Generated invoice: ${invRes.data.invoice_number} (Total: ₹${invRes.data.total})`);

        // Confirm invoice
        await api("PATCH", `/invoices/${invRes.data.id}/status`, { status: "CONFIRMED" }, adminToken);
        console.log(`   → Confirmed`);
      }
    }

    // 9. Record payments
    console.log("\n9. Recording payments...");
    for (let i = 0; i < invoiceIds.length; i++) {
      // Fetch invoice to get total
      const invDetail = await api("GET", `/invoices/${invoiceIds[i]}`, undefined, adminToken);
      if (invDetail) {
        const total = Number(invDetail.data.total);
        const methods: string[] = ["CREDIT_CARD", "BANK_TRANSFER", "CASH"];
        const payRes = await api("POST", "/payments", {
          invoice_id: invoiceIds[i],
          amount: total,
          payment_method: methods[i % methods.length],
          notes: `Payment for invoice #${i + 1}`,
        }, adminToken);
        if (payRes) {
          console.log(`   Payment recorded: ${payRes.data.payment_number} - ₹${total} via ${methods[i % methods.length]}`);
        }
      }
    }

    // 10. Create a DRAFT subscription (for demo purposes)
    console.log("\n10. Creating a draft subscription...");
    const draftRes = await api("POST", "/subscriptions", {
      customer_id: customerIds[0],
      recurring_plan_id: planIds[0],
      payment_terms: "NET_60",
      notes: "Draft subscription for review",
      lines: [
        { product_id: productIds[4], quantity: 2, unit_price: 799 },
        { product_id: productIds[5], quantity: 10, unit_price: 199, discount_id: discountIds[1] || undefined },
      ],
    }, adminToken);
    if (draftRes) {
      console.log(`   Draft subscription: ${draftRes.data.subscription_number}`);
    }
  } else {
    console.log("   Skipping subscriptions - not enough data created");
  }

  console.log("\n=== Seeding Complete! ===");
  console.log("You can now test the app:");
  console.log("  Admin: admin@example.com / Admin@123");
  console.log("  Customer: alice@example.com / Alice@123");
  console.log("  Customer: bob@example.com / Bob@1234");
  console.log("  Customer: charlie@example.com / Charlie@1");
}

main().catch(console.error);
