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
          <p id="onedrive-status-${ev.id}"><em>Kontrollin OneDrive linki…</em></p>
        `;

        // Klikitav kaart → detailvaade
        card.addEventListener("click", () => {
          window.location.href = `event.html?id=${ev.id}`;
        });

        resultsDiv.appendChild(card);
        // Kontrollime OneDrive linki
        if (ev.pildid && ev.pildid.length > 0) {
          const url = ev.pildid[0];
          checkOneDriveLink(url).then(result => {
            const statusEl = document.getElementById(`onedrive-status-${ev.id}`);
        
            if (result.ok) {
              statusEl.innerHTML = `✔ OneDrive pildid`;
              statusEl.style.color = "green";
            } else {
              statusEl.innerHTML = `⚠ OneDrive link ei tööta: ${result.reason}`;
              statusEl.style.color = "red";
            }
          });
        } else {
          const statusEl = document.getElementById(`onedrive-status-${ev.id}`);
          statusEl.innerHTML = `ℹ Pildikausta link puudub`;
          statusEl.style.color = "gray";
        }
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

    // OneDrive linkide kontroll
    async function checkOneDriveLink(url) {
      if (!url) return { ok: false, reason: "Puudub" };
    
      // Kontroll 1: kas link on OneDrive jagamislink
      if (!url.includes("resid=")) {
        return { ok: false, reason: "Pole jagamislink" };
      }
    
      // Kontroll 2: kas link on avalik
      if (!url.includes("authkey=")) {
        return { ok: false, reason: "Pole avalik link" };
      }
    
      // Kontroll 3: kas link päriselt avaneb
      try {
        const res = await fetch(url, { method: "HEAD" });
        if (!res.ok) {
          return { ok: false, reason: "Ei avane (HTTP " + res.status + ")" };
        }
      } catch (e) {
        return { ok: false, reason: "Võrguviga" };
      }
    
      return { ok: true };
    }
    
    // Kuvame alguses kõik
    displayEvents(events);

    // Otsingu ja filtrite kuulajad
    searchInput.addEventListener("input", updateView);
    filterStart.addEventListener("change", updateView);
    filterEnd.addEventListener("change", updateView);
  });
