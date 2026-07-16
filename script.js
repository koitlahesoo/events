// Kuupäeva formaat: yyyy-mm-dd → pp.kk.aaaa
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split("-");
  return `${day}.${month}.${year}`;
}

// OneDrive/SharePoint lingi lihtne kontroll
function isValidOneDriveLink(url) {
  if (!url) return false;
  if (!url.startsWith("https://")) return false;
  if (!url.includes("sharepoint.com")) return false;
  return true;
}

// Sorteerimine
let currentSort = { column: null, direction: 1 };

// Lülitab veeru sortimissuunda ja käivitab uuenduse
function sortByColumn(column) {
  if (currentSort.column === column) {
    currentSort.direction *= -1;
  } else {
    currentSort.column = column;
    currentSort.direction = 1;
  }
  updateView();
}

// Rakendab praeguse sorti nimekirjale (ei muuda currentSort olekut)
function applySortToList(list) {
  if (!currentSort.column) return list;

  return list.slice().sort((a, b) => {
    let valA, valB;

    switch (currentSort.column) {
      case "date":
        valA = a.algus;
        valB = b.algus;
        break;
      case "event":
        valA = a.sündmus.toLowerCase();
        valB = b.sündmus.toLowerCase();
        break;
      case "place":
        valA = a.koht.toLowerCase();
        valB = b.koht.toLowerCase();
        break;
      case "artist":
        valA = (a.esineja.find(e => e.nimi)?.nimi || "").toLowerCase();
        valB = (b.esineja.find(e => e.nimi)?.nimi || "").toLowerCase();
        break;
    }

    if (valA < valB) return -1 * currentSort.direction;
    if (valA > valB) return 1 * currentSort.direction;
    return 0;
  });
}

// updateView on global – defineeritakse pärast events laadimist
let updateView = () => {};

// Laeme sündmused JSON-failist
fetch("events.json")
  .then(response => response.json())
  .then(events => {
    const searchInput      = document.getElementById("search");
    const filterYearStart  = document.getElementById("filterYearStart");
    const filterYearEnd    = document.getElementById("filterYearEnd");
    const tableBody        = document.getElementById("events-body");

    // Eraldame aastad andmetest
    const years = [...new Set(events.map(ev => parseInt(ev.algus.substring(0, 4))))].sort((a, b) => a - b);
    const minYear = years[0];
    const maxYear = years[years.length - 1];

    // Täidame aastavalikud
    for (let y = minYear; y <= maxYear; y++) {
      filterYearStart.add(new Option(y, y));
      filterYearEnd.add(new Option(y, y));
    }
    filterYearStart.value = minYear;
    filterYearEnd.value   = maxYear;

    // Uuendab, millised aastad on valitavad (end >= start, start <= end)
    function updateYearConstraints() {
      const sy = parseInt(filterYearStart.value);
      const ey = parseInt(filterYearEnd.value);
      Array.from(filterYearEnd.options).forEach(o => {
        o.disabled = parseInt(o.value) < sy;
      });
      Array.from(filterYearStart.options).forEach(o => {
        o.disabled = parseInt(o.value) > ey;
      });
    }
    updateYearConstraints();

    // Kuvab sündmused tabelisse
    function displayEvents(list) {
      tableBody.innerHTML = "";

      if (list.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5">Ühtegi sündmust ei leitud.</td></tr>`;
        return;
      }

      list.forEach(ev => {
        const row = document.createElement("tr");

        // Kuupäev
        let kuupäevTekst = ev.algus === ev.lõpp
          ? formatDate(ev.algus)
          : `${formatDate(ev.algus)} – ${formatDate(ev.lõpp)}`;

        // Artistid (tühjad välja, 3 esimest + ...)
        let artistid = ev.esineja
          .map(e => e.nimi)
          .filter(n => n && n.trim() !== "");
        let artistTekst = artistid.length > 3
          ? artistid.slice(0, 3).join(", ") + ", ..."
          : artistid.join(", ");

        // Pildid
        let pildiLahter = `<span style="color:gray;">—</span>`;
        if (ev.pildid && ev.pildid.length > 0) {
          const url = ev.pildid[0];
          if (isValidOneDriveLink(url)) {
            pildiLahter = `<a href="${url}" target="_blank" title="Vaata OneDrive">📷</a>`;
          }
        }

        row.innerHTML = `
          <td>${kuupäevTekst}</td>
          <td class="event-link" data-id="${ev.id}">${ev.sündmus}</td>
          <td>${ev.koht}</td>
          <td>${artistTekst}</td>
          <td class="pildid-cell">${pildiLahter}</td>
        `;

        row.addEventListener("click", (e) => {
          if (e.target.closest(".pildid-cell")) return;
          window.location.href = `event.html?id=${ev.id}`;
        });

        tableBody.appendChild(row);
      });
    }

    // Filtreerib sündmused
    function applyFilters() {
      const q  = searchInput.value.toLowerCase();
      const sy = parseInt(filterYearStart.value);
      const ey = parseInt(filterYearEnd.value);

      return events.filter(ev => {
        const matchesText =
          ev.sündmus.toLowerCase().includes(q) ||
          ev.koht.toLowerCase().includes(q) ||
          ev.esineja.some(e => e.nimi.toLowerCase().includes(q));

        const evYear = parseInt(ev.algus.substring(0, 4));
        const matchesYear = evYear >= sy && evYear <= ey;

        return matchesText && matchesYear;
      });
    }

    // Uuendab vaate (filter + sort)
    updateView = function () {
      const filtered = applyFilters();
      const sorted   = applySortToList(filtered);
      displayEvents(sorted);
    };

    // Sordi päised
    document.querySelectorAll("th[data-sort]").forEach(th => {
      th.addEventListener("click", () => {
        sortByColumn(th.getAttribute("data-sort"));
      });
    });

    // Filtrite kuulajad
    searchInput.addEventListener("input", updateView);

    filterYearStart.addEventListener("change", () => {
      if (parseInt(filterYearStart.value) > parseInt(filterYearEnd.value)) {
        filterYearEnd.value = filterYearStart.value;
      }
      updateYearConstraints();
      updateView();
    });

    filterYearEnd.addEventListener("change", () => {
      if (parseInt(filterYearEnd.value) < parseInt(filterYearStart.value)) {
        filterYearStart.value = filterYearEnd.value;
      }
      updateYearConstraints();
      updateView();
    });

    // Algne kuvamine
    updateView();
  });
