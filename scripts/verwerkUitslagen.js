const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const uitslagenPad = path.join(__dirname, '../input/uitslagen.csv');
const boetesPad = path.join(__dirname, '../input/boetes.csv');
const scoresPad = path.join(__dirname, '../input/hoogste_worp.csv');
const spelersPad = path.join(__dirname, '../public/data/spelers.json');
const ranglijstenPad = path.join(__dirname, '../public/data/ranglijsten.json');
const kalenderPad = path.join(__dirname, '../public/data/kalender.json');

const uitslagen = [];
const spelers = [];
const gespeeldeMatchIds = new Set();
const ranglijsten = [];
const speeldagTypes = {};       // Voor lookup van speeldag vs inhaal
const puntenPerSpeeldag = {};   // Om bij te houden wie al punten kreeg op een speeldag

function magPuntenKrijgen(speler, inhaalDatum, kalender) {
  // Filter alle reguliere speeldagen vóór de inhaaldatum
  const gespeeldeSpeeldagen = kalender
    .filter(d => d.type === 'speeldag' && d.datum < inhaalDatum)
    .map(d => d.datum);

  // Zoek op welke speeldagen deze speler effectief een match speelde
  const gespeeldeDatums = speler.matchen
    .filter(m => gespeeldeSpeeldagen.includes(m.datum))
    .map(m => m.datum);

  // Zit er een speeldag bij die hij niet gespeeld heeft? → Dan mag hij inhalen
  const gemisteSpeeldagen = gespeeldeSpeeldagen.filter(d => !gespeeldeDatums.includes(d));

  return gemisteSpeeldagen.length > 0;
}

function genereerMatchID(datum, speler1, speler2, score1, score2) {
  const spelersSorted = [speler1, speler2].sort();
  const scores = speler1 < speler2 ? `${score1}-${score2}` : `${score2}-${score1}`;
  // return `${datum}_${spelersSorted[0]}_vs_${spelersSorted[1]}_${scores}`;
  return `${datum}_${speler1}_vs_${speler2}_${score1}-${score2}`;
}

function updateSpeler(naam, gewonnen, verloren, legsPlus, legsMin, tegenstander, uitslag, datum, matchId, puntenTellen = true) {
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
      boetes: [],
      hoogsteWorpen: [],
      hoogsteUitworpen: []
    };
    spelers.push(speler);
  }

  const bestaatAl = speler.matchen.some(m => m.id === matchId);
  if (bestaatAl) return;

  // const alPuntenOpDatum = puntenPerSpeeldag[datum]?.[naam] === true;
  // const magPuntenKrijgen = !isInhaal || !alPuntenOpDatum;

  
  if (puntenTellen) {
    speler.gespeeld += 1;
    speler.gewonnen += gewonnen;
    speler.verloren += verloren;
    speler.legsPlus += parseInt(legsPlus);
    speler.legsMin += parseInt(legsMin);
    speler.punten += parseInt(legsPlus);
  }

  speler.matchen.push({
    id: matchId,
    datum,
    tegenstander,
    uitslag,
    puntenTellen
  });
}

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

      const isInhaal = speeldagTypes[datum] === 'inhaal';

      const speler1Obj = spelers.find(s => s.naam === speler1) || { matchen: [] };
      const speler2Obj = spelers.find(s => s.naam === speler2) || { matchen: [] };

      const speler1MagPunten = !isInhaal || magPuntenKrijgen(speler1Obj, datum, kalender);
      const speler2MagPunten = !isInhaal || magPuntenKrijgen(speler2Obj, datum, kalender);


      updateSpeler(speler1, score1 > score2 ? 1 : 0, score1 < score2 ? 1 : 0, score1, score2, speler2, uitslag1, datum, matchId, speler1MagPunten);
      updateSpeler(speler2, score2 > score1 ? 1 : 0, score2 < score1 ? 1 : 0, score2, score1, speler1, uitslag2, datum, matchId, speler2MagPunten);
    });

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

function updateBoete(naam, datum, hoeveelheid, boeteId, spelers) {
  let speler = spelers.find(s => s.naam === naam);
  if (!speler) {
    // speler = {
    //   naam,
    //   gespeeld: 0,
    //   gewonnen: 0,
    //   verloren: 0,
    //   legsPlus: 0,
    //   legsMin: 0,
    //   punten: 0,
    //   matchen: [],
    //   boetes: [],
    //   hoogsteWorpen: [],
    //   hoogsteUitworpen: []
    // };
    // spelers.push(speler);
    console.log('Speler niet gevonden:', naam);
  }

  // if (!speler.boetes) speler.boetes = [];

  const bestaatAl = speler.boetes.some(b => b.id === boeteId);
  if (bestaatAl) return;

  speler.boetes.push({
    id: boeteId,
    datum,
    hoeveelheid: parseInt(hoeveelheid, 10)
  });
}

function updateHoogsteScores(scoreData, spelers) {
  scoreData.forEach(({ datum, speler, score, type, hoeveelheid }) => {
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

    const targetList = type === 'worp' ? 'hoogsteWorpen' : 'hoogsteUitworpen';

    if (!spelerObj[targetList]) spelerObj[targetList] = [];

    const bestaat = spelerObj[targetList].some(entry => entry.datum === datum && entry.score === score && entry.hoeveelheid === hoeveelheid);
    if (!bestaat) {
      spelerObj[targetList].push({ datum, score, hoeveelheid });
    }

    // for (let i = 0; i < hoeveelheid; i++) {        //Alernative, ipv 3x als hoeveelheid kun je ook gwn 3 entries
    //   spelerObj[targetList].push({ datum, score });
    // }
  });
}

const leesBoetes = () => {
  return new Promise((resolve, reject) => {
    const boetes = [];
    fs.createReadStream(boetesPad)
      .pipe(csv())
      .on('data', (row) => {
        row.hoeveelheid = parseInt(row.hoeveelheid, 10);
        boetes.push(row);
      })
      .on('end', () => resolve(boetes))
      .on('error', reject);
  });
};

const leesScores = () => {
  return new Promise((resolve, reject) => {
    const scores = [];
    fs.createReadStream(scoresPad)
      .pipe(csv())
      .on('data', (row) => {
        row.score = parseInt(row.score, 10);
        row.hoeveelheid = parseInt(row.hoeveelheid, 10);
        scores.push(row);
      })
      .on('end', () => resolve(scores))
      .on('error', reject);
  });
};

const kalenderData = JSON.parse(fs.readFileSync(kalenderPad));
kalenderData.forEach(item => {
  speeldagTypes[item.datum] = item.type; // 'speeldag' of 'inhaal'
});

const kalender = JSON.parse(fs.readFileSync(kalenderPad));

fs.createReadStream(uitslagenPad)
  .pipe(csv())
  .on('data', (row) => {
    row.score1 = parseInt(row.score1, 10);
    row.score2 = parseInt(row.score2, 10);
    uitslagen.push(row);
  })
  .on('end', async () => {
    try {
      genereerRanglijstenPerSpeeldag();

      const boetes = await leesBoetes();
      boetes.forEach(b => {
        const boeteId = `${b.datum}_${b.speler}_${b.hoeveelheid}`;
        updateBoete(b.speler, b.datum, b.hoeveelheid, boeteId, spelers);
      });

      const scores = await leesScores();
      updateHoogsteScores(scores, spelers);

      fs.writeFileSync(spelersPad, JSON.stringify(spelers, null, 2));
      fs.writeFileSync(ranglijstenPad, JSON.stringify(ranglijsten, null, 2));

      console.log('✔ spelers.json & ranglijsten.json bijgewerkt met uitslagen, boetes en scores');
    } catch (err) {
      console.error('❌ Fout bij verwerken gegevens:', err);
    }
  });