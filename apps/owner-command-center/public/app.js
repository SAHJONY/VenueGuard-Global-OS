const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const [summary, events] = await Promise.all([
  fetch("/api/summary").then(r => r.json()),
  fetch("/api/events").then(r => r.json())
]);

document.querySelector("#sales").textContent = money.format(summary.grossSales - summary.refunds);
document.querySelector("#tips").textContent = money.format(summary.tips);
document.querySelector("#alerts").textContent = summary.openAlerts;
document.querySelector("#variance").textContent = money.format(summary.inventoryVariance);

document.querySelector("#events").innerHTML = events.map(event => `
  <div class="event"><span>${event.type.replaceAll("_", " ")}</span><span>${event.source}</span><span>${event.amount ? money.format(event.amount) : "Review"}</span></div>
`).join("");
