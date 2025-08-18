const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

const PAD_SPELERS = path.join(__dirname, 'public/data/spelers.json');

app.use(express.static('public'));
app.use(express.json());

// API: uitslag verwerken
app.post('/api/uitslag', (req, res) => {
  const {
    winnaar,
    verliezer,
    legsWinnaar,
    legsVerliezer,
    datum,
    aantal180s
  } = req.body;

  let spelers = JSON.parse(fs.readFileSync(PAD_SPELERS));

  function updateSpeler(naam, gewonnen, verloren, legsPlus, legsMin, tegenstander, uitslag, a180s) {
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
        matchen: []
      };
      spelers.push(speler);
    }

    speler.gespeeld += 1;
    speler.gewonnen += gewonnen;
    speler.verloren += verloren;
    speler.legsPlus += parseInt(legsPlus);
    speler.legsMin += parseInt(legsMin);
    speler.punten += gewonnen ? 3 : 0;

    speler.matchen.push({
      datum,
      tegenstander,
      uitslag,
      aantal180s: parseInt(a180s)
    });
  }

  // Update winnaar
  updateSpeler(
    winnaar,
    1, 0,
    legsWinnaar, legsVerliezer,
    verliezer,
    `${legsWinnaar} - ${legsVerliezer}`,
    aantal180s
  );

  // Update verliezer
  updateSpeler(
    verliezer,
    0, 1,
    legsVerliezer, legsWinnaar,
    winnaar,
    `${legsVerliezer} - ${legsWinnaar}`,
    0 // Verliezer scoorde geen 180's
  );

  // Schrijf terug naar JSON
  fs.writeFileSync(PAD_SPELERS, JSON.stringify(spelers, null, 2));

  res.json({ message: 'Uitslag succesvol opgeslagen!' });
});

app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});
