/*  MONSTER RAW DATA PARSING - REFERENCE CHART
    0: Id
    1: Name
    2: Attribute
    3: Sub-attribute
    4: Is the monster's evo reversible? (1 or 0)
    5: Monster type #1
    6: Monster type #2
    8: Cost
    9: Unknown value - Always 5
    10: Max level before limit break
    11: Feed EXP at level 4 (divided by 4 to get level 1)
    12: Unknown value - Always 100
    13: Sell price per level
    14: Min HP
    15: Max HP
    16: HP Growth Exponent - Needs verify
    17: Min ATK
    18: Max ATK
    19: ATK Growth Exponent - Needs verify
    20: Min RCV
    21: Max RCV
    22: RCV Growth Exponent - Needs verify
    23: Exp Curve - The experience needed to get to level 99 from level 1
    24: EXP Growth Exponent - Needs verify
    25: Active Skill Id
        Skill data: [name, description, something we don't know, cool down at max level, cool down at level 1, '', something, something]
    26: Leader Skill Id, integer > 0
        Skill data [name, description, probably roupID ...]
    27: Emeny turn timer in a dungeon
    28: Enemy HP in a dungeon at level 1
    29: Enemy HP in a dungeon at level cap (10)
    30: 1 - Probably HP curve
    31: Enemy ATK in a dungeon at level 1
    32: Enemy ATK in a dungeon at level cap (10)
    33: 1 - Probably ATK curve
    34: Enemy DEF in a dungeon at level 1
    35: Enemy DEF in a dungeon at level cap (10)
    36: 1 - Probably DEF curve
    37: Unknown value
    38: Enemy coin dropped at level 2
    39: Enemy experience dropped at level 2
    40: Evo From Id (what did the current monster evo from?) - Monster ID. If card does not evo from anything, gives 0.
    41-45: Evo materials 1-5. If the card does not evo from anything, gives 0.
    46-50: Devo materials. Always 155-159 rbgld lits.
    51: Unknown value
    52: Unknown value
    53: Unknown value
    54: Unknown value
    55: Unknown value
    56: Unknown value
    57: Number of enemy passive + active skill in the dungeon (let's say this is x)

    Since for every moveset, the data uses 3 slots, so for the next 3 * x slots, it's all about the enemy's movesets
    
    The next value is the number of the awakenings of the monsters (let's say this is a)

    Every awakening takes 1 slot, so the next a slots are used for awakenings

    The next value is a string, comma separated values of all the super awakenings
    
    The next value is the base form of the monster itself
    The next value is UNKNOWN but probably groupingKey
    The next value is the third type of the monster, -1 if none
    The next value is the monster points
    There are 4 unknown values
    The next value is the percent gain for the stats of the monsters after limit breaking (for example, 25 means 25%)
    There are 2 unknown values
    The next one is the ID of the monster that the current monster transforms into
*/
