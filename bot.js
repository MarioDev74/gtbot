var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var AWS = require('aws-sdk');

const fs = require("fs");
var gamertags;
var s3 = new AWS.S3();

var params = {
    Bucket: 'gtbot', Key: 'gamertags.json'
};

s3.getObject(params, function (err, json_data) {
    if (!err) {
        gamertags = JSON.parse(new Buffer(json_data.Body).toString("utf8"));
    } else {
        logger.info(err.message);
        gamertags = JSON.parse('{"mariocms": {"gamertag": "MarioFake"}}');
    }
});

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
    token: process.env.BOT_TOKEN,
    autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' -');
        var cmd = args[0];
        var par = args[1];
        var par2 = args[2];

        args = args.splice(1);

        switch (cmd) {
            case 'gt':
                if (par != null) {
                    //var lcpar = bot.users[Object.keys(bot.users).find(key => key.toLowerCase() === par.toLowerCase())].username;
                    //logger.info(JSON.parse(bot.users));
                    if (gamertags.hasOwnProperty(par)) {
                        let gt = gamertags[par].gamertag;
                        bot.sendMessage({
                            to: channelID,
                            message: 'El GT de ' + par + ' es: ' + gt
                        });
                    } else {
                        bot.sendMessage({
                            to: channelID,
                            message: 'El usuario ' + par + ' a\u00FAn no tiene un GT registrado. Favor de usar el comando !añadirgt -gamertag para agregarlo. Aseg\u00FArate de respetar may\u00FAsculas y min\u00FAsculas al buscar.'
                        });
                    };
                } else {
                    if (gamertags.hasOwnProperty(user)) {
                        let gt = gamertags[user].gamertag;
                        bot.sendMessage({
                            to: channelID,
                            message: user + ' tu GT es: ' + gt
                        });
                    } else {
                        bot.sendMessage({
                            to: channelID,
                            message: 'El usuario ' + user + ' a\u00FAn no tiene un GT registrado. Favor de usar el comando !añadirgt -gamertag para agregarlo.'
                        });
                    };
                    /*bot.sendMessage({
                        to: channelID,
                        message: 'El comando utilizado requiere un nombre de usuario de Discord para buscar su GT. Ej: !gt -usuariodiscord'
                    });*/
                };
                break;
            case 'agregargt':
            case 'añadirgt':
                if (par != null && par2 != null) {
                    if (gamertags.hasOwnProperty(par)) {
                        gamertags[par].gamertag = par2;
                        //fs.writeFile("./gamertags.json", JSON.stringify(gamertags, null, 4));
                        params = {Bucket: 'gtbot', Key: 'gamertags.json', Body: JSON.stringify(gamertags, null, 4)};
                        s3.putObject(params, function (resp) {logger.info('GT modificado para ' + par)});
                        bot.sendMessage({
                            to: channelID,
                            message: 'El GT ' + par2 + ' ha sido modificado para el usuario ' + par
                        });
                    } else {
                        //var strgt = ""
                        gamertags[par] = {
                            gamertag: par2
                        }
                        params = {Bucket: 'gtbot', Key: 'gamertags.json', Body: JSON.stringify(gamertags, null, 4)};
                        s3.putObject(params, function (resp) {logger.info('GT agregado para ' + par)});
                        bot.sendMessage({
                            to: channelID,
                            message: 'El GT ' + par2 + ' ha sido agregado para el usuario ' + par
                        });
                    };
                } else if (par != null) { //Caso cuando un usuario agrega su propio GT.
                    if (gamertags.hasOwnProperty(user)) {
                        gamertags[user].gamertag = par;
                        params = {Bucket: 'gtbot', Key: 'gamertags.json', Body: JSON.stringify(gamertags, null, 4)};
                        s3.putObject(params, function (resp) {logger.info('GT modificado para ' + user)});
                        bot.sendMessage({
                            to: channelID,
                            message: 'El GT ' + par + ' ha sido modificado para el usuario ' + user
                        });
                    } else {
                        gamertags[user] = {
                            gamertag: par
                        }
                        params = {Bucket: 'gtbot', Key: 'gamertags.json', Body: JSON.stringify(gamertags, null, 4)};
                        s3.putObject(params, function (resp) {logger.info('GT agregado para ' + user)});
                        bot.sendMessage({
                            to: channelID,
                            message: 'El GT ' + par + ' ha sido agregado para el usuario ' + user + '.'
                        });
                    };
                } else {
                    bot.sendMessage({
                        to: channelID,
                        message: 'El comando utilizado requiere que se indique el GT a agregar.'
                    });
                };
                break;
            case 'ayudagt':
                bot.sendMessage({
                    to: channelID,
                    message: 'Para usar el GTBot (Bot de Gamertags) usa los siguientes comandos: \n'
                        + '!gt para mostrar tu propio GT. \n'
                        + '!gt -nombredeusuario para ver el Gamertag de alg\u00FAn usuario de Discord. \n'
                        + '!añadirgt -gamertag para registrar tu Gamertag en la base de datos, y que otros lo puedan buscar.'
                });
                break;
            // Just add any case commands if you want to..

            /*   Mensaje de En Mantenimiento
            bot.sendMessage({
                to: channelID,
                message: 'Por el momento, GTBot se encuentra en mantenimiento. Disculpa las molestias. Pronto volvera con toda la funcionalidad!'
            });
            break;*/
        }
    }
});
