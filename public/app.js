const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const navItems = [["overview","Overview","⌂"],["cash","Cashflow","$"],["inventory","Inventory","◇"],["workforce","Workforce","◎"],["tickets","Tickets","▣"],["artists","Artists","★"]];

async function json(path) { const response = await fetch(path); if (!response.ok) throw new Error(`${path}: ${response.status}`); return response.json(); }

try {
  const [summary, events, ecosystem] = await Promise.all([json("/api/summary"), json("/api/events"), json("/api/ecosystem")]);
  document.querySelector("#venue").textContent = ecosystem.venue.name;
  const portalNames = { OWNER: "Owner", EMPLOYEE: "Employee", CUSTOMER: "Customer", ARTIST: "Artist" };
  document.querySelector("#portal-switch").innerHTML = Object.entries(portalNames).map(([id, label], index) => `<button class="${index ? "" : "active"}" data-portal="${id}">${label}</button>`).join("");
  document.querySelector("#sales").textContent = money.format(summary.grossSales - summary.refunds);
  document.querySelector("#tips").textContent = money.format(summary.tips);
  document.querySelector("#alerts").textContent = summary.openAlerts;
  document.querySelector("#nav").innerHTML = navItems.map(([id,label,icon], index) => `<button class="${index ? "" : "active"}" data-target="${id}" aria-label="${label}" title="${label}"><span>${icon}</span><small>${label}</small></button>`).join("");
  document.querySelector("#modules").innerHTML = ecosystem.modules.map(module => `<button class="module" data-target="${module.id === "risk" ? "overview" : module.id}"><span class="pill ${module.status}">${module.status}</span><h3>${module.label}</h3><strong>${module.metric}</strong><p>${module.detail}</p></button>`).join("");
  document.querySelector("#events").innerHTML = events.map(event => `<div class="event"><span>${event.type.replaceAll("_", " ")}</span><span>${event.source}</span><span>${event.amount ? money.format(event.amount) : "Review"}</span></div>`).join("");
  document.querySelector("#cashflow").innerHTML = ecosystem.cashflow.map(row => `<article><small>${row.label}</small><strong class="${row.amount < 0 ? "negative" : ""}">${money.format(row.amount)}</strong></article>`).join("");
  document.querySelector("#controls").innerHTML = ecosystem.controls.map(control => `<div><span>✓</span>${control}</div>`).join("");
  document.querySelector("#inventory").innerHTML = ecosystem.inventory.map(row => `<tr><td>${row.sku}</td><td>${row.item}</td><td>${number.format(row.received)}</td><td>${number.format(row.consumed)}</td><td>${number.format(row.sold)}</td><td>${number.format(row.variance)}</td><td><span class="pill ${row.state === "balanced" ? "live" : "attention"}">${row.state}</span></td></tr>`).join("");
  document.querySelector("#workforce").innerHTML = ecosystem.workforce.map(row => `<tr><td><strong>${row.employee}</strong></td><td>${row.role}</td><td>${money.format(row.sales)}</td><td>${money.format(row.tips)}</td><td>${money.format(row.due)}</td></tr>`).join("");
  const ticket = ecosystem.ticketing, progress = Math.round(ticket.sold / ticket.capacity * 100);
  document.querySelector("#ticketing").innerHTML = `<div><p class="label">NEXT EVENT</p><h3>${ticket.event}</h3><strong>${ticket.sold} / ${ticket.capacity}</strong><div class="progress"><i style="width:${progress}%"></i></div><p>${progress}% sold · ${ticket.checkedIn} checked in · ${ticket.reservations} reservations</p></div><div class="ticket-revenue"><small>Direct ticket revenue</small><b>${money.format(ticket.revenue)}</b><button data-action="sell">Open sales portal</button></div>`;
  document.querySelector("#artists").innerHTML = ecosystem.artists.map(row => `<article><p class="label">${row.date}</p><h3>${row.artist}</h3><strong>${money.format(row.tariff)}</strong><p>Contract: ${row.contract}</p><p>Settlement: ${row.settlement}</p><button class="outline" data-action="contract">Review contract</button></article>`).join("");

  function show(target) { document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view.dataset.view === target)); document.querySelectorAll("#nav button").forEach(button => button.classList.toggle("active", button.dataset.target === target)); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function showPortal(portalId) {
    const owner = portalId === "OWNER", data = ecosystem.portals[portalId];
    document.querySelector("#owner-workspace").hidden = !owner;
    document.querySelector("#portal-workspace").hidden = owner;
    document.querySelector(".rail").classList.toggle("portal-mode", !owner);
    document.querySelector("#access-label").textContent = `${portalId} ACCESS`;
    document.querySelectorAll("[data-portal]").forEach(button => button.classList.toggle("active", button.dataset.portal === portalId));
    if (!owner) {
      document.querySelector("#portal-kind").textContent = `${portalId} PORTAL`;
      document.querySelector("#portal-title").textContent = data.title;
      document.querySelector("#portal-subtitle").textContent = data.subtitle;
      document.querySelector("#portal-stats").innerHTML = data.stats.map(([label, value]) => `<article><small>${label}</small><strong>${value}</strong></article>`).join("");
      document.querySelector("#portal-actions").innerHTML = data.actions.map(action => `<button data-action="portal">${action}<span>→</span></button>`).join("");
      document.querySelector("#portal-privacy").textContent = portalId === "EMPLOYEE" ? "Employees can see only their own shifts, sales, tips and amounts due." : portalId === "CUSTOMER" ? "Customers can see only their own profile, reservations, tickets and purchases." : "Artists can see only their own offers, contracts, dates, merchandise and settlements.";
    }
  }
  document.addEventListener("click", event => { const portal = event.target.closest("[data-portal]")?.dataset.portal; if (portal) showPortal(portal); const target = event.target.closest("[data-target]")?.dataset.target; if (target) show(target); const action = event.target.closest("[data-action]")?.dataset.action; if (action) { const toast = document.querySelector("#toast"); toast.textContent = action === "export" ? "Audit export prepared in demo mode" : action === "sell" ? "Customer sales portal is ready for provider connection" : action === "portal" ? "Demo action recorded — live provider not connected" : "Contract review requires verified owner approval"; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2800); } });
} catch (error) {
  document.querySelector("main").insertAdjacentHTML("afterbegin", `<div class="error">Data services are unavailable. ${error.message}</div>`);
}
