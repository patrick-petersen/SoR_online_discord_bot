const https = require('https');
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const exitHook = require('exit-hook');
const fs = require("fs");


function Notifier() {

    //Notification settings
    const minPauseBetweenAttacks = 1000 * 60 * 30; //If there is a break between attacks it counts as new
    const startTime = new Date().getTime();
    const shouldSendStartupNotifications = false;
    const timeTilFirstNotification = 1000 * 60 * 2;

    //Discord settings
    const IMAGE_URL = 'https://www.soronline.us/logo.ico';
    const VZ_test = new Webhook("DiscordWebbhook1");
    const VZ_offi  = new Webhook("DiscordWebbhook2");

/*
    const webhooks = {
        "all": [VZ_test, VZ_offi],
        "debug": [VZ_test],
        "1": [VZ_test],
        "2": [VZ_test],
        "3": [VZ_test],
        "4": [VZ_test],
        "pre_fort": [VZ_test, VZ_offi],
        "fort": [VZ_test, VZ_offi],
        "city": [VZ_test, VZ_offi],

    }

 */


    const webhooks = {
        "all": [VZ_test],
        "debug": [VZ_test],
        "1": [VZ_test],
        "2": [VZ_test],
        "3": [VZ_test],
        "4": [VZ_test],
        "pre_fort": [VZ_test],
        "fort": [VZ_test],
        "city": [VZ_test],
    }


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
            .addField('Functions', 'Sending out notifications if keeps, forts or cities are getting attacked')
            .setColor('#00b0f4')
            .setThumbnail(IMAGE_URL)
            .setDescription('Created by Kalell with the help of Ruke\'s [sor_online](https://soronline.us)')
            .setImage(IMAGE_URL)
            .setTimestamp();

        this.sendDiscordDebugNotification(embed);
    }

    this.init = function () {
        const timeout = 1000 * 60; //timeout in milliseconds

        for (let index in webhooks["all"]) {
            const webhook = webhooks["all"][index];
            webhook.setUsername('SoR online discord bot');
            webhook.setAvatar(IMAGE_URL);
            //webhook.send("Bot is online!");
        }

        this.sendStartupMessage();

        const shutdownCallback = () => {
            console.log("shutting down!");
            //this does not send the message to the discord hook!
            //this.sendDiscordDebugNotification("Shutting down!");
        }

        exitHook(shutdownCallback.bind(this));

        setInterval(this.makeApiCallWithCallback.bind(this), timeout);
        this.makeApiCallWithCallback.bind(this)();
    }

    this.shouldNotify = function(region, faction) {
        console.log(this.lastState);

        if(!shouldSendStartupNotifications
            && (startTime + timeTilFirstNotification > new Date().getTime())) {
            return false;
        }

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
        return (preFortKeeps.hasOwnProperty(region) && preFortKeeps[region] === faction)
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
            fs.appendFile("log.txt", response+"\n", (err) => {
                if (err) {
                    console.log(err);
                }
                else {
                }
            });

            const data = json[0].data;
            const dataJson = JSON.parse(data);
            if(dataJson.hasOwnProperty("keeps"))
                this.parseKeeps(dataJson["keeps"]);

            if(dataJson.hasOwnProperty("forts"))
                this.parseForts(dataJson["forts"]);

            if(dataJson.hasOwnProperty("cities"))
                this.parseCity(dataJson["cities"]);

            if(dataJson.hasOwnProperty("servmsg"))
                this.parseServerMsg(dataJson["servmsg"]);
        };
        this.makeApiCall(callback);
    }

    this.parseServerMsg = function(data) {
        //[{"id":"1","data":"{\"servmsg\": \"No data updates, RoR server may be down\"}","created_at":"2020-07-30 05:48:21","accessed":null}]
        this.sendDiscordDebugNotification(JSON.stringify(data));
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

    this.parseCity = function (data) {
        //[{"id":"1","data":"{\"keeps\": [{\"aao\": \"80\", \"bos\": [\"Destruction\", \"Neutral\", \"Order\", \"Destruction\"], \"name\": \"Reikland\", \"pop1\": \"23\", \"pop2\": \"42\", \"tier\": 4, \"keep1\": {\"obj\": \"Safe\", \"rank\": \"1\", \"owner\": \"Destruction\", \"rankup\": \"23\", \"status\": \"Safe\"}, \"keep2\": {\"obj\": \"Safe\", \"rank\": \"3\", \"owner\": \"Order\", \"rankup\": \"0\", \"status\": \"Safe\"}, \"aaoOwner\": \"Order\"}],
        // \"cities\": [{\"name\": \"Altdorf\", \"rank\": \"3\", \"time\": \"138\", \"dwins\": \"0\", \"owins\": \"0\", \"owner\": \"Order\", \"instances\": \"25\"}], \"zonelocks\": [{\"name\": \"Dwarfs v Greenskins\", \"owner\": \"Destruction\", \"pairing\": 1}, {\"name\": \"High Elves v Dark Elves\", \"owner\": \"Destruction\", \"pairing\": 3}]}","created_at":"2020-07-29 19:00:37","accessed":null}]
        data.forEach((city) => {
            const cityName = city["name"];
            const defender = city["owner"];
            const attacker = (defender==="Order")?"Destruction":"Order";

            if(this.shouldNotify(cityName, defender)) {
                const color = (defender==="Order")?"#ff0000":"#0000ff";

                const instances = city["instances"];
                const rank = city["rank"];
                const orderWins = city["owins"];
                const destroWins = city["dwins"];

                const embed = new MessageBuilder()
                    .setText(attacker + " is attacking " + cityName + "(Rank " + rank + ")")
                    .setTitle(attacker + " is attacking " + cityName + "(Rank " + rank + ")")
                    .addField('Instances', 'Total: ' + instances + '; Order wins: ' + orderWins
                                + "; Destruction wins: " + destroWins)
                    .addField('Details', "For more details visit [sor_online](https://soronline.us)")
                    .setColor(color)
                    .setThumbnail(IMAGE_URL)
                    .setFooter('Created by Kalell with the help of Ruke')
                    .setImage(IMAGE_URL)
                    .setTimestamp();

                this.sendDiscordNotification(embed, "city");
            }
            this.setAttacked(cityName, defender);
        });
    }

    this.parseForts = function (data) {
/*[{"id":"1","data":"{\"forts\": [{\"name\": \"Shining Way\", \"pop1\": \"241\", \"pop2\": \"180\", \"owner\": \"Order\", \"stage\": \"2\", \"health\": \"51\"}], \"keeps\": [{\"aao\": \"400\", \"bos\": [\"Neutral\", \"Neutral\", \"Order\", \"Neutral\"], \"name\": \"Reikland\", \"pop1\": \"25\", \"pop2\": \"5\", \"tier\": 4, \"keep1\": {\"obj\": \"Safe\", \"rank\": \"1\", \"owner\": \"Destruction\", \"rankup\": \"51\", \"status\": \"Safe\"}, \"keep2\": {\"obj\": \"Safe\", \"rank\": \"3\", \"owner\": \"Order\", \"rankup\": \"0\", \"status\": \"Safe\"}, \"aaoOwner\": \"Destruction\"}], \"zonelocks\": [{\"name\": \"Dwarfs v Greenskins\", \"owner\": \"Destruction\", \"pairing\": 1}]}","created_at":"2020-07-29 18:13:06","accessed":null}]
*/
        data.forEach((fort) => {
            const fortName = fort["name"];
            const defender = fort["owner"];
            const attacker = (defender==="Order")?"Destruction":"Order";

            if(this.shouldNotify(fortName, defender)) {
                const orderPop = (attacker === "Order"?fort["pop1"]:fort["pop2"]);
                const destroPop = (attacker === "Order"?fort["pop2"]:fort["pop1"]);

                const color = (defender==="Order")?"#ff0000":"#0000ff";

                const embed = new MessageBuilder()
                    .setTitle(attacker + " is attacking " + fortName)
                    .setText(attacker + " is attacking " + fortName)
                    .addField('Players', 'Order: ' + orderPop + "; Destruction: " + destroPop)
                    .addField('Details', "For more details visit [sor_online](https://soronline.us)")
                    .setColor(color)
                    .setThumbnail(IMAGE_URL)
                    .setFooter('Created by Kalell with the help of Ruke')
                    .setImage(IMAGE_URL)
                    .setTimestamp();

                    this.sendDiscordNotification(embed, "fort");
            }
            this.setAttacked(fortName, defender);
        });
    }

    this.parseKeeps = function(data) {
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
                .addField('Details', "For more details visit [sor_online](https://soronline.us)")
                .setColor(color)
                .setThumbnail(IMAGE_URL)
                .setFooter('Created by Kalell with the help of Ruke')
                .setImage(IMAGE_URL)
                .setTimestamp();

            if(this.isPreFortKeep(region.name, keep["owner"])) {
                const text = "PRE FORT " + keep["owner"] + " keep under attack in " + region.name + "\n@here";
                embed.setText(text);
                this.sendDiscordNotification(embed, "pre_fort", ""+tier);
            }
            else {
                const text = "Tier " +region["tier"] +" " + keep["owner"] + " keep under attack in " + region.name;
                embed.setText(text);
                this.sendDiscordNotification(embed, ""+tier);
            }
        }
    }

    this.sendDiscordNotification = function (notification, ...categories) {
        console.log(categories);
        //all parameters after the first are categories (strings)
        const discordWebhooks = categories.map(category => {
            console.log(category, webhooks.hasOwnProperty(category), webhooks[category]);
            return (webhooks.hasOwnProperty(category)?webhooks[category]:[])
        }).reduce((list, curr) => {
            console.log(list);
            curr.forEach((oneWebhook) => {
                if(list.indexOf(oneWebhook) === -1) {
                    console.log("-1", oneWebhook);
                    list.push(oneWebhook);
                }
                else {
                    console.log("skipping", oneWebhook);
                }
            });

            return list;
        }, []);

        this._sendDiscordNotification(notification, discordWebhooks);
    }

    this.sendDiscordDebugNotification = function (notification) {
        this.sendDiscordNotification(notification, "debug");
    }

    this._sendDiscordNotification = function (notification, discordWebhooks) {
        console.log(notification, discordWebhooks);

        for (let index in discordWebhooks) {
            const webhook = discordWebhooks[index];
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