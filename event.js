// Loeme URL-i parameetri ?id=...
const params = new URLSearchParams(window.location.search);
const eventId = params.get("id");

// HTML elemendid
const titleEl = document.getElementById("event-title");
const detailsEl = document.getElementById("event-details");

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

    // OneDrive kausta link
    let pildidHtml = "";
    if (ev.pildid && ev.pildid.length > 0) {
      pildidHtml = `
        <p><strong>Pildid:</strong> 
          <a href="${ev.pildid[0]}" target="_blank">Vaata OneDrive’is</a>
        </p>
      `;
    }

    // Koostame detailvaate HTML-i
    detailsEl.innerHTML = `
      <p><strong>Kuupäev:</strong> ${kuupäevTekst}</p>
      <p><strong>Koht:</strong> ${ev.koht}</p>
      <p><strong>Esinejad:</strong> ${esinejadTekst}</p>
      <p><strong>Märkmed:</strong> ${ev.märkmed}</p>
      ${pildidHtml}
    `;
  });
