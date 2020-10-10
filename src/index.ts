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

	message.channel.send(`I am being maintained and will be able to work again in a moment!`);
	return;
});

client.login(DISCORD_TOKEN);
