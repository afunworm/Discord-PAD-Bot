/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
require('dotenv').config();
import { Monster } from './classes/monster.class';
import { AI, QueryResultInterface } from './classes/ai.class';
import { Helper } from './classes/helper.class';
const Discord = require('discord.js');

/*-------------------------------------------------------*
 * CONST
 *-------------------------------------------------------*/
const client = new Discord.Client();
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

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
	let helper = new Helper(message.channel);
	let input = message.content;
	input = input.replace(client.user.id, ''); // stripping ping from message

	try {
		let result: QueryResultInterface = await ai.detectIntent(input);
		let action = result.queryResult.action;
		let infoType = result.queryResult.parameters.fields?.infoType?.stringValue || null;
		let questionType = result.queryResult.parameters.fields?.questionType?.stringValue || null;
		let actionType = result.queryResult.parameters.fields?.actionType?.stringValue || null;
		let cardId = result.queryResult.parameters.fields?.number?.numberValue || null;
		let acceptedActions = ['card.info'];

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

		if ((!infoType || infoType === 'info') && !actionType) {
			await helper.sendMonsterInfo(card);
		} else if (infoType === 'photo') {
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
		}
	} catch (error) {
		await helper.sendMessage('It looks like something went wrong. Can you say it again?');
		console.log('ERROR: ', error);
	}
});

client.login(DISCORD_TOKEN);
