const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
import { Monster } from './monster.class';
import { MonsterData } from '../shared/monster.interfaces';
import { Common } from './common.class';
import * as admin from 'firebase-admin';
import { WhereFilterOp } from '@firebase/firestore-types';
import { DMChannel, MessageReaction, MessageEmbed, Message } from 'discord.js';
import { Cache } from './cache.class';
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
			};
			let ref = await firestore.collection('TrainingRequests').add(data);
			data['trainingRequestId'] = ref.id;
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
		let reg = /(fire|water|wood|light|dark|r|g|b|l|d|none|x)\/(fire|water|wood|light|dark|r|g|b|l|d|none|x)/gi;
		let dict = {
			redred: 'red red',
			redr: 'red red',
			rred: 'red red',
			rr: 'red red',
			redblue: 'red blue',
			redb: 'red blue',
			rblue: 'red blue',
			rb: 'red blue',
			redgreen: 'red green',
			redg: 'red green',
			rgreen: 'red green',
			rg: 'red green',
			redlight: 'red light',
			redl: 'red light',
			rlight: 'red light',
			rl: 'red light',
			reddark: 'red dark',
			redd: 'red dark',
			rdark: 'red dark',
			rd: 'red dark',
			redx: 'red none',
			rx: 'red none',
			bluered: 'blue red',
			bluer: 'blue red',
			bred: 'blue red',
			br: 'blue red',
			blueblue: 'blue blue',
			blueb: 'blue blue',
			bblue: 'blue blue',
			bb: 'blue blue',
			bluegreen: 'blue green',
			blueg: 'blue green',
			bgreen: 'blue green',
			bg: 'blue green',
			bluelight: 'blue light',
			bluel: 'blue light',
			blight: 'blue light',
			bl: 'blue light',
			bluedark: 'blue dark',
			blued: 'blue dark',
			bdark: 'blue dark',
			bd: 'blue dark',
			bluex: 'blue none',
			bx: 'blue none',
			greenred: 'green red',
			greenr: 'green red',
			gred: 'green red',
			gr: 'green red',
			greenblue: 'green blue',
			greenb: 'green blue',
			gblue: 'green blue',
			gb: 'green blue',
			greengreen: 'green green',
			greeng: 'green green',
			ggreen: 'green green',
			gg: 'green green',
			greenlight: 'green light',
			greenl: 'green light',
			glight: 'green light',
			gl: 'green light',
			greendark: 'green dark',
			greend: 'green dark',
			gdark: 'green dark',
			gd: 'green dark',
			greenx: 'green none',
			gx: 'green none',
			lightred: 'light red',
			lightr: 'light red',
			lred: 'light red',
			lr: 'light red',
			lightblue: 'light blue',
			lightb: 'light blue',
			lblue: 'light blue',
			lb: 'light blue',
			lightgreen: 'light green',
			lightg: 'light green',
			lgreen: 'light green',
			lg: 'light green',
			lightlight: 'light light',
			lightl: 'light light',
			llight: 'light light',
			ll: 'light light',
			lightdark: 'light dark',
			lightd: 'light dark',
			ldark: 'light dark',
			ld: 'light dark',
			lightx: 'light none',
			lx: 'light none',
			darkred: 'dark red',
			darkr: 'dark red',
			dred: 'dark red',
			dr: 'dark red',
			darkblue: 'dark blue',
			darkb: 'dark blue',
			dblue: 'dark blue',
			db: 'dark blue',
			darkgreen: 'dark green',
			darkg: 'dark green',
			dgreen: 'dark green',
			dg: 'dark green',
			darklight: 'dark light',
			darkl: 'dark light',
			dlight: 'dark light',
			dl: 'dark light',
			darkdark: 'dark dark',
			darkd: 'dark dark',
			ddark: 'dark dark',
			dd: 'dark dark',
			darkx: 'dark none',
			dx: 'dark none',
		};

		//Trim it
		message = message.trim();

		//Check for / first
		if (message.includes('/')) {
			//'Show me d/r Anubis' -> 'd/r' -> 'd r'
			let attributes = message.match(reg)[0].split('/').join(' ');
			message = message.replace(reg, attributes);
		}

		//Replace conjuncted terms
		for (let replaceWhat in dict) {
			let byWhat = dict[replaceWhat];

			//Added spaces to distingush from regular words, but ignore the beginning space if the sentence starts with it
			//Eg: (lx) cotton
			if (message.toLowerCase().startsWith(replaceWhat.toLowerCase())) {
				let reg = new RegExp(replaceWhat + ' ', 'ig');
				message = message.replace(reg, byWhat + ' ');
			} else {
				let reg = new RegExp(' ' + replaceWhat + ' ', 'ig');
				message = message.replace(reg, ' ' + byWhat + ' ');
			}
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
		return message.createReactionCollector(this.collectorFilter, { time: 6000000 }).on('end', async (collected) => {
			try {
				await message.reactions.removeAll();
			} catch (error) {
				console.log(error);
			}
		});
	}

	public async sendMessage(message: string | MessageEmbed, optionals = null) {
		if (!message) return;
		try {
			let sentEmbed =
				optionals === null ? await this._channel.send(message) : await this._channel.send(message, optionals);
			let sentEmbedId = sentEmbed.id;
			let author = this._message.author.id;

			if (!cache.get(author)) {
				cache.set(author, [sentEmbedId]);
			} else {
				let cachedData = cache.get(author);
				cachedData.push(sentEmbedId);
				cache.set(author, cachedData);
			}

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

		//Construct first page
		let embed = this.constructMessageListPage(messageTitle, paginations, 0);

		if (paginations.length <= 1) {
			//Send out embed
			await this.sendMessage(embed);
			return;
		}

		//Send out embed
		await this.sendMessage(
			'There are multiple pages in this list. Use the reaction number to navigate between the lists!'
		);

		let sentEmbed = await this.sendMessage(embed);

		//Count the number of react
		let emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
		let reacts = [];
		for (let i = 0; i < paginations.length; i++) {
			reacts.push(sentEmbed.react(emojis[i]));
		}

		await Promise.all(reacts);

		let reactors = (message: Message) => {
			this.createCollector(message).on('collect', async (react: MessageReaction, user) => {
				let index = 0;

				switch (react.emoji.name) {
					case '2️⃣':
						index = 1;
						break;
					case '3️⃣':
						index = 2;
						break;
					case '4️⃣':
						index = 3;
						break;
					case '5️⃣':
						index = 4;
						break;
					case '6️⃣':
						index = 5;
						break;
					case '7️⃣':
						index = 6;
						break;
					case '8️⃣':
						index = 7;
						break;
					case '9️⃣':
						index = 8;
						break;
					case '🔟':
						index = 9;
						break;
					default:
						break;
				}

				let embed = this.constructMessageListPage(messageTitle, paginations, index);
				let reactEmbed = await react.message.edit(embed);

				reactors(reactEmbed);
			});
		};

		reactors(sentEmbed);
	}

	private constructMonsterInfo(card: Monster) {
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
		let embed = this.constructMonsterInfo(card);
		let sentEmbed = await this.sendMessage(embed);
		await sentEmbed.react('⬅️');
		await sentEmbed.react('➡️');

		let reactors = (message: Message) => {
			this.createCollector(message).on('collect', async (react: MessageReaction, user) => {
				//Try to extract number from the title
				let monsterId = Number(react.message.embeds[0].title.match(/(\d)+/gi)[0]);

				if (react.emoji.name === '⬅️') {
					monsterId -= 1;
					let monster = new Monster(monsterId);
					await monster.init();

					let embed = this.constructMonsterInfo(monster);
					let reactEmbed = await react.message.edit(embed);
					reactors(reactEmbed);
				} else if (react.emoji.name === '➡️') {
					monsterId += 1;
					let monster = new Monster(monsterId);
					await monster.init();

					let embed = this.constructMonsterInfo(monster);
					let reactEmbed = await react.message.edit(embed);
					reactors(reactEmbed);
				}
			});
		};

		reactors(sentEmbed);
	}

	public async sendMonsterImage(card: Monster) {
		let embed = new Discord.MessageEmbed().setTitle(`Image for ${card.getName()}`).setImage(card.getImageUrl());
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
		for (let i = 0; i < numberOfEvos; i++) {
			let monsterId = evoList[i];
			let monster = new Monster(monsterId);
			await monster.init();
			let mainAttribute = monster.getMainAttribute();
			let subAttribute = monster.getSubAttribute() === null ? -1 : monster.getSubAttribute();
			let attributes =
				Common.attributeEmotesMapping([mainAttribute])[0] + Common.attributeEmotesMapping([subAttribute])[0];

			result.push(`${attributes}| ${monsterId}. ${monster.getName()}`);
		}

		await this.sendMessageList(`All Evolutions of ${card.getName()}`, result);
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
					if (monster.name.includes('**')) return;
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
					if (monster.name.includes('**')) return;
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

	public async sendMonsterMaterials(card: Monster, type: 'evo' | 'devo' = 'evo') {
		let mats = type === 'evo' ? card.getEvoMaterials() : card.getDevoMaterials();
		let names = [];
		let iconUrls = [];

		mats = mats.filter((mat) => mat !== 0);

		if (type === 'devo' && card.getEvoMaterials().filter((mat) => mat !== 0).length === 0) {
			await this.sendMessage(`**${card.getName()} (#${card.getId()})** cannot be devolved!`);
			return;
		}

		if (type === 'evo' && mats.length === 0) {
			await this.sendMessage(`**${card.getName()} (#${card.getId()})** is in its base form!`);
			return;
		}

		for (let i = 0; i < mats.length; i++) {
			let evoMatId = mats[i];

			let monster = new Monster(evoMatId);
			await monster.init();

			names.push(monster.getId() + '. ' + monster.getName());
			iconUrls.push(monster.getThumbnailUrl());
		}

		let imagePath = await Common.writeDisplayIcons(iconUrls);

		let embed = new Discord.MessageEmbed()
			.setThumbnail(card.getThumbnailUrl())
			.addFields({
				name: `${type === 'evo' ? 'Evo' : 'Devo'} Materials for **${card.getId()}. ${card.getName()}**`,
				value: names.join('\n'),
			})
			.attachFiles([
				{
					attachment: imagePath,
					name: 'evoMats.png',
				},
			])
			.setImage('attachment://evoMats.png');

		await this.sendMessage(embed);
		await fs.unlinkSync(imagePath);
	}

	public async sendQueryResult(data) {
		// console.log('\n\n======\n');
		// console.log(JSON.stringify(data, null, 4));
		let {
			queryFilterType,
			monsterSeries,
			queryQuantity,
			queryIncludeSA,
			monsterAwakenings,
			quantities,
			attribute1,
			attribute2,
		} = data;
		let checkPassed = true;
		quantities = quantities.map((o, i) =>
			Number(o.numberValue || o.NumberValue === 0 ? o.numberValue : o.stringValue)
		);
		monsterAwakenings = monsterAwakenings.map((o, i) =>
			Number(o.numberValue || o.NumberValue === 0 ? o.numberValue : o.stringValue)
		);
		queryQuantity = queryQuantity.map((o, i) => o.stringValue);

		//Do some prerequisite checks
		//If number is with a different length with awakenings, we cannot process it
		//For example: Show me all cards with SBs, 3 blind resist will result in [sb, br] for awakenings but
		//             [3] for number and it's confusing
		if (quantities.length !== monsterAwakenings.length) checkPassed = false;

		//If queryQuantity is NOT empty, and also doesn't match the quantities' length, we will be confused
		//For example: show me all cards with 3 SBs, cloud resist will result in [3] for number, but [sb, cr] for awakenings
		//             and we won't know which one is which
		if (queryQuantity.length > 0 && queryQuantity.length > quantities.length) checkPassed = false;

		if (!checkPassed) {
			await this.sendMessage(
				`Your query seems a bit confusing to me. Help me clarify it.\n\nHere is example of good query:\n\`\`\`\nSearch for all cards with at least 3 skill boosts, exactly 1 tape resist from Monster Hunter Collab.\`\`\`\nAnd here is example of bad/vague query: \n\`\`\`Show me monsters with 5 skill boosts and cloud resist.\n\`\`\`\nIf you believe your query is good, it just means I haven't been trained to deal with your specific query phrases. Please let my devs know.`
			);
			await this.bugLog(
				`I have also sent a copy of your message to the dev to further help with this command. In the future, this command might work :).`
			);
			return;
		}

		//Display query criteria
		let includingSA =
			queryIncludeSA === 'includeSA' ? 'will also count Super Awakenings' : 'will not count Super Awakenings';
		let seriesSpecified = monsterSeries ? monsterSeries : 'None';
		let attributesSpecified;
		if (attribute1 === null && attribute2 === null) attributesSpecified = 'None';
		if (attribute1 !== null && attribute2 === null)
			attributesSpecified = Common.attributeEmotesMapping([attribute1]);
		if (attribute1 === null && attribute2 !== null)
			attributesSpecified = Common.attributeEmotesMapping([attribute2]);
		if (attribute1 !== null && attribute2 !== null)
			attributesSpecified = Common.attributeEmotesMapping([attribute1, attribute2]);

		let embed = new Discord.MessageEmbed().setTitle('Search Criteria');

		embed.addFields(
			{ name: 'Series Specified', value: seriesSpecified },
			{ name: 'Attributes Requested', value: attributesSpecified },
			{ name: 'Super Awakenings', value: `The results ${includingSA}.` }
		);

		quantities.forEach((quantity, index) => {
			let quantityType = queryQuantity[index];
			let awakening = monsterAwakenings[index];
			let awakeningEmote = Common.awakenEmotesMapping([awakening]);

			let compare = '>=';
			if (quantityType === 'max') compare = '<=';
			else if (quantityType === 'exact') compare = '==';
			else if (quantityType === 'less') compare = '<';
			else if (quantityType === 'more') compare = '>';
			else compare = '>=';

			embed.addFields({ name: 'Criteria', value: `${awakeningEmote} ${compare} ${quantity}`, inline: true });
		});
		await this.sendMessage(embed);

		//Convert SB+, resist+, etc. to their smaller counterparts
		let tempMonsterAwakenings = [],
			tempQuantities = [];
		monsterAwakenings.forEach((awakening, index) => {
			let computedAwakening = awakening;
			let originalQuantity = quantities[index];
			let quantity = 1;

			if (computedAwakening === 52) {
				computedAwakening = 10;
				quantity = 2;
			} else if (computedAwakening === 68) {
				computedAwakening = 11;
				quantity = 5;
			} else if (computedAwakening === 69) {
				computedAwakening = 12;
				quantity = 5;
			} else if (computedAwakening === 70) {
				computedAwakening = 13;
				quantity = 5;
			} else if (computedAwakening === 53) {
				computedAwakening = 19;
				quantity = 2;
			} else if (computedAwakening === 56) {
				computedAwakening = 21;
				quantity = 2;
			}

			tempMonsterAwakenings.push(computedAwakening);
			tempQuantities.push(originalQuantity * quantity);
		});
		monsterAwakenings = tempMonsterAwakenings;
		quantities = tempQuantities;

		//Process data if this is an AND condition
		if (queryFilterType === 'and') {
			let filters = [];

			quantities.forEach((quantity, index) => {
				let compare: WhereFilterOp = '==';
				let quantityType = queryQuantity[index];
				let awakening = monsterAwakenings[index];

				if (quantityType === 'max') compare = '<=';
				else if (quantityType === 'exact') compare = '==';
				else if (quantityType === 'less') compare = '<';
				else if (quantityType === 'more') compare = '>';
				else compare = '>=';

				filters.push({
					quantity: quantity,
					awakening: awakening,
					compare: compare,
				});
			});

			//Sort them by highest level to save on request time
			filters = filters.sort((a, b) => b.quantity - a.quantity);

			//Grabbing data from source
			let result = [];
			let fieldName = queryIncludeSA === 'includeSA' ? 'computedAwakeningsWithSA' : 'computedAwakeningsWithoutSA';
			let snapshot = await firestore
				.collection('Monsters')
				.where(`${fieldName}.${filters[0].awakening}`, filters[0].compare, filters[0].quantity)
				.get();

			if (snapshot.empty) {
				await this.sendMessage('I cannot find monsters matched the criteria you are asking for.');
				return;
			}

			//Push data to data to filter
			snapshot.forEach((doc) => result.push(doc.data() as MonsterData));

			filters.forEach((filter, index) => {
				let quantity = filter.quantity;
				let awakening = filter.awakening;
				let compare: WhereFilterOp = filter.compare;

				if (index === 0) return;

				result = result.filter((entry) => {
					if (compare === '==') return entry[fieldName][awakening] === quantity;
					else if (compare === '<=') return entry[fieldName][awakening] <= quantity;
					else if (compare === '<') return entry[fieldName][awakening] < quantity;
					else if (compare === '>=') return entry[fieldName][awakening] >= quantity;
					else if (compare === '>') return entry[fieldName][awakening] > quantity;
				});
			});

			//Filter Japanese
			result = result.filter((monster) => !monster.name.includes('**') && !monster.name.includes('??'));

			//Filter by collab
			if (monsterSeries) {
				//If it asks for only specific collabs/series, then only filter those results
				result = result.filter((monster) => {
					return monster.collab === Number(monsterSeries) || monster.series === monsterSeries;
				});
			}

			//Filter by attribute
			if (attribute1 !== null) {
				result = result.filter((monster) => monster.mainAttribute === Number(attribute1));
			}
			if (attribute2 !== null) {
				result = result.filter((monster) => monster.subAttribute === Number(attribute2));
			}

			let dataToSend = [];
			result.forEach((monster) => {
				let mainAttribute = monster.mainAttribute;
				let subAttribute = monster.subAttribute === null ? -1 : monster.subAttribute;
				let attributes =
					Common.attributeEmotesMapping([mainAttribute])[0] +
					Common.attributeEmotesMapping([subAttribute])[0];
				dataToSend.push(`${attributes}| ${monster.id}. ${monster.name}`);
			});

			//Display result
			if (dataToSend.length === 0) {
				await this.sendMessage('I cannot find monsters matched the criteria you are asking for.');
			} else {
				await this.sendMessageList('Search Result for Your Query', dataToSend);
			}
		} else {
			await this.sendMessage(`I'm not trained to hand the 'OR' operator yet. Sorry :<.`);
		}
	}
}
