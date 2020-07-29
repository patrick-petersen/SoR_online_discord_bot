const https = require('https');
const { Webhook } = require('discord-webhook-node');
const exitHook = require('exit-hook');



function Notifier() {

    //Notification settings
    const minPauseBetweenAttacks = 1000 * 60 * 30; //If there is a break between attacks it counts as new

    //Discord settings
    const IMAGE_URL = 'https://www.soronline.us/logo.ico';
    const webhooks = [
        new Webhook("DiscordWebbhook1"),
    ]

    //internal
    this.lastState = {};

    this.init = function () {
        const timeout = 1000 * 60; //timeout in milliseconds

        for (let index in webhooks) {
            const webhook = webhooks[index];
            webhook.setUsername('SoR online discord bot');
            webhook.setAvatar(IMAGE_URL);
            webhook.send("Bot is online!");
        }

        const shutdownCallback = () => {
            this.notify("Shutting down!");
        }

        exitHook(shutdownCallback.bind(this));

        setInterval(this.makeApiCallWithCallback.bind(this), timeout);
        this.makeApiCallWithCallback.bind(this)();
    }

    this.shouldNotify = function(region, faction) {
        console.log(this.lastState);
        if(this.lastState.hasOwnProperty(region)) {
            const regionObj = this.lastState[region];
            console.log(regionObj);
            if(regionObj.hasOwnProperty(faction)) {
                const keep = regionObj[faction];
                console.log(keep);
                return (keep["lastAttack"] + minPauseBetweenAttacks < new Date().getTime());
            }
            else {
                return true;
            }
        }
        else {
            return true;
        }
    }

    this.setAttacked = function(region, faction) {
        console.log(this.lastState);
        if(!this.lastState.hasOwnProperty(region)) {
            this.lastState[region] = {};
        }
        const regionObj = this.lastState[region];
        if(!regionObj.hasOwnProperty(faction)) {
            regionObj[faction] = {};
        }
        const keep = regionObj[faction];
        keep["lastAttack"] = new Date().getTime();
    }

    this.makeApiCallWithCallback = function() {
        const callback = (response) => {
            const json = JSON.parse(response);
            const data = json[0].data;
            const dataJson = JSON.parse(data);
            this.parseData(dataJson["keeps"]);
        };
        this.makeApiCall(callback)
    }

    this.makeApiCall = function(callback) {
        console.debug("starting fetch");
        const postData = "api=ee6bd4a1-6e0b-475b-a4b0-4e18d4a66cb5";

        const options = {
            hostname: 'www.soronline.us',
            port: 443,
            path: '/api/get.php',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length
            }
        };

        const req = https.request(options, (res) => {
            let response = "";

            res.on('data', (d) => {
                response += d;
            });

            res.on("end", () => {
                console.debug("finished request");
                console.debug(response);
                callback(response);
            })
        });

        req.on('error', (e) => {
            console.error(e);
        });

        req.write(postData);
        req.end();
    }

    this.parseData = function(data) {
        data.forEach((region) => {
            this.parseRegion(region)
        })
    }

    this.parseRegion = function(region) {
        const keeps = [region["keep1"], region["keep2"]];
        keeps.forEach(keep => {
            if(this.isKeepUnderAttack(keep)) {
                if(this.shouldNotify(region.name, keep["owner"])) {
                    const text = "Tier " +region["tier"] +" " + keep["owner"] + " keep under attack in " + region.name + "\n@here";
                    this.notify(text);
                }
                this.setAttacked(region.name, keep["owner"]);
            }
            else {
                console.log(keep["owner"] + " keep safe in " + region.name);
            }
        })
    }

    this.notify = function (text) {
        console.log(text);

        for (let index in webhooks) {
            const webhook = webhooks[index];
            webhook.send(text);
        }
    }

    this.isKeepUnderAttack = function(keep) {
        //check if keep is under attack
        return keep["status"] !== "Safe";
        //"Outer" and "Inner" are possible
    }
}

const notifier = new Notifier();
notifier.init();