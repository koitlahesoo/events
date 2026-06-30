// OneDrive lingi kontroll
async function checkOneDriveLink(url) {
  if (!url) return { ok: false, reason: "Puudub" };

  // Kontroll 1: kas link on SharePoint/OneDrive Business
  if (!url.includes("sharepoint.com")) {
    return { ok: false, reason: "Pole SharePoint link" };
  }

  // Kontroll 2: kas link avaneb (GET, mitte HEAD)
  try {
    const res = await fetch(url, { method: "GET" });

    if (res.status === 200) {
      return { ok: true };
    }

    if (res.status === 403) {
      return { ok: false, reason: "Pole avalik link (403)" };
    }

    return { ok: false, reason: "Ei avane (HTTP " + res.status + ")" };

  } catch (e) {
    return { ok: false, reason: "Võrguviga" };
  }
}

// Laeme sündmused JSON-failist
fetch("events.json")
  .then(response => response.json())
  .then(events => {
    const searchInput = document.getElementById("search");
    const filterStart = document.getElementById("filterStart");
    const filterEnd = document.getElementById("filterEnd");
    const tableBody = document.getElementById("events-body");

    // Kuvamine tabelina
    function displayEvents(list) {
      tableBody.innerHTML = "";

      if (list.length === 0) {
        tableBody.innerHTML = `
          <tr><td colspan="5">Ühtegi sündmust ei leitud.</td></tr>
        `;
        return;
      }

      list.forEach(ev => {
        const row = document.createElement("tr");

        // Kuupäev
        let kuupäevTekst = ev.algus === ev.lõpp
          ? ev.algus
          : `${ev.algus} – ${ev.lõpp}`;

        // Artistid (3 esimest + ...)
        let artistid = ev.esineja.map(e => e.nimi);
        let artistTekst = artistid.length > 3
          ? artistid.slice(0, 3).join(", ") + ", ..."
          : artistid.join(", ");

        // Pildid (ikoon ainult kui link töötab)
        let pildiLahter = `<span style="color:gray;">—</span>`; // vaikimisi tühi

        if (ev.pildid && ev.pildid.length > 0) {
          const url = ev.pildid[0];

          // Kontrollime OneDrive linki
          checkOneDriveLink(url).then(result => {
            if (result.ok) {
              pildiLahter = `
                <a href="${url}" target="_blank" title="Vaata OneDrive">
                  📷
                </a>
              `;
            } else {
              pildiLahter = `<span style="color:gray;">—</span>`;
            }

            // uuendame lahtri HTML-i
            row.querySelector(".pildid-cell").innerHTML = pildiLahter;
          });
        }

        row.innerHTML = `
          <td>${kuupäevTekst}</td>
          <td class="event-link" data-id="${ev.id}">${ev.sündmus}</td>
          <td>${ev.koht}</td>
          <td>${artistTekst}</td>
          <td class="pildid-cell"><span style="color:gray;">—</span></td>
        `;

        // Klikitav sündmuse nimi → detailvaade
        row.querySelector(".event-link").addEventListener("click", () => {
          window.location.href = `event.html?id=${ev.id}`;
        });

        tableBody.appendChild(row);
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
