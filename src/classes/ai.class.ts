const dialogflow = require('dialogflow');
const AIEnv = require('../' + process.env.AI_SERVICE_ACCOUNT);

export interface QueryResultInterface {
	queryResult: {
		action: 'card.info' | 'card.query';
		queryText: string;
		parameters: {
			fields: {
				infoType: {
					stringValue:
						| 'photo'
						| 'icon'
						| 'name'
						| 'awakenings'
						| 'superAwakenings'
						| 'types'
						| 'attack'
						| 'hp'
						| 'recover'
						| 'stats'
						| 'rarity'
						| 'assist'
						| 'activeSkills'
						| 'leaderSkills'
						| 'monsterPoints'
						| 'evoMaterials'
						| 'evoList'
						| 'id'
						| 'info'
						| 'series'
						| 'devoMaterials';
					kind: 'stringValue';
				};
				questionType: {
					stringValue:
						| 'what'
						| 'how'
						| 'when'
						| 'who'
						| 'can'
						| 'do'
						| 'does'
						| 'is'
						| 'are'
						| 'should'
						| 'must';
					kind: 'stringValue';
				};
				actionType: {
					stringValue: 'call' | 'name' | 'sell' | 'list' | 'evolve' | 'devolve';
					kind: 'stringValue';
				};
				targetActionType: {
					stringValue: 'look' | 'take' | 'sell';
					kind: 'stringValue';
				};
				monsterAttribute1: {
					stringValue: string;
					kind: 'stringValue';
				};
				monsterAttribute2: {
					stringValue: string;
					kind: 'stringValue';
				};
				monsterName: {
					stringValue: string;
					kind: 'stringValue';
				};
				monsterSeries: {
					stringValue: string;
					kind: 'stringValue';
				};

				targetPronoun: {
					stringValue: 'self';
					kind: 'stringValue';
				};
				queryFilterType: {
					stringValue: 'and' | 'or';
					kind: 'stringValue';
				};
				number: {
					numberValue: number;
					kind: 'numberValue';
				};
				queryCompare1: {
					stringValue: 'min' | 'max' | 'exact' | 'less' | 'more';
					kind: 'stringValue';
				};
				queryCompare2: {
					stringValue: 'min' | 'max' | 'exact' | 'less' | 'more';
					kind: 'stringValue';
				};
				queryCompare3: {
					stringValue: 'min' | 'max' | 'exact' | 'less' | 'more';
					kind: 'stringValue';
				};
				monsterAwakenings1: {
					stringValue: string;
					kind: 'stringValue';
				};
				monsterAwakenings2: {
					stringValue: string;
					kind: 'stringValue';
				};
				monsterAwakenings3: {
					stringValue: string;
					kind: 'stringValue';
				};
				queryQuantity1: {
					stringValue: string;
					kind: 'stringValue';
				};
				queryQuantity2: {
					stringValue: string;
					kind: 'stringValue';
				};
				queryQuantity3: {
					stringValue: string;
					kind: 'stringValue';
				};
				queryEvoType: {
					stringValue:
						| 'equip'
						| 'superReincarnated'
						| 'superUltimate'
						| 'reincarnated'
						| 'pixel'
						| 'awoken'
						| 'ultimate'
						| 'base'
						| 'normal';
					kind: 'stringValue';
				};
				monsterTypes: {
					stringValue: '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '12' | '14' | '15';
					kind: 'stringValue';
				};
				targetObject: {
					stringValue: 'card';
					kind: 'stringValue';
				};
				queryIncludeSA: {
					stringValue: 'includeSA' | 'excludeSA';
					kind: 'stringValue';
				};
				queryIncludeLB: {
					stringValue: 'includeLB' | 'excludeLB';
					kind: 'stringValue';
				};
				queryMinMax: {
					stringValue: 'min' | 'max';
					kind: 'stringValue';
				};
				queryAdditionalTypes: {
					stringValue: 'random';
					kind: 'stringValue';
				};
				queryMonsterStats: {
					stringValue: 'hp' | 'attack' | 'recover';
					kind: 'stringValue';
				};
				eggMachines: {
					stringValue: 'event' | 'collab' | 'rare';
					kind: 'stringValue';
				};
				url: {
					stringValue: string;
					kind: 'stringValue';
				};
				trollNames: {
					stringValue: string;
					kind: 'stringValue';
				};
			};
		};
	};
}

export class AI {
	private _sessionClient: any;
	private _sessionId: string;
	private _languageCode: string = 'en-US';
	private _projectId: string = 'mirubot-j9we';

	constructor(sessionId: string, languageCode: string = 'en-US') {
		let privateKey = AIEnv.private_key;
		let clientEmail = AIEnv.client_email;
		let config = {
			credentials: {
				private_key: privateKey,
				client_email: clientEmail,
			},
		};
		this._sessionId = sessionId;
		this._languageCode = languageCode;
		this._sessionClient = new dialogflow.SessionsClient(config);
	}

	public detectIntent(text: string): Promise<any> {
		//The path to identify the agent that owns the created intent
		const sessionPath = this._sessionClient.sessionPath(this._projectId, this._sessionId);

		//The text query request
		const request = {
			session: sessionPath,
			queryInput: {
				text: {
					text: text, //The query to send to the dialogflow agent
					languageCode: this._languageCode, //The language used by the client (en-US)
				},
			},
		};

		return new Promise(async (resolve, reject) => {
			try {
				const responses = await this._sessionClient.detectIntent(request);
				resolve(responses[0] as QueryResultInterface);
			} catch (error) {
				reject(error);
			}
		});
	}
}
