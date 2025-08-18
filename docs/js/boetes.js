fetch('data/spelers.json')
  .then(res => res.json())
  .then(spelers => {
    const lijst = document.getElementById('boetelijst');
    const bedragPerBoete = 0.20;
    let totaalBoetes = 0;

    // Spelers met boetes en bijhorende totaalsom berekenen
    const spelersMetBoetes = spelers
      .filter(speler => speler.boetes && speler.boetes.length > 0)
      .map(speler => {
        const totaal = speler.boetes.reduce((som, b) => som + (parseInt(b.hoeveelheid) || 0), 0);
        totaalBoetes += totaal;
        return {
          ...speler,
          totaalBoetes: totaal
        };
      });

    // Sorteren op totaal aantal boetes
    spelersMetBoetes.sort((a, b) => b.totaalBoetes - a.totaalBoetes);

    let vorigeBoetes = null;
    let plaats = 0;

    spelersMetBoetes.forEach((speler, index) => {
      const totaalBedrag = speler.totaalBoetes * bedragPerBoete;

      if (speler.totaalBoetes !== vorigeBoetes) {
        plaats = index + 1;
        vorigeBoetes = speler.totaalBoetes;
      }
      const rang = plaats;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${getPlaatsIcoon(rang)}</td>
        <td><a href="speler.html?naam=${encodeURIComponent(speler.naam)}">${speler.naam}</a></td>
        <td>${speler.totaalBoetes}</td>
        <td>€ ${totaalBedrag.toFixed(2)}</td>
        <td><button onclick="toggleDetails('${speler.naam.replace(/\s+/g, '_')}')">Toon</button></td>
      `;
      lijst.appendChild(tr);

      // Details rij
      const detailTr = document.createElement('tr');
      detailTr.classList.add('hidden');
      detailTr.id = `details-${speler.naam.replace(/\s+/g, '_')}`;
      detailTr.innerHTML = `
        <td colspan="5" class="details">
          ${speler.boetes.map(b => `${b.datum} – ${b.hoeveelheid} boete(s)`).join('')}
        </td>
      `;
      lijst.appendChild(detailTr);

    });

    // 👉 Totaalregel toevoegen
    const totaalRij = document.createElement('tr');
    totaalRij.classList.add('totaal-rij');
    const totaalBedragAlles = totaalBoetes * bedragPerBoete;

    totaalRij.innerHTML = `
      <td colspan="2"><strong>Totaal</strong></td>
      <td><strong>${totaalBoetes}</strong></td>
      <td><strong>€ ${totaalBedragAlles.toFixed(2)}</strong></td>
      <td></td>
    `;

    lijst.appendChild(totaalRij);
  })
  .catch(err => {
    console.error('Fout bij inladen spelers.json:', err);
    document.getElementById('boetelijst').innerHTML = `<p style="color:red;">Kon spelers niet inladen: ${err.message}</p>`;
  });

function toggleDetails(id) {
  const el = document.getElementById(`details-${id}`);
  if (el) {
    el.classList.toggle('hidden');
  }
}

function getPlaatsIcoon(index) {
  switch (index) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return index;
  }
}