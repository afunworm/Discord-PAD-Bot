/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
require('dotenv').config();
import { Monster } from './classes/monster.class';
import { AI, QueryResultInterface } from './classes/ai.class';
import { Helper } from './classes/helper.class';
import { Cache } from './classes/cache.class';
import { ClientUser } from 'discord.js';
const Discord = require('discord.js');

/*-------------------------------------------------------*
 * CONST
 *-------------------------------------------------------*/
const client = new Discord.Client();
const DISCORD_TOKEN = process.env.MODE === 'PRODUCTION' ? process.env.DISCORD_TOKEN : process.env.DISCORD_TOKEN_DEV;
const COMMAND_PREFIX = process.env.COMMAND_PREFIX;

/*-------------------------------------------------------*
 * App
 *-------------------------------------------------------*/
client.once('ready', () => {
	let clientUser: ClientUser = client.user;
	clientUser.setPresence({ activity: { name: 'hard to train' }, status: 'online' });
	console.log('Server started');
});

client.on('message', async (message: any) => {
	//Do not run if it is from the bot itself
	if (message.author.bot) return;

	//Let's do some dadjokes - put it above the checking to make sure it can be activated anywhere
	if (Helper.isDadJokeable(message.content.trim())) {
		await Helper.sendIAmDadJoke(message);
		return;
	}

	//If message is NOT DM, and it is also not a message that mentioned the bot, then do nothing
	if (
		message.channel.type !== 'dm' &&
		!message.mentions.has(client.user) &&
		!message.content.trim().startsWith(COMMAND_PREFIX)
	) {
		return;
	}
	//If message is just an empty string, return
	let reg = new RegExp(`[\\${COMMAND_PREFIX}]+`);
	if (message.content.startsWith(COMMAND_PREFIX) && message.content.replace(reg, '').trim().length === 0) {
		return;
	}

	// message.channel.send(`I am being maintained and will be able to work again in 15 mins!`);
	// return;

	let userId = message.author.id;
	let ai = new AI(userId);
	let helper = new Helper(message);
	let input = message.content.trim().startsWith(COMMAND_PREFIX)
		? message.content.trim().substring(1)
		: message.content.trim();
	let cache = new Cache('conversation');
	input = input.replace(client.user.id, ''); //Stripping ping from message
	input = Helper.replaceCommonAbbreviation(input); //Replace commonly confusing terms

	try {
		let result: QueryResultInterface = await ai.detectIntent(input);
		let rawInput = result.queryResult.queryText;
		let action = result.queryResult.action;
		helper.assignQueryText(result.queryResult.queryText);

		//What information is being requestd? For example: show me Anubis IMAGE
		let infoType = result.queryResult.parameters.fields?.infoType?.stringValue || null;

		//Define the type of question on user input. For example: WHAT does Anubis look like?
		let questionType = result.queryResult.parameters.fields?.questionType?.stringValue || null;

		//What kind of action the user is trying to perform? For example: What do I CALL 1234?
		let actionType = result.queryResult.parameters.fields?.actionType?.stringValue || null;

		//What type of action the targeted monster is doing? For example: How much does Anubis COST?
		let targetActionType = result.queryResult.parameters.fields?.targetActionType?.stringValue || null;

		//Monster attributes, if any
		let attribute1 = result.queryResult.parameters.fields?.monsterAttribute1?.stringValue || null;
		let attribute2 = result.queryResult.parameters.fields?.monsterAttribute2?.stringValue || null;
		//Sometimes attribute2 is detected but not attribute1
		if (attribute2 && !attribute1) {
			//Don't overwrite attribute2 with null, instead, give it attribute1's old value
			let temp = attribute1;
			attribute1 = attribute2;
			attribute2 = temp;
		}

		//Monster name, if any
		let baseMonsterId = result.queryResult.parameters.fields?.monsterName?.stringValue || null;

		//Monster series/collab, if any
		let monsterSeries = result.queryResult.parameters.fields?.monsterSeries?.stringValue || null;

		//If the target pronoun exists, it indicates the continuous conversation
		let targetPronoun = result.queryResult.parameters.fields?.targetPronoun?.stringValue || null;

		if (action === 'card.info') {
			//If the ID is not provided, try to see if we can get the ID from guessing the name
			//But the monster name has to exists
			// console.log(result.queryResult.parameters);
			if (!baseMonsterId || !/^\d+$/.test(baseMonsterId)) {
				let previousThreadData = cache.get(userId);

				if (targetPronoun && previousThreadData) {
					baseMonsterId = previousThreadData.monsterId;
				} else {
					await helper.sendMessage(
						`I can't find the card you are looking for! Can you try a different name?`
					);
					return;
				}
			}

			//Assign cardId
			let cardId = Number(baseMonsterId);

			//Register message thread for conversation continuation
			cache.set(userId, {
				monsterId: cardId,
			});

			//Get info
			let card = new Monster(cardId);

			//Always initialize card before further processing
			await card.init();

			if (infoType === 'photo' || targetActionType === 'look') {
				await helper.sendMonsterImage(card);
				return;
			} else if (infoType === 'icon') {
				await helper.sendMonsterIcon(card);
				return;
			} else if (infoType === 'name' || actionType === 'call' || actionType === 'name') {
				await helper.sendMonsterName(card);
				return;
			} else if (infoType === 'awakenings' || infoType === 'superAwakenings') {
				await helper.sendAwakenings(card);
				return;
			} else if (infoType === 'types') {
				await helper.sendTypes(card);
				return;
			} else if (infoType === 'stats') {
				await helper.sendMonsterStats(card);
				return;
			} else if (infoType === 'attack') {
				await helper.sendMonsterAttack(card);
				return;
			} else if (infoType === 'hp') {
				await helper.sendMonsterHP(card);
				return;
			} else if (infoType === 'recover') {
				await helper.sendMonsterRecover(card);
				return;
			} else if (infoType === 'rarity') {
				await helper.sendMonsterRarity(card);
				return;
			} else if (infoType === 'assist') {
				await helper.sendMonsterIsInheritable(card);
				return;
			} else if (infoType === 'activeSkills') {
				await helper.sendMonsterActiveSkills(card);
			} else if (infoType === 'leaderSkills') {
				await helper.sendMonsterLeaderSkills(card);
				return;
			} else if (
				((questionType === 'how' || questionType === 'what') && actionType === 'sell') ||
				infoType === 'monsterPoints' ||
				((questionType === 'how' || questionType === 'what') && targetActionType === 'sell') ||
				actionType === 'sell'
			) {
				await helper.sendMonsterMonsterPoints(card);
				return;
			} else if (infoType === 'evoMaterials' || actionType === 'evolve') {
				await helper.sendMonsterMaterials(card, 'evo');
				return;
			} else if (infoType === 'devoMaterials' || actionType === 'devolve') {
				await helper.sendMonsterMaterials(card, 'devo');
				return;
			} else if (infoType === 'evoList') {
				await helper.sendMonsterEvoTree(card);
				return;
			} else if (infoType === 'id') {
				await helper.sendMonsterId(card);
			} else if (infoType === 'series') {
				await helper.sendMonsterSeries(card);
				return;
			}

			//Final, always
			else if ((!infoType && !actionType) || (!infoType && actionType) || infoType === 'info') {
				await helper.sendMonsterInfo(card);
			}

			return;
		} else if (action === 'card.query') {
			let parameters = result.queryResult.parameters.fields;
			let data = {
				queryFilterType: parameters.queryFilterType?.stringValue || 'and',
				queryIncludeSA: parameters.queryIncludeSA?.stringValue || 'includeSA',
				queryQuantity1: parameters.queryQuantity1?.stringValue,
				queryQuantity2: parameters.queryQuantity2?.stringValue,
				queryQuantity3: parameters.queryQuantity3?.stringValue,
				queryCompare1: parameters.queryCompare1?.stringValue || null,
				queryCompare2: parameters.queryCompare2?.stringValue || null,
				queryCompare3: parameters.queryCompare3?.stringValue || null,
				queryEvoType: parameters.queryEvoType?.stringValue || null,
				monsterAwakenings1: parameters.monsterAwakenings1?.stringValue || null,
				monsterAwakenings2: parameters.monsterAwakenings2?.stringValue || null,
				monsterAwakenings3: parameters.monsterAwakenings3?.stringValue || null,
				monsterAttribute1: parameters.monsterAttribute1?.stringValue || null,
				monsterAttribute2: parameters.monsterAttribute2?.stringValue || null,
				monsterTypes: parameters.monsterTypes?.stringValue || null,
				monsterSeries: parameters.monsterSeries?.stringValue || null,
			};

			if (
				(parameters.queryEvoType?.stringValue || parameters.monsterTypes?.stringValue) &&
				baseMonsterId !== null
			) {
				await helper.sendCardByEvoType({
					monsterId: baseMonsterId,
					queryEvoType: parameters.queryEvoType?.stringValue,
					monsterAttribute1: parameters.monsterAttribute1?.stringValue || null,
					monsterAttribute2: parameters.monsterAttribute2?.stringValue || null,
					monsterTypes: parameters.monsterTypes?.stringValue || null,
				});
				return;
			} else {
				await helper.sendMessage('Please wait while I am looking into that...');
				await helper.sendQueryResult(data);
				return;
			}
		} else if (action === 'card.query.minMax') {
			let parameters = result.queryResult.parameters.fields;

			if (parameters.monsterAwakenings1?.stringValue) {
				await helper.sendMessage('Please wait while I am looking into that...');
				await helper.sendMonstersMinMaxAwakenings({
					monsterAwakenings1: parameters.monsterAwakenings1?.stringValue || null,
					monsterAwakenings2: parameters.monsterAwakenings2?.stringValue || null, //Sometimes AI detects it in the wrong order
					monsterAwakenings3: parameters.monsterAwakenings3?.stringValue || null, //Sometimes AI detects it in the wrong order
					monsterAttribute1: parameters.monsterAttribute1?.stringValue || null,
					monsterAttribute2: parameters.monsterAttribute2?.stringValue || null,
					queryMinMax: parameters.queryMinMax?.stringValue,
					monsterSeries: parameters.monsterSeries?.stringValue || null,
					queryIncludeSA: parameters.queryIncludeSA?.stringValue || 'includeSA',
					queryEvoType: parameters.queryEvoType?.stringValue || null,
					monsterTypes: parameters.monsterTypes?.stringValue || null,
				});
				return;
			} else if (parameters.queryMonsterStats?.stringValue) {
				await helper.sendMessage('Please wait while I am looking into that...');
				await helper.sendMonstersMinMaxStats({
					stat: parameters.queryMonsterStats?.stringValue, //Sometimes AI detects it in the wrong order
					monsterAttribute1: parameters.monsterAttribute1?.stringValue || null,
					monsterAttribute2: parameters.monsterAttribute2?.stringValue || null,
					queryMinMax: parameters.queryMinMax?.stringValue,
					monsterSeries: parameters.monsterSeries?.stringValue || null,
					queryIncludeLB: parameters.queryIncludeLB?.stringValue || 'includeLB',
					queryEvoType: parameters.queryEvoType?.stringValue || null,
					monsterTypes: parameters.monsterTypes?.stringValue || null,
				});
				return;
			}
		} else if (action === 'card.query.random') {
			let parameters = result.queryResult.parameters.fields;
			let queryAddtionalTypes = parameters.queryAdditionalTypes?.stringValue;

			await helper.sendRandomCard({
				type: queryAddtionalTypes,
				quantity: parameters.number.numberValue,
				monsterAttribute1: parameters.monsterAttribute1?.stringValue || null,
				monsterAttribute2: parameters.monsterAttribute2?.stringValue || null,
				queryEvoType: parameters.queryEvoType?.stringValue || null,
				monsterSeries: parameters.monsterSeries?.stringValue || null,
			});
			return;
		} else if (action === 'card.roll') {
			let parameters = result.queryResult.parameters.fields;

			await helper.sendRandomRolls({
				quantity: parameters.number.numberValue || 1,
				machine: parameters.monsterSeries?.stringValue || parameters.eggMachines?.stringValue,
			});
			return;
		} else if (action === 'card.roll.until') {
			let parameters = result.queryResult.parameters.fields;

			await helper.sendRandomRollsUntil({
				quantity: parameters.number.numberValue || 1,
				machine: parameters.monsterSeries?.stringValue || parameters.eggMachines?.stringValue,
				monsterId: parameters.monsterName?.stringValue || 1,
			});
			return;
		} else if (action === 'guide.update.ranking') {
			let parameters = result.queryResult.parameters.fields;

			await helper.updateRankingGuide(parameters.url?.stringValue);
			return;
		} else if (action === 'guide.show.ranking') {
			await helper.showRankingGuide();
			return;
		}

		// if (process.env.MODE === 'PRODUCTION') {
		// await helper.bugLog(
		// 	`Sorry. I haven't been trained with that command yet, but I have requested the dev to train me with this command. Check back in a few days and I will be able to handle your request!`
		// );
		// }
	} catch (error) {
		//Image only, no text input
		if (error.code !== 3) {
			console.log(error);
			await helper.sendMessage(
				`It looks like something went wrong. I can't seem to understand your request. Can you try it again?`
			);
		}
	}
});

client.login(DISCORD_TOKEN);
