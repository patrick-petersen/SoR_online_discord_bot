const { Webhook } = require('discord-webhook-node');

const VZ_test= new Webhook("DiscordWebbhook1");
const VZ_offi= new Webhook("DiscordWebbhook2");


const discord_Config = {
    VZ_test: VZ_test,
    VZ_offi:VZ_offi,
};

module.exports = discord_Config;