const api = "/api";
let currentOrderId;
let pollingTimer;

async function request(path, options = {}) {
  const response = await fetch(`${api}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Request failed");
  return body;
}

function money(cents) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function renderOrder(order) {
  const target = document.querySelector("#order");
  target.className = "order-card";
  target.innerHTML = `
    <div class="state state-${order.status.toLowerCase()}">${order.status}</div>
    <p class="order-id">${order.id}</p>
    <strong>${money(order.totalCents)}</strong>
    <ul>${order.products.map((item) => `<li>${item.quantity} × ${item.name}<span>${money(item.lineTotalCents)}</span></li>`).join("")}</ul>`;
}

async function trackOrder(id) {
  if (!id) return;
  try {
    const order = await request(`/orders/${encodeURIComponent(id)}`);
    renderOrder(order);
    document.querySelector("#order-id").value = id;
    currentOrderId = id;
    if (["COMPLETED", "FAILED"].includes(order.status)) {
      clearInterval(pollingTimer);
    }
  } catch (error) {
    document.querySelector("#order").textContent = error.message;
  }
}

async function loadProducts() {
  const products = await request("/products");
  document.querySelector("#products").innerHTML = products.map((product) => `
    <label class="product">
      <span><strong>${product.name}</strong><small>${money(product.priceCents)}</small></span>
      <input type="number" name="${product.id}" min="0" max="20" value="0" aria-label="Quantity for ${product.name}">
    </label>`).join("");
}

document.querySelector("#order-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = document.querySelector("#form-message");
  const products = [...new FormData(event.target).entries()]
    .map(([productId, quantity]) => ({ productId, quantity: Number(quantity) }))
    .filter((item) => item.quantity > 0);
  message.textContent = "Submitting order…";
  try {
    const order = await request("/orders", { method: "POST", body: JSON.stringify({ products }) });
    message.textContent = "Order accepted for processing.";
    renderOrder(order);
    currentOrderId = order.id;
    document.querySelector("#order-id").value = order.id;
    clearInterval(pollingTimer);
    pollingTimer = setInterval(() => trackOrder(currentOrderId), 1000);
  } catch (error) {
    message.textContent = error.message;
  }
});

document.querySelector("#track").addEventListener("click", () => trackOrder(document.querySelector("#order-id").value.trim()));

request("/health/ready")
  .then(() => { document.querySelector("#api-status").textContent = "System ready"; })
  .catch(() => { document.querySelector("#api-status").textContent = "System unavailable"; });
loadProducts().catch((error) => { document.querySelector("#products").textContent = error.message; });
