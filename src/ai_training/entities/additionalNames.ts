/*
    Use https://docs.google.com/spreadsheets/d/1EyzMjvf8ZCQ4K-gJYnNkiZlCEsT9YYI9dUd-T5qCirc/pubhtml# as reference.

    data = data.split('\n');
    let result = {};
    data.forEach(entry => {
        let parts = entry.split(',');
            if (result[parts[1].trim()]) {
                result[parts[1].trim()].push(parts[0].trim());
            } else {
                result[parts[1].trim()] = [parts[0].trim()];
            }
    });
    console.log(JSON.stringify(result));
*/
export const ADDITIONAL_NAMES = {
	'138': ['ammy'],
	'498': ['OTG'],
	'799': ['ame'],
	'859': ['baggi'],
	'1196': ['rathalos cat'],
	'1197': ['rathian cat'],
	'1201': ['u13', 'u-13'],
	'1228': ['Grodin Tama'],
	'1230': ['Rodin tama'],
	'1237': ['dqxq'],
	'1242': ['ggy'],
	'1244': ['rgy'],
	'1324': ['EKMD'],
	'1373': ['GZL'],
	'1413': ['rrh'],
	'1463': ['Soupdet'],
	'1473': ['pirate zaerog'],
	'1612': ['tigrex cat'],
	'1645': ['ronia'],
	'1712': ['samurai zaerog'],
	'1727': ['lvalk'],
	'1728': ['rvalk'],
	'1729': ['bvalk'],
	'1730': ['gvalk'],
	'1731': ['dvalk'],
	'1744': ['dq'],
	'1745': ['xq'],
	'1847': ['z8'],
	'1923': ['zera', 'z&h'],
	'2006': ['goe'],
	'2013': ['One True God'],
	'2038': ['zidane'],
	'2105': ['udon'],
	'2129': ['tengu'],
	'2179': ['rodin'],
	'2234': ['dxm'],
	'2279': ['U&Y'],
	'2287': ['Pirate Sonia', 'psonia', 'paradise sonia', 'pgronia'],
	'2296': ['charite'],
	'2324': ['aama'],
	'2325': ['awoken yomi'],
	'2326': ['silver Shinji'],
	'2393': ['I&I'],
	'2407': ['hkali'],
	'2411': ['halraune'],
	'2412': ['hthoth'],
	'2502': ['aa lucifer'],
	'2507': ['ad lucifer', 'fa lucifer', 'ALuci'],
	'2512': ['xonia'],
	'2513': ['Chaku'],
	'2528': ['moose'],
	'2534': ['nykanna'],
	'2540': ['nytengu'],
	'2566': ['blonia'],
	'2567': ['gronia'],
	'2610': ['bitou'],
	'2639': ['jorm'],
	'2662': ['Panda'],
	'2685': ['chad', 'sado'],
	'2716': ['HephDra'],
	'2717': ['Noahdra'],
	'2718': ['Gaiadra'],
	'2719': ['ZDra'],
	'2720': ['heradra'],
	'2737': ['sgr'],
	'2741': ['adkz'],
	'2754': ['7zard'],
	'2756': ['xm'],
	'2758': ['squid', 'Sakamoto', 'You Yu'],
	'2760': ['chrys', 'Xiu Min'],
	'2762': ['plum'],
	'2810': ['Megane'],
	'2891': ['exodia'],
	'2898': ['Jormungand Yr', 'snek'],
	'2900': ['viz'],
	'2901': ['ACC'],
	'2902': ['asq'],
	'2903': ['alb'],
	'2904': ['adqxq'],
	'2924': ['oda', 'nobunaga'],
	'2928': ['zeus ace'],
	'2929': ['Ace Bastet', 'bacetet', 'ace bastet', 'bastet ace', 'ace.bastet'],
	'2940': ['whaledor'],
	'2943': ['sherias roots'],
	'2948': ['dios'],
	'2969': ['mirupa', 'miru', 'rick', 'rick loli', 'rl', 'lmiru', 'lmyr'],
	'2982': ['AU&Y', 'auy', 'a u&y'],
	'2993': ['citrus'],
	'2995': ['renive'],
	'3019': ['kenshin'],
	'3021': ['Kaoru'],
	'3025': ['Sanosuke'],
	'3088': ['Ana Valk', 'anavalk', 'valkyrie ana', 'ana valkyrie', 'valkana', 'valk ana'],
	'3089': ['anaceres', 'ana ceres', 'ceres ana'],
	'3090': ['anaphon', 'waiphon'],
	'3112': ['summyr'],
	'3118': ['bgoemon'],
	'3125': ['Kinnikuman'],
	'3162': ['r tamazo'],
	'3192': ['lheradra'],
	'3194': ['red miru', 'fire miru', 'rmiru'],
	'3198': ['thicc'],
	'3222': ['hxm'],
	'3227': ['hparv'],
	'3246': ['cb kali'],
	'3247': ['cb sakuya'],
	'3260': ['d tsubaki', 'dd tsubaki'],
	'3262': ['shivadra', 'Shivagon'],
	'3263': ['nepdra', 'nep dra', 'Nepgon'],
	'3264': ['odindra', 'odin dra'],
	'3265': ['radra'],
	'3266': ['yomidra', 'yomi dra', 'Yomigon', 'Ydra'],
	'3274': ['ilumina'],
	'3276': ['base meri'],
	'3353': ['awoken ichigo', 'a ichigo'],
	'3357': ['yamamoto'],
	'3359': ['aizen'],
	'3361': ['ulquiorra'],
	'3363': ['grimmjow'],
	'3365': ['ichimaru'],
	'3375': ['xlb'],
	'3378': ['castor pollux'],
	'3379': ['gremerry'],
	'3385': ['rotg'],
	'3388': ['ama'],
	'3389': ['ryomi', 'reyomi'],
	'3390': ['grodin'],
	'3391': ['blodin'],
	'3392': ['rowdin'],
	'3393': ['rei myr', 'rei miru', 'myrrei', 'myrei'],
	'3395': ['misato leilan'],
	'3396': ['asuka yamato'],
	'3397': ['shinji scheat'],
	'3398': ['mari ceres'],
	'3414': ['fuujin'],
	'3424': ['ginga'],
	'3425': ['kaede another'],
	'3434': ['hattori heiji', 'heiji'],
	'3436': ['ranma', 'male ranma'],
	'3437': ['b/r ranma', 'female ranma'],
	'3439': ['akane', 'tendo akane'],
	'3441': ['goro', 'shigeno'],
	'3443': ['toshiya sato'],
	'3498': ['rsq'],
	'3499': ['rlb', 'ralb'],
	'3500': ['dqxq'],
	'3509': ['tomato'],
	'3512': ['awoken wukong'],
	'3513': ['floof', 'floof'],
	'3515': ['meri'],
	'3527': ['juri'],
	'3539': ['nerva'],
	'3548': ['claimh solais'],
	'3549': ['arondight'],
	'3550': ['caladbolg'],
	'3551': ['kansho bakuya', 'kanshou & bakuya'],
	'3552': ['mistletain'],
	'3553': ['Awoken Kenshin', 'aKenshin'],
	'3556': ['hiko seijuro'],
	'3558': ['kashiwazaki nenji'],
	'3560': ['komagata yumi'],
	'3562': ["udo jin'e"],
	'3576': ['wallace'],
	'3577': ['amnel'],
	'3578': ['ena'],
	'3598': ['exodia necross'],
	'3600': ['enoch'],
	'3629': ['acnologia'],
	'3644': ['Cthugha'],
	'3646': ['Yog-Sothoth', 'yog', 'yogurt'],
	'3652': ['rathalos'],
	'3653': ['rathian'],
	'3655': ['tigrex'],
	'3656': ['narga'],
	'3658': ['glavenus', 'glav', 'dinovaldo'],
	'3659': ['gammoth', 'gamuto'],
	'3660': ['Astalos', 'raizex'],
	'3661': ['mizutsune', 'tamamitsune'],
	'3663': ['diablos'],
	'3705': ['rathalos x hunter', 'rathalos hunter', 'red male hunter'],
	'3706': ['tamamitsune hunter', 'tamamitsune x hunter', 'blue male hunter', 'bh', 'bhunter', 'bhunter'],
	'3707': ['massacre x hunter', 'diablos x hunter', 'diablos hunter', 'massacre hunter', 'green male hunter'],
	'3709': ['kirin x hunter', 'kirin hunter', 'light female hunter'],
	'3710': ['narga x hunter', 'narga hunter', 'dark female hunter'],
	'3711': ['Dino X Hunter', 'dino hunter', 'red female hunter', 'glavenus hunter', 'glavenus x hunter'],
	'3733': ['base mgoe'],
	'3734': ['machine goemon', 'mgoemon'],
	'3765': ['ronia'],
	'3766': ['gronia'],
	'3767': ['blonia'],
	'3788': ['ragdra'],
	'3790': ['wedding scheat', 'l scheat'],
	'3829': ['camael', 'caramel'],
	'3834': ['rath'],
	'3846': ['blujin', 'beach fujin'],
	'3847': ['beach tachibana'],
	'3848': ['beach artemis'],
	'3910': ['lsonia'],
	'3930': ['ideal'],
	'3935': ['weld'],
	'3937': ['Chazel'],
	'3941': ['Niece'],
	'3943': ['no6', 'no6'],
	'3949': ['rii', 'rii'],
	'3974': ['sadpy'],
	'3993': ['h gran'],
	'3994': ['h verd'],
	'3996': ['hruel'],
	'4009': ['yy'],
	'4011': ['xh'],
	'4014': ['sad tama', 'sadtama'],
	'4127': ['bestpadcard'],
	'4128': ['ny kami', 'New Year Kamimusubi', 'ny kami'],
	'4129': ['ny ame'],
	'4130': ['ny khepri'],
	'4299': ['cb horus'],
	'4300': ['cb gran reverse'],
	'4375': ['p3 protagonist'],
	'4379': ['Joker'],
	'4385': ['teddy'],
	'4430': ['mega blodin'],
	'4431': ['mega rodin'],
	'4763': [
		'swng',
		"swng's favorite",
		"swng's favorite monster",
		"steven's favorite card",
		'steven',
		"steven's favorite",
		"steven's favorite monster",
		"swng's favorite card",
	],
	'5740': [
		'afunworm',
		"afunworm's favorite",
		"afunworm's favorite monster",
		"afunworm's favorite card",
		'worm',
		"worm's favorite",
		"worm's favorite monster",
		"worm's favorite card",
		"tim's favorite",
		"tim's favorite monster",
		"tim's favorite card",
		'tim',
		'best anubis',
		'the best anubis',
	],
	'2118': [
		'xolse',
		"xolse's favorite",
		"xolse's favorite card",
		"xolse's favorite monster",
		'megumi',
		"megumi's favorite",
		"megumi's favorite card",
		"megumi's favorite monster",
		'megumin',
		"megumin's favorite",
		"megumin's favorite card",
		"megumin's favorite monster",
		'the best xolse',
		'best xolse',
		'best yukari',
		'the best yukari',
	],
	'3271': [
		'kiro',
		'kiro shaki',
		'kiroshaki',
		'the best kiro',
		'best kiro',
		'the best kiro shaki',
		'best kiro shaki',
		'the best kiroshaki',
		'the best kiroshaki',
		'best hino',
		'the best hino',
		'best kagutsuchi',
		'the best kagutsuchi',
		"kiro's favorite",
		"kiro's favorite card",
		"kiro's favorite monster",
		"kiro shaki's favorite",
		"kiro shaki's favorite card",
		"kiro shaki's favorite monster",
		"kiroshaki's favorite",
		"kiroshaki's favorite card",
		"kiroshaki's favorite monster",
	],
	'4761': [
		'datdude',
		'dat dude',
		'dat dumb dude',
		'datdumbdude',
		'ddao',
		'ddd',
		"datdude's favorite",
		"datdude's favorite card",
		"datdude's favorite monster",
		"dat dude's favorite",
		"dat dude's favorite card",
		"dat dude's favorite monster",
		"dat dumb dude's favorite",
		"dat dumb dude's favorite card",
		"dat dumb dude's favorite monster",
		"datdumbdude's favorite",
		"datdumbdude's favorite card",
		"datdumbdude's favorite monster",
		"ddao's favorite",
		"ddao's favorite card",
		"ddao's favorite monster",
		"ddd's favorite",
		"ddd's favorite card",
		"ddd's favorite monster",
	],
	'3235': ['drew', 'best ilm', 'the best ilm', "drew's favorite", "drew's favorite card", "drew's favorite monster"],
	'3825': [
		'best nocits',
		'the best noctis',
		'jcapp',
		'justin',
		"jcapp's favorite",
		"jcapp's favorite card",
		"jcapp's favorite monster",
		"justin's favorite",
		"justin's favorite card",
		"justin's favorite monster",
	],
};
