const Discord_Config = require("./Discord_Config.js");
const SoR_Config = require("./Discord_Config.js");
const SoR_Notifier = require("./SoR_Notifier");

const sor_Notifier = new SoR_Notifier(SoR_Config);
sor_Notifier.init();