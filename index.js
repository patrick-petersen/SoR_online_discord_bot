const https = require('https');
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const exitHook = require('exit-hook');

function Notifier() {

    //Notification settings
    const minPauseBetweenAttacks = 1000 * 60 * 30; //If there is a break between attacks it counts as new

    //Discord settings
    const IMAGE_URL = 'https://www.soronline.us/logo.ico';
    const webhooks = [
        //VZ zum testen
        new Webhook("DiscordWebbhook1"),
        //Offizieller VZ discord
        //new Webhook("DiscordWebbhook2"),
    ];

    const preFortKeeps = {
        "Kadrin Valley": "Order",
        "Black Crag": "Destro",
        "Chaos Wastes": "Destro",
        "Reikland": "Order",
        "Caledor": "Destro",
        "Eataine": "Order"
    };

    //internal
    this.lastState = {};

    this.sendStartupMessage = function () {
        const embed = new MessageBuilder()
            .setText("Discord Bot is online!")
            .setTitle('State of the Realm Discord Bot is online!')
            .setAuthor('Kalell', 'https://cdn.discordapp.com/embed/avatars/0.png')
            .setURL('https://www.soronline.us/')
            .addField('Functions', 'Sending out notifications if keeps are getting attacked')
            .setColor('#00b0f4')
            .setThumbnail(IMAGE_URL)
            .setDescription('Created by Kalell with the help of Ruke\'s [sor_online](https://soronline.us)')
            .setImage(IMAGE_URL)
            .setTimestamp();

        for (let index in webhooks) {
            const webhook = webhooks[index];
            webhook.send(embed);
        }
    }

    this.init = function () {
        const timeout = 1000 * 60; //timeout in milliseconds

        for (let index in webhooks) {
            const webhook = webhooks[index];
            webhook.setUsername('SoR online discord bot');
            webhook.setAvatar(IMAGE_URL);
            //webhook.send("Bot is online!");
        }

        this.sendStartupMessage();

        const shutdownCallback = () => {
            this.sendDiscordNotification("Shutting down!");
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

    this.isPreFortKeep = function(region, faction) {
        return (preFortKeeps.hasOwnProperty(region) && preFortKeeps[region] == faction)
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
            if(this.isKeepUnderAttack(region, keep)) {
                this.sendKeepNotification(region, keep);
                this.setAttacked(region.name, keep["owner"]);
            }
            else {
                console.log(keep["owner"] + " keep safe in " + region.name);
            }
        })
    }

    this.sendKeepNotification = function(region, keep) {
        if(this.shouldNotify(region.name, keep["owner"])) {
            const defender = keep["owner"];
            const attacker = (defender==="Order")?"Destruction":"Order";
            const tier = region["tier"];
            const regionName = region["name"];
            const color = (defender==="Order")?"#ff0000":"#0000ff";

            const aaoOwner = region["aaoOwner"];
            const aao = region["aao"];

            const orderPop = region["pop1"];
            const destroPop = region["pop2"];

            const bos = region["bos"];
            const orderBOs = bos.reduce((sum, val) => {return sum + (val==="Order"?1:0)}, 0);
            const destroBOs = bos.reduce((sum, val) => {return sum + (val==="Order"?0:1)}, 0);

            const keep1 = region["keep1"];
            const keep2 = region["keep2"];

            const orderKeep = keep1["owner"]==="Order"?keep1:keep2;
            const destroKeep = keep1["owner"]==="Order"?keep2:keep1;

            const status = keep["status"];

            const embed = new MessageBuilder()
                .setTitle(attacker + " is attacking the " + defender + " keep in " + regionName);

            if(status=== "Inner"
                || status === "Outer"
                || status === "Lord") {
                embed.addField('Status', "At " + status + " " + keep["obj"] + "%")
            }

            embed.addField('Players', 'Order: ' + orderPop + "; Destruction: " + destroPop)
                .addField('Rank', 'Order: ' + (":star:".repeat(orderKeep["rank"]))
                    + "; Destruction: " + (":star:".repeat(destroKeep["rank"])))
                .addField('AAO', aao + '% for: ' + aaoOwner)
                .addField('BOs', 'Order: ' + orderBOs + "; Destruction: " + destroBOs)
                .setColor(color)
                .setThumbnail(IMAGE_URL)
                .setFooter('Created by Kalell with the help of Ruke\'s sor_online')
                .setImage(IMAGE_URL)
                .setTimestamp();

            if(this.isPreFortKeep(region.name, keep["owner"])) {
                const text = "PRE FORT " + keep["owner"] + " keep under attack in " + region.name + "\n@here";
                embed.setText(text);
                this.sendDiscordNotification(embed);
            }
            else {
                const text = "Tier " +region["tier"] +" " + keep["owner"] + " keep under attack in " + region.name;
                embed.setText(text);
                this.sendDiscordNotification(embed);
            }
        }
    }

    this.sendDiscordNotification = function (notification) {
        console.log(notification);

        for (let index in webhooks) {
            const webhook = webhooks[index];
            webhook.send(notification);
        }
    }

    this.isKeepUnderAttack = function(region, keep) {
        if(!region.hasOwnProperty("keep1")) {
            return false;
        }
        if(!region.hasOwnProperty("keep2")) {
            return false;
        }
        if(region["keep1"]["owner"] === region["keep2"]["owner"]) {
            return false;
        }
        //check if keep is under attack
        return (keep["status"] !== "Safe") && (keep["status"] !== "Locked");
        //"Locked", "Safe", "Outer" and "Inner", "Lord" are possible,
    }
}

const notifier = new Notifier();
notifier.init();