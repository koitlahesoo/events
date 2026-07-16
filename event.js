// Kuupäeva formaat: yyyy-mm-dd → pp.kk.aaaa
function formatDate(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}.${month}.${year}`;
}

function isValidOneDriveLink(url) {
  if (!url) return false;
  if (!url.startsWith("https://")) return false;
  if (!url.includes("sharepoint.com")) return false;
  return true;
}

// Esinejate HTML – lihtnimekiri või kuupäeva järgi grupeeritud
function buildEsinejadHtml(esinejad) {
  const list = esinejad.filter(e => e.nimi && e.nimi.trim() !== "");
  if (list.length === 0) return `<p class="puudub">Esinejad määramata</p>`;

  const hasDateInfo = list.some(e => e.kuupäev);

  if (!hasDateInfo) {
    return `<ul class="esineja-list">
      ${list.map(e => `<li>${e.nimi}</li>`).join("")}
    </ul>`;
  }

  // Grupeerime kuupäeva järgi
  const grouped = {};
  const noDate  = [];

  list.forEach(e => {
    if (e.kuupäev) {
      if (!grouped[e.kuupäev]) grouped[e.kuupäev] = [];
      grouped[e.kuupäev].push(e.nimi);
    } else {
      noDate.push(e.nimi);
    }
  });

  let html = "";

  Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([date, names]) => {
      html += `
        <div class="esineja-grupp">
          <span class="esineja-kuupäev">${formatDate(date)}</span>
          <ul class="esineja-list">
            ${names.map(n => `<li>${n}</li>`).join("")}
          </ul>
        </div>`;
    });

  noDate.forEach(n => {
    html += `<p class="esineja-lisainfo">${n}</p>`;
  });

  return html;
}

// Loe URL-i parameeter ?id=
const params  = new URLSearchParams(window.location.search);
const eventId = params.get("id");
const detailsEl = document.getElementById("event-details");

fetch("events.json")
  .then(res => res.json())
  .then(events => {
    const ev = events.find(e => e.id === eventId);

    if (!ev) {
      detailsEl.innerHTML = `<p class="puudub">Sündmust ei leitud.</p>`;
      return;
    }

    document.title = `${ev.sündmus} – Koit Lahesoo sündmuste pesa`;

    // Kuupäev
    const kuupäevTekst = ev.algus === ev.lõpp
      ? formatDate(ev.algus)
      : `${formatDate(ev.algus)} – ${formatDate(ev.lõpp)}`;

    // Esinejad
    const esinejadHtml = buildEsinejadHtml(ev.esineja);

    // Märkmed
    const märkmedHtml = ev.märkmed ? `
      <div>
        <div class="detail-section-label">Märkmed</div>
        <div class="märkmed-kast">${ev.märkmed}</div>
      </div>` : "";

    // Pildid
    let pildiHtml = `<p class="puudub">Pildikausta link puudub</p>`;
    if (ev.pildid?.length > 0 && ev.pildid[0]) {
      const url = ev.pildid[0];
      if (isValidOneDriveLink(url)) {
        pildiHtml = `<a href="${url}" target="_blank" class="pildid-link">📷 Vaata OneDrive'is</a>`;
      } else {
        pildiHtml = `<span class="hoiatus">⚠ Link ei tööta</span>`;
      }
    }

    detailsEl.innerHTML = `
      <div class="detail-card">

        <div class="detail-card-header">
          <h2 class="detail-card-title">${ev.sündmus}</h2>
          <div class="detail-card-meta">
            <span>📅 ${kuupäevTekst}</span>
            <span>📍 ${ev.koht}</span>
          </div>
        </div>

        <div class="detail-card-body">

          <div>
            <div class="detail-section-label">Esinejad</div>
            ${esinejadHtml}
          </div>

          ${märkmedHtml}

          <div>
            <div class="detail-section-label">Pildid</div>
            ${pildiHtml}
          </div>

        </div>
      </div>
    `;
  });
