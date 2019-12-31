const fs = require('fs');
var google = require('../gsheet').google;
var authorize = require('../gsheet').authorize;
var spreadsheetId = require('../gsheet').spreadsheetId;

module.exports = {
  name: 'showScores',
  description: 'Grab data from google sheets',
  execute(message) {
    let personScores = [];
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Sheets API.
      authorize(JSON.parse(content), showScores);
    });
    function showScores(auth) {
      const sheets = google.sheets({version: 'v4', auth});
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Peeps!A1:B',
      }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const rows = res.data.values;
        personScores = rows;
        personScores.shift();
      });
    }
    message.channel.send('No prob, bob! Fetching some data...').catch(console.error);;
    setTimeout(function(){ 
      var resp = "";
      for (var i = 0; i < personScores.length; i++) {
        let name = personScores[i][0];
        let score = personScores[i][1];
        let line = name.concat(" -> ", score);
        resp = resp.concat(line, "\n")
      }
      message.channel.send("[Name -> score]\n" + resp).catch(console.error);;
    }, 2000);

  },
  
}