require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');

var google = require('./gsheet').google;
var spreadsheetId = require('./gsheet').spreadsheetId;

var authorize = require('./gsheet.js').authorize;
var authorizeScoreChange = require('./gsheet').authorizeScoreChange;
var authorizeMemberChange = require('./gsheet').authorizeMemberChange;
const PREFIX = 'chev';
var personScores = [];

/**
 * @see https://docs.google.com/spreadsheets/d/1MB34CSHSSnm9MFLXTdXqcGuqGTIK4ijEngyUhX7bLIs/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function getData(auth) {
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

function addScore(auth, score, name) {
  var resource;
  let loc = 2;
  const sheets = google.sheets({version: 'v4', auth});

  sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Peeps!A2:B',
    majorDimension: "Rows",
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const nameList = res.data.values;
    for (var i = 0; i < nameList.length; i++) {
      if (nameList[i][0] == name) {
        loc += i;
        score += parseInt(nameList[i][1]);
        let value = score;
        let values = [[value]];
        resource = {values};
      }
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

function addMember(auth, name) {
  const sheets = google.sheets({version: 'v4', auth});
  var resource;
  let loc = 2;

  sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Peeps!A2:B',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    let nameList = res.data.values;
    for (var i = 0; i < nameList.length; i++) {
      console.log("Just checking names: ", nameList[i][0]);
      if (nameList[i][0] == "" || !nameList[i][0]) {
        break;
      }
      loc++;
    }
    let value = name;
    let values = [[value]]
    resource = {values};

    setTimeout(function(){
      var rangeWrite = 'Peeps!A' + loc.toString();
      console.log("this is range: ", rangeWrite);
      sheets.spreadsheets.values.update({
        spreadsheetId,
        range: rangeWrite,
        valueInputOption: 'USER_ENTERED',
        resource,
      }, (err) => {
        if (err) return console.log('The API returned an error when getting: ' + err);
      });
    }, 1000);

    setTimeout(function(){
      var rangeWrite = 'Peeps!B' + loc.toString();
      console.log("this is range: ", rangeWrite);
      sheets.spreadsheets.values.update({
        spreadsheetId,
        range: rangeWrite,
        valueInputOption: 'USER_ENTERED',
        resource: {values: [["0"]]},
      }, (err) => {
        if (err) return console.log('The API returned an error when getting: ' + err);
      });
    }, 1000);
  });
}

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

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), getData);
  });
  
})

client.on('message', msg => {
  const content = msg.content;
  const parts = content.split(' ');

  if (parts[0] != PREFIX){ return; }
  if (parts.length === 1){ msg.reply("Yes?!!!! I hear thy name calling!"); }

  if (msg.content === 'chev list scores') {
    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Sheets API.
      authorize(JSON.parse(content), getData);
    });
    msg.reply('No prob, bob! Fetching some data...');
    var resp = "";
    for (var i = 0; i < personScores.length; i++) {
      let name = personScores[i][0];
      let score = personScores[i][1];
      let line = name.concat(" -> ", score);
      resp = resp.concat(line, "\n")
    }

    setTimeout(function(){ 
      var resp = "";
      for (var i = 0; i < personScores.length; i++) {
        let name = personScores[i][0];
        let score = personScores[i][1];
        let line = name.concat(" -> ", score);
        resp = resp.concat(line, "\n")
      }
      msg.reply("[Name -> score]\n" + resp);
    }, 2000);
  }

  if (parts[1] === 'add' && parts[2] != null 
    && parts[3] === 'to' && parts[4] != null) {
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Sheets API.
      authorizeScoreChange(JSON.parse(content), addScore, parseInt(parts[2]), parts[4]);
    });
  }

  if (parts[1] === 'subtract' && parts[2] != null 
    && parts[3] === 'to' && parts[4] != null) {
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Sheets API.
      authorizeScoreChange(JSON.parse(content), subtractScore, parseInt(parts[2]), parts[4]);
    });
  }

  if (parts[1] === 'add' && parts[2] === 'member' && parts[3] != null){
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Sheets API.
      authorizeMemberChange(JSON.parse(content), addMember, parts[3]);
    });
  }

  if (parts[1] === 'remove' && parts[2] === 'member' && parts[3] != null){
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Sheets API.
      authorizeMemberChange(JSON.parse(content), removeMember, parts[3]);
    });
  }

})

client.login(process.env.BOT_TOKEN)