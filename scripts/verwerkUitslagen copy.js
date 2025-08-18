const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const uitslagenPad = path.join(__dirname, '../input/uitslagen.csv');
const boetesPad = path.join(__dirname, '../input/boetes.csv');
const hoogsteworpPad = path.join(__dirname, '../input/hoogste_worp.csv');

const spelersPad = path.join(__dirname, '../public/data/spelers.json');
const ranglijstenPad = path.join(__dirname, '../public/data/ranglijsten.json');

const uitslagen = [];
const spelers = [];
const gespeeldeMatchIds = new Set();
const ranglijsten = [];

// ➕ Hulpfunctie: match-ID
function genereerMatchID(datum, speler1, speler2, score1, score2) {
  const spelersSorted = [speler1, speler2].sort();
  const scores = speler1 < speler2 ? `${score1}-${score2}` : `${score2}-${score1}`;
  return `${datum}_${spelersSorted[0]}_vs_${spelersSorted[1]}_${scores}`;
}
function genereerBoetesID(datum, speler) {
  return `${datum}_${speler}`;
}

// 🧠 Update speler met matchstatistieken
function updateSpelerMatchen(naam, gewonnen, verloren, legsPlus, legsMin, tegenstander, uitslag, datum, matchId) {
  let speler = spelers.find(s => s.naam === naam);
  if (!speler) {
    speler = {
      naam,
      gespeeld: 0,
      gewonnen: 0,
      verloren: 0,
      legsPlus: 0,
      legsMin: 0,
      punten: 0,
      matchen: [],
      hoogsteWorp: [],
      hoogsteUitworp: [],
      boetes: []
    };
    spelers.push(speler);
  }

  const bestaatAl = speler.matchen.some(m => m.id === matchId);
  if (bestaatAl) return;

  speler.gespeeld += 1;
  speler.gewonnen += gewonnen;
  speler.verloren += verloren;
  speler.legsPlus += parseInt(legsPlus);
  speler.legsMin += parseInt(legsMin);
  speler.punten += parseInt(legsPlus);

  speler.matchen.push({
    id: matchId,
    datum,
    tegenstander,
    uitslag
  });
}

function updateSpelerBoetes(naam, datum, hoeveelheid){
  let speler = spelers.find(s => s.naam === naam);
  if (!speler) {
    // console.log("Speler ${naam} bestaat niet, kan boetes niet updaten");
    speler = {
      naam,
      gespeeld: 0,
      gewonnen: 0,
      verloren: 0,
      legsPlus: 0,
      legsMin: 0,
      punten: 0,
      matchen: [],
      hoogsteWorp: [],
      hoogsteUitworp: [],
      boetes: []
    };
    spelers.push(speler);
  }

  const boetesId = genereerBoetesID(datum, naam)
  const bestaatAl = speler.boetes.some(m => m.id === boetesId);
  if (bestaatAl) return;

  speler.boetes.push({
    id: boetesId,
    datum,
    hoeveelheid: parseInt(hoeveelheid)
  });

}

function updateHoogsteScores(scoreData, spelers) {
  scoreData.forEach(({ datum, speler, score, type }) => {
    let spelerObj = spelers.find(s => s.naam === speler);
    if (!spelerObj) {
      spelerObj = {
        naam: speler,
        gespeeld: 0,
        gewonnen: 0,
        verloren: 0,
        legsPlus: 0,
        legsMin: 0,
        punten: 0,
        matchen: [],
        boetes: [],
        hoogsteWorpen: [],
        hoogsteUitworpen: []
      };
      spelers.push(spelerObj);
    }

    const targetList = type === 'worp' ? 'hoogsteWorp' : 'hoogsteUitworp';

    if (!spelerObj[targetList]) spelerObj[targetList] = [];

    // Check of score voor deze datum al bestaat
    const bestaat = spelerObj[targetList].some(entry => entry.datum === datum && entry.score === score);
    if (!bestaat) {
      spelerObj[targetList].push({ datum, score });
    }
  });
}


// 🧠 Genereer ranking snapshots per speeldag
function genereerRanglijstenPerSpeeldag() {
  const uitslagenPerDatum = uitslagen.reduce((acc, row) => {
    if (!acc[row.datum]) acc[row.datum] = [];
    acc[row.datum].push(row);
    return acc;
  }, {});

  const datumsGesorteerd = Object.keys(uitslagenPerDatum).sort();

  datumsGesorteerd.forEach(datum => {
    const dagUitslagen = uitslagenPerDatum[datum];

    dagUitslagen.forEach(row => {
      const { speler1, speler2, score1, score2 } = row;
      const matchId = genereerMatchID(datum, speler1, speler2, score1, score2);

      if (gespeeldeMatchIds.has(matchId)) return;
      gespeeldeMatchIds.add(matchId);

      const uitslag1 = `${score1}-${score2}`;
      const uitslag2 = `${score2}-${score1}`;

      updateSpelerMatchen(speler1, score1 > score2 ? 1 : 0, score1 < score2 ? 1 : 0, score1, score2, speler2, uitslag1, datum, matchId);
      updateSpelerMatchen(speler2, score2 > score1 ? 1 : 0, score2 < score1 ? 1 : 0, score2, score1, speler1, uitslag2, datum, matchId);
    });

    // Genereer tussenklassement
    const gesorteerd = [...spelers].sort((a, b) => b.punten - a.punten);
    const klassement = gesorteerd.map((speler, index) => ({
      naam: speler.naam,
      positie: index + 1
    }));

    ranglijsten.push({
      datum,
      klassement
    });
  });
}

// Convert the csv for uitslagen
fs.createReadStream(uitslagenPad)
  .pipe(csv())
  .on('data', (row) => {
    // Zet getallen correct om
    row.score1 = parseInt(row.score1, 10);
    row.score2 = parseInt(row.score2, 10);
    uitslagen.push(row);
  })
  .on('end', () => {
    genereerRanglijstenPerSpeeldag();

    fs.writeFileSync(spelersPad, JSON.stringify(spelers, null, 2));
    fs.writeFileSync(ranglijstenPad, JSON.stringify(ranglijsten, null, 2));

    console.log('✔ spelers.json en ranglijsten.json gegenereerd uit uitslagen.csv');
  });

//Convert the csv for boetes
fs.createReadStream(boetesPad)
  .pipe(csv())
  .on('data', (row) => {
    const { datum, speler, hoeveelheid } = row;
    updateSpelerBoetes(speler, datum, hoeveelheid)
  })
  .on('end', () => {
    fs.writeFileSync(spelersPad, JSON.stringify(spelers, null, 2));
    console.log('✔ Spelersbestand bijgewerkt op basis van uitslagen.csv');
  });