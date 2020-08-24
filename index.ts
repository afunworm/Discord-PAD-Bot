/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
require('dotenv').config();
import { Monster } from './classes/monster.class';
import { AI, QueryResultInterface } from './classes/ai.class';
import { Helper } from './classes/helper.class';
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
class Cache {
	static set(key, value) {
		cache.set(key, JSON.stringify(value));
	}

	static get(key) {
		let data = cache.get(key);

		return typeof data === 'string' ? JSON.parse(data) : data;
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
	input = input.replace(client.user.id, ''); // stripping ping from message

	try {
		let result: QueryResultInterface = await ai.detectIntent(input);
		let action = result.queryResult.action;
		let acceptedActions = ['card.info'];
		let cardId = result.queryResult.parameters.fields?.number?.numberValue;

		if (!cardId) {
			let previousThreadData = Cache.get(userId);

			if (previousThreadData) cardId = previousThreadData.monsterId;
		}

		//What information is being requestd? For example: show me Anubis IMAGE
		let infoType = result.queryResult.parameters.fields?.infoType?.stringValue || null;

		//Define the type of question on user input. For example: WHAT does Anubis look like?
		let questionType = result.queryResult.parameters.fields?.questionType?.stringValue || null;

		//What kind of action the user is trying to perform? For example: What do I CALL 1234?
		let actionType = result.queryResult.parameters.fields?.actionType?.stringValue || null;

		//What type of action the targeted monster is doing? For example: How much does Anubis COST?
		let targetActionType = result.queryResult.parameters.fields?.targetActionType?.stringValue || null;

		//Register message thread for conversation continuation
		cache.set(userId, {
			monsterId: cardId,
		});

		// console.log(result.queryResult.parameters);

		//Only if AI detects the card id and the actions
		if ((!acceptedActions.includes(action) || cardId === null) && (!actionType || cardId === null)) {
			//TODO - PROCESS IT USING OLD-SCHOOL METHODS
			await message.channel.send(`I'm sorry. I don't quite understand that.`);
			return;
		}

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
		}

		//Final, always
		else if ((!infoType && !actionType) || (!infoType && actionType) || infoType === 'info') {
			await helper.sendMonsterInfo(card);
		}
	} catch (error) {
		await helper.sendMessage('It looks like something went wrong. Can you say it again?');
		console.log('ERROR: ', error);
	}
});

client.login(DISCORD_TOKEN);
