Promise.all([
  fetch('data/spelers.json').then(res => res.json()),
  fetch('data/kalender.json').then(res => res.json())
]).then(([spelers, kalender]) => {
  const container = document.getElementById('tabel-container');

  const vandaag = new Date().toISOString().split('T')[0];

  const datums = kalender
    .filter(d => d.type === 'speeldag' || d.type === 'inhaal')
    .map(d => ({ datum: d.datum, type: d.type }))
    .sort((a, b) => a.datum.localeCompare(b.datum));

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  headerRow.innerHTML = `<th>Speler</th>`;
  datums.forEach(d => {
    const th = document.createElement('th');
    th.classList.add('rotate');
    th.textContent = d.datum;

    if (d.type === 'inhaal') {
      th.style.backgroundColor = 'orange'; // licht oranje
    }

    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  spelers.forEach(speler => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${speler.naam}</td>`;

    datums.forEach(d => {
      const td = document.createElement('td');

      const alleMatchenOpDatum = speler.matchen?.filter(match => match.datum === d.datum) || [];
      const heeftMatchOpDatum = alleMatchenOpDatum.length > 0;

      if (!heeftMatchOpDatum) {
        td.textContent = d.datum > vandaag ? '⏳' : '❌';
        td.classList.add(d.datum > vandaag ? 'toekomst' : 'afwezig');
      } else if (d.type === 'speeldag') {
        td.textContent = '✅';
        td.classList.add('aanwezig');
      } else if (d.type === 'inhaal') {
        // Bij inhaal checken of speler ook al punten had op originele speeldag
        // We zoeken of speler op datum al punten kreeg
        const heeftPuntenGekregen = speler.matchen.some(match => match.datum === d.datum && match.puntenTellen);
        
        if (heeftPuntenGekregen) {
          td.textContent = '✅';
          td.classList.add('aanwezig');
        } else {
          td.textContent = '➖'; // Andere weergave: was aanwezig maar geen punten
          td.classList.add('neutral');
        }
      }

      row.appendChild(td);
    });

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.innerHTML = '';
  container.appendChild(table);
}).catch(err => {
  console.error('Fout bij laden data:', err);
  document.getElementById('tabel-container').textContent = 'Fout bij laden data.';
});
