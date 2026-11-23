document.addEventListener("DOMContentLoaded", async () => {
  const $ = id => document.getElementById(id), money = value => `₱${Number(value || 0).toFixed(2)}`;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  let products = [], cart = {}, cartKey = "lops-carwash-cart";
  const message = (text, error = false) => { const box = $("checkoutMessage"); box.textContent = text; box.style.display = "block"; box.style.color = error ? "#ff2e7e" : "#b8ff32"; };
  const save = () => localStorage.setItem(cartKey, JSON.stringify(cart));
  function renderProducts() {
    $("shopProducts").innerHTML = products.length ? products.map(p => `<article style="border:1px solid #285067;border-radius:12px;padding:18px;background:#102d41"><span style="color:#7fe6ff;font-size:12px">${esc(p.category || "Car Care")}</span><h3 style="margin:10px 0 6px">${esc(p.product_name)}</h3><p style="min-height:38px;color:#a9c2d0">${esc(p.description || "Premium car care service")}</p><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><strong>${money(p.price)}</strong><button class="btn-primary add-cart" data-id="${p.id}" ${p.stock < 1 ? "disabled" : ""} style="padding:9px 12px;border:0;border-radius:6px">${p.stock < 1 ? "Unavailable" : "Add service"}</button></div><small style="display:block;margin-top:10px;color:#a9c2d0">${p.stock} slots available</small></article>`).join("") : "<p>No services are available right now.</p>";
    document.querySelectorAll(".add-cart").forEach(b => b.onclick = () => { const id = b.dataset.id; cart[id] = (cart[id] || 0) + 1; save(); renderCart(); message("Added to your cart."); });
  }
  function renderCart() {
    const lines = Object.entries(cart).map(([id, quantity]) => ({ p: products.find(product => product.id === Number(id)), quantity })).filter(line => line.p);
    $("cartCount").textContent = lines.reduce((sum, line) => sum + line.quantity, 0);
    $("cartTotal").textContent = money(lines.reduce((sum, line) => sum + Number(line.p.price) * line.quantity, 0));
    $("cartItems").innerHTML = lines.length ? lines.map(line => `<div style="display:flex;align-items:center;gap:12px;justify-content:space-between;padding:12px 0;border-bottom:1px solid #30303a"><span>${esc(line.p.product_name)} <small>${money(line.p.price)} each</small></span><span><button class="cart-change" data-id="${line.p.id}" data-change="-1">−</button> ${line.quantity} <button class="cart-change" data-id="${line.p.id}" data-change="1" ${line.quantity >= line.p.stock ? "disabled" : ""}>+</button> <button class="cart-remove" data-id="${line.p.id}">Remove</button></span></div>`).join("") : "<p>Your cart is empty.</p>";
    document.querySelectorAll(".cart-change").forEach(b => b.onclick = () => { const id = b.dataset.id; cart[id] += Number(b.dataset.change); if (cart[id] < 1) delete cart[id]; save(); renderCart(); });
    document.querySelectorAll(".cart-remove").forEach(b => b.onclick = () => { delete cart[b.dataset.id]; save(); renderCart(); });
  }
  async function loadOrders() { const d = await (await fetch("/api/customer/orders")).json(); $("ordersBody").innerHTML = d.orders?.length ? d.orders.map(o => `<tr><td style="padding:14px">${esc(o.invoice_no)}</td><td style="padding:14px">${String(o.sale_date).slice(0, 10)}</td><td style="padding:14px">${esc(o.products || "—")}</td><td style="padding:14px;text-align:right">${money(o.total_amount)}</td><td style="padding:14px">${esc(o.payment_method)}</td></tr>`).join("") : '<tr><td colspan="5" style="padding:30px;text-align:center">No orders yet.</td></tr>'; }
  async function loadProducts() { const d = await (await fetch("/api/products")).json(); products = d.products || []; renderProducts(); renderCart(); }
  $("checkoutButton").onclick = async () => {
    const items = Object.entries(cart).map(([product_id, quantity]) => ({ product_id, quantity }));
    if (!items.length) return message("Add an item to your cart before checking out.", true);
    const button = $("checkoutButton"); button.disabled = true; message("Placing your order…");
    try { const result = await (await fetch("/api/customer/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, payment_method: $("paymentMethod").value }) })).json(); if (!result.success) return message(result.message || "Unable to place your order.", true); cart = {}; save(); message(`Order ${result.invoice_no} placed successfully!`); await loadProducts(); await loadOrders(); } catch (error) { message("Unable to reach the server. Please try again.", true); } finally { button.disabled = false; }
  };
  try { const user = await (await fetch("/api/user")).json(); if (user.logged_in) { $("customerName").textContent = user.user.fullname; cartKey = `lops-carwash-cart-${user.user.id}`; cart = JSON.parse(localStorage.getItem(cartKey) || "{}"); } await loadProducts(); await loadOrders(); } catch (error) { console.error("Customer portal error:", error); message("Unable to load services.", true); }
});
