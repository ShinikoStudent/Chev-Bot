const fs = require('fs');
var google = require('../gsheet').google;
var authorizeMemberChange = require('../gsheet').authorizeMemberChange;
var spreadsheetId = require('../gsheet').spreadsheetId;

module.exports = {
  name: 'removeMember',
  description: 'Grab data from google sheets',
  execute(message, name) {
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Sheets API.
      authorizeMemberChange(JSON.parse(content), removeMember, name);
    });
    
    function removeMember(auth, name) {
      const sheets = google.sheets({version: 'v4', auth});
      let loc = 2;
    
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Peeps!A2:B',
      }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        let nameList = res.data.values;
        for (var i = 0; i < nameList.length; i++) {
          if (nameList[i][0] == name) {
            break;
          }
          loc++;
        }
    
        setTimeout(function(){
          var rangeWrite = 'Peeps!A' + loc.toString() + ":B" + loc.toString();
          console.log("this is range: ", rangeWrite);
          sheets.spreadsheets.values.update({
            spreadsheetId,
            range: rangeWrite,
            valueInputOption: 'USER_ENTERED',
            resource: {values: [['','']]},
          }, (err) => {
            if (err) return console.log('The API returned an error when getting: ' + err);
          });
        }, 1000);
    
      });
    }

  },
  
}