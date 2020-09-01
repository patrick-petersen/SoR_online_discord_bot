const https = require('https');
const { MessageBuilder } = require('discord-webhook-node');
const exitHook = require('exit-hook');
const fs = require("fs");
const Discord_Notifier = require("./Discord_Notifier");

require("tls").DEFAULT_ECDH_CURVE = "auto";

function SoR_Notifier(config) {
    this.lastState = {};
    this.discord_Notifier = new Discord_Notifier(config);

    this.sendStartupMessage = function () {
        const embed = new MessageBuilder()
            .setText("Discord Bot is online!")
            .setTitle('State of the Realm Discord Bot is online!')
            .setAuthor('Kalell', 'https://cdn.discordapp.com/embed/avatars/0.png')
            .setURL('https://www.soronline.us/')
            .addField('Functions', 'Sending out notifications if keeps, forts or cities are getting attacked')
            .setColor('#00b0f4')
            .setThumbnail(config.IMAGE_URL)
            .setDescription('Created by Kalell with the help of Ruke\'s [sor_online](https://soronline.us)')
            .setImage(config.IMAGE_URL)
            .setTimestamp();

        this.discord_Notifier.sendDiscordDebugNotification(embed);
    }

    this.init = function () {
        const allWebhooks = config.webhooks["all"]
        for (let index in allWebhooks) {
            if(!allWebhooks.hasOwnProperty(index)) continue;

            const webhook = allWebhooks[index];
            webhook.setUsername('SoR online discord bot');
            webhook.setAvatar(config.IMAGE_URL);
            //webhook.send("Bot is online!");
        }

        this.sendStartupMessage();

        const shutdownCallback = () => {
            console.log("shutting down!");
            //this does not send the message to the discord hook!
            //this.sendDiscordDebugNotification("Shutting down!");
        }

        exitHook(shutdownCallback.bind(this));

        setInterval(this.makeApiCallWithCallback.bind(this), config.timeout);
        this.makeApiCallWithCallback.bind(this)();
    }

    this.shouldNotify = function(region, faction) {
        console.log(this.lastState);

        if(!config.shouldSendStartupNotifications
            && (config.startTime + config.timeTilFirstNotification > new Date().getTime())) {
            return false;
        }

        if(this.lastState.hasOwnProperty(region)) {
            const regionObj = this.lastState[region];
            console.log(regionObj);
            if(regionObj.hasOwnProperty(faction)) {
                const keep = regionObj[faction];
                console.log(keep);
                return (keep["lastAttack"] + config.minPauseBetweenAttacks < new Date().getTime());
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
        return (config.preFortKeeps.hasOwnProperty(region) && config.preFortKeeps[region] === faction)
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
            if(config.enableLogFile) {
                fs.appendFile("log.txt", response+"\n", (err) => {
                    if (err) {
                        console.log(err);
                    }
                    else {
                    }
                });
            }

            const data = json[0].data;
            const dataJson = JSON.parse(data);
            if(dataJson.hasOwnProperty("keeps"))
                this.parseKeeps(dataJson["keeps"], dataJson);

            if(dataJson.hasOwnProperty("forts"))
                this.parseForts(dataJson["forts"], dataJson);

            if(dataJson.hasOwnProperty("cities"))
                this.parseCity(dataJson["cities"], dataJson);

            if(dataJson.hasOwnProperty("servmsg"))
                this.parseServerMsg(dataJson["servmsg"], dataJson);
        };
        this.makeApiCall(callback);
    }

    this.parseServerMsg = function(data) {
        //[{"id":"1","data":"{\"servmsg\": \"No data updates, RoR server may be down\"}","created_at":"2020-07-30 05:48:21","accessed":null}]
        if(this.shouldNotify("servmsg", data)) {
            this.discord_Notifier.sendDiscordDebugNotification(JSON.stringify(data));
        }
        this.setAttacked("servmsg", data);
    }

    this.makeApiCall = function(callback) {
        console.debug("starting fetch");
        const postData = "api=ee6bd4a1-6e0b-475b-a4b0-4e18d4a66cb5";

        const options = {
            hostname: 'www.soronline.us',
            protocol: "https:",
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
                    .setThumbnail(config.IMAGE_URL)
                    .setFooter('Created by Kalell with the help of Ruke')
                    .setImage(config.IMAGE_URL)
                    .setTimestamp();

                this.discord_Notifier.sendDiscordNotification(embed, "city");
            }
            this.setAttacked(cityName, defender);
        });
    }

    this.parseForts = function (data, allData) {
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
                    .setThumbnail(config.IMAGE_URL)
                    .setFooter('Created by Kalell with the help of Ruke')
                    .setImage(config.IMAGE_URL)
                    .setTimestamp();

                this.discord_Notifier.sendDiscordNotification(embed, "fort");
            }
            this.setAttacked(fortName, defender);


            const stage = fort["stage"];
            const health = fort["health"];

            if(allData.hasOwnProperty("zonelocks")) {
                const zonelocks = allData["zonelocks"];

                const lockerChecker = (accum, current) => current || accum["owner"] === attacker;

                const isZoneLockedForAttacker = zonelocks.reduce(lockerChecker, false);


                if(isZoneLockedForAttacker && stage == 3 && health < 90) {
                    const cityIncName = fortName + "CityInc";

                    if(this.shouldNotify(cityIncName, defender)) {
                        const orderPop = (attacker === "Order"?fort["pop1"]:fort["pop2"]);
                        const destroPop = (attacker === "Order"?fort["pop2"]:fort["pop1"]);

                        const color = (defender==="Order")?"#ff0000":"#0000ff";

                        const embed = new MessageBuilder()
                            .setTitle(defender + " city incoming!")
                            .setText(fortName + " lord at " + health + "%")
                            .addField('Players', 'Order: ' + orderPop + "; Destruction: " + destroPop)
                            .addField('Details', "For more details visit [sor_online](https://soronline.us)")
                            .setColor(color)
                            .setThumbnail(config.IMAGE_URL)
                            .setFooter('Created by Kalell with the help of Ruke')
                            .setImage(config.IMAGE_URL)
                            .setTimestamp();

                        this.discord_Notifier.sendDiscordNotification(embed, "cityInc");
                    }

                    this.setAttacked(cityIncName, defender);
                }
            }
        });
    }

    this.parseKeeps = function(data) {
        data.forEach(region => {
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
                .setThumbnail(config.IMAGE_URL)
                .setFooter('Created by Kalell with the help of Ruke')
                .setImage(config.IMAGE_URL)
                .setTimestamp();

            if(this.isPreFortKeep(region.name, keep["owner"])) {
                const text = "PRE FORT " + keep["owner"] + " keep under attack in " + region.name + "\n@here";
                embed.setText(text);
                this.discord_Notifier.sendDiscordNotification(embed, "pre_fort", ""+tier);
            }
            else {
                const text = "Tier " +region["tier"] +" " + keep["owner"] + " keep under attack in " + region.name;
                embed.setText(text);
                this.discord_Notifier.sendDiscordNotification(embed, ""+tier);
            }
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

module.exports = SoR_Notifier;