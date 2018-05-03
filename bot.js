var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');

const fs = require("fs");
//const { URL } = require('url');
//const fileUrl = new URL('https://s3.us-east-2.amazonaws.com/gtbot/gamertags.json');
//var data = fs.readFileSync(fileUrl);
//var gamertags = JSON.parse(data);

var params = { Bucket: process.env.S3_BUCKET_NAME, Key: process.env.AWS_ACCESS_KEY_ID };
new AWS.S3().getObject(params, function (err, json_data) {
    if (!err) {
        var gamertags = JSON.parse(new Buffer(json_data.Body).toString("utf8"));
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

        switch(cmd) {
            case 'gt':
            case 'agregargt':
            case 'ayudagt':
                bot.sendMessage({
                    to: channelID,
                    message: 'Por el momento, GTBot se encuentra en mantenimiento. Disculpa las molestias. Pronto volvera con toda la funcionalidad!'
                });
                break;

            case 'prueba1':
                if (par != null) {
                    if (gamertags.hasOwnProperty(par)) {
                        let gt = gamertags[par].gamertag;
                        bot.sendMessage({
                            to: channelID,
                            message: 'El GT de ' + par + ' es: ' + gt
                        });
                    } else {
                        bot.sendMessage({
                            to: channelID,
                            message: 'El usuario ' + par + ' aun no tiene un GT registrado. Favor de usar el comando !agregargt -gamertag para agregarlo. Asegurate de respetar mayusculas y minusculas.'
                        });
                    };
                } else {
                    bot.sendMessage({
                        to: channelID,
                        message: 'El comando utilizado requiere un nombre de usuario para buscar su GT.'
                    });                
                };
                break;
            case 'prueba2':
                if (par != null && par2 != null) {
                    if (gamertags.hasOwnProperty(par)) {
                        gamertags[par].gamertag = par2;
                        fs.writeFile("./gamertags.json", JSON.stringify(gamertags, null, 4));
                        bot.sendMessage({
                            to: channelID,
                            message: 'El GT ' + par2 + ' ha sido modificado para el usuario ' + par
                        });
                    } else {
                        //var strgt = ""
                        gamertags[par] = {
                            gamertag: par2
                        }
                        fs.writeFile("./gamertags.json", JSON.stringify(gamertags, null, 4));//, err => {
                        //if (err) throw err;
                        //});
                        bot.sendMessage({
                            to: channelID,
                            message: 'El GT ' + par2 + ' ha sido agregado para el usuario ' + par
                        });
                    };
                } else if (par != null) { //Caso cuando un usuario agrega su propio GT.
                    if (gamertags.hasOwnProperty(user)) {
                        gamertags[user].gamertag = par;
                        fs.writeFile("./gamertags.json", JSON.stringify(gamertags, null, 4));
                        bot.sendMessage({
                            to: channelID,
                            message: 'El GT ' + par + ' ha sido modificado para el usuario ' + user
                        });
                    } else {
                        //var strgt = ""
                        gamertags[user] = {
                            gamertag: par
                        }
                        fs.writeFile("./gamertags.json", JSON.stringify(gamertags, null, 4));//, err => {
                        //if (err) throw err;
                        //});
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
            case 'prueba3':
                bot.sendMessage({
                    to: channelID,
                    message: 'Para usar el GTBot (Bot de Gamertags) usa los siguientes comandos: \n'
                        + '!gt -nombredeusuario para ver el Gamertag de algun usuario de Discord. \n'
                        + '!agregargt -gamertag para registrar tu Gamertag en la base de datos, y que otros lo puedan buscar.'
                });
                break;
            // Just add any case commands if you want to..
         }
     }
});