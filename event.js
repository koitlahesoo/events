// Loeme URL-i parameetri ?id=...
const params = new URLSearchParams(window.location.search);
const eventId = params.get("id");

// HTML elemendid
const titleEl = document.getElementById("event-title");
const detailsEl = document.getElementById("event-details");

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

// Laeme sündmused
fetch("events.json")
  .then(res => res.json())
  .then(events => {
    const ev = events.find(e => e.id === eventId);

    if (!ev) {
      titleEl.textContent = "Sündmust ei leitud";
      return;
    }

    // Pealkiri
    titleEl.textContent = ev.sündmus;

    // Kuupäevad
    let kuupäevTekst = "";
    if (ev.algus === ev.lõpp) {
      kuupäevTekst = ev.algus;
    } else {
      kuupäevTekst = `${ev.algus} – ${ev.lõpp}`;
    }

    // Esinejad
    const esinejadTekst = ev.esineja
      .map(e => e.kuupäev ? `${e.nimi} (${e.kuupäev})` : e.nimi)
      .join(", ");

    // OneDrive link (kui olemas)
    let onedriveHtml = "<p><em>kontrollin OneDrive linki…</em></p>";

    if (ev.pildid && ev.pildid.length > 0) {
      const url = ev.pildid[0];

      checkOneDriveLink(url).then(result => {
        if (result.ok) {
          onedriveHtml = `
            <p><strong>Pildid:</strong> 
              <a href="${url}" target="_blank">vaata OneDrive</a>
            </p>
          `;
        } else {
          onedriveHtml = `
            <p><strong>Pildid:</strong> 
              <span style="color:red;">⚠ OneDrive link ei tööta: ${result.reason}</span>
            </p>
          `;
        }

        detailsEl.innerHTML = `
          <p><strong>Kuupäev:</strong> ${kuupäevTekst}</p>
          <p><strong>Koht:</strong> ${ev.koht}</p>
          <p><strong>Esinejad:</strong> ${esinejadTekst}</p>
          <p><strong>Märkmed:</strong> ${ev.märkmed}</p>
          ${onedriveHtml}
        `;
      });

    } else {
      // Kui link puudub
      onedriveHtml = `
        <p><strong>Pildid:</strong> 
          <span style="color:gray;">ℹ Pildikausta link puudub</span>
        </p>
      `;

      detailsEl.innerHTML = `
        <p><strong>Kuupäev:</strong> ${kuupäevTekst}</p>
        <p><strong>Koht:</strong> ${ev.koht}</p>
        <p><strong>Esinejad:</strong> ${esinejadTekst}</p>
        <p><strong>Märkmed:</strong> ${ev.märkmed}</p>
        ${onedriveHtml}
      `;
    }
  });
