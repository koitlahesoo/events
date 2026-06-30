// andmed events.json failist
fetch("events.json")
  .then(response => response.json())
  .then(events => {
    // sinu otsingu ja filtrite loogika
    displayEvents(events);

    searchInput.addEventListener("input", () => {
      const q = searchInput.value.toLowerCase();

      const filtered = events.filter(ev =>
        ev.sündmus.toLowerCase().includes(q) ||
        ev.koht.toLowerCase().includes(q) ||
        ev.esineja.some(e => e.toLowerCase().includes(q))
      );

      displayEvents(filtered);
    });
  });

// HTML elemendid
const searchInput = document.getElementById("search");
const resultsDiv = document.getElementById("results");

// Funktsioon sündmuste kuvamiseks
function displayEvents(list) {
  resultsDiv.innerHTML = "";

  list.forEach(ev => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h2>${ev.sündmus}</h2>
      <p><strong>Kuupäev:</strong> ${ev.kuupäev}</p>
      <p><strong>Koht:</strong> ${ev.koht}</p>
      <p><strong>Esineja:</strong> ${ev.esineja.join(", ")}</p>
      <p>${ev.märkmed}</p>
    `;

    resultsDiv.appendChild(card);
  });
}

// Otsing esineja, sündmuse või koha järgi
searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();

  const filtered = events.filter(ev =>
    ev.sündmus.toLowerCase().includes(q) ||
    ev.koht.toLowerCase().includes(q) ||
    ev.esineja.some(e => e.toLowerCase().includes(q))
  );

  displayEvents(filtered);
});

// Kuvame alguses kõik
displayEvents(events);
