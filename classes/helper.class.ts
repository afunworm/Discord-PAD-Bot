require('dotenv').config({ path: '../.env' });
import { Monster } from './monster.class';
import { RESPONSE_PHRASES } from './responsePhrases';
const Discord = require('discord.js');

export class Helper {
	private _channel;
	private _message;
	private _threads = {};

	constructor(message) {
		this._message = message;
		this._channel = message.channel;
	}

	public registerMessageThread(userId, monsterId) {
		if (!this._threads[userId]) {
			this._threads[userId] = {
				monsterId: monsterId,
			};
		}
	}

	public getPreviousThreadData(userId) {
		return this._threads[userId] ? this._threads[userId] : null;
	}

	private numberWithCommas = (x: number) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

	private fillTemplate(templateString: string, templateVars: { [key: string]: string }): string {
		let result = templateString;

		for (let replace in templateVars) {
			let replaceWith = templateVars[replace];

			if (replaceWith === undefined || replaceWith === null) {
				continue;
			}

			let regex = new RegExp('{{ *' + replace + ' *}}', 'g');
			result = result.replace(regex, replaceWith);
		}

		return result;
	}

	public sendMessage(message: string) {
		this._channel.send(message);
	}

	private dynamicResponse(templateId: string, templateVars: { [key: string]: string }): string {
		let r = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
		let responses = RESPONSE_PHRASES[templateId];
		let randomIndex = r(0, responses.length - 1);
		let response = responses[randomIndex];

		return response ? this.fillTemplate(response, templateVars) : '';
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
				{ name: 'Stats', value: card.getStats(), inline: true }
			);

		if (card.hasActiveSkill()) {
			embed.addFields({ name: card.getActiveSkillHeader(), value: card.getActiveSkillDescriptionDetails() });
		}

		if (card.hasLeaderSkill()) {
			embed.addFields({ name: card.getLeaderSkillHeader(), value: card.getLeaderSkillDescriptionDetails() });
		}

		return this._channel.send(embed);
	}

	public sendMonsterImage(card: Monster) {
		const imageUrl = card.getImageUrl();
		this._channel.send(`**${card.getName()}** (#${card.getId()})`, {
			files: [imageUrl],
		});
	}

	public sendMonsterIcon(card: Monster) {
		const imageUrl = card.getThumbnailUrl();
		this._channel.send(`**${card.getName()}** (#${card.getId()})`, {
			files: [imageUrl],
		});
	}

	public sendMonsterName(card: Monster) {
		let response = this.dynamicResponse('ON_NAME_REQUEST', {
			id: card.getId().toString(),
			name: card.getName(),
		});
		this._channel.send(response);
	}

	public sendAwakenings(card: Monster) {
		let embed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`${card.getId()}: ${card.getName()}`)
			.setURL(card.getUrl())
			.setThumbnail(card.getThumbnailUrl())
			.addFields({ name: card.getAwakenEmotes(), value: card.getSuperAwakenEmotes() });

		return this._channel.send(embed);
	}

	public sendTypes(card: Monster) {
		let types = card.getTypesReadable();
		let message: string = '';

		if (types.length === 1) {
			message = this.dynamicResponse('ON_TYPE_REQUEST_1', {
				id: card.getId().toString(),
				name: card.getName(),
				type1: types[0],
			});
		} else if (types.length === 2) {
			message = this.dynamicResponse('ON_TYPE_REQUEST_2', {
				id: card.getId().toString(),
				name: card.getName(),
				type1: types[0],
				type2: types[1],
			});
		} else if (types.length === 3) {
			message = this.dynamicResponse('ON_TYPE_REQUEST_3', {
				id: card.getId().toString(),
				name: card.getName(),
				type1: types[0],
				type2: types[1],
				type3: types[2],
			});
		}

		return this._channel.send(message);
	}

	public sendMonsterStats(card: Monster) {
		let embed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`${card.getId()}: ${card.getName()}`)
			.setURL(card.getUrl())
			.setThumbnail(card.getThumbnailUrl())
			.addFields({ name: 'Stats', value: card.getStats(), inline: true });

		return this._channel.send(embed);
	}

	public sendMonsterRarity(card: Monster) {
		let response = this.dynamicResponse('ON_RARITY_REQUEST', {
			id: card.getId().toString(),
			name: card.getName(),
			rarity: card.getRarity().toString(),
		});
		this._channel.send(response);
	}

	public sendMonsterIsInheritable(card: Monster) {
		let response = this.dynamicResponse('ON_ISINHERITABLE_REQUEST', {
			id: card.getId().toString(),
			name: card.getName(),
			isInheritable: card.isInheritable() ? 'is inheritable' : 'is not inhreitable',
		});
		this._channel.send(response);
	}

	public sendMonsterActiveSkills(card: Monster) {
		if (!card.hasActiveSkill()) {
			let response = this.dynamicResponse('ON_NO_ACTIVESKILL_FOUND', {
				id: card.getId().toString(),
				name: card.getName(),
			});
			return this._channel.send(response);
		}

		let embed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`${card.getId()}: ${card.getName()}`)
			.setURL(card.getUrl())
			.setThumbnail(card.getThumbnailUrl())
			.addFields(
				{ name: '**[IN-GAME]** ' + card.getActiveSkillHeader(), value: card.getActiveSkillDescription() },
				{ name: '**[DETAILS]** ' + card.getActiveSkillHeader(), value: card.getActiveSkillDescriptionDetails() }
			);

		this._channel.send(embed);
	}

	public sendMonsterLeaderSkills(card: Monster) {
		if (!card.hasLeaderSkill()) {
			let response = this.dynamicResponse('ON_NO_LEADERSKILL_FOUND', {
				id: card.getId().toString(),
				name: card.getName(),
			});
			return this._channel.send(response);
		}

		let embed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`${card.getId()}: ${card.getName()}`)
			.setURL(card.getUrl())
			.setThumbnail(card.getThumbnailUrl())
			.addFields(
				{ name: '**[IN-GAME]** ' + card.getLeaderSkillHeader(), value: card.getLeaderSkillDescription() },
				{ name: '**[DETAILS]** ' + card.getLeaderSkillHeader(), value: card.getLeaderSkillDescriptionDetails() }
			);

		this._channel.send(embed);
	}

	public sendMonsterMonsterPoints(card: Monster) {
		let response = this.dynamicResponse('ON_MONSTERPOINTS_REQUEST', {
			id: card.getId().toString(),
			name: card.getName(),
			monsterPoints: this.numberWithCommas(card.getMonsterPoints()),
		});
		this._channel.send(response);
	}

	public async sendMonsterEvoTree(card: Monster) {
		let reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

		let message = await this.sendMonsterInfo(card);

		let numberOfEvos = 10;
		let promises = [];
		for (let i = 0; i < numberOfEvos; i++) {
			let reaction = reactions[i];
			promises.push(message.react(reaction));
		}

		Promise.all(promises).catch((error) => {
			throw new Error('Unable to react to messages. Please tell my master.');
		});
	}
}
