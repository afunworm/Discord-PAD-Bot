require('dotenv').config({ path: '../.env' });
import { Monster } from './monster.class';
import { Common } from './common.class';
const _ = require('lodash');
const Discord = require('discord.js');

export class Helper {
	private _channel;
	private _message;
	private _threads = {};

	constructor(message) {
		this._message = message;
		this._channel = message.channel;
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

	public sendMessage(message: string) {
		this._channel.send(message);
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
		let response = Common.dynamicResponse('ON_NAME_REQUEST', {
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
		let response = Common.dynamicResponse('ON_RARITY_REQUEST', {
			id: card.getId().toString(),
			name: card.getName(),
			rarity: card.getRarity().toString(),
		});
		this._channel.send(response);
	}

	public sendMonsterIsInheritable(card: Monster) {
		let response = Common.dynamicResponse('ON_ISINHERITABLE_REQUEST', {
			id: card.getId().toString(),
			name: card.getName(),
			isInheritable: card.isInheritable() ? 'is inheritable' : 'is not inhreitable',
		});
		this._channel.send(response);
	}

	public sendMonsterActiveSkills(card: Monster) {
		if (!card.hasActiveSkill()) {
			let response = Common.dynamicResponse('ON_NO_ACTIVESKILL_FOUND', {
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
			let response = Common.dynamicResponse('ON_NO_LEADERSKILL_FOUND', {
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
		let response = Common.dynamicResponse('ON_MONSTERPOINTS_REQUEST', {
			id: card.getId().toString(),
			name: card.getName(),
			monsterPoints: this.numberWithCommas(card.getMonsterPoints()),
		});
		this._channel.send(response);
	}

	public sendMonsterId(card: Monster) {
		let response = Common.dynamicResponse('ON_ID_REQUEST', {
			id: card.getId().toString(),
			name: card.getName(),
		});
		this._channel.send(response);
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

			return this._channel.send(message);
		} else {
			message = Common.dynamicResponse('ON_EVOLIST_REQUEST', {
				id: card.getId().toString(),
				name: card.getName(),
				numberOfEvos: numberOfEvos.toString(),
			});

			this._channel.send(message);
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

			result.push(`${attributes}| ${monster.getName()} (#${monsterId})`);
		}

		let embed = new Discord.MessageEmbed().addFields({
			name: `All Evolutions of ${card.getName()}`,
			value: result.join('\n'),
		});

		return this._channel.send(embed);
	}
}
