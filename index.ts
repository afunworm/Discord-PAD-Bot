/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
require('dotenv').config();
import { Monster } from './classes/monster.class';
import { AI, QueryResultInterface } from './classes/ai.class';
import { Helper } from './classes/helper.class';
import { Common } from './classes/common.class';
const Discord = require('discord.js');
const NodeCache = require('node-cache');
const cache = new NodeCache();

/*-------------------------------------------------------*
 * CONST
 *-------------------------------------------------------*/
const client = new Discord.Client();
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

/*-------------------------------------------------------*
 * CACHE HELPER
 *-------------------------------------------------------*/
class ConverstationCache {
	static set(key, value) {
		let data = {};
		data[key] = value;
		cache.set('conversation', JSON.stringify(data));
	}

	static get(key) {
		let data = cache.get('conversation');
		data = typeof data === 'string' ? JSON.parse(data) : data;

		return data[key];
	}
}

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
	if (message.channel.type !== 'dm' && !message.mentions.has(client.user)) {
		return;
	}

	let userId = message.author.id;
	let ai = new AI(userId);
	let helper = new Helper(message);
	let input = message.content;
	input = input.replace(client.user.id, ''); //Stripping ping from message
	input = Helper.replaceCommonAbbreviation(input); //Replace common terms, such as dr, l/d, etc.
	// console.log(input);

	try {
		let result: QueryResultInterface = await ai.detectIntent(input);
		let rawInput = result.queryResult.queryText;

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

		//Is this the exact query?
		let isExactIdQuery = rawInput.includes(baseMonsterId);

		//If the ID is not provided, try to see if we can get the ID from guessing the name
		//But the monster name has to exists
		// console.log(result.queryResult.parameters);
		if (!baseMonsterId) {
			let previousThreadData = ConverstationCache.get(userId);

			if (previousThreadData) {
				baseMonsterId = previousThreadData.monsterId;
			} else {
				await helper.sendMessage(`I can't find the card you are looking for! Can you try a different name?`);
				return;
			}
		} else {
			//Let the user know the bot is working on it
			await helper.sendMessage(Common.dynamicResponse('WORKING'));

			//Because asking for evo list will have to go through all the monsters anyway
			if (infoType === 'evoList') isExactIdQuery = true;

			let specific2AttributeFilter =
				(attribute1 !== null && attribute2 === 'none') || (attribute1 !== null && attribute2 !== null);

			let cardIds = await Helper.detectMonsterIdFromName(
				baseMonsterId,
				attribute1 || 'none',
				attribute2 || 'none',
				specific2AttributeFilter,
				isExactIdQuery
			);

			if (cardIds.length === 0) {
				await helper.sendMessage(
					'I am not able to find that monster. Please double check the attributes and name. You can also use ID for precision.'
				);
				return;
			} else if (cardIds.length > 1) {
				let cardList = [];
				cardIds.forEach((card) => {
					cardList.push(`${card.attributes} | ${card.name} (#${card.id})`);
				});

				await helper.sendMessage(
					'There are more than one monsters that match your criteria. Please help me narrow it down!'
				);

				let embed = new Discord.MessageEmbed().addFields({
					name: 'Monsters Related to Your Query',
					value: cardList.join('\n'),
				});

				await helper.sendMessage(embed);
				return;
			} else if (cardIds.length === 1) {
				baseMonsterId = cardIds[0].id;
			}
		}

		//Assign cardId
		let cardId = Number(baseMonsterId);

		//Register message thread for conversation continuation
		ConverstationCache.set(userId, {
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
		} else if (
			infoType === 'stats' ||
			infoType === 'hp' ||
			infoType === 'attack' ||
			infoType === 'recover' ||
			(questionType === 'how' && infoType === 'stats')
		) {
			await helper.sendMonsterStats(card);
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
		} else if (infoType === 'materials') {
			let isEvo = targetActionType === 'devo' ? false : true;
		} else if (infoType === 'evoList') {
			await helper.sendMonsterEvoTree(card);
		} else if (infoType === 'id') {
			await helper.sendMonsterId(card);
		}

		//Final, always
		else if ((!infoType && !actionType) || (!infoType && actionType) || infoType === 'info') {
			await helper.sendMonsterInfo(card);
		}
	} catch (error) {
		await helper.sendMessage(
			`It looks like something went wrong. I can't seem to understand your request. Can you try it again?`
		);
		console.log('ERROR: ', error);
	}
});

client.login(DISCORD_TOKEN);
