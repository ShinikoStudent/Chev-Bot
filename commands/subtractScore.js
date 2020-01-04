const fs = require('fs');
var google = require('../gsheet').google;
var authorizeScoreChange = require('../gsheet').authorizeScoreChange;
var spreadsheetId = require('../gsheet').spreadsheetId;

module.exports = {
  name: 'subtractScore',
  description: 'Substract scores to members',
  execute(message, score, name) {
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Sheets API.
      authorizeScoreChange(JSON.parse(content), subtractScore, score, name);
    });
    
    function subtractScore(auth, score, name) {
      var resource;
      let loc = 2;
      const sheets = google.sheets({version: 'v4', auth});
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Peeps!A2:B',
      }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const nameList = res.data.values;
        for (var i = 0; i < nameList.length; i++) {
          if (nameList[i][0] == name) {
            loc += i;
            if (parseInt(nameList[i][1]) - score < 0){
              score = 0;
            }
            else {
              score = parseInt(nameList[i][1]) - score;
            }
            let value = score;
            let values = [[value]]
            resource = {values};
          }
          console.log(nameList[i]);
        }
    
        setTimeout(function(){
          var rangeWrite = 'Peeps!B' + loc.toString();
          console.log(rangeWrite);
          sheets.spreadsheets.values.update({
            spreadsheetId,
            range: rangeWrite,
            valueInputOption: 'USER_ENTERED',
            resource,
          }, (err) => {
            if (err) return console.log('The API returned an error: ' + err);
          });
        }, 1000);
    
      });
    }

  },
  
}