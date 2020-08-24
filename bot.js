//Configure Variables
var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var fs = require('fs');
var prefix = 'v.';
var computers = ["Shaox Latsu"];
var baseGhz = [1];
var maxGHz = [2];
var baseMem = [3];
var maxMem = [4];
var cores = [1];
var usbPorts = [0];
var ghzPricing = 250;
var memPricing = 500;
var compPricing = 1000;

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

//Initializes connection with database
const { Client } = require('pg');
const dtb = new Client({
  connectionString: 'postgres://vmapburnukrbsw:b6106349e61e4e4786c4e67d7b81ede54655e953b9b6bf3a059212ca8c4422e4@ec2-107-21-248-200.compute-1.amazonaws.com:5432/demmv8ihg54dmj',
  ssl: true,
});
dtb.connect();



// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

//Calculates "upgrade pricing" based on an exponential function
function upgBase(base, num){
	return Math.ceil(base*(Math.pow(2.5, num)));
}
function nxtPrice(base, change){
	return Math.ceil(base*(Math.pow(Math.E, change)));
}

//Logs connection and initializes bot settings
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
	bot.setPresence({
			game: {
				type: 3,
				name: 'the chat'
			}
		}, function(err, res){
			if (err) throw err
		});
});

//Logs any disconnect issues the bot encounters and automatically reconnects
bot.on('disconnect', function(erMsg, code) {
    console.log('----- Bot disconnected from Discord with code', code, 'for reason:', erMsg, '-----');
	bot.sendMessage({
		to: '701915050688118804',
		message: 'Error Code: ' + code + ' Reason: ' + erMsg
	});
	bot.connect();
});

//When a server the bot is in receives a message
bot.on('message', function (user, userID, channelID, message, evt) {
	//If the user is not another bot
	if (!(bot.users[userID].bot)){		
		
		//Initialize local time variables
		let thisTime = new Date();
		let thisHour = (thisTime.getHours());
		let thisMinute = thisTime.getMinutes();
		let thisDay = thisTime.getDate();
		let thisDayay = (thisTime.getDay());
		let thisMonth = thisTime.getMonth() + 1;
		
		//Converts the message to lowercase and splits it into an array of arguments
		message = message.toLowerCase();
		let args = message.substring(2).split(' ');
		command = args[0];

		//If the first two letters of the message are "v."
		if (message.substring(0,2) == prefix){
			//Get information about the user using the command from the database, or create it if it is not present
			dtb.query('SELECT * FROM peoples WHERE id = ' + userID, function(e, r){
				if (r != undefined){
					if (r.rows[0] == undefined){
						dtb.query('INSERT INTO peoples(id, moneys, scrap, date, computer, GHz, memory, memBlocks1, usb, preference, language) VALUES (' + userID + ', 100, 100, 1313, 0, 1, 3, 0, 0, 0, 0)', function(err, res){
							if (err) throw err;
						});
					} else {
						//Sets local variables to the values received from the database
						let compNum = r.rows[0].computer;
						let runningGhz = r.rows[0].ghz;
						let totalMem = r.rows[0].memory;
						let smallBlocks = r.rows[0].memblocks1;
						let usbDevices = r.rows[0].usb;

						//Performs different action based on the first word after the prefix
						switch (command) {

							//Prints the time to the channel the command was used
							case 'time':
								bot.sendMessage({
									to: channelID,
									message: thisHour + ':' + thisMinute
								});
							break;
							
							//A command used to alter the content of the database
							case 'setup':
								/**
								dtb.query("DROP TABLE peoples");
								dtb.query("CREATE TABLE peoples(id bigint NOT NULL, moneys int NOT NULL, scrap int NOT NULL, date int NOT NULL)", function(err, res){
									if (err) throw err;
								});**/
						
								/**
								dtb.query('ALTER TABLE peoples ADD COLUMN computer int NOT NULL DEFAULT 0', function (e, r){
									if (e) throw e;
								});
								dtb.query('ALTER TABLE peoples ADD COLUMN GHz double NOT NULL DEFAULT 1');
								dtb.query('ALTER TABLE peoples ADD COLUMN memory int NOT NULL DEFAULT 3');
								dtb.query('ALTER TABLE peoples ADD COLUMN memBlocks1 int NOT NULL DEFAULT 0');
								dtb.query('ALTER TABLE peoples ADD COLUMN usb int NOT NULL DEFAULT 0');
								dtb.query('ALTER TABLE peoples ADD COLUMN preference int NOT NULL DEFAULT 0');
								dtb.query('ALTER TABLE peoples ADD COLUMN language int NOT NULL DEFAULT 0');
								dtb.query('ALTER TABLE peoples ALTER COLUMN GHz TYPE float(1)');**/
							break;

							//Checks if the user has claimed a "daily" today. If not, reward them with a daily reward and alter the database to reflect the collection of today's daily'
							case 'daily':
								if (r.rows[0].date != thisMonth + '' + thisDay){
									dtb.query('SELECT moneys FROM peoples WHERE id = ' + userID, function(e1, r1){
										bot.sendMessage({
											to: channelID,
											message: "You now have **" + (r1.rows[0].moneys + 100) + "** arptix!"
										});
										dtb.query('UPDATE peoples SET moneys = ' + (r1.rows[0].moneys + 100) + ' WHERE id = ' + userID, function(e2, r2){
											if  (e2) throw e2;
										});
										dtb.query('UPDATE peoples SET date = ' + thisMonth + '' + thisDay + ' WHERE id = ' + userID, function(e2, r2){
											if  (e2) throw e2;
										});
									});
								} else {
									bot.sendMessage({
										to: channelID,
										message: "You've already claimed your daily today"
									})
								}
							break;

							//Returns the user's "arptix" value from the results of the eariler database query
							case 'arptix':
								bot.sendMessage({
									to: channelID,
									message: "You have **" + r.rows[0].moneys + "** arptix!"
								});
							break;

							//Returns the user's "arptix" value from the results of the eariler database query
							case 'scrap':
								bot.sendMessage({
									to: channelID,
									message: "You have **" + r.rows[0].scrap + "** scrap!"
								});
							break;

							//Returns what "equipment" the user has from the results of the earlier database query
							case 'equipment':
								//let lang = languages[r.rows[0].language];
								bot.sendMessage({
									to: channelID,
									message: "You currently have the **" + computers[compNum] + "** \n**Base Memory:** " + baseMem[compNum] + " GB \n**Max Memory:** " + maxMem[compNum] + " GB \n**Base GHz:** " + baseGhz[compNum] + "\n**Max GHz:** " +  maxGHz[compNum] + "\n**Cores:** " + cores[compNum] + " \n**USB Ports: **" + usbPorts[compNum] + "\n\nYour CPU is currently running at **" + runningGhz + "** GHz, and you have **" + totalMem + "** total GB of memory in use, **" + smallBlocks + "** 100 GB hard drives, and **" + usbDevices + "** total USB devices."
								});
							break;

							case 'code':
								//Initializes local variables that use an RNG to determine whether the user gets "arptix" or "scrap" from this command, weighted on a prefence they established if present in the eariler database query
								let inRand = 2;
								if (r.rows[0].preference != 0){
									inRand = 4;
								}
								let temp = Math.floor(Math.random() * inRand);

								//Alters the amount of "arptix" the user has, and prints information about their new value
								if (temp == 0){
									dtb.query('UPDATE peoples SET moneys = ' + (r.rows[0].moneys + ((r.rows[0].memory)*5)) + ' WHERE id = ' + userID, function (e2, r2){
										if (e2) throw e2;
									});
									bot.sendMessage({
										to: channelID,
										message: "You sold your program for " + ((r.rows[0].memory)*5) + " arptix!"
									})
								}

								//Alters the amount of "scrap" the user has, and prints information about their new value
								if (temp == 1){
									dtb.query('UPDATE peoples SET scrap = ' + (r.rows[0].scrap + ((r.rows[0].memory)*5)) + ' WHERE id = ' + userID, function (e2, r2){
										if (e2) throw e2;
									});
									bot.sendMessage({
										to: channelID,
										message: "You sold your program for " + ((r.rows[0].memory)*5) + " scrap!"
									})
								}

								//Alters the amount of "arptix" or "scrap", based on preference if listed in the earlier database query, and prints information about their new value
								if (temp > 1){
									if (r.rows[0].preference == 1){
										dtb.query('UPDATE peoples SET moneys = ' + (r.rows[0].moneys + Math.ceil((r.rows[0].memory)*6*r.rows[0].ghz)) + ' WHERE id = ' + userID, function (e2, r2){
											if (e2) throw e2;
										});
										bot.sendMessage({
											to: channelID,
											message: "You sold your program for " + Math.ceil((r.rows[0].memory)*6*r.rows[0].ghz) + " arptix!"
										})
									}
									if (r.rows[0].preference == 2){
										dtb.query('UPDATE peoples SET scrap = ' + (r.rows[0].scrap + Math.ceil((r.rows[0].memory)*6*r.rows[0].ghz)) + ' WHERE id = ' + userID, function (e2, r2){
											if (e2) throw e2;
										});
										bot.sendMessage({
											to: channelID,
											message: "You sold your program for " + Math.ceil((r.rows[0].memory)*6*r.rows[0].ghz) + " scrap!"
										})
									}
								}
							break;

							//Alters the database with information about the user's new preference, based on the original message
							case 'setpreference':
								if (message.substring(16) == "a" || message.substring(16) == "arptix"){
									dtb.query('UPDATE peoples SET preference = 1', function(e, r){
										if (e) throw e;
										bot.sendMessage({
											to: channelID,
											message: "You successfully set your coding preference to arptix!"
										});
									});
								} else if (message.substring(16) == "s" || message.substring(16) == "scrap"){
									dtb.query('UPDATE peoples SET preference = 2', function(e, r){
										if (e) throw e;
										bot.sendMessage({
											to: channelID,
											message: "You successfully set your coding preference to scrap!"
										});
									});
								} else {
									bot.sendMessage({
										to: channelID,
										message: "Invalid usage, please use this syntax: \n**v.setPreference [arptix|scrap]**"
									});
								}
							break;

							//Prints information about the users preference based on the earlier database query
							case 'viewpreference':
								bot.sendMessage({
									to: channelID,
									message: "Your preference is " + ["not set.","arptix.", "scrap."][r.rows[0].preference]
								});
							break;

							//Displays a "shop" that lists information about possible upgrades based on the user's equipment found in the earlier database query and upgrade pricing functions
							case 'shop':
								bot.sendMessage({
									to: channelID,
									embed: {
										color: 3393093,
										author : {
											name : bot.users[userID].username + "'s shop:",
											icon_url: 'https://lh3.googleusercontent.com/lhPTOLK5wOqeQBn0ySr3NxVUSPXqHmtGv-Vzd8s0b5yjejVSFUaLQ_vLrKqj2345X-Dv0VXH6laTwk-uWOsOc4GF6jR-9CJ4vbjw5FbXWDzQ_F_n35x8h1tWqTvY-vHcrD7xgs1t17TG_w5gyeC1pPcgVmv9XBf8IMPgLdjFPv-U-haH7k8G6LLBqJ_M7xJMs_QV5lbroHzLmGBv1lT4siNdJYAs3mvOX2G69BYaq89yC11W-tYoXLyTCwUM1bhXTAEDeT2Y20vLEZTT3-LU6XcBuQ_SSQTZgkR7R35GNO4mjcWmOXsKaffUkIhU17uFm5sFNWZQnO3GsqELSv3YQ-BBpVT4BpKHK3dg_EEbQUyoPGaMJP1Kh2G8hDa7VIlHyY6h7H8qzS5BLXiw_4ooxkyiauXJOXpGvuBGmUwe2zXHWIuKnL2vIMoTZbVs4HBcA2F1WGM78mmU_8FbojUvccLBMzum8JSRTOQkANBko5gn3oe-PoNwsQ5qc3mHc-9Vatx2fzcN71tsDIYCsEk9SDNWXsFMUFZGElcWrIJXFWiacNbzAHMmpABCoDwKv5u9rMSmhAuCAcsrWeJv4MqmtBEErwTa1RLn32NnTvdcHhcuUqKK2CQmqd59CpfW4ZC6gE13tqj-AhHVfLB1Qe58ALE4eUaXLtHDJgZrvrtnN8uaMlkkZHZ9GcM37Q0L9fWuQlU2=w1920-h902-ft'
										},
										fields:[{
											name: "Computer Upgrades:",
											value: "`1` RAM Card (+ 1 GB) - " + nxtPrice(upgBase(memPricing, compNum), totalMem - baseMem[compNum]) + " scarp \n`2` Increase processor optimization (+ .2 GHz) - " + nxtPrice(upgBase(ghzPricing, compNum), runningGhz - baseGhz[compNum]) + " scrap \n`3` Next Computer - " + upgBase(compPricing, compNum) + " arptix",
											inline: true
										}/**,
										{
											name: "Self Improvement:",
											value: "",
											inline: false
										}**/]
									}
								});
							break;

							//Allows the user to buy an item listed in the "shop", if they have the appropriate amount of currency, and their equipment meets the requiremnts.
							case 'buy':
								switch(message.substring(6)){
									case '1':
										if (r.rows[0].scrap >= nxtPrice(upgBase(memPricing, compNum), totalMem - baseMem[compNum]) && totalMem < maxMem[compNum]){
											dtb.query('UPDATE peoples SET scrap = ' + (r.rows[0].scrap - nxtPrice(upgBase(memPricing, compNum), totalMem - baseMem[compNum])) + ', memory = ' + (totalMem + 1) + ' WHERE id = ' + userID, function (e2, r2){
												if (e2) throw e2;
												bot.sendMessage({
													to: channelID,
													message: bot.users[userID].username + ", you now have " + (r.rows[0].scrap - nxtPrice(upgBase(memPricing, compNum), totalMem - baseMem[compNum])) + " scrap, and your computer memory has increased by 1 GB!"
												});
											});
										} else if(totalMem >= maxMem[compNum]) {
											bot.sendMessage({
												to: channelID,
												message: "Your current computer already has max memory!"
											});
										} else {
											bot.sendMessage({
												to: channelID,
												message: bot.users[userID].username + ", you don't have enough scrap to buy this!"
											});
										}
									break;
									case '2':
										if (r.rows[0].scrap >= nxtPrice(upgBase(ghzPricing, compNum), runningGhz - baseGhz[compNum]) && runningGhz < maxGHz[compNum]){
											dtb.query('UPDATE peoples SET scrap = ' + (r.rows[0].scrap - nxtPrice(upgBase(ghzPricing, compNum), runningGhz - baseGhz[compNum])) + ', ghz = ' + (runningGhz + .2) + ' WHERE id = ' + userID, function (e2, r2){
												bot.sendMessage({
													to: channelID,
													message: bot.users[userID].username + ", you now have " + (r.rows[0].scrap - nxtPrice(upgBase(ghzPricing, compNum), runningGhz - baseGhz[compNum])) + " scrap, and your processor now runs at " + (Math.ceil(10*(runningGhz + .2)))/10 +  " GHz!"
												});
											});
										} else if(runningGhz >= maxGHz[compNum]) {
											bot.sendMessage({
												to: channelID,
												message: "Your current computer already has a max level processor!"
											});
										} else {
											bot.sendMessage({
												to: channelID,
												message: bot.users[userID].username + ", you don't have enough scrap to buy this!"
											});
										}
									break;
									case '3':
										if (compNum == 0){
											bot.sendMessage({
												to: channelID,
												message: "More computers coming soon!"
											});
										}
									break;
									default:
										bot.sendMessage({
											to: channelID,
											message: "Invalid usage, please use this syntax: \n**v.buy [shop number slot]**"
										});
								}
							break;

							//Prints a list of commands the bot recognizes
							case 'help':
								bot.sendMessage({
									to: channelID,
									message: "***NOTE, THIS IS AN EARLY VERSION OF THE HELP COMMAND WITH THE SOLE PURPOSE OF SHOWING AVAILABLE COMMANDS***"
								}, function(e,r){
									bot.sendMessage({
										to: channelID,
										message: "*time; \n daily; \n arptix; \n scrap; \n equipment; \n code; \n setPreference; \n viewPreference; \nshop; \nbuy;*"
									});
								});
							break;

							//A command for developmental testing.
							case 'test':
								console.log(upgBase(100, 3));
								console.log(nxtPrice(upgBase(100, 3), .4));
							break;

							//Prints if the user types an unrecognized command with the bot's prefix.
							default:
								bot.sendMessage({
									to: channelID,
									message: "Thank you for using Virobot! For details on the features of this bot, use the 'v.help' command!"
								});
						}
					}
				}
			});
		}
	}
});