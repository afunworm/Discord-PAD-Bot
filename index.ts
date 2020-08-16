/**
 * LIBRARIES
 */
import { env } from './environment';
import { Monster } from './classes/monster.class';
import { AI, QueryResultInterface } from './classes/ai.class';
const Discord = require('discord.js');

/**
 * CONST
 */
const client = new Discord.Client();
const DISCORD_TOKEN = env.DISCORD_TOKEN;
const COMMAND_PREFIX = env.COMMAND_PREFIX;

client.once('ready', () => {
	console.log('Server started');
});

client.on('message', async (message: any) => {
	//Do not run if it is from the bot itself
	if (message.author.bot) return;

	let userId = message.author.id;
	let ai = new AI(userId);
	let input = message.content;

	try {
		let result: QueryResultInterface = await ai.detectIntent(input);
		let action = result.queryResult.action;
		let cardId = result.queryResult.parameters.fields?.number?.numberValue || null;

		//Only if AI detects the action as card.info
		if (action !== 'card.info' || cardId === null) {
			//TODO - PROCESS IT USING OLD-SCHOOL METHODS
			await message.channel.send(`I'm sorry. I don't quite understand that.`);
			return;
		}

		//Check if card exists in the database
		if (!Number.isInteger(cardId) || cardId > Monster.getDatabaseLength()) {
			await message.channel.send(`Cannot find card.`);
			return;
		}

		//Get info
		let card = new Monster(cardId);

		//Sending card info
		let embed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`${card.getId()}: ${card.getName()}`)
			.setURL(`http://puzzledragonx.com/en/monster.asp?n=${card.getId()}`)
			//.setAuthor('Some name', 'https://i.imgur.com/wSTFkRM.png', 'https://discord.js.org')
			//.setDescription('Some description here')
			.setThumbnail(`http://puzzledragonx.com/en/img/book/${card.getId()}.png`)
			.addFields(
				{ name: card.getAwakenEmotes(), value: card.getSuperAwakenEmotes() },
				// { name: '\u200B', value: '\u200B' },
				{ name: 'Available killers', value: card.getAvailableKillers() },
				{ name: 'Info', value: card.getGenericInfo(), inline: true },
				{ name: 'Stats', value: card.getStats(), inline: true },
				{ name: card.getActiveSkillHeader(), value: card.getActiveSkillBody() },
				{ name: 'Leader Skill', value: card.getLeaderSkill() }
			);

		await message.channel.send(embed);
	} catch (error) {
		console.log('ERROR: ', error);
	}
});

client.login(DISCORD_TOKEN);
