export const RESPONSE_PHRASES = {
	WORKING: [
		`Alright. Let me work on it.`,
		`Ok. Gimme a second.`,
		`Let me look in the database.`,
		`Hold on a second. I'll get you the result soon.`,
		`Working on it!`,
		`Let me see. Hold up.`,
		`Let me check the database really quick.`,
		`This will take a sec.`,
		`Gimme a sec`,
		`I'll get back to you in a moment`,
	],
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
	ON_ID_REQUEST: [
		`The ID for **{{name}}** is #{{id}}.`,
		`**{{name}}**'s ID is #{{id}}.`,
		`**{{name}}** is #{{id}} in my monster book.`,
		`The database says **{{name}}** is #{{id}}`,
		`I believe **{{name}}**'s ID is #{{id}}`,
	],
	ON_EVOLIST_REQUEST: [
		`I found {{numberOfEvos}} forms for **{{name}}** (#{{id}})! Click on 📃 to view full details.`,
		`Here are all {{numberOfEvos}} forms of **{{name}}** (#{{id}})! Click on 📃 to view full details.`,
		,
		`These are what I found for **{{name}}** (#{{id}})! Click on 📃 to view full details.`,
	],
	ON_EVOLIST_REQUEST_SINGLE_EVO: [
		`**{{name}}** (#{{id}}) only has 1 form!`,
		`There are no other evolutions for **{{name}}** (#{{id}})!`,
		,
		`I cannot find any more evolutions for **{{name}}** (#{{id}})!`,
	],
	ON_SERIES_REQUEST_FOUND: [
		`**{{name}}** (#{{id}}) is from the {{series}} series.`,
		`You can find **{{name}}** (#{{id}}) from the series {{series}}.`,
		`I am pretty sure **{{name}}** (#{{id}}) is from the {{series}} series.`,
		`The {{series}} series is where you can find **{{name}}** (#{{id}}).`,
	],
	ON_SERIES_REQUEST_NOT_FOUND: [
		`I can't find any series that **{{name}}** (#{{id}}) belongs to.`,
		`**{{name}}** (#{{id}}) doesn't seem to be in any series.`,
		`I can't find any series for **{{name}}** (#{{id}}).`,
	],
	ON_ATTACK_REQUEST_LB: [
		`The attack of **{{name}}** (#{{id}}) is {{maxAttack}} ({{maxAttackWithPluses}} with pluses) at max level. When limit broken, its attack becomes {{LBAttack}} ({{LBAttackWithPluses}} with pluses).`,
		`The attack of **{{name}}** (#{{id}}) is {{maxAttack}} ({{maxAttackWithPluses}} with pluses) at level 99. When 110'd, its attack becomes {{LBAttack}} ({{LBAttackWithPluses}} with pluses).`,
	],
	ON_ATTACK_REQUEST_NO_LB: [
		`The attack of **{{name}}** (#{{id}}) is {{maxAttack}} ({{maxAttackWithPluses}} with pluses) at max level.`,
	],
	ON_HP_REQUEST_LB: [
		`The HP of **{{name}}** (#{{id}}) is {{maxHP}} ({{maxHPWithPluses}} with pluses) at max level. When limit broken, its attack becomes {{LBHP}} ({{LBHPWithPluses}} with pluses).`,
		`The HP of **{{name}}** (#{{id}}) is {{maxHP}} ({{maxHPWithPluses}} with pluses) at level 99. When 110'd, its attack becomes {{LBHP}} ({{LBHPWithPluses}} with pluses).`,
	],
	ON_HP_REQUEST_NO_LB: [
		`The HP of **{{name}}** (#{{id}}) is {{maxHP}} ({{maxHPWithPluses}} with pluses) at max level.`,
	],
	ON_RECOVER_REQUEST_LB: [
		`The RCV of **{{name}}** (#{{id}}) is {{maxRCV}} ({{maxRCVWithPluses}} with pluses) at max level. When limit broken, its recover becomes {{LBRCV}} ({{LBRCVWithPluses}} with pluses).`,
		`The RCV of **{{name}}** (#{{id}}) is {{maxRCV}} ({{maxRCVWithPluses}} with pluses) at level 99. When 110'd, its recover becomes {{LBRCV}} ({{LBRCVWithPluses}} with pluses).`,
	],
	ON_RECOVER_REQUEST_NO_LB: [
		`The RCV of **{{name}}** (#{{id}}) is {{maxRCV}} ({{maxRCVWithPluses}} with pluses) at max level.`,
	],
};
