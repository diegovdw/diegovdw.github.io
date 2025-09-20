document.addEventListener('DOMContentLoaded', function () {
  
  // Klassemment page
  if (document.title === "Klassement") {
    Promise.all([
      fetch('assets/data/spelers.json').then(res => res.json())
    ])
    .then(([spelers]) => {
      toonKlassement(spelers);
    });
  }

  // Speler page
  if (document.title === "Speler Detail") {
    Promise.all([
      fetch('assets/data/spelers.json').then(res => res.json()),
      fetch('assets/data/ranglijsten.json').then(res => res.json())
    ]).then(([spelers,ranglijsten]) => {
      const urlParams = new URLSearchParams(window.location.search);
      const spelerNaam = urlParams.get('naam');

      toonSpelerDetails(spelers, ranglijsten, spelerNaam);
    })
    .catch(error => {
      console.error('Fout bij inladen JSON:', error);
    });
  }

  // Kalender page
  if (document.title === "Kalender") {
    Promise.all([
      fetch('assets/data/kalender.json').then(res => res.json())
    ]).then(([kalender]) => {

      toonKalender(kalender);
    })
    .catch(error => {
      console.error('Fout bij inladen JSON:', error);
    });
  }

  // Uitslagen page
  if (document.title === "Uitslagen") {
    Promise.all([
      fetch('assets/data/spelers.json').then(res => res.json())
    ])
    .then(([spelers]) => {
      const urlParams = new URLSearchParams(window.location.search);
      const speeldagDatum = urlParams.get('datum');

      

      toonSpeeldagDetails(spelers, speeldagDatum);
    });
  }

  // Boetes page
  if (document.title === "Boetes") {
    Promise.all([
      fetch('assets/data/spelers.json').then(res => res.json())
    ]).then(([spelers]) => {

      toonAlleBoetes(spelers);
    })
    .catch(error => {
      console.error('Fout bij inladen JSON:', error);
    });
  }

  // Aanwezigheden page
  if (document.title === "Aanwezigheden") {
    Promise.all([
      fetch('assets/data/spelers.json').then(res => res.json()),
      fetch('assets/data/kalender.json').then(res => res.json())
    ]).then(([spelers,kalender]) => {

      toonAanwezigheden(spelers, kalender)
    })
    .catch(error => {
      console.error('Fout bij inladen JSON:', error);
    });
  }

});

//#region FUNCTIONS



//#region klassement

function toonKlassement(spelers) {
  const tbody = document.querySelector('#klassement tbody');
  // spelers.sort((a, b) => b.punten - a.punten);
  spelers.sort((a, b) => {
    // 1. Punten
    if (b.punten !== a.punten) return b.punten - a.punten;

    // 2. Legverschil
    const legDiffA = a.legsPlus - a.legsMin;
    const legDiffB = b.legsPlus - b.legsMin;
    if (legDiffB !== legDiffA) return legDiffB - legDiffA;

    // 3. Gewonnen wedstrijden
    if (b.gewonnen !== a.gewonnen) return b.gewonnen - a.gewonnen;

    // 4. Alfabetisch op naam als laatste tie-breaker
    return a.naam.localeCompare(b.naam);
  });

  let vorigePunten = null;
  let plaats = 0;

  if(spelers.length === 0){
    const tr = document.createElement('tr');
    //Geen boetes
    const tdBoetes = document.createElement('td');
    tdBoetes.colSpan = 11
    tdBoetes.innerHTML = `Nog geen matchen gespeeld`
    tdBoetes.className = "px-6 py-4 whitespace-nowrap text-center"
    tr.appendChild(tdBoetes)
    tbody.appendChild(tr);
    return
  }

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
    //rang
    const rangTd = document.createElement('td');
    rangTd.classList = "px-6 py-4 whitespace-nowrap text-center"
    rangTd.innerHTML = `${getPlaatsIcoon(rang)}`
    rij.appendChild(rangTd)
    //speler
    const spelerTd = document.createElement('td');
    spelerTd.classList = "px-6 py-4 whitespace-nowrap text-center hover:text-slate-500 cursor-pointer sticky left-0 bg-white"
    spelerTd.innerHTML = `${speler.naam}`
    spelerTd.addEventListener('click', () => {
      location.href = `speler.html?naam=${encodeURIComponent(speler.naam)}`;
    });
    rij.appendChild(spelerTd)
    //punten
    const puntenTd = document.createElement('td');
    puntenTd.classList = "px-6 py-4 whitespace-nowrap text-center font-bold"
    puntenTd.innerHTML = `${speler.punten}`
    rij.appendChild(puntenTd)
    //gespeeld
    const gespeeldTd = document.createElement('td');
    gespeeldTd.classList = "px-6 py-4 whitespace-nowrap text-center"
    gespeeldTd.innerHTML = `${speler.gespeeld}`
    rij.appendChild(gespeeldTd)
    //gewonnen
    const gewonnenTd = document.createElement('td');
    gewonnenTd.classList = "px-6 py-4 whitespace-nowrap text-center"
    gewonnenTd.innerHTML = `${speler.gewonnen}`
    rij.appendChild(gewonnenTd)
    //verloren
    const verlorenTd = document.createElement('td');
    verlorenTd.classList = "px-6 py-4 whitespace-nowrap text-center"
    verlorenTd.innerHTML = `${speler.verloren}`
    rij.appendChild(verlorenTd)
    //legsPlus
    const legsPlusTd = document.createElement('td');
    legsPlusTd.classList = "px-6 py-4 whitespace-nowrap text-center"
    legsPlusTd.innerHTML = `${speler.legsPlus}`
    rij.appendChild(legsPlusTd)
    //legsMin
    const legsMinTd = document.createElement('td');
    legsMinTd.classList = "px-6 py-4 whitespace-nowrap text-center"
    legsMinTd.innerHTML = `${speler.legsMin}`
    rij.appendChild(legsMinTd)
    //hoogsteWorp
    const hoogsteWorpTd = document.createElement('td');
    hoogsteWorpTd.classList = "px-6 py-4 whitespace-nowrap text-center"
    hoogsteWorpTd.innerHTML = `${hoogsteWorp}`
    rij.appendChild(hoogsteWorpTd)
    //hoogsteUitworp
    const hoogsteUitworpTd = document.createElement('td');
    hoogsteUitworpTd.classList = "px-6 py-4 whitespace-nowrap text-center"
    hoogsteUitworpTd.innerHTML = `${hoogsteUitworp}`
    rij.appendChild(hoogsteUitworpTd)
    //boetes
    const boetesTd = document.createElement('td');
    boetesTd.classList = "px-6 py-4 whitespace-nowrap text-center"
    boetesTd.innerHTML = `${boetes}`
    rij.appendChild(boetesTd)
    
    tbody.appendChild(rij);
  });
}

//#endregion

//#region spelerpagina

function toonSpelerDetails(spelers, ranglijsten, naam) {
  const speler = spelers.find(s => s.naam === naam);
  if (!speler) {
    window.location.href = 'index.html';
    return;
  }

  // Naam tonen
  document.getElementById('speler-naam').textContent = `Spelerstatistieken van ${speler.naam}`;

  //#region Statistieken tonen in de cards
  //Ranking
  const currentRanking = getLatestRank(ranglijsten, speler.naam)
  document.getElementById('speler-stats-rank').textContent = `${currentRanking}`;
  
  //Gewonnen
  const currentGewonnen = speler.gewonnen
  document.getElementById('speler-stats-gewonnen').textContent = `${currentGewonnen}`;
  
  //Verloren
  const currentVerloren = speler.verloren
  document.getElementById('speler-stats-verloren').textContent = `${currentVerloren}`;

  //Legs +-
  const currentlegsdiff = speler.legsPlus - speler.legsMin
  document.getElementById('speler-stats-legsdiff').textContent = `${currentlegsdiff}`;

  //Boetes
  const currentBoetes = speler.boetes?.reduce((som, b) => som + b.hoeveelheid, 0);
  document.getElementById('speler-stats-boetes').textContent = `${currentBoetes}`;

  //Punten
  const currentPunten = speler.punten
  document.getElementById('speler-stats-punten').textContent = `${currentPunten}`;

  //Vorige speeldag statistieken
  if(speler.vorigeData.punten){
    //Ranking
    const previousRanking = getPreviousRank(ranglijsten, speler.naam)
    toonStatsHistory(currentRanking, previousRanking, 'speler-stats-rank-previous', true, true)

    //Gewonnen
    const previousGewonnen = speler.vorigeData.gewonnen
    toonStatsHistory(currentGewonnen, previousGewonnen, 'speler-stats-gewonnen-previous')

    //Verloren
    const previousVerloren = speler.vorigeData.verloren
    toonStatsHistory(currentVerloren, previousVerloren, 'speler-stats-verloren-previous', true, false)

    //Legs +-
    const previouslegsdiff = speler.vorigeData.legsPlus - speler.vorigeData.legsMin
    toonStatsHistory(currentlegsdiff, previouslegsdiff, 'speler-stats-legsdiff-previous')

    //Boetes
    const latestDate = speler.boetes?.reduce((latest, b) => { return new Date(b.datum) > new Date(latest) ? b.datum : latest; }, speler.boetes[0]?.datum || null);
    const filtered = speler.boetes?.filter(b => b.datum !== latestDate);
    const previousBoetes = filtered.reduce((sum, b) => sum + b.hoeveelheid, 0);
    toonStatsHistory(currentBoetes, previousBoetes, 'speler-stats-boetes-previous', true, false)

    //Punten
    const previousPunten = speler.vorigeData.punten
    toonStatsHistory(currentPunten, previousPunten, 'speler-stats-punten-previous')
  }

  //#endregion

  // Tabel Wedstrijden
  const matchenTbody = document.querySelector('#speler-stats-matchen tbody');

  // Eerst groeperen per datum
  const matchenPerDatum = speler.matchen.reduce((acc, match) => {
    if (!acc[match.datum]) acc[match.datum] = [];
    acc[match.datum].push(match);
    return acc;
  }, {});

  // Renderen
  Object.entries(matchenPerDatum).forEach(([datum, matchen]) => {
    // Header-rij voor de datum
    const headerRow = document.createElement('tr');
    headerRow.classList = "cursor-pointer";
    // Datum
    const tdDatum = document.createElement('td');
    tdDatum.classList = "px-6 py-2 font-bold text-center";
    tdDatum.innerHTML = datum;
    headerRow.appendChild(tdDatum);
    // Lege cellen
    const tdEmpty = document.createElement('td');
    tdEmpty.colSpan = 3
    tdEmpty.classList = "px-6 py-2 text-center";
    tdEmpty.innerHTML = matchen[0].groep;
    headerRow.appendChild(tdEmpty);
    // Arrow cel
    const tdArrow = document.createElement('td');
    tdArrow.classList = "px-6 py-2 font-bold text-center";
    const arrowIcon = document.createElement('i');
    arrowIcon.classList = "fas fa-arrow-down transition-transform duration-300"; 
    // transition-transform zorgt voor een vloeiende draai
    tdArrow.appendChild(arrowIcon);
    headerRow.appendChild(tdArrow);

    matchenTbody.appendChild(headerRow);

    // Container-rijen voor de matchen (standaard verborgen)
    matchen.forEach(match => {
      const rij = document.createElement('tr');
      rij.classList.add("hidden"); // standaard onzichtbaar
      if (!match.puntenTellen) rij.classList.add("bg-gray-200");

      // Datum lege cel
      const tdEmpty = document.createElement('td');
      tdEmpty.classList = "px-6 py-4 whitespace-nowrap text-center";
      tdEmpty.innerHTML = `${!match.puntenTellen ? 'Telt niet':''}`
      rij.appendChild(tdEmpty);

      // Thuis
      const tdThuis = document.createElement('td');
      tdThuis.classList = "px-6 py-4 whitespace-nowrap text-center hover:text-slate-500 cursor-pointer";
      tdThuis.innerHTML = `${match.thuis}`;
      tdThuis.addEventListener('click', () => {
        location.href = `speler.html?naam=${encodeURIComponent(match.thuis)}`;
      });
      rij.appendChild(tdThuis);

      // Uitslag
      const tdUitslag = document.createElement('td');
      tdUitslag.classList = "px-6 py-4 whitespace-nowrap text-center";
      tdUitslag.innerHTML = `${match.uitslag}`;
      rij.appendChild(tdUitslag);

      // Uit
      const tdUit = document.createElement('td');
      tdUit.classList = "px-6 py-4 whitespace-nowrap text-center hover:text-slate-500 cursor-pointer";
      tdUit.innerHTML = `${match.uit}`;
      tdUit.addEventListener('click', () => {
        location.href = `speler.html?naam=${encodeURIComponent(match.uit)}`;
      });
      rij.appendChild(tdUit);

      // Opnieuw lege cel
      const tdEmpty2 = document.createElement('td');
      rij.appendChild(tdEmpty2);

      matchenTbody.appendChild(rij);

      // Koppel rij aan de headerRow (zodat we ze samen kunnen togglen)
      if (!headerRow.matchRows) headerRow.matchRows = [];
      headerRow.matchRows.push(rij);
    });

    // Klik event om de matches te togglen
    headerRow.addEventListener("click", () => {
      headerRow.matchRows.forEach(r => r.classList.toggle("hidden"));
      arrowIcon.classList.toggle("rotate-180");
    });
  });

  // Worpen tonen
  toonHoogsteWorp(speler.hoogsteWorpen,"speler-stats-hoogsteworp","hoogste worpen")
  toonHoogsteWorp(speler.hoogsteUitworpen,"speler-stats-hoogsteuitworp","hoogste uitworpen")

  // Grafiek Ranking verloop
  toonRankingGrafiek(ranglijsten, speler.naam, spelers.length);

}

function toonHoogsteWorp(scoreList, containerId, soortWorp) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  if (!scoreList || scoreList.length === 0) {
    container.innerHTML = `<p class="flex w-full items-start gap-x-5 justify-between rounded-lg text-left font-bold text-slate-900 focus:outline-none p-5">Geen ${soortWorp} geregistreerd.</p>`;
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
    .forEach(([score, datums], index) => {
      const totaal = Object.values(datums).reduce((sum, val) => sum + val, 0);
      
      const dropdownbutton = document.createElement('button');
      dropdownbutton.className = 'question-btn flex w-full items-start gap-x-5 justify-between rounded-lg text-left font-bold text-slate-900 focus:outline-none p-5';
      dropdownbutton.setAttribute('data-toggle', `${containerId}-hoogsteworp-${score}`);

      const buttonspan = document.createElement('span');
      buttonspan.textContent = `${score} × ${totaal}`;
      const buttonarrow = document.createElement('i');
      buttonarrow.className = 'fas fa-arrow-down mr-1 transition-transform duration-300'

      const dropdownAnswer = document.createElement('div');
      dropdownAnswer.className = 'answer pt-2 pb-5 px-5 text-sm lg:text-base text-[#343E3A] font-medium text-center'
      dropdownAnswer.style.display = 'none'
      dropdownAnswer.id = `${containerId}-hoogsteworp-${score}`;

      Object.entries(datums)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([datum, aantal]) => {
          const p = document.createElement('p');
          p.textContent = `${datum} × ${aantal}`;
          dropdownAnswer.appendChild(p);
        });

      dropdownbutton.onclick = (event) => {
        const btn = event.currentTarget;
        const targetId = btn.getAttribute('data-toggle');
        const target = document.getElementById(targetId);
        const isExpanded = target.style.display === 'block';

        if (isExpanded) {
            target.style.display = 'none';
            btn.querySelector('i').classList.remove('rotate-180');
        } else {
            target.style.display = 'block';
            btn.querySelector('i').classList.add('rotate-180');
        }
      };

      dropdownbutton.appendChild(buttonspan);
      dropdownbutton.appendChild(buttonarrow);

      container.appendChild(dropdownbutton);
      container.appendChild(dropdownAnswer);
    });
}

function toonRankingGrafiek(ranglijsten, spelerNaam, aantalSpelers) {
  
  const spelerPosities = [];
  const labels = [];
  ranglijsten.forEach(week => {
    labels.push(week.datum);
    const positie = week.klassement.find(p => p.naam === spelerNaam)?.positie ?? null;
    spelerPosities.push(positie);
  });


  const ctx = document.getElementById('rankingChart').getContext('2d');
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `Ranking van ${spelerNaam}`,
        data: spelerPosities,
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

function toonStatsHistory(currentRanking, previousRanking, containerId, reverseColor = false, reverseArrow = false) {
    const container = document.getElementById(containerId);

    let trend
    let trendColor
    let trendDifference

    if(parseInt(currentRanking, 10) > parseInt(previousRanking, 10)){
        trend = reverseArrow ? "arrow-down" : "arrow-up"
        trendColor = reverseColor ? "red" : "green"
        trendDifference = parseInt(currentRanking, 10) - parseInt(previousRanking, 10)
    }else if(parseInt(currentRanking, 10) < parseInt(previousRanking, 10)){
        trend = reverseArrow ? "arrow-up" : "arrow-down"
        trendColor = reverseColor ? "green" : "red"
        trendDifference = parseInt(previousRanking, 10) - parseInt(currentRanking, 10)
    }else{
        trend = "equals"
        trendColor = "orange"
        trendDifference = parseInt(currentRanking, 10) - parseInt(previousRanking, 10)
    }

    const historyspan1 =  document.createElement('span');
    historyspan1.className = `text-${trendColor}-600 text-sm font-medium flex items-center`
    const historyspan1logo =  document.createElement('i');
    historyspan1logo.className = `fas fa-${trend} mr-1`
    const historyspan1text =  document.createElement('p');
    historyspan1text.textContent = `${trendDifference}`

    const historyspan2 =  document.createElement('span');
    historyspan2.className = `text-gray-600 text-sm ml-2`
    historyspan2.textContent = `vs vorige maand`

    historyspan1.appendChild(historyspan1logo);
    historyspan1.appendChild(historyspan1text);

    container.appendChild(historyspan1);
    container.appendChild(historyspan2);

}
//#endregion

//#region kalender

function toonKalender(kalender) {
  const tbody = document.querySelector('#kalender tbody');
  if (!tbody) return;

  const vandaag = new Date().toISOString().split('T')[0];

  // Zoek eerstvolgende datum
  const gesorteerd = kalender
    .filter(item => item.datum >= vandaag)
    .sort((a, b) => a.datum.localeCompare(b.datum));

  const eerstvolgende = gesorteerd.length > 0 ? gesorteerd[0].datum : null;

  // Sorteer op datum (optioneel)
  kalender.sort((a, b) => new Date(a.datum) - new Date(b.datum));

  kalender.forEach(item => {
    const datumLang = capitalize(formatDatumLong(item.datum));
    const rij = document.createElement('tr');

    const typeLabel = item.type === 'inhaal' ? 'inhaal' : '';
    const isVolgende = item.datum === eerstvolgende;
    const isVerleden = item.datum < vandaag;

    // Maak klikbaar als in verleden
    if (isVerleden) {
      rij.className = "text-blue-900 hover:text-slate-500 cursor-pointer"
      rij.addEventListener('click', () => {
        location.href = `uitslagen.html?datum=${item.datum}`;
      });
    }

    datumWeergave = `${datumLang}${typeLabel}`;

    rij.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-center">${isVolgende ? '➤':''}</td>
      <td class="px-6 py-4 whitespace-nowrap text-center">${datumLang}</td>
      <td class="px-6 py-4 whitespace-nowrap text-center">${typeLabel}</td>
      <td class="px-6 py-4 whitespace-nowrap text-center">${item.tijd}</td>
    `;
    tbody.appendChild(rij);
  });
}

//#endregion

//#region uitslagen

function toonSpeeldagDetails(spelers, speeldagDatum) {
  const alleMatchen = laadAlleMatchen(spelers)
  const speeldagMatchen = alleMatchen.filter(m => m.datum === speeldagDatum);
  const speeldagSpelers = []
  let speeldagLegCount = 0

  speeldagMatchen.forEach(match => {
    if(!speeldagSpelers.includes(match.speler)){
      speeldagSpelers.push(match.speler)
    }
    if(!speeldagSpelers.includes(match.speler)){
      speeldagSpelers.push(match.tegenstander)
    }

    speeldagLegCount += parseInt(match.uitslag.split("-")[0],10)
    speeldagLegCount += parseInt(match.uitslag.split("-")[1],10)

  })

  let speeldagBoetes = 0
  const hoogsteWorpenSpeeldag = []
  const hoogsteUitworpenSpeeldag = []

  spelers.forEach((speler) => {
    //Boetes logica
    const boetes = speler.boetes.filter(b => b.datum === speeldagDatum)
    boetes.forEach((boete) =>{
      speeldagBoetes += boete.hoeveelheid
    })

    //Hoogste Worp logica
    const hoogsteWorpen = speler.hoogsteWorpen.filter(w => w.datum === speeldagDatum)
    hoogsteWorpen.forEach((hoogsteWorp) =>{
      hoogsteWorpenSpeeldag.push({
          datum: hoogsteWorp.datum,
          score: hoogsteWorp.score,
          hoeveelheid: hoogsteWorp.hoeveelheid,
          speler: speler.naam
        })
    })

    //Hoogste Uitworp logica
    const hoogsteUitworpen = speler.hoogsteUitworpen.filter(w => w.datum === speeldagDatum)
    hoogsteUitworpen.forEach((hoogsteUitworp) =>{
      hoogsteUitworpenSpeeldag.push({
          datum: hoogsteUitworp.datum,
          score: hoogsteUitworp.score,
          hoeveelheid: hoogsteUitworp.hoeveelheid,
          speler: speler.naam
        })
    })
  })

  //Speeldag tonen
  document.getElementById('speeldag-datum').textContent = `Uitslagen speeldag ${speeldagDatum}`;

  //#region Statistieken tonen in de cards
  //Spelers aanwezig
  document.getElementById('speeldag-stats-aanwezig').textContent = `${speeldagSpelers.length}`;

  //Gespeelde Matches
  document.getElementById('speeldag-stats-gespeeld').textContent = `${speeldagMatchen.length}`;

  //Gespeelde Legs
  document.getElementById('speeldag-stats-legs').textContent = `${speeldagLegCount}`;

  //Boetes
  document.getElementById('speeldag-stats-boetes').textContent = `${speeldagBoetes}`;

  //Hoogste Worp
  const hoogsteWorpSpeeldag = hoogsteWorpenSpeeldag.sort((a, b) => b.score - a.score || b.hoeveelheid - a.hoeveelheid)[0];
  if(hoogsteWorpSpeeldag){
    document.getElementById('speeldag-stats-hoogsteworp').innerHTML = `<b>${hoogsteWorpSpeeldag.score}</b>${hoogsteWorpSpeeldag.hoeveelheid > 1 ? ` x ${hoogsteWorpSpeeldag.hoeveelheid}`:""}`;
    document.getElementById('speeldag-stats-hoogsteworp-speler').innerHTML = `<span class="text-sm font-medium flex items-center">${hoogsteWorpSpeeldag.speler}</span>`;
  }else{
    document.getElementById('speeldag-stats-hoogsteworp').innerHTML = `NvT`;
  }

  //Hoogste Uitworp
  const hoogsteUitworpSpeeldag = hoogsteUitworpenSpeeldag.sort((a, b) => b.score - a.score || b.hoeveelheid - a.hoeveelheid)[0];
  if(hoogsteUitworpSpeeldag){
    document.getElementById('speeldag-stats-hoogsteuitworp').innerHTML = `<b>${hoogsteUitworpSpeeldag.score}</b>${hoogsteUitworpSpeeldag.hoeveelheid > 1 ? ` x ${hoogsteUitworpSpeeldag.hoeveelheid}`:""}`;
    document.getElementById('speeldag-stats-hoogsteuitworp-speler').innerHTML = `<span class="text-sm font-medium flex items-center">${hoogsteUitworpSpeeldag.speler}</span>`;
  }else{
    document.getElementById('speeldag-stats-hoogsteuitworp').innerHTML = `NvT`;
  }

  const matchenTbody = document.querySelector('#speeldag-stats-matchen tbody');
  matchenTbody.innerHTML = ''; // leegmaken

  // Groeperen op groep
  const matchenPerGroep = {};
  speeldagMatchen.forEach(match => {
    const groep = match.groep || 'Geen groep';
    if (!matchenPerGroep[groep]) matchenPerGroep[groep] = [];
    matchenPerGroep[groep].push(match);
  });

  Object.entries(matchenPerGroep).forEach(([groep, matchen]) => {
    // Header row voor de groep
    const headerRow = document.createElement('tr');

    const tdGroep = document.createElement('td');
    // tdGroep.colSpan = 4; // past bij de originele 5 kolommen van je table
    tdGroep.classList = "px-6 py-2 font-bold text-center";
    tdGroep.textContent = groep;
    headerRow.appendChild(tdGroep);

    // Lege cellen
    const tdEmpty = document.createElement('td');
    tdEmpty.colSpan = 3
    headerRow.appendChild(tdEmpty);

    // Arrow cel
    const tdArrow = document.createElement('td');
    tdArrow.classList = "px-6 py-2 font-bold text-center";
    const arrowIcon = document.createElement('i');
    arrowIcon.classList = "fas fa-arrow-down transition-transform duration-300";
    tdArrow.appendChild(arrowIcon);
    headerRow.appendChild(tdArrow);

    matchenTbody.appendChild(headerRow);

    // Match-rijen (standaard verborgen)
    matchen.forEach(match => {
      const rij = document.createElement('tr');
      rij.classList.add("hidden"); // standaard onzichtbaar

      // Kolommen behouden van originele functie
      const tdGroep = document.createElement('td');
      tdGroep.classList = "px-6 py-4 whitespace-nowrap text-center";
      // tdGroep.innerHTML = match.groep;
      rij.appendChild(tdGroep);

      const tdThuis = document.createElement('td');
      tdThuis.classList = "px-6 py-4 whitespace-nowrap text-center hover:text-slate-500 cursor-pointer";
      tdThuis.innerHTML = match.thuis;
      tdThuis.addEventListener('click', () => {
        location.href = `speler.html?naam=${encodeURIComponent(match.thuis)}`;
      });
      rij.appendChild(tdThuis);

      const tdUitslag = document.createElement('td');
      tdUitslag.classList = "px-6 py-4 whitespace-nowrap text-center";
      tdUitslag.innerHTML = match.uitslag;
      rij.appendChild(tdUitslag);

      const tdUit = document.createElement('td');
      tdUit.classList = "px-6 py-4 whitespace-nowrap text-center hover:text-slate-500 cursor-pointer";
      tdUit.innerHTML = match.uit;
      tdUit.addEventListener('click', () => {
        location.href = `speler.html?naam=${encodeURIComponent(match.uit)}`;
      });
      rij.appendChild(tdUit);

      // Extra lege cel voor spacing (originele layout)
      const tdEmpty = document.createElement('td');
      rij.appendChild(tdEmpty);

      matchenTbody.appendChild(rij);

      // Toggle koppeling
      if (!headerRow.matchRows) headerRow.matchRows = [];
      headerRow.matchRows.push(rij);
    });

    // Klik event toggle
    headerRow.addEventListener("click", () => {
      headerRow.matchRows.forEach(r => r.classList.toggle("hidden"));
      arrowIcon.classList.toggle("rotate-180");
    });
  });
}



//#endregion

//#region boetes

function toonAlleBoetes(spelers) {
  const tbody = document.querySelector('#boetes tbody');
  const bedragPerBoete = 0.20;
  let totaalBoetes = 0;

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

  spelersMetBoetes.sort((a, b) => b.totaalBoetes - a.totaalBoetes);

  let vorigeBoetes = null;
  let plaats = 0;

  if(spelersMetBoetes.length === 0){
    const tr = document.createElement('tr');
    //Geen boetes
    const tdBoetes = document.createElement('td');
    tdBoetes.colSpan = 5
    tdBoetes.innerHTML = `Nog geen boetes`
    tdBoetes.className = "px-6 py-4 whitespace-nowrap text-center"
    tr.appendChild(tdBoetes)
    tbody.appendChild(tr);
    return
  }

  spelersMetBoetes.forEach((speler, index) => {
    const totaalBedrag = speler.totaalBoetes * bedragPerBoete;

    if (speler.totaalBoetes !== vorigeBoetes) {
      plaats = index + 1;
      vorigeBoetes = speler.totaalBoetes;
    }
    const rang = plaats;

    

    const tr = document.createElement('tr');

    //#region row td's

    //plaats
    const tdPlaats = document.createElement('td');
    tdPlaats.innerHTML = `${getPlaatsIcoon(rang)}`
    tdPlaats.className = "px-6 py-4 whitespace-nowrap text-center"
    tr.appendChild(tdPlaats)
    //speler
    const tdSpeler = document.createElement('td');
    tdSpeler.innerHTML = `${speler.naam}`
    tdSpeler.className = "px-6 py-4 whitespace-nowrap text-center hover:text-slate-500 cursor-pointer sticky left-0 bg-white"
    tdSpeler.addEventListener('click', () => {
        location.href = `speler.html?naam=${encodeURIComponent(speler.naam)}`;
      });
    tr.appendChild(tdSpeler)
    //boetes
    const tdBoetes = document.createElement('td');
    tdBoetes.innerHTML = `${speler.totaalBoetes}`
    tdBoetes.className = "px-6 py-4 whitespace-nowrap text-center"
    tr.appendChild(tdBoetes)
    //bedrag
    const tdBedrag = document.createElement('td');
    tdBedrag.innerHTML = `${totaalBedrag.toFixed(2)}`
    tdBedrag.className = "px-6 py-4 whitespace-nowrap text-center"
    tr.appendChild(tdBedrag)
    //button
    const buttonTd = document.createElement('td');
    buttonTd.classList = "px-6 py-4 whitespace-nowrap text-center hover:text-slate-500 cursor-pointer"
    buttonTd.innerHTML = "Toon"
    buttonTd.addEventListener('click', () => {
      const el = document.getElementById(`boetes-${speler.naam.replace(/\s+/g, '_')}`);
      if (el) {
        el.classList.toggle('hidden');
      }
    });
    tr.appendChild(buttonTd)

    //#endregion

    tbody.appendChild(tr);

    // Details rij
    const detailTr = document.createElement('tr');
    detailTr.classList.add('hidden');
    detailTr.id = `boetes-${speler.naam.replace(/\s+/g, '_')}`;
    detailTr.innerHTML = `
      <td colspan="5" class="details px-6 py-4 whitespace-nowrap text-center">
        ${speler.boetes.map(b => `${b.datum} – ${b.hoeveelheid} boete(s)`).join('')}
      </td>
    `;
    tbody.appendChild(detailTr);

  });

  const tfoot = document.querySelector('#boetes tfoot');
  const totaalBedragAlles = totaalBoetes * bedragPerBoete;

  const detailTr = document.createElement('tr');
  detailTr.innerHTML = `
    <td></td>
    <td class="px-6 py-4 whitespace-nowrap text-center font-bold">Totaal</td>
    <td class="px-6 py-4 whitespace-nowrap text-center font-bold">${totaalBoetes}</td>
    <td class="px-6 py-4 whitespace-nowrap text-center font-bold">€ ${totaalBedragAlles.toFixed(2)}</td>
    <td></td>
  `;

  tfoot.appendChild(detailTr);
}

//#endregion

//#region aanwezigheden

function toonAanwezigheden(spelers, kalender) {

  const vandaag = new Date().toISOString().split('T')[0];
  const datums = kalender
    .filter(d => d.type === 'speeldag' || d.type === 'inhaal')
    .map(d => ({ datum: d.datum, type: d.type }))
    .sort((a, b) => a.datum.localeCompare(b.datum));

  //Fill header of table
  const thead = document.querySelector('#aanwezigheden thead');
  const headerRow = document.createElement('tr');

  headerRow.innerHTML = `<th class="px-6 py-3 text-center text-sm font-semibold text-slate-900 sticky left-0 h-fit bg-[#76A936]">Speler</th>`;
  datums.forEach(d => {
    const th = document.createElement('th');
    th.classList = "px-6 py-3 [writing-mode:sideways-lr] text-center text-sm font-semibold text-slate-900";
    const currDatum = new Date(d.datum);
    th.textContent = currDatum.toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });;

    if (d.type === 'inhaal') {
      th.style.backgroundColor = 'orange'; // licht oranje
    }

    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);

  //Fill body of table
  const tbody = document.querySelector('#aanwezigheden tbody');

  if(spelers.length === 0){
    const tr = document.createElement('tr');
    //Geen boetes
    const tdBoetes = document.createElement('td');
    tdBoetes.colSpan = 13
    tdBoetes.innerHTML = `Nog geen matchen gespeeld`
    tdBoetes.className = "px-6 py-4 whitespace-nowrap text-center"
    tr.appendChild(tdBoetes)
    tbody.appendChild(tr);
    return
  }

  spelers.forEach(speler => {
    const row = document.createElement('tr');
    //speler
    const tdSpeler = document.createElement('td');
    tdSpeler.innerHTML = `${speler.naam}`
    tdSpeler.className = "px-6 py-4 whitespace-nowrap text-center hover:text-slate-500 cursor-pointer sticky left-0 bg-white"
    tdSpeler.addEventListener('click', () => {
        location.href = `speler.html?naam=${encodeURIComponent(speler.naam)}`;
      });
    row.appendChild(tdSpeler)

    datums.forEach(d => {
      const td = document.createElement('td');
      td.classList = "px-6 py-4 whitespace-nowrap text-center"

      const alleMatchenOpDatum = speler.matchen?.filter(match => match.datum === d.datum) || [];
      const heeftMatchOpDatum = alleMatchenOpDatum.length > 0;

      if (!heeftMatchOpDatum) {
        td.textContent = d.datum > vandaag ? '⏳' : '❌';
      } else if (d.type === 'speeldag') {
        td.textContent = '✅';
      } else if (d.type === 'inhaal') {
        // Bij inhaal checken of speler ook al punten had op originele speeldag
        // We zoeken of speler op datum al punten kreeg
        const heeftPuntenGekregen = speler.matchen.some(match => match.datum === d.datum && match.puntenTellen);
        
        if (heeftPuntenGekregen) {
          td.textContent = '✅';
        } else {
          td.textContent = '➖'; // Andere weergave: was aanwezig maar geen punten
        }
      }

      row.appendChild(td);
    });

    tbody.appendChild(row);
  });
}

//#endregion

//#region HELPERFUNCTIONS

function getLatestRank(ranglijsten, spelerNaam) {

    ranglijsten.sort((a, b) => new Date(a.datum) - new Date(b.datum))

    const laatsteSpeeldag = ranglijsten[ranglijsten.length - 1];

    const spelerInfo = laatsteSpeeldag.klassement.find(p => p.naam === spelerNaam);

    return spelerInfo ? spelerInfo.positie : null;
}

function getPreviousRank(ranglijsten, spelerNaam) {

    ranglijsten.sort((a, b) => new Date(a.datum) - new Date(b.datum))

    const laatsteSpeeldag = ranglijsten[ranglijsten.length - 2];

    const spelerInfo = laatsteSpeeldag.klassement.find(p => p.naam === spelerNaam);

    return spelerInfo ? spelerInfo.positie : null;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDatumLong(datumShort) {
  const datum = new Date(datumShort);
  return new Intl.DateTimeFormat('nl-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(datum);
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
      //Generate the matchid of the current match to check if it's the correct order
      const generatedMatchid = `${match.datum}_${match.thuis}_vs_${match.uit}_${match.uitslag.split("-")[0]}-${match.uitslag.split("-")[1]}`
      if (!uniekeMatchIDs.has(match.id) && generatedMatchid === match.id) {
        uniekeMatchIDs.add(match.id);

        // Voeg toe met wie de match was (deze speler + tegenstander)
        alleMatchen.push({
          id: match.id,
          datum: match.datum,
          thuis: match.thuis,
          uit: match.uit,
          uitslag: match.uitslag,
          groep: match.groep
        });
      }
    });
  });

  return alleMatchen
}

//#endregion

//#endregion FUNCTIONS