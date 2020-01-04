require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');

const PREFIX = 'chev';

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) { // Setup each command for client
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

client.once('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`)
});

/*
* Todo:
* - Can buy from store (subtract points from themselves)
* - People can buy emotes in exchange for points
* - Once 3 people have purchased an emote, then its available for everyone
* - Sassy responses for anyone who tries to abuse the system
* - Be able to add new cheevos names
*/

client.on('message', msg => {
  const content = msg.content;
  const parts = content.split(' ');

  if (parts[0] != PREFIX){ return; }
  if (parts.length === 1){ msg.reply("Yes?!!!! I hear thy name calling!"); }

  if (msg.content === 'chev list scores') {
    client.commands.get('showScores').execute(msg);
  }
  else if (parts[1] === 'add' && parts[2] != null 
    && parts[3] === 'to' && parts[4] != null) {
      client.commands.get('addScore').execute(msg, parseInt(parts[2]), parts[4]);
  }
  else if (parts[1] === 'subtract' && parts[2] != null 
    && parts[3] === 'to' && parts[4] != null) {
      client.commands.get('subtractScore').execute(msg, parseInt(parts[2]), parts[4]);
  }
  else if (parts[1] === 'add' && parts[2] === 'member' && parts[3] != null){
    client.commands.get('addMember').execute(msg, parts[3]);
  }
  else if (parts[1] === 'remove' && parts[2] === 'member' && parts[3] != null){
    client.commands.get('removeMember').execute(msg, parts[3]);
  }

})

client.login(process.env.BOT_TOKEN)