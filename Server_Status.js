const https = require('https');
const { MessageBuilder } = require('discord-webhook-node');
const exitHook = require('exit-hook');
const fs = require("fs");
const isPortReachable = require("is-port-reachable");
const Discord_Notifier = require("./Discord_Notifier");


require("tls").DEFAULT_ECDH_CURVE = "auto";


function Server_Status(config) {
    this.lastStateOnline = false;
    this.firstCall = true;

    this.discord_Notifier = new Discord_Notifier(config);

    this.init = function () {
        const allWebhooks = config.webhooks["all"];
        for (let index in allWebhooks) {
            if(!allWebhooks.hasOwnProperty(index)) continue;

            const webhook = allWebhooks[index];
            webhook.setUsername('RoR Server Status discord bot');
            webhook.setAvatar(config.IMAGE_URL);
            //webhook.send("Bot is online!");
        }

        const shutdownCallback = () => {
            console.log("shutting down!");
            //this does not send the message to the discord hook!
            //this.sendDiscordDebugNotification("Shutting down!");
        }

        exitHook(shutdownCallback.bind(this));

        setInterval(this.checkOnline.bind(this), config.time_between_checks);
        this.checkOnline.bind(this)();
    }

    this.shouldNotify = function(online) {
        console.log(this.lastStateOnline);

        //to not notify on the first call
        if(this.firstCall) {
            this.firstCall = false;
            return false;
        }

        return this.lastStateOnline !== online;
    }

    this.setLastState = function(online) {
        this.lastStateOnline = online;
    }

    this.checkOnline = function() {
        (async () => {
            const isOnline = await isPortReachable(config.server.port, {host: config.server.ip});
            if(this.shouldNotify(isOnline)) {
                const embed = new MessageBuilder()
                    .setText("Return of Reckoning is " + (isOnline?"":"not ") + "online.")
                    .setTitle("Return of Reckoning is " + (isOnline?"":"not ") + "online.")
                    .setAuthor('Kalell', 'https://cdn.discordapp.com/embed/avatars/0.png')
                    .setDescription('Created by Kalell')
                    .setTimestamp();

                this.discord_Notifier.sendDiscordNotification(embed, "status_change")
            }
            this.setLastState(isOnline);
        })();
    }
}

module.exports = Server_Status;