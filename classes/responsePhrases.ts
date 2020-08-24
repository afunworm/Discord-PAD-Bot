export const RESPONSE_PHRASES = {
	ON_NAME_REQUEST: [
		`{{id}} is called **{{name}}**.`,
		`You can call {{id}} **{{name}}**.`,
		`I believe {{id}} is called **{{name}}**.`,
		`{{id}} is **{{name}}**.`,
	],
	ON_TYPE_REQUEST_1: [`**{{name}}** (#{{id}}) is a {{type1}} monster.`],
	ON_TYPE_REQUEST_2: [`**{{name}}** (#{{id}}) is a {{type1}} and {{type2}} monster.`],
	ON_TYPE_REQUEST_3: [`**{{name}}** (#{{id}}) is a {{type1}}, {{type2}} and {{type3}} monster.`],
	ON_RARITY_REQUEST: [
		`**{{name}}** (#{{id}}) is a {{rarity}}-star monster.`,
		`**{{name}}** (#{{id}}) has {{rarity}} stars!`,
		`I counted {{rarity}} stars for **{{name}}** (#{{id}}).`,
	],
	ON_ISINHERITABLE_REQUEST: [
		`**{{name}}** (#{{id}}) is {{isInheritable}}.`,
		`I believe **{{name}}** (#{{id}}) is {{isInheritable}}.`,
		`**{{name}}** (#{{id}}) is definitely {{isInheritable}}.`,
	],
	ON_NO_ACTIVESKILL_FOUND: [
		`**{{name}}** (#{{id}}) does not have any active skills.`,
		`**{{name}}** (#{{id}}) doesn't seem to have any active skills.`,
		`There is no active skill for **{{name}}** (#{{id}}).`,
	],
	ON_NO_LEADERSKILL_FOUND: [
		`**{{name}}** (#{{id}}) does not have any leader skills.`,
		`**{{name}}** (#{{id}}) doesn't seem to have any leader skills.`,
		`There is no leader skill for **{{name}}** (#{{id}}).`,
	],
	ON_MONSTERPOINTS_REQUEST: [
		`**{{name}}** (#{{id}}) can be sold for {{monsterPoints}} MP.`,
		`You can sell **{{name}}** (#{{id}}) for {{monsterPoints}} MP!`,
		`I sold **{{name}}** (#{{id}}) before, got {{monsterPoints}} MP!`,
		`**{{name}}** (#{{id}}) will give you {{monsterPoints}} MP if you decide to sell it.`,
		`I'm pretty sure you can sell **{{name}}** (#{{id}}) for {{monsterPoints}} MP.`,
	],
};
