require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';

const spreadsheetId = '1MB34CSHSSnm9MFLXTdXqcGuqGTIK4ijEngyUhX7bLIs';
const PREFIX = 'chev';
var personScores = [];

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
*/
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function authorizeWrite(credentials, callback, val1, val2) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client, val1, val2);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * @see https://docs.google.com/spreadsheets/d/1MB34CSHSSnm9MFLXTdXqcGuqGTIK4ijEngyUhX7bLIs/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function getData(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sheet1!A1:B',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    personScores = rows;
    personScores.shift();
  });
}

function addData(auth, score, name) {
  var resource;
  var loc = 2;
  const sheets = google.sheets({version: 'v4', auth});

  sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sheet1!A2:B',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const nameList = res.data.values;
    for (var i = 0; i < nameList.length; i++) {
      if (nameList[i][0] == name) {
        loc += i;
        score += parseInt(nameList[i][1]);
        let value = score;
        let values = [[value]]
        resource = {values};
      }
      console.log(nameList[i]);
    }
    setTimeout(function(){
      console.log("this is resource:", resource);
      var rangeWrite = 'sheet1!B' + loc.toString();
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

function removeData(auth, score, name) {
  var resource;
  var loc = 2;
  const sheets = google.sheets({version: 'v4', auth});

  sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sheet1!A2:B',
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
      var rangeWrite = 'sheet1!B' + loc.toString();
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
  if (parts.length === 1){ msg.reply("Yes? I hear thy name calling!"); }
  if (msg.content === 'chev list') {
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
      authorizeWrite(JSON.parse(content), addData, parseInt(parts[2]), parts[4]);
    });
  }

  if (parts[1] === 'subtract' && parts[2] != null 
  && parts[3] === 'to' && parts[4] != null) {
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorizeWrite(JSON.parse(content), removeData, parseInt(parts[2]), parts[4]);
  });
}

})

client.login(process.env.BOT_TOKEN)