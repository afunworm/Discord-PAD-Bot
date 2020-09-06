/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
require('dotenv').config();
import { Monster } from './classes/monster.class';
import { AI, QueryResultInterface } from './classes/ai.class';
import { Helper } from './classes/helper.class';
import { Cache } from './classes/cache.class';
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
	console.log('Server started');
});

client.on('message', async (message: any) => {
	//Do not run if it is from the bot itself
	if (message.author.bot) return;

	//If message is NOT DM, and it is also not a message that mentioned the bot, then do nothing
	if (
		message.channel.type !== 'dm' &&
		!message.mentions.has(client.user) &&
		!message.content.trim().startsWith(COMMAND_PREFIX)
	) {
		return;
	}

	let userId = message.author.id;
	let ai = new AI(userId);
	let helper = new Helper(message);
	let input = message.content.trim().startsWith(COMMAND_PREFIX)
		? message.content.trim().substring(1)
		: message.content.trim();
	let cache = new Cache('conversation');
	input = input.replace(client.user.id, ''); //Stripping ping from message
	input = Helper.replaceCommonAbbreviation(input); //Replace common terms, such as dr, l/d, etc.

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
			//Is this the exact query?
			let isExactIdQuery = rawInput.includes(baseMonsterId);

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
			} else if (infoType === 'icon') {
				await helper.sendMonsterIcon(card);
			} else if (infoType === 'name' || actionType === 'call' || actionType === 'name') {
				await helper.sendMonsterName(card);
			} else if (infoType === 'awakenings' || infoType === 'superAwakenings') {
				await helper.sendAwakenings(card);
			} else if (infoType === 'types') {
				await helper.sendTypes(card);
			} else if (infoType === 'stats') {
				await helper.sendMonsterStats(card);
			} else if (infoType === 'attack') {
				await helper.sendMonsterAttack(card);
			} else if (infoType === 'hp') {
				await helper.sendMonsterHP(card);
			} else if (infoType === 'recover') {
				await helper.sendMonsterRecover(card);
			} else if (infoType === 'rarity') {
				await helper.sendMonsterRarity(card);
			} else if (infoType === 'assist') {
				await helper.sendMonsterIsInheritable(card);
			} else if (infoType === 'activeSkills') {
				await helper.sendMonsterActiveSkills(card);
			} else if (infoType === 'leaderSkills') {
				await helper.sendMonsterLeaderSkills(card);
			} else if (
				((questionType === 'how' || questionType === 'what') && actionType === 'sell') ||
				infoType === 'monsterPoints' ||
				((questionType === 'how' || questionType === 'what') && targetActionType === 'sell')
			) {
				await helper.sendMonsterMonsterPoints(card);
			} else if (infoType === 'evoMaterials') {
				await helper.sendMonsterMaterials(card, 'evo');
			} else if (infoType === 'devoMaterials') {
				await helper.sendMonsterMaterials(card, 'devo');
			} else if (infoType === 'evoList') {
				await helper.sendMonsterEvoTree(card);
			} else if (infoType === 'id') {
				await helper.sendMonsterId(card);
			} else if (infoType === 'series') {
				await helper.sendMonsterSeries(card);
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
				monsterSeries: parameters.monsterSeries?.stringValue || null,
			};

			if (['min', 'max'].includes(parameters.queryMinMax?.stringValue)) {
				await helper.sendMessage('Please wait while I am looking into that...');
				await helper.sendMonstersMinMax({
					monsterAwakenings1: parameters.monsterAwakenings1?.stringValue || null,
					monsterAwakenings2: parameters.monsterAwakenings2?.stringValue || null, //Sometimes AI detects it in the wrong order
					monsterAwakenings3: parameters.monsterAwakenings3?.stringValue || null, //Sometimes AI detects it in the wrong order
					monsterAttribute1: parameters.monsterAttribute1?.stringValue || null,
					monsterAttribute2: parameters.monsterAttribute2?.stringValue || null,
					queryMinMax: parameters.queryMinMax?.stringValue,
					monsterSeries: parameters.monsterSeries?.stringValue || null,
					queryIncludeSA: parameters.queryIncludeSA?.stringValue || 'includeSA',
					queryEvoType: parameters.queryEvoType?.stringValue || null,
				});
			} else if (parameters.queryAdditionalTypes?.stringValue === 'random') {
				await helper.sendRandomCard({
					queryQuantity1: parameters.queryQuantity1?.stringValue,
					monsterAttribute1: parameters.monsterAttribute1?.stringValue || null,
					monsterAttribute2: parameters.monsterAttribute2?.stringValue || null,
					queryEvoType: parameters.queryEvoType?.stringValue || null,
					monsterSeries: parameters.monsterSeries?.stringValue || null,
				});
			} else {
				await helper.sendMessage('Please wait while I am looking into that...');
				await helper.sendQueryResult(data);
			}

			return;
		}

		await helper.bugLog(
			`Sorry. I haven't been trained with that command yet, but I have requested the dev to train me with this command. Check back in a few days and I will be able to handle your request!`
		);
	} catch (error) {
		await helper.sendMessage(
			`It looks like something went wrong. I can't seem to understand your request. Can you try it again?`
		);
		console.log('ERROR: ', error);
	}
});

client.login(DISCORD_TOKEN);
