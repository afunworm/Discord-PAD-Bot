const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
import { Monster } from './monster.class';
import { MonsterData } from '../shared/monster.interfaces';
import { Common } from './common.class';
import * as admin from 'firebase-admin';
import { DMChannel, MessageReaction, MessageEmbed, Message, DiscordAPIError } from 'discord.js';
import { Cache } from './cache.class';
import { RARE_EGG_MACHINE, EVENT_EGG_MACHINE, COLLAB_EGG_MACHINE } from './eggMachines';
const moment = require('moment');
const _ = require('lodash');
const Discord = require('discord.js');
const fs = require('fs');

/*-------------------------------------------------------*
 * FIREBASE ADMIN
 *-------------------------------------------------------*/
if (admin.apps.length === 0) {
	admin.initializeApp({
		credential: admin.credential.cert(require('../' + process.env.FIREBASE_SERVICE_ACCOUNT)),
		databaseURL: process.env.FIREBASE_DATABASE_URL,
	});
}
const firestore = admin.firestore();
let cache = new Cache('authorship');

export class Helper {
	private _channel: DMChannel;
	private _message;
	private _threads = {};
	private _queryText;

	constructor(message) {
		this._message = message;
		this._channel = message.channel;
	}

	public async bugLog(message: string) {
		if (this._queryText) {
			let data = {
				_createdAt: new Date(),
				command: this._queryText,
				requestedBy: this._message.author.username + ' (#' + this._message.author.id + ')',
				status: 'RECEIVED',
				developerResponse: '',
			};
			let ref = await firestore.collection('TrainingRequests').add(data);
			data['trainingRequestId'] = ref.id;
			delete data['status'];
			delete data['developerResponse'];
			await this.sendMessage(`${message}\n\`\`\`json\n${JSON.stringify(data, null, 4)}\`\`\``);
		} else {
			await this.sendMessage(message);
		}
	}

	public assignQueryText(queryText: string) {
		this._queryText = queryText;
	}

	static async detectMonsterIdFromName(
		baseMonsterId: string,
		attribute1String: string = 'notProvided',
		attribute2String: string = 'notProvided',
		specific2AttributeFilter: boolean = false,
		isExactIdQuery: boolean = false
	) {
		//Make sure the attributes are acceptable
		let acceptables = ['fire', 'water', 'wood', 'light', 'dark', 'none'];
		let map = {
			fire: 0,
			water: 1,
			wood: 2,
			light: 3,
			dark: 4,
			none: null,
			notProvided: null,
		};

		if (!attribute1String || !acceptables.includes(attribute1String)) attribute1String = 'none';
		if (!attribute2String || !acceptables.includes(attribute2String)) attribute2String = 'none';

		//Convert attribute strings to their corresponding number
		let attribute1 = map[attribute1String];
		let attribute2 = map[attribute2String];

		//Since monsterId is string (detected by AI as a string), make sure we convert it to Number
		let monsterId = Number(baseMonsterId);
		let monsters = {};

		try {
			let monster = new Monster(monsterId);
			await monster.init();

			if (isExactIdQuery) {
				return Promise.resolve({
					name: monster.getName(),
					id: monster.getId(),
				});
			}

			let evoTree = monster.getEvoTree();

			//Loop through all evo trees to get data
			do {
				let id = evoTree[evoTree.length - 1];
				let mon = new Monster(id);
				await mon.init();

				monsters[id.toString()] = mon.getFullData();
				evoTree.pop();
			} while (evoTree.length > 0);

			if (Object.keys(monsters).length === 0) {
				return Promise.resolve([]);
			}

			//Only filter if there is restriction on mainAttribute
			if (attribute1 === null) {
				let result = _.values(monsters);
				result = result.map((data) => {
					let mainAttribute = data.mainAttribute;
					let subAttribute = data.subAttribute === null ? -1 : data.subAttribute;
					let attributes =
						Common.attributeEmotesMapping([mainAttribute])[0] +
						Common.attributeEmotesMapping([subAttribute])[0];
					return {
						id: data.id,
						name: data.name,
						attributes: attributes,
					};
				});
				return Promise.resolve(result);
			}

			let result = _.filter(monsters, (m) =>
				specific2AttributeFilter
					? m.mainAttribute === attribute1 && m.subAttribute === attribute2
					: m.mainAttribute === attribute1
			);
			result = result.map((data) => {
				let mainAttribute = data.mainAttribute;
				let subAttribute = data.subAttribute === null ? -1 : data.subAttribute;
				let attributes =
					Common.attributeEmotesMapping([mainAttribute])[0] +
					Common.attributeEmotesMapping([subAttribute])[0];
				return {
					id: data.id,
					name: data.name,
					attributes: attributes,
				};
			});

			return Promise.resolve(result);
		} catch (error) {
			console.log(error.message);
			return Promise.reject('Unable to process request. Please try again later.');
		}
	}

	static replaceCommonAbbreviation(message: string) {
		let dict = {
			'7c': 'enhanced combo',
			'7cs': 'enhanced combos',
		};

		//Trim it
		message = message.trim();

		//Replace terms
		for (let replaceWhat in dict) {
			let byWhat = dict[replaceWhat];

			message = message.replace(replaceWhat, byWhat);
		}

		return message;
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

	private collectorFilter = (reaction: MessageReaction, user) => {
		let userId = user.id;
		let cachedData = cache.get(userId);

		if (!cachedData) return false;

		return cachedData.includes(reaction.message.id);
	};

	private createCollector(message: Message) {
		let author = this._message.author.id;

		if (author) {
			if (!cache.get(author)) {
				cache.set(author, [message.id]);
			} else {
				let cachedData = cache.get(author);
				cachedData.push(message.id);
				cache.set(author, cachedData);
			}
		}

		return message.createReactionCollector(this.collectorFilter, { time: 6000000 }).on('end', async (collected) => {
			try {
				await message.reactions.removeAll();
			} catch (error) {
				console.log('Unable to remove all reactions when collector dies.');
			}
		});
	}

	public async sendMessage(message: string | MessageEmbed, optionals = null) {
		if (!message) return;
		try {
			let sentEmbed =
				optionals === null ? await this._channel.send(message) : await this._channel.send(message, optionals);

			if (typeof message === 'string') return;

			await sentEmbed.react('❌');

			this.createCollector(sentEmbed).on('collect', (react: MessageReaction, user) => {
				if (react.emoji.name === '❌') {
					react.message.delete();
				}
			});

			return sentEmbed;
		} catch (error) {
			console.log(error.message);
			await this._channel.send(
				"Something went wrong. Discord doesn't let me send this message. <@190276489806086144>, please take a look."
			);
		}
	}

	private constructMessageListPage(messageTitle: string, paginationData, pageIndex: number = 0) {
		let embed = new Discord.MessageEmbed();
		let pageContent = [];
		paginationData[pageIndex].forEach((listItem) => pageContent.push(listItem));

		//Construct first page of the embed
		embed.addFields({
			name: messageTitle + ` (${pageIndex + 1}/${paginationData.length})`,
			value: pageContent.join('\n'),
		});

		return embed;
	}

	public async sendMessageList(messageTitle: string, messageList: string[]) {
		let paginations = [];
		let maxEntryPerPage = 8;
		let maxPage = 10;
		let maxResult = maxEntryPerPage * maxPage;

		if (messageList.length > maxResult) {
			messageList = messageList.slice(0, maxResult);
			await this.sendMessage(
				`There are more than ${maxResult} entries found. Only the first ${maxResult} entries will be displayed.`
			);
		}

		messageList.forEach((listItem, index) => {
			if (index % maxEntryPerPage === 0) {
				paginations.push([listItem]);
			} else {
				paginations[paginations.length - 1].push(listItem);
			}
		});

		if (paginations.length <= 1) {
			//Send out embed
			let embed = this.constructMessageListPage(messageTitle, paginations, 0);
			let sentEmbed = await this.sendMessage(embed);
			return sentEmbed;
		}

		//Construct all other pages
		let embeds = [];
		paginations.forEach((page, index) =>
			embeds.push(this.constructMessageListPage(messageTitle, paginations, index))
		);

		//Send out embed
		await this.sendMessage(
			'There are multiple pages in this list. Use the reaction number to navigate between the lists!'
		);

		return await this.sendEmbedWithMultiplePages(embeds);
	}

	public async sendEmbedWithMultiplePages(embeds: MessageEmbed[], customEmojis: string[] = []) {
		let maxPage = 10;

		//Check and make sure customEmojis is valid
		if (new Set(customEmojis).size !== customEmojis.length) {
			throw new Error('Invalid custom emojis');
		}

		//If custom emojis can cover the reactions then, no problem
		if (embeds.length > maxPage && customEmojis.length < maxPage) {
			embeds = embeds.slice(0, maxPage);
			await this.sendMessage(
				`There are more than ${maxPage} pages in this message. Only the ${maxPage} pages will be displayed.`
			);
		}

		//Send out first embed
		let embed = embeds[0];
		let sentEmbed = await this._channel.send(embed); //Do not use this.sendMessage because we want to handle emojis manually

		//Count the number of react
		let emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
		customEmojis.forEach((emoji, index) => (emojis[index] = emoji));

		let reacts = [];
		reacts.push(sentEmbed.react('❌'));

		for (let i = 0; i < embeds.length; i++) {
			reacts.push(sentEmbed.react(emojis[i]));
		}

		Promise.all(reacts);

		let reactors = (message: Message) => {
			this.createCollector(message).on('collect', async (react: MessageReaction, user) => {
				if (react.emoji.name === '❌') {
					await react.message.delete();
					return;
				}

				let index = emojis.indexOf(react.emoji.name);
				let embed = embeds[index];

				await react.message.edit(embed);
			});
		};

		reactors(sentEmbed);
		return sentEmbed;
	}

	private async constructMonsterInfo(card: Monster) {
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
		return embed;
	}

	public async sendMonsterInfo(card: Monster) {
		let embeds = [];

		//First page is the monster
		embeds.push(await this.constructMonsterInfo(card));

		//Second page is the evos
		embeds.push(await this.constructMonsterMaterials(card, 'evo'));

		//Third page is image
		embeds.push(await this.constructMonsterImage(card));

		//The next pages are for evolutions
		let reacts = ['ℹ️', '⏫', '🖼️'];
		let sentEmbed = await this.sendEmbedWithMultiplePages(embeds, reacts);

		//Then add dynamic pages
		await sentEmbed.react('⬅️');
		await sentEmbed.react('➡️');

		let currentMonsterId = card.getId();
		let currentMonster = card;

		let embedReactor = (message: Message) => {
			this.createCollector(message).on('collect', async (react: MessageReaction, user) => {
				//Try to extract number from the title
				currentMonsterId = Number(react.message.embeds[0].title.match(/(\d)+/gi)[0]);

				if (react.emoji.name === '⬅️') {
					currentMonsterId -= 1;
					currentMonster = new Monster(currentMonsterId);
					await currentMonster.init();

					let embed = await this.constructMonsterInfo(currentMonster);
					await react.message.edit(embed);
				} else if (react.emoji.name === '➡️') {
					currentMonsterId += 1;
					currentMonster = new Monster(currentMonsterId);
					await currentMonster.init();

					let embed = await this.constructMonsterInfo(currentMonster);
					await react.message.edit(embed);
				}
			});
		};
		embedReactor(sentEmbed);

		//Added a separate line to navigate between the monster's evos
		let evoList = card.getEvoTree();
		if (evoList.length <= 1) return;

		let emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

		let message = await this._channel.send(
			`To navigate between all forms of **${card.getId()}. ${card.getName()}**, react to the numbers below.`
		);
		let evoEmbeds = [];
		await message.react('❌');

		for (let i = 0; i < evoList.length; i++) {
			let monsterId = evoList[i];
			let monster = new Monster(monsterId);
			await monster.init();

			message.react(emojis[i]);
			evoEmbeds.push(await this.constructMonsterInfo(monster));
		}

		Promise.all(reacts);
		let messageReactor = (message: Message) => {
			this.createCollector(message).on('collect', async (react: MessageReaction, user) => {
				if (react.emoji.name === '❌') {
					await react.message.delete();
					return;
				}
				let index = emojis.indexOf(react.emoji.name);
				let embed = evoEmbeds[index];

				sentEmbed.edit(embed);
			});
		};
		messageReactor(message);
	}

	private async constructMonsterImage(card: Monster) {
		return new Discord.MessageEmbed().setTitle(`Image for ${card.getName()}`).setImage(card.getImageUrl());
	}

	public async sendMonsterImage(card: Monster) {
		let embed = await this.constructMonsterImage(card);
		await this.sendMessage(embed);
	}

	public async sendMonsterIcon(card: Monster) {
		let embed = new Discord.MessageEmbed().setTitle(`Icon for ${card.getName()}`).setImage(card.getThumbnailUrl());
		await this.sendMessage(embed);
	}

	public async sendMonsterName(card: Monster) {
		let response = Common.dynamicResponse('ON_NAME_REQUEST', {
			id: card.getId().toString(),
			name: card.getName(),
		});
		await this.sendMessage(response);
	}

	public async sendAwakenings(card: Monster) {
		let embed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`${card.getId()}: ${card.getName()}`)
			.setURL(card.getUrl())
			.setThumbnail(card.getThumbnailUrl())
			.addFields({ name: card.getAwakenEmotes(), value: card.getSuperAwakenEmotes() });

		await this.sendMessage(embed);
	}

	public async sendTypes(card: Monster) {
		let types = card.getTypesReadable();
		let message: string = '';

		if (types.length === 1) {
			message = Common.dynamicResponse('ON_TYPE_REQUEST_1', {
				id: card.getId().toString(),
				name: card.getName(),
				type1: types[0],
			});
		} else if (types.length === 2) {
			message = Common.dynamicResponse('ON_TYPE_REQUEST_2', {
				id: card.getId().toString(),
				name: card.getName(),
				type1: types[0],
				type2: types[1],
			});
		} else if (types.length === 3) {
			message = Common.dynamicResponse('ON_TYPE_REQUEST_3', {
				id: card.getId().toString(),
				name: card.getName(),
				type1: types[0],
				type2: types[1],
				type3: types[2],
			});
		}

		await this.sendMessage(message);
	}

	public async sendMonsterStats(card: Monster) {
		let embed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`${card.getId()}: ${card.getName()}`)
			.setURL(card.getUrl())
			.setThumbnail(card.getThumbnailUrl())
			.addFields({ name: 'Stats', value: card.getStats(), inline: true });

		await this.sendMessage(embed);
	}

	public async sendMonsterAttack(card: Monster) {
		let maxAttack = card.getMaxAttack();
		let maxAttackWithPluses = maxAttack + 99 * 5;
		let LBAttack = Math.round(maxAttack * (1 + card.getlimitBreakPercentage() / 100));
		let LBAttackWithPluses = LBAttack + 99 * 5;

		if (card.isLimitBreakable()) {
			let response = Common.dynamicResponse('ON_ATTACK_REQUEST_LB', {
				id: card.getId().toString(),
				name: card.getName(),
				maxAttack: maxAttack.toString(),
				maxAttackWithPluses: maxAttackWithPluses.toString(),
				LBAttack: LBAttack.toString(),
				LBAttackWithPluses: LBAttackWithPluses.toString(),
			});
			await this.sendMessage(response);
		} else {
			let response = Common.dynamicResponse('ON_ATTACK_REQUEST_NO_LB', {
				id: card.getId().toString(),
				name: card.getName(),
				maxAttack: maxAttack.toString(),
				maxAttackWithPluses: maxAttackWithPluses.toString(),
			});
			await this.sendMessage(response);
		}
	}

	public async sendMonsterHP(card: Monster) {
		let maxHP = card.getMaxHP();
		let maxHPWithPluses = maxHP + 99 * 10;
		let LBHP = Math.round(maxHP * (1 + card.getlimitBreakPercentage() / 100));
		let LBHPWithPluses = LBHP + 99 * 10;

		if (card.isLimitBreakable()) {
			let response = Common.dynamicResponse('ON_HP_REQUEST_LB', {
				id: card.getId().toString(),
				name: card.getName(),
				maxHP: maxHP.toString(),
				maxHPWithPluses: maxHPWithPluses.toString(),
				LBHP: LBHP.toString(),
				LBHPWithPluses: LBHPWithPluses.toString(),
			});
			await this.sendMessage(response);
		} else {
			let response = Common.dynamicResponse('ON_HP_REQUEST_NO_LB', {
				id: card.getId().toString(),
				name: card.getName(),
				maxHP: maxHP.toString(),
				maxHPWithPluses: maxHPWithPluses.toString(),
			});
			await this.sendMessage(response);
		}
	}

	public async sendMonsterRecover(card: Monster) {
		let maxRCV = card.getMaxRecover();
		let maxRCVWithPluses = maxRCV + 99 * 3;
		let LBRCV = Math.round(maxRCV * (1 + card.getlimitBreakPercentage() / 100));
		let LBRCVWithPluses = LBRCV + 99 * 3;

		if (card.isLimitBreakable()) {
			let response = Common.dynamicResponse('ON_RECOVER_REQUEST_LB', {
				id: card.getId().toString(),
				name: card.getName(),
				maxRCV: maxRCV.toString(),
				maxRCVWithPluses: maxRCVWithPluses.toString(),
				LBRCV: LBRCV.toString(),
				LBRCVWithPluses: LBRCVWithPluses.toString(),
			});
			await this.sendMessage(response);
		} else {
			let response = Common.dynamicResponse('ON_RECOVER_REQUEST_NO_LB', {
				id: card.getId().toString(),
				name: card.getName(),
				maxRCV: maxRCV.toString(),
				maxRCVWithPluses: maxRCVWithPluses.toString(),
			});
			await this.sendMessage(response);
		}
	}

	public async sendMonsterRarity(card: Monster) {
		let response = Common.dynamicResponse('ON_RARITY_REQUEST', {
			id: card.getId().toString(),
			name: card.getName(),
			rarity: card.getRarity().toString(),
		});
		await this.sendMessage(response);
	}

	public async sendMonsterIsInheritable(card: Monster) {
		let response = Common.dynamicResponse('ON_ISINHERITABLE_REQUEST', {
			id: card.getId().toString(),
			name: card.getName(),
			isInheritable: card.isInheritable() ? 'is inheritable' : 'is not inhreitable',
		});
		await this.sendMessage(response);
	}

	public async sendMonsterActiveSkills(card: Monster) {
		if (!card.hasActiveSkill()) {
			let response = Common.dynamicResponse('ON_NO_ACTIVESKILL_FOUND', {
				id: card.getId().toString(),
				name: card.getName(),
			});
			await this.sendMessage(response);
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

		await this.sendMessage(embed);
	}

	public async sendMonsterLeaderSkills(card: Monster) {
		if (!card.hasLeaderSkill()) {
			let response = Common.dynamicResponse('ON_NO_LEADERSKILL_FOUND', {
				id: card.getId().toString(),
				name: card.getName(),
			});
			await this.sendMessage(response);
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

		await this.sendMessage(embed);
	}

	public async sendMonsterMonsterPoints(card: Monster) {
		let response = Common.dynamicResponse('ON_MONSTERPOINTS_REQUEST', {
			id: card.getId().toString(),
			name: card.getName(),
			monsterPoints: this.numberWithCommas(card.getMonsterPoints()),
		});
		await this.sendMessage(response);
	}

	public async sendMonsterId(card: Monster) {
		let response = Common.dynamicResponse('ON_ID_REQUEST', {
			id: card.getId().toString(),
			name: card.getName(),
		});
		await this.sendMessage(response);
	}

	public async sendMonsterSeries(card: Monster) {
		let seriesName = null;

		if (card.getCollab() !== 0 && card.getCollabReadable().toLowerCase() !== 'unknown') {
			seriesName = card.getCollabReadable();
		}

		if (card.getSeries() !== null) {
			seriesName = card.getSeriesReadable();
		}

		let response = Common.dynamicResponse(
			seriesName !== null ? 'ON_SERIES_REQUEST_FOUND' : 'ON_SERIES_REQUEST_NOT_FOUND',
			{
				id: card.getId().toString(),
				name: card.getName(),
				series: seriesName,
			}
		);

		await this.sendMessage(response);
	}

	public async sendFullMonsterEvoTree(monsterCardList: Monster[]) {
		let embeds = [];

		for (let monsterCard of monsterCardList) {
			embeds.push(await this.constructMonsterInfo(monsterCard));
		}

		await this.sendEmbedWithMultiplePages(embeds);
	}

	public async sendMonsterEvoTree(card: Monster) {
		let evoList = card.getEvoTree();
		let numberOfEvos = evoList.length;
		let message;

		if (numberOfEvos === 1) {
			message = Common.dynamicResponse('ON_EVOLIST_REQUEST_SINGLE_EVO', {
				id: card.getId().toString(),
				name: card.getName(),
			});

			await this.sendMessage(message);
		} else {
			message = Common.dynamicResponse('ON_EVOLIST_REQUEST', {
				id: card.getId().toString(),
				name: card.getName(),
				numberOfEvos: numberOfEvos.toString(),
			});

			await this.sendMessage(message);
		}

		let result = [];
		let cards = [];
		for (let i = 0; i < numberOfEvos; i++) {
			let monsterId = evoList[i];
			let monster = new Monster(monsterId);
			await monster.init();

			//For later embed, needs cleaning up...
			cards.push(monster);

			let mainAttribute = monster.getMainAttribute();
			let subAttribute = monster.getSubAttribute() === null ? -1 : monster.getSubAttribute();
			let attributes =
				Common.attributeEmotesMapping([mainAttribute])[0] + Common.attributeEmotesMapping([subAttribute])[0];

			result.push(`${attributes}| ${monsterId}. ${monster.getName()}`);
		}

		let sentEmbed = await this.sendMessageList(`All Evolutions of ${card.getName()}`, result);
		await sentEmbed.react('📃');

		let reactors = (message: Message) => {
			this.createCollector(message).on('collect', async (react: MessageReaction, user) => {
				if (react.emoji.name === '📃') {
					await this.sendFullMonsterEvoTree(cards);
				}
			});
		};

		reactors(sentEmbed);
	}

	public async sendCollabList(series: string, attribute1 = null, attribute2 = null) {
		let monsters: MonsterData[] = [];

		try {
			//Get all monsters with that series
			let seriesMonsters = await Monster.getAllCardsFromSeries(series);
			let collabMonsters = await Monster.getAllCardsFromCollab(Number(series));

			if (seriesMonsters.length === 0 && collabMonsters.length === 0) {
				await this.sendMessage(
					"I don't have any information on the collab/series you were inquiring. Please let my devs know to update the database."
				);
				return;
			}

			seriesMonsters.forEach((doc) => monsters.push(doc));
			collabMonsters.forEach((doc) => monsters.push(doc));

			//Get the first monster and see if it is grouped with something else
			let group = monsters[0].group;
			let seriesName =
				monsters[0].collab !== 0 && monsters[0].collabReadable.toLowerCase() !== 'unknown'
					? monsters[0].collabReadable
					: monsters[0].seriesReadable;

			if (group === null) {
				let result = [];

				//Filter monsters by attributes
				if (attribute1 !== null) {
					monsters = monsters.filter((monster) => monster.mainAttribute === Number(attribute1));
				}
				if (attribute2 !== null) {
					monsters = monsters.filter((monster) => monster.mainAttribute === Number(attribute1));
				}

				monsters.forEach((monster) => {
					if (monster.name.includes('*')) return;
					let mainAttribute = monster.mainAttribute;
					let subAttribute = monster.subAttribute === null ? -1 : monster.subAttribute;
					let attributes =
						Common.attributeEmotesMapping([mainAttribute])[0] +
						Common.attributeEmotesMapping([subAttribute])[0];
					result.push(`${attributes}| ${monster.id}. ${monster.name}`);
				});

				let title = `Monsters from the **${seriesName}** series`;
				await this.sendMessageList(title, result);
			} else {
				let extraMonsters = await Monster.getAllCardsFromCustomGroup(group);
				extraMonsters.forEach((doc) => monsters.push(doc));

				//Filter monsters by attributes
				if (attribute1 !== null) {
					monsters = monsters.filter((monster) => monster.mainAttribute === Number(attribute1));
				}
				if (attribute2 !== null) {
					monsters = monsters.filter((monster) => monster.mainAttribute === Number(attribute1));
				}

				let result = [];
				monsters.forEach((monster) => {
					if (monster.name.includes('*')) return;
					let mainAttribute = monster.mainAttribute;
					let subAttribute = monster.subAttribute === null ? -1 : monster.subAttribute;
					let attributes =
						Common.attributeEmotesMapping([mainAttribute])[0] +
						Common.attributeEmotesMapping([subAttribute])[0];
					result.push(`${attributes}| ${monster.id}. ${monster.name}`);
				});

				let title = `Monsters from the **${seriesName}** series`;
				await this.sendMessageList(title, result);
			}
		} catch (error) {
			await this.sendMessage('Something went wrong! Please try again later T_T.');
		}
	}

	public async constructMonsterMaterials(card: Monster, type: 'evo' | 'devo' = 'evo') {
		let mats = type === 'evo' ? card.getEvoMaterials() : card.getDevoMaterials();
		let names = [];
		mats = mats.filter((mat) => mat !== 0);

		let embed = new Discord.MessageEmbed()
			.setTitle(`**${card.getId()}. ${card.getName()}**`)
			.setThumbnail(card.getThumbnailUrl());

		if (type === 'devo' && (mats.length === 0 || card.getPreviousEvoId() === 0)) {
			embed.addFields({
				name: `Devo Materials`,
				value: `**${card.getName()} (#${card.getId()})** cannot be devolved.`,
			});
		} else if (type === 'evo' && mats.length === 0) {
			embed.addFields({
				name: `Evo Materials`,
				value: `**${card.getName()} (#${card.getId()})** is in its base form and cannot be evolved to from any other evo.`,
			});
		} else {
			for (let i = 0; i < mats.length; i++) {
				let evoMatId = mats[i];
				let monster = new Monster(evoMatId);
				await monster.init();

				names.push(monster.getId() + '. ' + monster.getName());
			}

			let imagePath = type === 'evo' ? Common.getEvoImageUrl(card.getId()) : Common.getDevoImageUrl(card.getId());

			embed
				.addFields({
					name: `${type === 'evo' ? 'Evo' : 'Devo'} Materials`,
					value: names.join('\n'),
				})
				.setImage(imagePath);
		}

		return embed;
	}

	public async sendMonsterMaterials(card: Monster, type: 'evo' | 'devo' = 'evo') {
		let embed = await this.constructMonsterMaterials(card, type);
		await this.sendMessage(embed);
	}

	public async sendQueryResult(data) {
		let {
			queryFilterType, //Unused for now
			queryIncludeSA,
			queryQuantity1,
			queryQuantity2,
			queryQuantity3,
			queryCompare1,
			queryCompare2,
			queryCompare3,
			queryEvoType,
			monsterAwakenings1,
			monsterAwakenings2,
			monsterAwakenings3,
			monsterAttribute1,
			monsterAttribute2,
			monsterSeries,
		} = data;

		let conditions = Monster.constructFilterConditions(data);

		//Display query criteria
		let includingSA =
			queryIncludeSA === 'includeSA' ? 'will also count Super Awakenings' : 'will not count Super Awakenings';
		let attributesSpecified;
		if (monsterAttribute1 === null && monsterAttribute2 === null) attributesSpecified = 'None';
		if (monsterAttribute1 !== null && monsterAttribute2 === null)
			attributesSpecified = Common.attributeEmotesMapping([monsterAttribute1]);
		if (monsterAttribute1 === null && monsterAttribute2 !== null)
			attributesSpecified = Common.attributeEmotesMapping([monsterAttribute1]);
		if (monsterAttribute1 !== null && monsterAttribute2 !== null)
			attributesSpecified = Common.attributeEmotesMapping([monsterAttribute1, monsterAttribute2]).join(' ');

		let embed = new Discord.MessageEmbed().setTitle('Search Criteria');

		embed.addFields(
			{ name: 'Series Specified', value: monsterSeries ? monsterSeries : 'None' },
			{ name: 'Evolution Type', value: queryEvoType ? queryEvoType : 'None' },
			{ name: 'Attributes Requested', value: attributesSpecified },
			{ name: 'Super Awakenings', value: `The results ${includingSA}.` }
		);

		conditions.forEach((condition, index) => {
			if (condition.type !== 'awakening') return;

			let queryCompare = condition.queryCompare;
			let awakening = condition.monsterAwakening;
			let awakeningEmote = Common.awakenEmotesMapping([awakening]);
			let quantity = condition.queryQuantity;

			let compare = '>=';
			if (queryCompare === 'max') compare = '<=';
			else if (queryCompare === 'exact') compare = '==';
			else if (queryCompare === 'less') compare = '<';
			else if (queryCompare === 'more') compare = '>';
			else compare = '>=';

			embed.addFields({ name: 'Criteria', value: `${awakeningEmote} ${compare} ${quantity}`, inline: true });
		});
		await this.sendMessage(embed);

		//Convert SB+, resist+, etc. to their smaller counterparts
		conditions = Monster.convertFilterConditions(conditions);

		let monsters: MonsterData[] = await Monster.getAllCardsWithMultipleConditions(
			conditions,
			queryIncludeSA === 'includeSA'
		);

		//Filter Japanese
		monsters = monsters.filter((monster) => !monster.name.includes('*') && !monster.name.includes('??'));

		let dataToSend = [];
		monsters.forEach((monster) => {
			let mainAttribute = monster.mainAttribute;
			let subAttribute = monster.subAttribute === null ? -1 : monster.subAttribute;
			let attributes =
				Common.attributeEmotesMapping([mainAttribute])[0] + Common.attributeEmotesMapping([subAttribute])[0];
			dataToSend.push(`${attributes}| ${monster.id}. ${monster.name}`);
		});

		//Display result
		if (dataToSend.length === 0) {
			await this.sendMessage('I cannot find monsters matched the criteria you are asking for.');
		} else {
			await this.sendMessageList('Search Result for Your Query', dataToSend);
		}
	}

	public async sendMonstersMinMaxAwakenings(data) {
		let {
			queryMinMax,
			monsterAwakenings1,
			monsterAwakenings2,
			monsterAwakenings3,
			monsterSeries,
			queryIncludeSA,
			queryEvoType,
		} = data;

		if (monsterAwakenings1 === null) {
			await this.sendMessage(`I can't seem to find the awakening you are looking for. Can you please try again?`);
			return;
		}

		if (queryMinMax === 'min') {
			await this.sendMessage(
				"I can only process info about cards with the most number of awakenings. The min number should be 0, shouldn't it?"
			);
			return;
		}

		//Fix attribute detection
		let { monsterAttribute1, monsterAttribute2 } = Monster.fixAttributeDetection(data);

		//Display query criteria
		let includingSA =
			queryIncludeSA === 'includeSA' ? 'will also count Super Awakenings' : 'will not count Super Awakenings';
		let attributesSpecified = '';
		if (monsterAttribute1 !== null) attributesSpecified += Common.attributeEmotesMapping([monsterAttribute1])[0];
		if (monsterAttribute2 !== null)
			attributesSpecified += ' ' + Common.attributeEmotesMapping([monsterAttribute1])[0];
		if (attributesSpecified.trim().length === 0) attributesSpecified = 'None';

		let embed = new Discord.MessageEmbed().setTitle('Search Criteria');

		embed.addFields(
			{ name: 'Series Specified', value: monsterSeries ? monsterSeries : 'None' },
			{ name: 'Evolution Type', value: queryEvoType ? queryEvoType : 'None' },
			{ name: 'Attributes Requested', value: attributesSpecified },
			{ name: 'Super Awakenings', value: `The results ${includingSA}.` },
			{ name: 'Searching for Monsters with The Most', value: Common.awakenEmotesMapping([monsterAwakenings1])[0] }
		);
		await this.sendMessage(embed);

		let max = 0;
		let monsters: MonsterData[] = [];
		let fieldName = queryIncludeSA === 'includeSA' ? 'computedAwakeningsWithSA' : 'computedAwakeningsWithoutSA';
		if (monsterSeries !== null || monsterAttribute1 !== null || queryEvoType !== null) {
			//Construct conditions
			let conditions = Monster.constructFilterConditions(data);

			//Convert SB+, resist+, etc. to their smaller counterparts
			conditions = Monster.convertFilterConditions(conditions);

			//Get monsters
			monsters = await Monster.getAllCardsWithMultipleConditions(conditions, queryIncludeSA === 'includeSA', [
				'series',
				'attribute',
				'evoType',
			]);

			//Run through the list of monsters to choose the one with the highest amount of awakenings
			//Sort them from high to low
			monsters = monsters.sort(
				(a: MonsterData, b: MonsterData) => b[fieldName][monsterAwakenings1] - a[fieldName][monsterAwakenings1]
			);

			max = monsters[0][fieldName][monsterAwakenings1];

			if (max === 0) monsters = [];
			else monsters = monsters.filter((monster) => monster[fieldName][monsterAwakenings1] === max);
		} else {
			//Calculate max stats
			let maxStats = await Monster.getCalculatedMaxStats();

			if (!maxStats) {
				await this.sendMessage(
					'I cannot process that query at the moment. Please let my dev know to update the database.'
				);
				return;
			}
			max =
				maxStats[queryIncludeSA === 'includeSA' ? 'maxComputedInfoWithSA' : 'maxComputedInfoWithoutSA'][
					monsterAwakenings1
				];
			//Get new data
			let snapshot = await firestore
				.collection('Monsters')
				.where(`${fieldName}.${monsterAwakenings1}`, '==', max)
				.get();

			if (snapshot.empty) {
				await this.sendMessage(
					'I cannot process that query at the moment. Please let my dev know to update the database.'
				);
				return;
			}

			snapshot.forEach((monster: FirebaseFirestore.DocumentData) => monsters.push(monster.data()));
		}

		//Filter Japanese
		monsters = monsters.filter((monster) => !monster.name.includes('*') && !monster.name.includes('??'));

		let dataToSend = [];
		monsters.forEach((monster) => {
			let mainAttribute = monster.mainAttribute;
			let subAttribute = monster.subAttribute === null ? -1 : monster.subAttribute;
			let attributes =
				Common.attributeEmotesMapping([mainAttribute])[0] + Common.attributeEmotesMapping([subAttribute])[0];
			dataToSend.push(`${attributes}| ${monster.id}. ${monster.name}`);
		});

		let awakeningEmote = Common.awakenEmotesMapping([monsterAwakenings1])[0];

		if (monsters.length === 0) {
			await this.sendMessage(`There are no monsters with more than 0 ${awakeningEmote} from your criteria.`);
		} else {
			//Display result
			let message = `Here is the list of monsters with the most ${awakeningEmote}! (${max} is the maximum number of ${awakeningEmote} based on your criteria)`;
			await this.sendMessage(message);
			await this.sendMessageList('Search Result for Your Query', dataToSend);
		}
	}

	public async sendMonstersMinMaxStats(data) {
		let { queryMinMax, stat, monsterSeries, queryIncludeLB, queryEvoType } = data;

		if (!['hp', 'attack', 'recover'].includes(stat)) {
			await this.sendMessage(`I can't seem to find the stat you are looking for. Can you please try again?`);
			return;
		}

		if (queryMinMax === 'min') {
			await this.sendMessage(
				'I can only process info about cards with the most stats. Will learn to process min stats later!'
			);
			return;
		}

		//Fix attribute detection
		let { monsterAttribute1, monsterAttribute2 } = Monster.fixAttributeDetection(data);

		//Display query criteria
		let includingLB =
			queryIncludeLB === 'includeLB'
				? 'will count stats after limit break (if any)'
				: 'will only count stats before limit break';
		let attributesSpecified = '';
		if (monsterAttribute1 !== null) attributesSpecified += Common.attributeEmotesMapping([monsterAttribute1])[0];
		if (monsterAttribute2 !== null)
			attributesSpecified += ' ' + Common.attributeEmotesMapping([monsterAttribute1])[0];
		if (attributesSpecified.trim().length === 0) attributesSpecified = 'None';

		let embed = new Discord.MessageEmbed().setTitle('Search Criteria');

		embed.addFields(
			{ name: 'Series Specified', value: monsterSeries ? monsterSeries : 'None' },
			{ name: 'Evolution Type', value: queryEvoType ? queryEvoType : 'None' },
			{ name: 'Attributes Requested', value: attributesSpecified },
			{ name: 'Super Awakenings', value: `The results ${includingLB}.` },
			{ name: 'Searching for Monsters with The Highest', value: stat.toUpperCase() }
		);
		await this.sendMessage(embed);

		let max = 0;
		let monsters: MonsterData[] = [];
		if (monsterSeries !== null || monsterAttribute1 !== null || queryEvoType !== null) {
			//Construct conditions
			let conditions = Monster.constructFilterConditions(data);

			//Convert SB+, resist+, etc. to their smaller counterparts
			conditions = Monster.convertFilterConditions(conditions);

			//Get monsters
			monsters = await Monster.getAllCardsWithMultipleConditions(conditions, false, [
				'series',
				'attribute',
				'evoType',
			]);

			//Run through the list of monsters to choose the one with the highest amount of awakenings
			//Sort them from high to low
			let fieldName;
			if (stat === 'hp') fieldName = 'HP';
			if (stat === 'attack') fieldName = 'ATK';
			if (stat === 'recover') fieldName = 'RCV';
			let withLB = monsters.sort(
				(a: MonsterData, b: MonsterData) => b['limitBreak' + fieldName] - a['limitBreak' + fieldName]
			);
			let withoutLB = monsters.sort(
				(a: MonsterData, b: MonsterData) => b['max' + fieldName] - a['max' + fieldName]
			);

			max = Math.max(withLB[0]['limitBreak' + fieldName], withoutLB[0]['max' + fieldName]);

			monsters = monsters.filter(
				(monster) => monster['limitBreak' + fieldName] === max || monster['max' + fieldName] === max
			);
		} else {
			//Calculate max stats
			let maxStats = await Monster.getCalculatedMaxStats();

			if (!maxStats) {
				await this.sendMessage(
					'I cannot process that query at the moment. Please let my dev know to update the database.'
				);
				return;
			}

			if (stat === 'hp') {
				max =
					queryIncludeLB === 'includeLB'
						? Math.max(maxStats['maxComputedStatsWithoutLB'].hp, maxStats['maxComputedStatsWithLB'].hp)
						: maxStats['maxComputedStatsWithoutLB'].hp;
			}
			if (stat === 'attack') {
				max =
					queryIncludeLB === 'includeLB'
						? Math.max(
								maxStats['maxComputedStatsWithoutLB'].attack,
								maxStats['maxComputedStatsWithLB'].attack
						  )
						: maxStats['maxComputedStatsWithoutLB'].attack;
			}
			if (stat === 'recover') {
				max =
					queryIncludeLB === 'includeLB'
						? Math.max(
								maxStats['maxComputedStatsWithoutLB'].recover,
								maxStats['maxComputedStatsWithLB'].recover
						  )
						: maxStats['maxComputedStatsWithoutLB'].recover;
			}

			//Get new data
			let fieldName;
			if (stat === 'hp') fieldName = 'HP';
			if (stat === 'attack') fieldName = 'ATK';
			if (stat === 'recover') fieldName = 'RCV';
			let snapshotWithLB = await firestore
				.collection('Monsters')
				.where(`limitBreak${fieldName}`, '==', max)
				.get();
			let snapshotWithoutLB = await firestore.collection('Monsters').where(`max${fieldName}`, '==', max).get();

			snapshotWithLB.forEach((monster: FirebaseFirestore.DocumentData) => monsters.push(monster.data()));
			snapshotWithoutLB.forEach((monster: FirebaseFirestore.DocumentData) => monsters.push(monster.data()));
		}

		//Filter Japanese
		monsters = monsters.filter((monster) => !monster.name.includes('*') && !monster.name.includes('??'));

		let dataToSend = [];
		monsters.forEach((monster) => {
			let mainAttribute = monster.mainAttribute;
			let subAttribute = monster.subAttribute === null ? -1 : monster.subAttribute;
			let attributes =
				Common.attributeEmotesMapping([mainAttribute])[0] + Common.attributeEmotesMapping([subAttribute])[0];
			dataToSend.push(`${attributes}| ${monster.id}. ${monster.name}`);
		});

		if (monsters.length === 0) {
			await this.sendMessage(
				`I cannot process that query at the moment. Please let my dev know to update the database.`
			);
		} else {
			//Display result
			let message = `Here is the list of monsters with the most ${stat.toUpperCase()}! (${max} is the highest based on your criteria)`;
			await this.sendMessage(message);
			await this.sendMessageList('Search Result for Your Query', dataToSend);
		}
	}

	public async sendRandomCard(data) {
		let { quantity, queryEvoType, monsterSeries, type } = data;
		quantity = Number(quantity) || 1;

		if (quantity > 20) {
			if (type === 'random') {
				await this.sendMessage(
					"Due to Discord's limitation on embed messages, I can only give you at most 20 monsters. Wanna try again?"
				);
				return;
			} else {
				await this.sendMessage(
					"Due to Discord's limitation on embed messages, you can only roll 20 monsters at a time. Wanna try again?"
				);
				return;
			}
		}

		//Fix attribute detection
		let { monsterAttribute1, monsterAttribute2 } = Monster.fixAttributeDetection(data);

		let monsters: MonsterData[] = [];
		if (monsterSeries !== null || monsterAttribute1 !== null || queryEvoType !== null) {
			//Construct conditions
			let conditions = Monster.constructFilterConditions(data);

			//Convert SB+, resist+, etc. to their smaller counterparts
			conditions = Monster.convertFilterConditions(conditions);

			//Get monsters
			monsters = await Monster.getAllCardsWithMultipleConditions(conditions, false, [
				'series',
				'attribute',
				'evoType',
			]);

			//Filter Japanese
			monsters = monsters.filter((monster) => !monster.name.includes('*') && !monster.name.includes('??'));

			//If the number of monsters retrieved is > the quantity, just pick random
			if (monsters.length > quantity) {
				let temp = [];

				do {
					let index = Common.randomBetween(0, monsters.length - 1);

					if (type === 'random') {
						temp.push(monsters[index]);
					} else {
						if (monsters[index].monsterPoints >= 1000) {
							temp.push(monsters[index]);
						}
					}
					monsters.splice(index, 1);
				} while (temp.length < quantity && monsters.length > 0);

				monsters = temp;
			}
		} else {
			do {
				let maxIndex = Monster.getHighestValidMonsterId();
				let index = Common.randomBetween(0, maxIndex);
				try {
					let monster = new Monster(index);
					await monster.init();

					//Filter out Japanese names
					if (monster.getName().includes('*') || monster.getName().includes('??')) continue;

					if (type === 'random') {
						monsters.push(monster.getFullData());
					} else {
						if (monster.getMonsterPoints() >= 1000) {
							monsters.push(monster.getFullData());
						}
					}
				} catch (error) {
					console.log(error);
					continue;
				}
			} while (monsters.length < quantity);
		}

		//Map to id & url only
		let monsterIconData = monsters.map((monster) => {
			return {
				id: monster.id,
				url: Common.getThumbnailUrl(monster.id),
			};
		});
		let monsterNameData = monsters.map((monster) => monster.id + '. ' + monster.name);

		let imagePath;
		try {
			//We wrap it in here so we can re-run the whole function if something went wrong
			imagePath = await Common.displayCardIcons(monsterIconData);
		} catch (error) {
			console.log(error);
			this.sendRandomCard(data);
			return;
		}

		let embed = new Discord.MessageEmbed()
			.addFields({
				name:
					type === 'random'
						? `Random Monsters`
						: `Your Roll Result (**NOT** real in-game rate, read footer for more)`,
				value: monsterNameData.join('\n'),
			})
			.attachFiles([
				{
					attachment: imagePath,
					name: 'randomMonsters.png',
				},
			])
			.setImage('attachment://randomMonsters.png');

		if (type === 'roll') {
			embed.setFooter(
				`For real in-game rate simulation of currently active machines, try \`roll 10 times current rare egg machine\`, \`roll 10 times current collab machine\` or \`roll 20 times current event egg machine\``
			);
		}

		if (type === 'random') {
			await this.sendMessage(
				`Here ${monsters.length > 1 ? 'are' : 'is'} ${monsters.length} random ${
					monsters.length > 1 ? 'monsters' : 'monster'
				} for you!`
			);
		} else {
			await this.sendMessage(`I rolled ${monsters.length} times for you! Here is the result!`);
		}
		await this.sendMessage(embed);
		await fs.unlinkSync(imagePath);
	}

	public async sendCardByEvoType(data) {
		let { monsterId, queryEvoType } = data;

		monsterId = Number(monsterId);

		//Fix attribute detection
		let { monsterAttribute1, monsterAttribute2 } = Monster.fixAttributeDetection(data);

		let monster = new Monster(monsterId);
		await monster.init();

		let forms = monster.getEvoTree();
		let monsters: MonsterData[] = [];

		//Use for-loop for async
		for (let id of forms) {
			let m = new Monster(id);
			await m.init();

			monsters.push(m.getFullData());
		}

		monsters = Monster.filterByAttributes(monsters, monsterAttribute1, monsterAttribute2);
		monsters = Monster.filterByEvoType(monsters, queryEvoType);

		if (monsters.length === 0) {
			await this.sendMessage(
				`I was able to find the monster you were asking for, but it looks like that evolution type or attribute doesn't exist on this monster!`
			);
		} else if (monsters.length === 1) {
			let monster = new Monster(monsters[0].id);
			await monster.init();

			await this.sendMonsterInfo(monster);
		} else {
			let result = [];
			for (let i = 0; i < monsters.length; i++) {
				let monsterId = monsters[i].id;
				let monster = new Monster(monsterId);
				await monster.init();

				let mainAttribute = monster.getMainAttribute();
				let subAttribute = monster.getSubAttribute() === null ? -1 : monster.getSubAttribute();
				let attributes =
					Common.attributeEmotesMapping([mainAttribute])[0] +
					Common.attributeEmotesMapping([subAttribute])[0];

				result.push(`${attributes}| ${monsterId}. ${monster.getName()}`);
			}

			await this.sendMessage(
				`There are more than 1 card that fit your criteria. Here are the list of what I found:`
			);
			await this.sendMessageList(`Monsters that match your criteria`, result);
		}
	}

	public async sendRandomRolls(data) {
		let { machine, quantity } = data;
		quantity = Number(quantity) || 1;

		if (!['event', 'collab', 'rare'].includes(machine)) {
			await this.sendMessage(
				"I can't seem to find that machine type. For real-rate rolling, you can only do `event`, `collab` or `rare` egg machines. Try again!"
			);
			return;
		}

		if (quantity > 20) {
			await this.sendMessage(
				"Due to Discord's limitation on embed messages, you can only roll 20 monsters at a time. Wanna try again?"
			);
		}

		let machineData;
		if (machine === 'event') machineData = EVENT_EGG_MACHINE;
		else if (machine === 'collab') machineData = COLLAB_EGG_MACHINE;
		else machineData = RARE_EGG_MACHINE;

		let from = moment(machineData.startDate).format('MM/DD/YYYY');
		let to = moment(machineData.endDate).format('MM/DD/YYYY');
		let by = machineData.rateBy;
		let lineup = machineData.lineup || {};
		let updatedAt = moment(machineData.updatedAt).format('MM/DD/YYYY');
		let machineName = machineData.name;
		let cost = machineData.cost;

		//Construct lineup
		let lineups = [];
		for (let id in lineup) {
			let rate = lineup[id];
			let amount = rate * 100;
			for (let i = 0; i < amount; i++) {
				lineups.push(id);
			}
		}

		//Shuffle it
		for (let i = lineups.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * i);
			const temp = lineups[i];
			lineups[i] = lineups[j];
			lineups[j] = temp;
		}
		if (Object.keys(lineup).length === 0 || lineups.length === 0) {
			await this.sendMessage(
				`This egg machine is not currently active or there is no data yet. Last data was updated on ${updatedAt}.`
			);
			return;
		}

		let monsters = [];
		//Get random amount, up to the quantity
		do {
			let index = Common.randomBetween(0, lineups.length - 1);
			let monsterId = Number(lineups[index]);
			try {
				let monster = new Monster(monsterId);
				await monster.init();

				monsters.push(monster.getFullData());
			} catch (error) {
				// console.log(error);
				continue;
			}
		} while (monsters.length < quantity);

		//Map to id & url only
		let monsterIconData = monsters.map((monster) => {
			return {
				id: monster.id,
				url: Common.getThumbnailUrl(monster.id),
			};
		});
		//Get datanames
		let temp = {};
		let rarity = {};
		monsters.forEach((monster) => {
			//Record rarity
			if (!Number.isInteger(rarity[monster.rarity])) {
				rarity[monster.rarity] = 1;
			} else {
				rarity[monster.rarity] = rarity[monster.rarity] + 1;
			}

			//Convert duplicated monsters to number for quantity
			if (!Number.isInteger(temp[monster.id]?.quantity)) {
				temp[monster.id] = {
					name: monster.name,
					id: monster.id,
					quantity: 1,
				};
			} else {
				temp[monster.id] = {
					name: monster.name,
					id: monster.id,
					quantity: temp[monster.id].quantity + 1,
				};
			}
		});

		let monsterNameData = [];
		let analysis = [];
		for (let id in temp) {
			let roll = temp[id];
			monsterNameData.push(
				`${roll.id}. ${roll.name} **x${roll.quantity}** - \`${machineData.lineup[id]}% chance\``
			);
		}
		for (let star in rarity) {
			let quantity = rarity[star];
			let percentage = ((quantity / monsters.length) * 100).toFixed(2);
			analysis.push(`- ${star} stars - ${quantity} rolls (\`~${percentage}%\`)`);
		}

		let imagePath;
		try {
			//We wrap it in here so we can re-run the whole function if something went wrong
			imagePath = await Common.displayCardIcons(monsterIconData);
		} catch (error) {
			console.log(error);
			this.sendRandomCard(data);
			return;
		}

		let embed = new Discord.MessageEmbed()
			.setAuthor(`${from} - ${to}`)
			.setTitle(`${machineName} (using real in-game rate)`)
			.addFields({
				name: `Your Roll Result`,
				value: monsterNameData.join('\n'),
			})
			.addFields({
				name: `Roll Rate Analysis`,
				value: analysis.join('\n'),
			})
			.attachFiles([
				{
					attachment: imagePath,
					name: 'rolledMonsters.png',
				},
			])
			.setImage('attachment://rolledMonsters.png')
			.setFooter(
				`In-game rate data was input on ${updatedAt} by ${by}.\nThis is just a simulator of what the machine rolls would be with provided in-game rates; and is in no way affiliated with Gungho's drop algorithms.`
			);

		cost = cost * monsters.length;
		let dollar = ((46.99 * cost) / 85).toFixed(2);
		await this.sendMessage(
			`<@!${this._message.author.id}> I just spent **${cost}** stones (**~$${dollar}**, assuming you buy packs?) to roll ${monsters.length} times for you in the current **${machineName}** machine! Here is the result!`
		);
		await this.sendMessage(embed);
		await fs.unlinkSync(imagePath);
	}
}
