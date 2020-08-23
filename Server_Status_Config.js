const {VZ_test_online} = require("./Discord_Config");

const Server_Status_Config = {
    IMAGE_URL: 'https://www.soronline.us/logo.ico',

    time_between_checks: 60 * 1000, //time between connectivity checks

    server: {
        ip: "46.105.54.77",
        port: 8000
    },

    webhooks: {
        "all": [VZ_test_online],
        "status_change": [VZ_test_online],
    }
};

module.exports = Server_Status_Config;