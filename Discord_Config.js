const { Webhook } = require('discord-webhook-node');

const VZ_test_SoR = new Webhook("DiscordWebbhook1");
const VZ_offi_SoR = new Webhook("DiscordWebbhook2");

const VZ_test_online = new Webhook("DiscordWebbhook3");

const discord_Config = {
    VZ_test_SoR: VZ_test_SoR,
    VZ_offi_SoR: VZ_offi_SoR,
    VZ_test_online: VZ_test_online,
};

module.exports = discord_Config;