// Test example

module.exports = {
  name: 'ping',
  description: 'Ping!',
  execute(message) {
    message.channel.send("pong!").catch(console.error);
  },
};