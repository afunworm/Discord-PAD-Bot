const dialogflow = require('dialogflow');
const AIEnv = require('../' + process.env.AI_SERVICE_ACCOUNT);

export interface QueryResultInterface {
	queryResult: {
		action: string;
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
					stringValue: 'call' | 'name' | 'sell' | 'list';
					kind: 'stringValue';
				};
				targetActionType: {
					stringValue: 'look' | 'take' | 'sell';
					kind: 'stringValue';
				};
				monsterAttribute1: {
					stringValue: 'fire' | 'water' | 'wood' | 'light' | 'dark' | 'none';
					kind: 'stringValue';
				};
				monsterAttribute2: {
					stringValue: 'fire' | 'water' | 'wood' | 'light' | 'dark' | 'none';
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
				queryQuantity: {
					listValue: {
						values: {
							stringValue: 'min' | 'max' | 'exact' | 'less' | 'more';
							kind: 'stringValue';
						}[];
					};
					kind: 'listValue';
				};
				queryFilterType: {
					stringValue: 'and' | 'or';
					kind: 'stringValue';
				};
				number: {
					listValue: {
						values: {
							numberValue: number;
							kind: 'numberValue';
						}[];
					};
					kind: 'listValue';
				};
				monsterAwakenings: {
					listValue: {
						values: {
							numberValue: number;
							kind: 'numberValue';
						}[];
					};
					kind: 'listValue';
				};
				targetObject: {
					stringValue: 'card';
					kind: 'stringValue';
				};
				queryIncludeSA: {
					stringValue: 'includeSA' | 'excludeSA';
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
