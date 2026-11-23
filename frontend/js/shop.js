document.addEventListener("DOMContentLoaded", async () => {
  const $ = id => document.getElementById(id);
  const money = value => `₱${Number(value || 0).toFixed(2)}`;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

  let products = [], cart = {}, cartKey = "lops-carwash-cart";

  // ── TOAST ──────────────────────────────────────────────────────────
  let toastTimer = null;
  function toast(text, error = false) {
    const el = $("toast");
    if (!el) return;
    el.textContent = text;
    el.className = "toast" + (error ? " toast-error" : "");
    // force reflow so transition fires even if already showing
    void el.offsetWidth;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
  }

  // keep checkoutMessage hidden; we use toast instead
  const message = (text, error = false) => {
    const box = $("checkoutMessage");
    if (box) box.style.display = "none";
    toast(text, error);
  };

  const save = () => localStorage.setItem(cartKey, JSON.stringify(cart));

  // ── IMAGE HELPERS ──────────────────────────────────────────────────
  const DEFAULT_PHOTOS = {
    "express": "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&q=80",
    "full service": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&q=80",
    "inside": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&q=80",
    "detail": "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=600&q=80",
    "premium": "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=600&q=80",
    "motorcycle": "https://images.unsplash.com/photo-1558618047-f7ae14c3e7bc?w=600&q=80",
    "interior": "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=600&q=80",
    "ceramic": "https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&q=80",
    "shield": "https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&q=80",
    "engine": "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&q=80",
    "headlight": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&q=80",
    "restoration": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&q=80",
    "exterior": "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&q=80",
    "wash": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    "default": "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=600&q=80"
  };

  function getProductImage(p) {
    if (p.image && p.image.trim()) {
      return `/uploads/${p.image}`;
    }
    const text = ((p.category || "") + " " + (p.product_name || "")).toLowerCase();
    for (const [key, url] of Object.entries(DEFAULT_PHOTOS)) {
      if (text.includes(key)) return url;
    }
    return DEFAULT_PHOTOS.default;
  }

  // ── RENDER PRODUCTS ────────────────────────────────────────────────
  function renderProducts() {
    if (!products.length) {
      $("shopProducts").innerHTML = `<p style="padding:24px;color:var(--muted)">No services are available right now.</p>`;
      return;
    }
    $("shopProducts").innerHTML = products.map(p => {
      const outOfStock = p.stock < 1;
      const imgSrc = getProductImage(p);
      return `
        <article class="shop-card" data-id="${p.id}">
          <div class="shop-card-img">
            <img src="${imgSrc}" alt="${esc(p.product_name)}" loading="lazy">
            ${outOfStock ? `<div class="out-of-stock-overlay"><span>Unavailable</span></div>` : ""}
          </div>
          <div class="shop-card-body">
            <span class="shop-card-cat">${esc(p.category || "Car Care")}</span>
            <h3 class="shop-card-name">${esc(p.product_name)}</h3>
            <p class="shop-card-desc">${esc(p.description || "Premium car care service.")}</p>
            <div class="shop-card-row">
              <span class="shop-card-price">${money(p.price)}</span>
              <button
                class="btn-add add-cart"
                data-id="${p.id}"
                ${outOfStock ? "disabled" : ""}
                aria-label="Add ${esc(p.product_name)} to cart"
              >${outOfStock ? "Unavailable" : "Add service"}</button>
            </div>
            <span class="shop-card-stock">${outOfStock ? "No slots available" : `${p.stock} slot${p.stock !== 1 ? "s" : ""} available`}</span>
          </div>
        </article>`;
    }).join("");

    document.querySelectorAll(".add-cart").forEach(b => {
      b.onclick = () => {
        const id = b.dataset.id;
        cart[id] = (cart[id] || 0) + 1;
        save();
        renderCart();
        const p = products.find(prod => String(prod.id) === String(id));
        toast(`${p ? esc(p.product_name) : "Service"} added to cart.`);
      };
    });
  }

  // ── RENDER CART ────────────────────────────────────────────────────
  function renderCart() {
    const lines = Object.entries(cart)
      .map(([id, quantity]) => ({ p: products.find(product => product.id === Number(id)), quantity }))
      .filter(line => line.p);

    $("cartCount").textContent = lines.reduce((sum, line) => sum + line.quantity, 0);
    $("cartTotal").textContent = money(lines.reduce((sum, line) => sum + Number(line.p.price) * line.quantity, 0));

    if (!lines.length) {
      $("cartItems").innerHTML = `<p class="cart-empty">Your booking is empty.</p>`;
      return;
    }

    $("cartItems").innerHTML = lines.map(line => `
      <div class="cart-line">
        <div class="cart-line-name">
          <strong>${esc(line.p.product_name)}</strong>
          <small>${money(line.p.price)} each</small>
        </div>
        <div class="cart-qty">
          <button class="qty-btn cart-change" data-id="${line.p.id}" data-change="-1" aria-label="Decrease quantity">−</button>
          <span class="qty-count">${line.quantity}</span>
          <button class="qty-btn cart-change" data-id="${line.p.id}" data-change="1"
            ${line.quantity >= line.p.stock ? "disabled" : ""}
            aria-label="Increase quantity">+</button>
        </div>
        <button class="cart-remove-btn cart-remove" data-id="${line.p.id}" aria-label="Remove ${esc(line.p.product_name)}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>`).join("");

    document.querySelectorAll(".cart-change").forEach(b => {
      b.onclick = () => {
        const id = b.dataset.id;
        cart[id] += Number(b.dataset.change);
        if (cart[id] < 1) delete cart[id];
        save();
        renderCart();
      };
    });

    document.querySelectorAll(".cart-remove").forEach(b => {
      b.onclick = () => {
        const p = products.find(prod => String(prod.id) === String(b.dataset.id));
        delete cart[b.dataset.id];
        save();
        renderCart();
        if (p) toast(`${esc(p.product_name)} removed from cart.`);
      };
    });
  }

  // ── LOAD ORDERS ────────────────────────────────────────────────────
  async function loadOrders() {
    const d = await (await fetch("/api/customer/orders")).json();
    const payChipClass = method => {
      if (!method) return "pay-cash";
      const m = method.toLowerCase().replace(/\s+/g, "-");
      if (m.includes("gcash")) return "pay-gcash";
      if (m.includes("bank") || m.includes("transfer")) return "pay-bank-transfer";
      return "pay-cash";
    };
    $("ordersBody").innerHTML = d.orders?.length
      ? d.orders.map(o => `
          <tr>
            <td class="invoice-col">${esc(o.invoice_no)}</td>
            <td>${String(o.sale_date).slice(0, 10)}</td>
            <td>${esc(o.products || "—")}</td>
            <td class="amount-col">${money(o.total_amount)}</td>
            <td><span class="pay-chip ${payChipClass(o.payment_method)}">${esc(o.payment_method)}</span></td>
          </tr>`).join("")
      : `<tr><td colspan="5" style="padding:30px;text-align:center;color:var(--muted)">No orders yet.</td></tr>`;
  }

  // ── LOAD PRODUCTS ──────────────────────────────────────────────────
  async function loadProducts() {
    const d = await (await fetch("/api/products")).json();
    products = d.products || [];
    renderProducts();
    renderCart();
  }

  // ── CHECKOUT ───────────────────────────────────────────────────────
  $("checkoutButton").onclick = async () => {
    const items = Object.entries(cart).map(([product_id, quantity]) => ({ product_id, quantity }));
    if (!items.length) return message("Add a service to your booking before checking out.", true);
    const button = $("checkoutButton");
    button.disabled = true;
    toast("Placing your order…");
    try {
      const result = await (await fetch("/api/customer/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, payment_method: $("paymentMethod").value })
      })).json();
      if (!result.success) return message(result.message || "Unable to place your order.", true);
      cart = {};
      save();
      message(`Order ${result.invoice_no} placed successfully! 🎉`);
      await loadProducts();
      await loadOrders();
    } catch (error) {
      message("Unable to reach the server. Please try again.", true);
    } finally {
      button.disabled = false;
    }
  };

  // ── MOBILE SIDEBAR TOGGLE ──────────────────────────────────────────
  document.getElementById("menuToggle")?.addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
    document.getElementById("sidebarOverlay")?.classList.toggle("show");
  });

  document.getElementById("sidebarOverlay")?.addEventListener("click", () => {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebarOverlay").classList.remove("show");
  });

  // ── BOOT ───────────────────────────────────────────────────────────
  try {
    const user = await (await fetch("/api/user")).json();
    if (user.logged_in) {
      $("customerName").textContent = user.user.fullname;
      cartKey = `lops-carwash-cart-${user.user.id}`;
      cart = JSON.parse(localStorage.getItem(cartKey) || "{}");
    }
    await loadProducts();
    await loadOrders();

    // Check if a service was requested via URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const serviceParam = urlParams.get("service") || urlParams.get("add");
    if (serviceParam && products.length) {
      const match = products.find(p =>
        String(p.id) === serviceParam ||
        p.sku?.toLowerCase() === serviceParam.toLowerCase() ||
        p.product_name?.toLowerCase().includes(serviceParam.toLowerCase())
      );
      if (match) {
        cart[match.id] = (cart[match.id] || 0) + 1;
        save();
        renderCart();
        toast(`${match.product_name} added to your booking!`);
        if (urlParams.get("scroll") === "cart") {
          setTimeout(() => {
            $("cart")?.scrollIntoView({ behavior: "smooth" });
          }, 300);
        }
      }
    }
  } catch (error) {
    console.error("Customer portal error:", error);
    message("Unable to load services.", true);
  }
});
