const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const uitslagenPad = path.join(__dirname, "../input/uitslagen.csv"); //datum,speler1,speler2,score1,score2
const boetesPad = path.join(__dirname, "../input/boetes.csv"); //datum,speler,hoeveelheid
const scoresPad = path.join(__dirname, "../input/hoogste_worp.csv"); //datum,speler,score,hoeveelheid,type
const spelersPad = path.join(__dirname, "../docs/assets/data/spelers.json");
const ranglijstenPad = path.join(
  __dirname,
  "../docs/assets/data/ranglijsten.json",
);
const kalenderPad = path.join(__dirname, "../docs/assets/data/kalender.json");

const uitslagen = [];
const spelers = [];
const gespeeldeMatchIds = new Set();
const ranglijsten = [];
const kalender = JSON.parse(fs.readFileSync(kalenderPad));

function convertDate(dateStr) {
  // verwacht: dd/MM/yyyy (bv. 19/09/2025)
  const [dag, maand, jaar] = dateStr.split("/");
  return `${jaar}-${maand.padStart(2, "0")}-${dag.padStart(2, "0")}`;
}

function magPuntenKrijgen(speler, inhaalDatum, kalender) {
  if (!speler.matchen) return false;

  // 1. Speeldagen vóór inhaaldatum
  const eerdereSpeeldagen = kalender
    .filter((d) => d.type === "speeldag" && d.datum < inhaalDatum)
    .map((d) => d.datum);

  // 2. Op welke daarvan was de speler aanwezig?
  const gespeeldeSpeeldagen = speler.matchen
    .filter((m) => eerdereSpeeldagen.includes(m.datum))
    .map((m) => m.datum);

  const gemisteSpeeldagen = eerdereSpeeldagen.filter(
    (d) => !gespeeldeSpeeldagen.includes(d),
  ).length;

  // 3. Hoeveel inhaalmatchen speelde deze speler al vóór deze datum waar puntenTellen = true
  const eerdereInhaalmatches = speler.matchen.filter(
    (m) => m.datum < inhaalDatum && m.puntenTellen === true,
  ).length;

  // 4. Speler mag punten krijgen als hij nog een gemiste speeldag moet compenseren
  return eerdereInhaalmatches < gemisteSpeeldagen;
}

function genereerMatchID(datum, speler1, speler2, score1, score2) {
  const spelersSorted = [speler1, speler2].sort();
  const scores =
    speler1 < speler2 ? `${score1}-${score2}` : `${score2}-${score1}`;
  // return `${datum}_${spelersSorted[0]}_vs_${spelersSorted[1]}_${scores}`;
  return `${datum}_${speler1}_vs_${speler2}_${score1}-${score2}`;
}

function parseMatchID(matchID) {
  // matchID = "2025-09-20_Chris_vs_Diego_2-1"
  const eersteUnderscore = matchID.indexOf("_");
  if (eersteUnderscore === -1) return null;

  const datum = matchID.substring(0, eersteUnderscore); // "2025-09-20"
  const rest = matchID.substring(eersteUnderscore + 1); // "Chris_vs_Diego_2-1"

  const laatsteUnderscore = rest.lastIndexOf("_");
  if (laatsteUnderscore === -1) return null;

  const spelersPart = rest.substring(0, laatsteUnderscore); // "Chris_vs_Diego"
  const scoresPart = rest.substring(laatsteUnderscore + 1); // "2-1"

  const vsIndex = spelersPart.indexOf("_vs_");
  if (vsIndex === -1) return null;

  const speler1 = spelersPart.substring(0, vsIndex);
  const speler2 = spelersPart.substring(vsIndex + 4); // "_vs_" is 4 chars

  const [score1, score2] = scoresPart.split("-").map(Number);

  return { datum, speler1, speler2, score1, score2 };
}

function updateSpeler(
  naam,
  gewonnen,
  verloren,
  legsPlus,
  legsMin,
  tegenstander,
  uitslag,
  datum,
  groep,
  matchId,
  puntenTellen = true,
) {
  let speler = spelers.find((s) => s.naam === naam);
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
      hoogsteUitworpen: [],
      vorigeData: {
        gespeeld: 0,
        gewonnen: 0,
        verloren: 0,
        legsPlus: 0,
        legsMin: 0,
        punten: 0,
      },
    };
    spelers.push(speler);
  }

  const bestaatAl = speler.matchen.some((m) => m.id === matchId);
  if (bestaatAl) return;

  if (puntenTellen) {
    // Update Vorige Data
    // speler.vorigeData.gespeeld = speler.gespeeld
    // speler.vorigeData.gewonnen = speler.gewonnen
    // speler.vorigeData.verloren = speler.verloren
    // speler.vorigeData.legsPlus = speler.legsPlus
    // speler.vorigeData.legsMin = speler.legsMin
    // speler.vorigeData.punten = speler.punten

    // Update Current Data
    speler.gespeeld += 1;
    speler.gewonnen += gewonnen;
    speler.verloren += verloren;
    speler.legsPlus += parseInt(legsPlus);
    speler.legsMin += parseInt(legsMin);
    speler.punten += parseInt(legsPlus);
  }

  const pulledMatch = parseMatchID(matchId);
  const pulledUitlsag = `${pulledMatch.score1}-${pulledMatch.score2}`;

  speler.matchen.push({
    id: matchId,
    datum: datum,
    thuis: pulledMatch.speler1,
    uit: pulledMatch.speler2,
    uitslag: pulledUitlsag,
    groep,
    puntenTellen,
  });
}

function genereerRanglijstenPerSpeeldag() {
  const uitslagenPerDatum = uitslagen.reduce((acc, row) => {
    if (!acc[row.datum]) acc[row.datum] = [];
    acc[row.datum].push(row);
    return acc;
  }, {});

  const datumsGesorteerd = Object.keys(uitslagenPerDatum).sort();

  datumsGesorteerd.forEach((datum) => {
    const dagUitslagen = uitslagenPerDatum[datum];

    spelers.forEach((speler) => {
      speler.vorigeData = {
        gespeeld: speler.gespeeld,
        gewonnen: speler.gewonnen,
        verloren: speler.verloren,
        legsPlus: speler.legsPlus,
        legsMin: speler.legsMin,
        punten: speler.punten,
      };
    });

    dagUitslagen.forEach((row) => {
      const { speler1, speler2, score1, score2, groep } = row;
      const matchId = genereerMatchID(datum, speler1, speler2, score1, score2);

      if (gespeeldeMatchIds.has(matchId)) return;
      gespeeldeMatchIds.add(matchId);

      const uitslag1 = `${score1}-${score2}`;
      const uitslag2 = `${score2}-${score1}`;

      const isInhaal =
        kalender.find((k) => k.datum === datum)?.type === "inhaal";

      const speler1Obj = spelers.find((s) => s.naam === speler1) || {
        matchen: [],
      };
      const speler2Obj = spelers.find((s) => s.naam === speler2) || {
        matchen: [],
      };

      const speler1MagPunten =
        !isInhaal || magPuntenKrijgen(speler1Obj, datum, kalender);
      const speler2MagPunten =
        !isInhaal || magPuntenKrijgen(speler2Obj, datum, kalender);

      updateSpeler(
        speler1,
        score1 > score2 ? 1 : 0,
        score1 < score2 ? 1 : 0,
        score1,
        score2,
        speler2,
        uitslag1,
        datum,
        groep,
        matchId,
        speler1MagPunten,
      );
      updateSpeler(
        speler2,
        score2 > score1 ? 1 : 0,
        score2 < score1 ? 1 : 0,
        score2,
        score1,
        speler1,
        uitslag2,
        datum,
        groep,
        matchId,
        speler2MagPunten,
      );
    });

    //Extra logica voor oneven groepen
    const groepenMap = {};
    dagUitslagen.forEach((row) => {
      if (!groepenMap[row.groep]) groepenMap[row.groep] = new Set();
      groepenMap[row.groep].add(row.speler1);
      groepenMap[row.groep].add(row.speler2);
    });

    const grootsteGroep = Math.max(
      ...Object.values(groepenMap).map((set) => set.size),
    );
    // 2. Check welke groepen minder dan 4 spelers hadden
    Object.entries(groepenMap).forEach(([groep, spelersSet]) => {
      const verschil = grootsteGroep - spelersSet.size;
      if (verschil > 0) {
        spelersSet.forEach((naam) => {
          const byeId = `${datum}_${groep}_${naam}_bye_${verschil}`;
          const speler = spelers.find((s) => s.naam === naam);
          if (speler && !speler.matchen.some((m) => m.id === byeId)) {
            speler.punten += verschil;
            // speler.matchen.push({
            //   id: byeId,
            //   datum,
            //   tegenstander: "BYE",
            //   uitslag: `${verschil}-0`, // symbolisch
            //   puntenTellen: false,
            //   isBye: true,
            //   groep,
            //   extraPunten: verschil
            // });
          }
        });
      }
    });

    const gesorteerd = [...spelers].sort((a, b) => b.punten - a.punten);
    const klassement = gesorteerd.map((speler, index) => ({
      naam: speler.naam,
      positie: index + 1,
      punten: speler.punten,
    }));

    ranglijsten.push({
      datum,
      klassement,
    });
  });
}

function updateBoete(naam, datum, hoeveelheid, boeteId, spelers) {
  let speler = spelers.find((s) => s.naam === naam);
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
    console.log("Speler niet gevonden:", naam);
  }

  // if (!speler.boetes) speler.boetes = [];

  const bestaatAl = speler.boetes.some((b) => b.id === boeteId);
  if (bestaatAl) return;

  speler.boetes.push({
    id: boeteId,
    datum,
    hoeveelheid: parseInt(hoeveelheid, 10),
  });
}

function updateHoogsteScores(scoreData, spelers) {
  scoreData.forEach(({ datum, speler, score, type, hoeveelheid }) => {
    let spelerObj = spelers.find((s) => s.naam === speler);
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
        hoogsteUitworpen: [],
      };
      spelers.push(spelerObj);
    }

    const targetList = type === "worp" ? "hoogsteWorpen" : "hoogsteUitworpen";

    if (!spelerObj[targetList]) spelerObj[targetList] = [];

    const bestaat = spelerObj[targetList].some(
      (entry) =>
        entry.datum === datum &&
        entry.score === score &&
        entry.hoeveelheid === hoeveelheid,
    );
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
      .pipe(
        csv({
          separator: ";",
          mapHeaders: ({ header }) => header.toLowerCase(),
        }),
      )
      .on("data", (row) => {
        row.datum = convertDate(row.datum);
        row.hoeveelheid = parseInt(row.hoeveelheid, 10);
        boetes.push(row);
      })
      .on("end", () => resolve(boetes))
      .on("error", reject);
  });
};

const leesScores = () => {
  return new Promise((resolve, reject) => {
    const scores = [];
    fs.createReadStream(scoresPad)
      .pipe(
        csv({
          separator: ";",
          mapHeaders: ({ header }) => header.toLowerCase(),
        }),
      )
      .on("data", (row) => {
        row.datum = convertDate(row.datum);
        row.score = parseInt(row.score, 10);
        row.hoeveelheid = parseInt(row.hoeveelheid, 10);
        scores.push(row);
      })
      .on("end", () => resolve(scores))
      .on("error", reject);
  });
};

fs.createReadStream(uitslagenPad)
  .pipe(
    csv({
      separator: ";",
      mapHeaders: ({ header }) => header.toLowerCase(),
    }),
  )
  .on("data", (row) => {
    row.datum = convertDate(row.datum);
    row.score1 = parseInt(row.score1, 10);
    row.score2 = parseInt(row.score2, 10);
    row.groep = row.groep || null;
    uitslagen.push(row);
  })
  .on("end", async () => {
    try {
      genereerRanglijstenPerSpeeldag();

      const boetes = await leesBoetes();
      boetes.forEach((b) => {
        const boeteId = `${b.datum}_${b.speler}_${b.hoeveelheid}`;
        updateBoete(b.speler, b.datum, b.hoeveelheid, boeteId, spelers);
      });

      const scores = await leesScores();
      updateHoogsteScores(scores, spelers);

      fs.writeFileSync(spelersPad, JSON.stringify(spelers, null, 2));
      fs.writeFileSync(ranglijstenPad, JSON.stringify(ranglijsten, null, 2));

      console.log(
        "✔ spelers.json & ranglijsten.json bijgewerkt met uitslagen, boetes en scores",
      );
    } catch (err) {
      console.error("❌ Fout bij verwerken gegevens:", err);
    }
  });
