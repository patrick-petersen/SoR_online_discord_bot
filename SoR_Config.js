const {VZ_test_SoR, VZ_offi_SoR} = require("./Discord_Config");


const SoR_Config = {
    IMAGE_URL: 'https://www.soronline.us/logo.ico',

    enableLogFile: true,
    timeout: 1000 * 60, //timeout in milliseconds, interval at which to query sor_online api

//Notification settings
    minPauseBetweenAttacks: 1000 * 60 * 30, //If there is a break between attacks it counts as new
    startTime: new Date().getTime(),
    shouldSendStartupNotifications: false,
    timeTilFirstNotification: 1000 * 60 * 2,

    preFortKeeps: {
        "Kadrin Valley": "Order",
        "Black Crag": "Destruction",
        "Chaos Wastes": "Destruction",
        "Reikland": "Order",
        "Caledor": "Destruction",
        "Eataine": "Order"
    },

    webhooks: {
        "all": [VZ_test_SoR, VZ_offi_SoR],
        "debug": [VZ_test_SoR],
        "1": [VZ_test_SoR],
        "2": [VZ_test_SoR],
        "3": [VZ_test_SoR],
        "4": [VZ_test_SoR],
        "pre_fort": [VZ_test_SoR, VZ_offi_SoR],
        "fort": [VZ_test_SoR, VZ_offi_SoR],
        "cityInc": [VZ_test_SoR, VZ_offi_SoR],
        "city": [VZ_test_SoR, VZ_offi_SoR],
    },
}

//debug overwrite
SoR_Config.webhooks = {
    "all": [VZ_test_SoR],
    "debug": [VZ_test_SoR],
    "1": [VZ_test_SoR],
    "2": [VZ_test_SoR],
    "3": [VZ_test_SoR],
    "4": [VZ_test_SoR],
    "pre_fort": [VZ_test_SoR],
    "fort": [VZ_test_SoR],
    "cityInc": [VZ_test_SoR],
    "city": [VZ_test_SoR],
};

module.exports = SoR_Config;