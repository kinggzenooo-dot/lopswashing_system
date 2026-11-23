document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));
  let customers = [];
  const close = () => $("customerModal").style.display = "none";
  const open = customer => {
    $("customerForm").reset(); $("customerId").value = customer?.id || "";
    $("customerModalTitle").textContent = customer ? "Edit Customer" : "Add Customer";
    ["Name", "Email", "Mobile", "Status"].forEach(key => $("customer" + key).value = customer?.[{Name:"customer_name",Email:"email",Mobile:"phone",Status:"status"}[key]] || (key === "Status" ? "Active" : ""));
    $("customerModal").style.display = "flex";
  };
  async function load() {
    const response = await fetch("/api/customers"), result = await response.json();
    if (!result.success) return;
    customers = result.customers;
    $("totalCustomers").textContent = customers.length;
    $("activeCustomers").textContent = customers.filter(c => c.status === "Active").length;
    const month = new Date().toISOString().slice(0, 7);
    $("newCustomers").textContent = customers.filter(c => String(c.created_at).slice(0, 7) === month).length;
    render();
  }
  function render() {
    const query = $("customerSearch").value.toLowerCase();
    const filtered = customers.filter(c => `${c.customer_name} ${c.email} ${c.phone}`.toLowerCase().includes(query));
    $("customerTableBody").innerHTML = filtered.length ? filtered.map(c => `<tr><td>${c.id}</td><td>${esc(c.customer_name)}</td><td>${esc(c.email)}</td><td>${esc(c.phone)}</td><td>${esc(c.status)}</td><td><button data-edit="${c.id}">Edit</button></td></tr>`).join("") : `<tr><td colspan="6" style="text-align:center;padding:30px">No customers found.</td></tr>`;
    document.querySelectorAll("[data-edit]").forEach(button => button.onclick = () => open(customers.find(c => c.id === Number(button.dataset.edit))));
  }
  $("addCustomerButton").onclick = () => open(); $("closeCustomerModal").onclick = close; $("cancelCustomer").onclick = close;
  $("customerSearch").oninput = render; $("searchCustomerButton").onclick = render;
  $("customerForm").onsubmit = async event => { event.preventDefault(); const id = $("customerId").value; const response = await fetch(id ? `/api/customers/${id}` : "/api/customers", {method: id ? "PUT" : "POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({customer_name:$("customerName").value,email:$("customerEmail").value,phone:$("customerMobile").value,status:$("customerStatus").value})}); const result = await response.json(); if (result.success) { close(); load(); } else alert(result.message); };
  load().catch(console.error);
});
