const config = require("./config.js");
const Discord_Notifier = require("./Discord_Notifier");
const SoR_Notifier = require("./SoR_Notifier");


const discord_Notifier = new Discord_Notifier(config);

const sor_Notifier = new SoR_Notifier(config, discord_Notifier);
sor_Notifier.init();