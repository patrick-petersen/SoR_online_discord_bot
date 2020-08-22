const SoR_Config = require("./SoR_Config");
const SoR_Notifier = require("./SoR_Notifier");

const Server_Status_Config = require("./Server_Status_Config")
const Server_Status = require("./Server_Status")

//const sor_Notifier = new SoR_Notifier(SoR_Config);
//sor_Notifier.init();


const server_Status = new Server_Status(Server_Status_Config);
server_Status.init();