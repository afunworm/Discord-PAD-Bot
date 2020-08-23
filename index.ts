/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
require('dotenv').config();
import { Monster } from './classes/monster.class';
import { AI, QueryResultInterface } from './classes/ai.class';
const Discord = require('discord.js');

/*-------------------------------------------------------*
 * CONST
 *-------------------------------------------------------*/
const client = new Discord.Client();
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

/*-------------------------------------------------------*
 * Handlers
 *-------------------------------------------------------*/
class Helper {
	private _channel;
	constructor(channel) {
		this._channel = channel;
	}
	public sendMonsterInfo(card: Monster) {
		let embed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`${card.getId()}: ${card.getName()}`)
			.setURL(card.getUrl())
			.setThumbnail(card.getThumbnailUrl())
			.addFields(
				{ name: card.getAwakenEmotes(), value: card.getSuperAwakenEmotes() },
				{ name: 'Available Killers', value: card.getAvailableKillers() },
				{ name: 'Info', value: card.getGenericInfo(), inline: true },
				{ name: 'Stats', value: card.getStats(), inline: true },
				{ name: card.getActiveSkillHeader(), value: card.getActiveSkillDescription() },
				{ name: card.getLeaderSkillHeader(), value: card.getLeaderSkillDescription() }
			);

		return this._channel.send(embed);
	}

	public sendMonsterImage(card: Monster) {
		const imageUrl = card.getImageUrl();
		this._channel.send(`${card.getId()}: ${card.getName()}`, {
			files: [imageUrl],
		});
	}

	public sendMonsterIcon(card: Monster) {
		const imageUrl = card.getThumbnailUrl();
		this._channel.send(`${card.getId()}: ${card.getName()}`, {
			files: [imageUrl],
		});
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
	let input = message.content;
	input = input.replace(client.user.id, ''); // stripping ping from message

	try {
		let result: QueryResultInterface = await ai.detectIntent(input);
		let action = result.queryResult.action;
		let infoType = result.queryResult.parameters.fields?.infoType.stringValue || null;
		let cardId = result.queryResult.parameters.fields?.number?.numberValue || null;
		let acceptedActions = ['card.info'];

		//Only if AI detects the card id and the actions
		if (!acceptedActions.includes(action) || cardId === null) {
			//TODO - PROCESS IT USING OLD-SCHOOL METHODS
			await message.channel.send(`I'm sorry. I don't quite understand that.`);
			return;
		}

		//Get info
		let card = new Monster(cardId);
		let helper = new Helper(message.channel);

		//Always initialize card before further processing
		await card.init();

		if (!infoType || infoType === 'info') {
			await helper.sendMonsterInfo(card);
		} else if (infoType === 'photo') {
			await helper.sendMonsterImage(card);
		} else if (infoType === 'icon') {
			await helper.sendMonsterIcon(card);
		}
	} catch (error) {
		console.log('ERROR: ', error);
	}
});

client.login(DISCORD_TOKEN);
