const { Webhook, MessageBuilder } = require('discord-webhook-node');

const VZ_test= new Webhook("DiscordWebbhook1");
const VZ_offi= new Webhook("DiscordWebbhook2");


const config = {
    enableLogFile: true,

    timeout: 1000 * 60, //timeout in milliseconds, interval at which to query sor_online api

//Notification settings
    minPauseBetweenAttacks: 1000 * 60 * 30, //If there is a break between attacks it counts as new
    startTime: new Date().getTime(),
    shouldSendStartupNotifications: false,
    timeTilFirstNotification: 1000 * 60 * 2,

//Discord settings
    IMAGE_URL: 'https://www.soronline.us/logo.ico',

    webhooks: {
        "all": [VZ_test, VZ_offi],
        "debug": [VZ_test],
        "1": [VZ_test],
        "2": [VZ_test],
        "3": [VZ_test],
        "4": [VZ_test],
        "pre_fort": [VZ_test, VZ_offi],
        "fort": [VZ_test, VZ_offi],
        "city": [VZ_test, VZ_offi],
    },

    preFortKeeps: {
        "Kadrin Valley": "Order",
        "Black Crag": "Destruction",
        "Chaos Wastes": "Destruction",
        "Reikland": "Order",
        "Caledor": "Destruction",
        "Eataine": "Order"
    },
};

//debug overwrite
/*
config.webhooks = {
    "all": [VZ_test],
        "debug": [VZ_test],
        "1": [VZ_test],
        "2": [VZ_test],
        "3": [VZ_test],
        "4": [VZ_test],
        "pre_fort": [VZ_test],
        "fort": [VZ_test],
        "city": [VZ_test],
};*/

module.exports = config;