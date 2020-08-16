/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
import { env } from "./environment";
import { Monster } from "./classes/monster.class";
import { AI, QueryResultInterface } from "./classes/ai.class";
const Discord = require("discord.js");

/*-------------------------------------------------------*
 * CONST
 *-------------------------------------------------------*/
const client = new Discord.Client();
const DISCORD_TOKEN = env.DISCORD_TOKEN;
const COMMAND_PREFIX = env.COMMAND_PREFIX;

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
			.setColor("#0099ff")
			.setTitle(`${card.getId()}: ${card.getName()}`)
			.setURL(card.getUrl())
			.setThumbnail(card.getThumbnailUrl())
			.addFields(
				{ name: card.getAwakenEmotes(), value: card.getSuperAwakenEmotes() },
				{ name: "Available killers", value: card.getAvailableKillers() },
				{ name: "Info", value: card.getGenericInfo(), inline: true },
				{ name: "Stats", value: card.getStats(), inline: true },
				{ name: card.getActiveSkillHeader(), value: card.getActiveSkillBody() },
				{ name: "Leader Skill", value: card.getLeaderSkill() }
			);

		return this._channel.send(embed);
	}

	public sendMonsterImage(card: Monster) {
		const imageUrl = card.getImageUrl();
		this._channel.send(`${card.getId()}: ${card.getName()}`, {
			files: [imageUrl],
		});
	}
}

/*-------------------------------------------------------*
 * App
 *-------------------------------------------------------*/
client.once("ready", () => {
	console.log("Server started");
});

client.on("message", async (message: any) => {
	//Do not run if it is from the bot itself
	if (message.author.bot) return;

	//If message is NOT DM, and it is also not a message that mentioned the bot, then do nothing
	if (message.channel.type !== "dm" && !message.mentions.has(client.user)) {
		return;
	}

	let userId = message.author.id;
	let ai = new AI(userId);
	let input = message.content;
	input = input.replace(client.user.id, ""); // stripping ping from message

	try {
		let result: QueryResultInterface = await ai.detectIntent(input);
		let action = result.queryResult.action;
		let cardId =
			result.queryResult.parameters.fields?.number?.numberValue || null;
		let acceptedActions = ["card.info", "card.image"];

		//Only if AI detects the card id and the actions
		if (!acceptedActions.includes(action) || cardId === null) {
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
		let helper = new Helper(message.channel);

		if (action === "card.info") {
			await helper.sendMonsterInfo(card);
		} else if (action === "card.image") {
			await helper.sendMonsterImage(card);
		}
	} catch (error) {
		console.log("ERROR: ", error);
	}
});

client.login(DISCORD_TOKEN);
