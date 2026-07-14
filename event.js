// Kuupäeva formaat: yyyy-mm-dd → pp.kk.aaaa
function formatDate(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}.${month}.${year}`;
}

// Lihtne SharePoint/OneDrive Business lingi kontroll
function isValidOneDriveLink(url) {
  if (!url) return false;
  if (!url.startsWith("https://")) return false;
  if (!url.includes("sharepoint.com")) return false;
  return true;
}

// Esinejate HTML – festivalidel grupeeritud kuupäeva järgi
function buildEsinejadHtml(esinejad) {
  const list = esinejad.filter(e => e.nimi && e.nimi.trim() !== "");
  if (list.length === 0) return "<p class='puudub'>Esinejad määramata</p>";

  const hasDateInfo = list.some(e => e.kuupäev);

  if (!hasDateInfo) {
    // Lihtne nimekiri ilma kuupäevadeta
    return `<ul class="esineja-list">
      ${list.map(e => `<li>${e.nimi}</li>`).join("")}
    </ul>`;
  }

  // Grupeerime kuupäeva järgi
  const grouped = {};
  const noDate = [];

  list.forEach(e => {
    if (e.kuupäev) {
      if (!grouped[e.kuupäev]) grouped[e.kuupäev] = [];
      grouped[e.kuupäev].push(e.nimi);
    } else {
      noDate.push(e.nimi);
    }
  });

  let html = `<ul class="esineja-list grouped">`;

  Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([date, names]) => {
      html += `
        <li class="esineja-grupp">
          <span class="esineja-kuupäev">${formatDate(date)}</span>
          <ul>${names.map(n => `<li>${n}</li>`).join("")}</ul>
        </li>`;
    });

  // Esinejad ilma kuupäevata (nt "erinevad esinejad")
  noDate.forEach(n => {
    html += `<li class="esineja-lisainfo">${n}</li>`;
  });

  html += `</ul>`;
  return html;
}

// Loeme URL-i parameetri ?id=...
const params = new URLSearchParams(window.location.search);
const eventId = params.get("id");

const titleEl = document.getElementById("event-title");
const detailsEl = document.getElementById("event-details");

fetch("events.json")
  .then(res => res.json())
  .then(events => {
    const ev = events.find(e => e.id === eventId);

    if (!ev) {
      titleEl.textContent = "Sündmust ei leitud";
      detailsEl.innerHTML = `<p><a href="index.html">← Tagasi nimekirja</a></p>`;
      return;
    }

    // Pealkiri
    titleEl.textContent = ev.sündmus;

    // Kuupäev
    let kuupäevTekst = ev.algus === ev.lõpp
      ? formatDate(ev.algus)
      : `${formatDate(ev.algus)} – ${formatDate(ev.lõpp)}`;

    // Esinejad
    const esinejadHtml = buildEsinejadHtml(ev.esineja);

    // Märkmed
    const märkmedHtml = ev.märkmed
      ? `<div class="märkmed-kast"><p class="märkmed-silt">Märkmed</p>${ev.märkmed}</div>`
      : "";

    // OneDrive link
    let onedriveHtml = "";
    if (ev.pildid && ev.pildid.length > 0) {
      const url = ev.pildid[0];
      if (isValidOneDriveLink(url)) {
        onedriveHtml = `<p><strong>Pildid:</strong> <a href="${url}" target="_blank">vaata OneDrive'is</a></p>`;
      } else if (url) {
        onedriveHtml = `<p><strong>Pildid:</strong> <span class="hoiatus">⚠ OneDrive link ei tööta</span></p>`;
      }
    }
    if (!onedriveHtml) {
      onedriveHtml = `<p><strong>Pildid:</strong> <span class="puudub">pildikausta link puudub</span></p>`;
    }

    // Detailvaade
    detailsEl.innerHTML = `
      <p><a href="index.html" class="tagasi-link">← Tagasi nimekirja</a></p>

      <p><strong>Kuupäev:</strong> ${kuupäevTekst}</p>
      <p><strong>Koht:</strong> ${ev.koht}</p>

      <div class="detail-sektsioon">
        <strong>Esinejad:</strong>
        ${esinejadHtml}
      </div>

      ${märkmedHtml}
      ${onedriveHtml}
    `;
  });
