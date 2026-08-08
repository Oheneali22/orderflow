const api = "/api";
const ticketsEl = document.querySelector("#tickets");
const form = document.querySelector("#ticket-form");
const message = document.querySelector("#form-message");

async function request(path, options = {}) {
  const response = await fetch(`${api}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error || "Request failed");
  }
  return response.status === 204 ? null : response.json();
}

function escapeHtml(value) {
  const node = document.createElement("div");
  node.textContent = value;
  return node.innerHTML;
}

async function loadTickets() {
  const tickets = await request("/tickets");
  ticketsEl.innerHTML = tickets.length ? tickets.map((ticket) => `
    <article class="ticket" data-priority="${escapeHtml(ticket.priority)}">
      <h3>#${ticket.id} · ${escapeHtml(ticket.title)}</h3>
      <p>${escapeHtml(ticket.description)}</p>
      <div class="meta">
        <span class="pill">${escapeHtml(ticket.status.replace("_", " "))}</span>
        <span class="pill">${escapeHtml(ticket.priority)}</span>
        <span>${escapeHtml(ticket.requester_email)}</span>
      </div>
    </article>`).join("") : '<p class="empty">No tickets yet. Create the first one.</p>';
}

async function loadStats() {
  const stats = await request("/stats");
  document.querySelector("#total").textContent = stats.total;
  document.querySelector("#open").textContent = stats.by_status.open || 0;
  document.querySelector("#resolved").textContent = stats.by_status.resolved || 0;
  document.querySelector("#critical").textContent = stats.by_priority.critical || 0;
}

async function checkApi() {
  const badge = document.querySelector("#api-status");
  try {
    await request("/ready");
    badge.textContent = "API ready";
  } catch (error) {
    badge.textContent = "API unavailable";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  message.textContent = "Submitting…";
  try {
    await request("/tickets", { method: "POST", body: JSON.stringify(data) });
    form.reset();
    message.textContent = "Ticket created.";
    await Promise.all([loadTickets(), loadStats()]);
  } catch (error) {
    message.textContent = error.message;
  }
});

document.querySelector("#refresh").addEventListener("click", () => Promise.all([loadTickets(), loadStats()]));
Promise.all([checkApi(), loadTickets(), loadStats()]).catch(console.error);
