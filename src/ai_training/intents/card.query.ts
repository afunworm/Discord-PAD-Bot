export const CARD_QUERY_TRAINING_PHRASES = [
	`{{monsterName:shelling_ford}} {{queryEvoType:equip:assist:weapon}}`,
	`{{monsterAttribute1:red}} {{monsterName:shelling_ford}} {{queryEvoType:equip:assist:weapon}}`,
	`{{monsterAttribute1:green}} {{monsterName:shelling_ford}} {{queryEvoType:equip:assist:weapon}}`,
	`{{monsterAttribute1:light}} {{monsterName:shelling_ford}} {{queryEvoType:equip:assist:weapon}}`,
	`{{monsterName:shelling_ford}} {{queryEvoType:equip:assist:weapon}}`,
	`{{ATTRIBUTES}} {{MONSTER}} {{queryEvoType}}`,
	`{{ATTRIBUTES}} {{queryEvoType}} of {{MONSTER}}`,
	`{{ATTRIBUTES}} {{queryEvoType}} for {{MONSTER}}`,
	// `{{ATTRIBUTES}} {{MONSTER}} {{queryEvoType}}`, //Multiple trainings of the same phrase to make it learn better
	// `{{ATTRIBUTES}} {{queryEvoType}} of {{MONSTER}}`, //Multiple trainings of the same phrase to make it learn better
	// `{{ATTRIBUTES}} {{queryEvoType}} for {{MONSTER}}`, //Multiple trainings of the same phrase to make it learn better
	// `{{ATTRIBUTES}} {{MONSTER}} {{queryEvoType}}`, //Multiple trainings of the same phrase to make it learn better
	// `{{ATTRIBUTES}} {{queryEvoType}} of {{MONSTER}}`, //Multiple trainings of the same phrase to make it learn better
	// `{{ATTRIBUTES}} {{queryEvoType}} for {{MONSTER}}`, //Multiple trainings of the same phrase to make it learn better
	`{{ATTRIBUTES}} {{targetObject}} from {{monsterSeries}}`,
	`{{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} from {{monsterSeries}}`,
	`{{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} from {{monsterSeries}} series`,
	`{{monsterSeries}} series`,
	`{{monsterSeries}} collab`,
	`{{targetObject}} from {{monsterSeries}} collab`,
	`{{targetObject}} from {{monsterSeries}} series`,
	`show me all {{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} with {{FILTERS}} from {{monsterSeries}} collab`,
	`list all {{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} with {{FILTERS}} from {{monsterSeries}} series`,
	`I want a list of all {{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} with {{FILTERS}} from {{monsterSeries}} collab`,
	`What are the {{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} that have {{FILTERS}} from bleach series`,
	`Find me all {{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} with {{FILTERS}} from {{monsterSeries}} collab`,
	`Show me a list of {{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} that have {{FILTERS}} from {{monsterSeries}} series`,
	`Search for all {{ATTRIBUTES}} {{queryEvoType}} with {{FILTERS}} from {{monsterSeries}} collab`,
	`Help me find all {{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} with {{FILTERS}} from {{monsterSeries}} collab`,
	`Search {{monsterSeries}} series for all {{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} that have {{FILTERS}}`,
];
