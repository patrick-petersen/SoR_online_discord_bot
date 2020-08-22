
function Discord_Notifier(config) {
    this.sendDiscordNotification = function (notification, ...categories) {
        console.log(categories);
        //all parameters after the first are categories (strings)
        const discordWebhooks = categories.map(category => {
            console.log(category, config.webhooks.hasOwnProperty(category), config.webhooks[category]);
            return (config.webhooks.hasOwnProperty(category)?config.webhooks[category]:[])
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
}

module.exports = Discord_Notifier;