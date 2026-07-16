// Kuupäeva formaat: yyyy-mm-dd → pp.kk.aaaa
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split("-");
  return `${day}.${month}.${year}`;
}

// OneDrive lingi kontroll
function isValidOneDriveLink(url) {
  if (!url) return false;
  if (!url.startsWith("https://")) return false;
  if (!url.includes("sharepoint.com")) return false;
  return true;
}

// Festival: "Festival" nimes või mitmepäevane
function isFestivalEvent(ev) {
  return ev.sündmus.toLowerCase().includes("festival");
}

// Sort
let currentSort = { column: null, direction: 1 };

function sortByColumn(column) {
  if (currentSort.column === column) {
    currentSort.direction *= -1;
  } else {
    currentSort.column = column;
    currentSort.direction = 1;
  }
  updateView();
}

function applySortToList(list) {
  if (!currentSort.column) return list;
  return list.slice().sort((a, b) => {
    let valA, valB;
    switch (currentSort.column) {
      case "date":
        valA = a.algus; valB = b.algus; break;
      case "event":
        valA = a.sündmus.toLowerCase(); valB = b.sündmus.toLowerCase(); break;
      case "place":
        valA = a.koht.toLowerCase(); valB = b.koht.toLowerCase(); break;
      case "artist":
        valA = (a.esineja.find(e => e.nimi?.trim())?.nimi || "").toLowerCase();
        valB = (b.esineja.find(e => e.nimi?.trim())?.nimi || "").toLowerCase();
        break;
    }
    if (valA < valB) return -1 * currentSort.direction;
    if (valA > valB) return 1 * currentSort.direction;
    return 0;
  });
}

let updateView = () => {};

fetch("events.json")
  .then(res => res.json())
  .then(events => {
    const searchInput     = document.getElementById("search");
    const filterYearStart = document.getElementById("filterYearStart");
    const filterYearEnd   = document.getElementById("filterYearEnd");
    const tableBody       = document.getElementById("events-body");

    // Statistika
    const years = [...new Set(events.map(ev => parseInt(ev.algus.substring(0, 4))))].sort((a, b) => a - b);
    const minYear = years[0];
    const maxYear = years[years.length - 1];

    const uniqueArtists = new Set(
      events.flatMap(ev =>
        ev.esineja.map(e => e.nimi).filter(n =>
          n && n.trim() !== "" &&
          !n.startsWith("TÄPSUSTADA") &&
          !n.startsWith("erinevad")
        )
      )
    );

    document.getElementById("stat-events").textContent  = events.length;
    document.getElementById("stat-artists").textContent = uniqueArtists.size + "+";
    document.getElementById("site-subtitle").textContent =
      `${minYear}–${maxYear} · isiklik kontserdiajalugu`;

    // Aastavalikud
    for (let y = minYear; y <= maxYear; y++) {
      filterYearStart.add(new Option(y, y));
      filterYearEnd.add(new Option(y, y));
    }
    filterYearStart.value = minYear;
    filterYearEnd.value   = maxYear;

    function updateYearConstraints() {
      const sy = parseInt(filterYearStart.value);
      const ey = parseInt(filterYearEnd.value);
      Array.from(filterYearEnd.options).forEach(o => { o.disabled = parseInt(o.value) < sy; });
      Array.from(filterYearStart.options).forEach(o => { o.disabled = parseInt(o.value) > ey; });
    }
    updateYearConstraints();

    // Kuvamine
    function displayEvents(list) {
      tableBody.innerHTML = "";

      if (list.length === 0) {
        const row = document.createElement("tr");
        row.className = "no-results";
        row.innerHTML = `<td colspan="5">Ühtegi sündmust ei leitud.</td>`;
        tableBody.appendChild(row);
        return;
      }

      // Aasta-eraldajad ainult kuupäevalise sortimise korral
      const showYearSep = !currentSort.column || currentSort.column === "date";
      let prevYear = null;

      list.forEach(ev => {
        const yr = ev.algus.substring(0, 4);

        if (showYearSep && yr !== prevYear) {
          const sep = document.createElement("tr");
          sep.className = "year-sep";
          sep.innerHTML = `<td colspan="5">── ${yr}</td>`;
          tableBody.appendChild(sep);
          prevYear = yr;
        }

        const festival = isFestivalEvent(ev);
        const badge = festival ? `<span class="badge-festival">festival</span>` : "";

        const kuupäevTekst = ev.algus === ev.lõpp
          ? formatDate(ev.algus)
          : `${formatDate(ev.algus)} – ${formatDate(ev.lõpp)}`;

        const artistid = ev.esineja
          .map(e => e.nimi)
          .filter(n => n && n.trim() !== "");
        const artistTekst = artistid.length > 3
          ? artistid.slice(0, 3).join(", ") + ", ..."
          : artistid.join(", ");

        let pildiLahter = `<span class="no-pics">—</span>`;
        if (ev.pildid?.length > 0 && isValidOneDriveLink(ev.pildid[0])) {
          pildiLahter = `<a href="${ev.pildid[0]}" target="_blank" title="Vaata OneDrive">📷</a>`;
        }

        const row = document.createElement("tr");
        row.className = festival ? "row-festival" : "row-normal";
        row.innerHTML = `
          <td class="col-date">${kuupäevTekst}</td>
          <td class="col-event">${ev.sündmus}${badge}</td>
          <td class="col-place">${ev.koht}</td>
          <td class="col-artist">${artistTekst}</td>
          <td class="col-pics">${pildiLahter}</td>
        `;

        row.addEventListener("click", e => {
          if (e.target.closest(".col-pics")) return;
          window.location.href = `event.html?id=${ev.id}`;
        });

        tableBody.appendChild(row);
      });
    }

    // Filtreerimine
    function applyFilters() {
      const q  = searchInput.value.toLowerCase();
      const sy = parseInt(filterYearStart.value);
      const ey = parseInt(filterYearEnd.value);

      return events.filter(ev => {
        const matchesText =
          ev.sündmus.toLowerCase().includes(q) ||
          ev.koht.toLowerCase().includes(q) ||
          ev.esineja.some(e => e.nimi?.toLowerCase().includes(q));

        const evYear = parseInt(ev.algus.substring(0, 4));
        const matchesYear = evYear >= sy && evYear <= ey;

        return matchesText && matchesYear;
      });
    }

    updateView = function () {
      displayEvents(applySortToList(applyFilters()));
    };

    // Sordi päised
    document.querySelectorAll("th[data-sort]").forEach(th => {
      th.addEventListener("click", () => sortByColumn(th.getAttribute("data-sort")));
    });

    // Filtrite kuulajad
    searchInput.addEventListener("input", updateView);

    filterYearStart.addEventListener("change", () => {
      if (parseInt(filterYearStart.value) > parseInt(filterYearEnd.value))
        filterYearEnd.value = filterYearStart.value;
      updateYearConstraints();
      updateView();
    });

    filterYearEnd.addEventListener("change", () => {
      if (parseInt(filterYearEnd.value) < parseInt(filterYearStart.value))
        filterYearStart.value = filterYearEnd.value;
      updateYearConstraints();
      updateView();
    });

    updateView();
  });
