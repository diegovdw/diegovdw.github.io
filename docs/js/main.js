document.addEventListener('DOMContentLoaded', function () {
  /*kalender pagina*/
  if (document.querySelector('#kalender')) {
    toonKalender();
  }
  /*klassement pagina*/
  if (document.querySelector('#klassement')) {
    Promise.all([
      fetch('data/spelers.json').then(res => res.json()),
      // fetch('data/hoogste_worpen.json').then(res => res.json())
    ])
    .then(([spelers]) => {
      toonKlassement(spelers);
    });
  }
  /*speler pagina*/
  if (document.querySelector('#matchen')) {
    fetch('data/spelers.json')
    .then(response => response.json())
    .then(data => {
      const urlParams = new URLSearchParams(window.location.search);
      const spelerNaam = urlParams.get('naam');

      toonSpelerDetail(data, spelerNaam);
    })
    .catch(error => {
      console.error('Fout bij inladen JSON:', error);
    });
  }

  if (document.querySelector('#speeldag-uitslagen')) {
    fetch('data/spelers.json')
    .then(response => response.json())
    .then(spelers => {
      const urlParams = new URLSearchParams(window.location.search);
      const speeldagDatum = urlParams.get('datum');

      toonMatchenSpeeldag(spelers, speeldagDatum);
    })
    .catch(error => {
      console.error('Fout bij inladen JSON:', error);
    });
  }
});

function toonKlassement(spelers) {
  const tbody = document.querySelector('#klassement tbody');
  tbody.innerHTML = '';

  spelers.sort((a, b) => b.punten - a.punten);

  let vorigePunten = null;
  let plaats = 0;

  spelers.forEach((speler, index) => {
    const hoogsteWorp = speler.hoogsteWorpen?.reduce((max, d) => Math.max(max, d.score || 0), 0);
    const hoogsteUitworp = speler.hoogsteUitworpen?.reduce((max, d) => Math.max(max, d.score || 0), 0);
    const boetes = speler.boetes?.reduce((som, b) => som + b.hoeveelheid, 0);
    
    if (speler.punten !== vorigePunten) {
      plaats = index + 1;
      vorigePunten = speler.punten;
    }
    const rang = plaats;

    const rij = document.createElement('tr');
    rij.innerHTML = `
      <td>${getPlaatsIcoon(rang)}</td>
      <td><a href="speler.html?naam=${encodeURIComponent(speler.naam)}">${speler.naam}</a></td>
      <td>${speler.gespeeld}</td>
      <td>${speler.gewonnen}</td>
      <td>${speler.verloren}</td>
      <td>${speler.legsPlus}</td>
      <td>${speler.legsMin}</td>
      <td><b>${speler.punten}</b></td>
      <td>${hoogsteWorp}</td>
      <td>${hoogsteUitworp}</td>
      <td>${boetes}</td>
    `;
    tbody.appendChild(rij);
  });

  maakKolommenSorteerbaar('klassement'); // als je dit gebruikt
}

function maakKolommenSorteerbaar(tabelId) {
  const headers = document.querySelectorAll(`#${tabelId} thead th`);
  headers.forEach((header, index) => {
    header.style.cursor = 'pointer';
    let oplopend = true;

    header.addEventListener('click', () => {
      const rows = Array.from(document.querySelectorAll(`#${tabelId} tbody tr`));
      rows.sort((a, b) => {
        const cellA = a.children[index].innerText;
        const cellB = b.children[index].innerText;

        const numA = parseFloat(cellA);
        const numB = parseFloat(cellB);

        if (!isNaN(numA) && !isNaN(numB)) {
          return oplopend ? numA - numB : numB - numA;
        } else {
          return oplopend ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
        }
      });

      const tbody = document.querySelector(`#${tabelId} tbody`);
      tbody.innerHTML = '';
      rows.forEach(row => tbody.appendChild(row));
      oplopend = !oplopend;
    });
  });
}

function toonKalender() {
  fetch('data/kalender.json')
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector('#kalender tbody');
      if (!tbody) return;

      const vandaag = new Date().toISOString().split('T')[0];

      // Zoek eerstvolgende datum
      const gesorteerd = data
        .filter(item => item.datum >= vandaag)
        .sort((a, b) => a.datum.localeCompare(b.datum));

      const eerstvolgende = gesorteerd.length > 0 ? gesorteerd[0].datum : null;

      // Sorteer op datum (optioneel)
      data.sort((a, b) => new Date(a.datum) - new Date(b.datum));

      data.forEach(item => {
        const datumLang = capitalize(formatDatumLang(item.datum));
        const rij = document.createElement('tr');

        const typeLabel = item.type === 'inhaal' ? ' (inhaal)' : '';
        const isVolgende = item.datum === eerstvolgende;
        const isVerleden = item.datum < vandaag;

        // Maak klikbaar als in verleden
        if (isVerleden) {
          datumWeergave = `<a href="uitslagen.html?datum=${item.datum}">${datumLang}${typeLabel}</a>`;
        } else if (isVolgende) {
          datumWeergave = `➤ ${datumLang}${typeLabel}`;
        }else{
          datumWeergave = `${datumLang}${typeLabel}`;
        }

        rij.innerHTML = `
          <td>${datumWeergave}</td>
          <td>${item.tijd}</td>
        `;
        tbody.appendChild(rij);
      });
    })
    .catch(error => console.error('Fout bij laden kalender:', error));
}

function toonScoresMetTeller(scoreList, containerId, soort) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  if (!scoreList || scoreList.length === 0) {
    container.innerHTML = `<p>Geen ${soort} geregistreerd.</p>`;
    return;
  }

  const gegroepeerd = {};

  scoreList.forEach(({ score, datum, hoeveelheid }) => {
    if (!gegroepeerd[score]) gegroepeerd[score] = {};
    if (!gegroepeerd[score][datum]) gegroepeerd[score][datum] = 0;
    gegroepeerd[score][datum] += hoeveelheid;
  });

  Object.entries(gegroepeerd)
    .sort((a, b) => b[0] - a[0])
    .reverse()
    .forEach(([score, datums], index) => {
      const totaal = Object.values(datums).reduce((sum, val) => sum + val, 0);

      const wrapper = document.createElement('div');
      wrapper.className = 'score-group';

      const header = document.createElement('div');
      header.className = 'score-header';

      const title = document.createElement('span');
      title.textContent = `${score} × ${totaal}`;

      const button = document.createElement('button');
      button.textContent = 'Toon details';
      const detailsId = `details_${containerId}_${score}_${index}`;

      const details = document.createElement('div');
      details.className = 'score-details';
      details.id = detailsId;

      Object.entries(datums)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([datum, aantal]) => {
          const p = document.createElement('p');
          p.textContent = `${datum} × ${aantal}`;
          details.appendChild(p);
        });

      button.onclick = () => {
        details.classList.toggle('open');
        button.textContent = details.classList.contains('open') ? 'Verberg details' : 'Toon details';
      };

      header.appendChild(title);
      header.appendChild(button);

      wrapper.appendChild(header);
      wrapper.appendChild(details);
      container.appendChild(wrapper);
    });
}

function toonSpelerDetail(spelers, naam) {
  const speler = spelers.find(s => s.naam === naam);
  if (!speler) {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('speler-naam').textContent = `Speler: ${speler.naam}`;

  // Matchen ophalen
  const tbody = document.querySelector('#matchen tbody');
  speler.matchen.forEach(match => {
    const rij = document.createElement('tr');
    if(!match.puntenTellen) rij.setAttribute("class","score-notcounting")
    rij.innerHTML = `
      <td>${match.datum}</td>
      <td>${match.tegenstander}</td>
      <td>${match.uitslag}</td>
    `;
    tbody.appendChild(rij);
  });

  // Hoogste Worpen ophalen
  toonScoresMetTeller(speler.hoogsteWorpen, 'hoogste-worpen', 'hoogste worpen');
  toonScoresMetTeller(speler.hoogsteUitworpen, 'hoogste-uitworpen', 'hoogste uitworpen');

  // Boetes ophalen
  const boetesbody = document.querySelector('#boetes tbody');
  if (!speler.boetes || speler.boetes.length === 0) {
    boetesbody.innerHTML = `<p>Geen Boetes geregistreerd.</p>`;
  }else{
    speler.boetes.forEach(boete => {
    const rij = document.createElement('tr');
    rij.innerHTML = `
      <td>${boete.datum}</td>
      <td>${boete.hoeveelheid}</td>
    `;
    boetesbody.appendChild(rij);
  });
  }

  // Grafiek Ranking ophalen
  fetch('data/ranglijsten.json')
  .then(res => res.json())
  .then(ranglijsten => {
    const spelerPosities = [];
    const labels = [];

    ranglijsten.forEach(week => {
      labels.push(week.datum);

      const positie = week.klassement.find(p => p.naam === speler.naam)?.positie ?? null;
      spelerPosities.push(positie);
    });

    toonRankingGrafiek(labels, spelerPosities, speler.naam, spelers.length);
  });

}

function toonRankingGrafiek(labels, data, spelerNaam, aantalSpelers) {
  const ctx = document.getElementById('rankingChart').getContext('2d');
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `Ranking van ${spelerNaam}`,
        data: data,
        borderColor: 'blue',
        backgroundColor: 'rgba(0, 0, 255, 0.1)',
        tension: 0.3,
        spanGaps: true
      }]
    },
    options: {
      scales: {
        y: {
          reverse: true, // 1 bovenaan
          beginAtZero: false,
          ticks: {
            precision: 0
          },
          title: {
            display: true,
            text: 'Positie'
          },
          min: 1,
          max: parseInt(aantalSpelers, 10)
        },
        x: {
          title: {
            display: true,
            text: 'Speeldag'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

function toonMatchenSpeeldag(spelers, speeldagDatum) {

  const alleMatchen = laadAlleMatchen(spelers)

  const speeldagMatchen = alleMatchen.filter(m => m.datum === speeldagDatum);
  const tbody = document.getElementById('speeldag-uitslagen');

  if (speeldagMatchen.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3">Geen matchen gevonden voor ${speeldagDatum}</td></tr>`;
    return;
  }

  speeldagMatchen.forEach(match => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${match.speler}</td>
      <td>${match.uitslag}</td>
      <td>${match.tegenstander}</td>
    `;
    tbody.appendChild(tr);
  });
}




// HELPERFUNCTIONS
function formatDatumLang(datumShort) {
  const datum = new Date(datumShort);
  return new Intl.DateTimeFormat('nl-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(datum);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getPlaatsIcoon(index) {
  switch (index) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return index;
  }
}
function laadAlleMatchen(spelers) {
  
  const uniekeMatchIDs = new Set();
  const alleMatchen = [];

  spelers.forEach(speler => {
    if (!speler.matchen) return;

    speler.matchen.forEach(match => {
      if (!uniekeMatchIDs.has(match.id)) {
        uniekeMatchIDs.add(match.id);

        // Voeg toe met wie de match was (deze speler + tegenstander)
        alleMatchen.push({
          id: match.id,
          datum: match.datum,
          speler: speler.naam,
          tegenstander: match.tegenstander,
          uitslag: match.uitslag
        });
      }
    });
  });

  return alleMatchen
}