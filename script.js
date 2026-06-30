// Laeme sündmused JSON-failist
fetch("events.json")
  .then(response => response.json())
  .then(events => {
    // HTML elemendid
    const searchInput = document.getElementById("search");
    const filterStart = document.getElementById("filterStart");
    const filterEnd = document.getElementById("filterEnd");
    const resultsDiv = document.getElementById("results");

    // Funktsioon sündmuste kuvamiseks
    function displayEvents(list) {
      resultsDiv.innerHTML = "";

      if (list.length === 0) {
        resultsDiv.innerHTML = "<p>Ühtegi sündmust ei leitud.</p>";
        return;
      }

      list.forEach(ev => {
        const card = document.createElement("div");
        card.className = "card";

        // Kuupäevade kuvamine
        let kuupäevTekst = "";
        if (ev.algus === ev.lõpp) {
          kuupäevTekst = ev.algus;
        } else {
          kuupäevTekst = `${ev.algus} – ${ev.lõpp}`;
        }

        // Esinejate kuvamine
        const esinejadTekst = ev.esineja
          .map(e => {
            if (e.kuupäev) {
              return `${e.nimi} (${e.kuupäev})`;
            }
            return e.nimi;
          })
          .join(", ");

        card.innerHTML = `
          <h2>${ev.sündmus}</h2>
          <p><strong>Kuupäev:</strong> ${kuupäevTekst}</p>
          <p><strong>Koht:</strong> ${ev.koht}</p>
          <p><strong>Esineja:</strong> ${esinejadTekst}</p>
          <p>${ev.märkmed}</p>
        `;

        // Klikitav kaart → detailvaade
        card.addEventListener("click", () => {
          window.location.href = `event.html?id=${ev.id}`;
        });

        resultsDiv.appendChild(card);
      });
    }

    // Kuupäevavahemiku kontroll
    function isWithinRange(event, start, end) {
      const evStart = event.algus;
      const evEnd = event.lõpp;

      if (!start && !end) return true;
      if (start && !end) return evEnd >= start;
      if (!start && end) return evStart <= end;

      return evStart <= end && evEnd >= start;
    }

    // Filtrite rakendamine
    function applyFilters(events) {
      const q = searchInput.value.toLowerCase();
      const start = filterStart.value;
      const end = filterEnd.value;

      return events.filter(ev => {
        const matchesText =
          ev.sündmus.toLowerCase().includes(q) ||
          ev.koht.toLowerCase().includes(q) ||
          ev.esineja.some(e => e.nimi.toLowerCase().includes(q));

        const matchesDate = isWithinRange(ev, start, end);

        return matchesText && matchesDate;
      });
    }

    // Vaate uuendamine
    function updateView() {
      const filtered = applyFilters(events);
      displayEvents(filtered);
    }

    // Kuvame alguses kõik
    displayEvents(events);

    // Otsingu ja filtrite kuulajad
    searchInput.addEventListener("input", updateView);
    filterStart.addEventListener("change", updateView);
    filterEnd.addEventListener("change", updateView);
  });
