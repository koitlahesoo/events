// Loeme URL-i parameetri ?id=...
const params = new URLSearchParams(window.location.search);
const eventId = params.get("id");

// HTML elemendid
const titleEl = document.getElementById("event-title");
const detailsEl = document.getElementById("event-details");

// Lihtne SharePoint/OneDrive Business lingi kontroll
function isValidOneDriveLink(url) {
  if (!url) return false;
  if (!url.startsWith("https://")) return false;
  if (!url.includes("sharepoint.com")) return false;
  return true;
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

    // OneDrive link
    let onedriveHtml = "";

    if (ev.pildid && ev.pildid.length > 0) {
      const url = ev.pildid[0];

      if (isValidOneDriveLink(url)) {
        onedriveHtml = `
          <p><strong>Pildid:</strong>
            <a href="${url}" target="_blank">vaata OneDrive</a>
          </p>
        `;
      } else {
        onedriveHtml = `
          <p><strong>Pildid:</strong>
            <span style="color:red;">⚠ OneDrive link ei tööta</span>
          </p>
        `;
      }

    } else {
      onedriveHtml = `
        <p><strong>Pildid:</strong>
          <span style="color:gray;">ℹ Pildikausta link puudub</span>
        </p>
      `;
    }

    // Koostame detailvaate HTML-i
    detailsEl.innerHTML = `
      <p><strong>Kuupäev:</strong> ${kuupäevTekst}</p>
      <p><strong>Koht:</strong> ${ev.koht}</p>
      <p><strong>Esinejad:</strong> ${esinejadTekst}</p>
      <p><strong>Märkmed:</strong> ${ev.märkmed}</p>
      ${onedriveHtml}
    `;
  });
