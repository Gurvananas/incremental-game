/**
 * English texts: the reference language. Every key used in the UI lives here.
 * Placeholders use {name} and must match across languages (checked by tests).
 */
export const en = {
  'game.title': 'Sylve',

  'era.label': 'Era {numeral} · {name}',
  'era.1': 'Fallow ground',
  'era.2': 'Wildflower meadow',
  'era.3': 'Heathland',
  'era.4': 'Pioneer woodland',
  'era.5': 'Mature forest',
  'era.6': 'Old-growth forest',

  'season.spring': 'Spring',
  'season.summer': 'Summer',
  'season.autumn': 'Autumn',
  'season.winter': 'Winter',
  'calendar.date': '{season}, day {day}, year {year}',

  'resource.water': 'Water',
  'resource.sap': 'Sap',
  'resource.humus': 'Humus',
  'resource.spores': 'Spores',

  'panel.resources': 'Resources',
  'panel.journal': 'Journal',
  'tab.forest': 'Forest',
  'tab.mycelium': 'Mycelium',

  'action.murmur': 'Murmur',
  'action.murmur.effect': '+{amount} {resource}',
  'action.murmur.desc': 'Whisper to the bare ground. Something stirs.',

  'plant.grass.name': 'Wild grass',
  'plant.grass.desc': 'Grows anywhere, drinks a little, and turns light into Sap.',
  'plant.moss.name': 'Moss',
  'plant.moss.desc': 'Holds water like a sponge and gathers the morning dew.',
  'plant.lichen.name': 'Lichen',
  'plant.lichen.desc':
    'A fungus and an alga living as one. It slowly turns stone into soil, and sheds spores.',
  'plant.clover.name': 'Clover',
  'plant.clover.desc':
    'Its roots host bacteria that fix nitrogen from the air: every plant grows better.',
  'plant.owned': '{count}',
  'plant.growing': '+{count} growing',

  'discovery.symbiosis.name': 'Symbiosis',
  'discovery.symbiosis.desc': 'Living things do better together.',
  'discovery.rooting.name': 'Deep roots',
  'discovery.rooting.desc': 'Roots that reach further hold more.',
  'discovery.flowering.name': 'Flowering',
  'discovery.flowering.desc': 'The first flowers, and the first seeds.',
  'mycelium.intro': 'Under the lichen, fungal threads link the soil. Spores pay for discoveries.',
  'mycelium.done': 'Discovered',
  'mycelium.nothing': 'Nothing more to discover for now.',

  'cost.wait': 'in {duration}',
  'cost.overCap': 'needs more {resource} storage',

  'effect.produces': '+{amount} {resource}/s',
  'effect.drinks': 'drinks {amount} {resource}/s',
  'effect.storage': '+{amount} {resource} storage',
  'effect.sapBonus': '+{percent}% Sap from every plant',
  'effect.growth': 'adult in {days} days',
  'effect.storageMultiplier': '{resource} storage ×{factor}',
  'effect.unlocks': 'unlocks {name}',
  'effect.era': 'opens Era {numeral}',

  'breakdown.rain': 'Rain',
  'breakdown.plant': '{name} ×{count}',
  'breakdown.season': 'Season: ×{factor}',
  'breakdown.sapBonus': 'Nitrogen: ×{factor}',
  'breakdown.waterShortage': 'Water shortage: plants at {percent}%',

  'journal.newGame': 'Rain falls on bare ground. Something is waiting.',
  'journal.welcomeBack': 'While you were away, {duration} passed in the forest.',
  'journal.loadError': 'The save could not be read. It was kept aside, and a new forest begins.',
  'journal.tooNew': 'This save comes from a newer version of the game. A new forest begins.',
  'journal.imported': 'Save imported.',
  'journal.importFailed': 'This save code could not be read.',
  'journal.season.spring': 'Spring returns. Everything starts again.',
  'journal.season.summer': 'Summer. The rain grows scarce.',
  'journal.season.autumn': 'Autumn. The rain comes back.',
  'journal.season.winter': 'Winter falls. The forest holds its breath.',
  'journal.first.grass': 'The first blades of grass push through the bare ground.',
  'journal.first.moss': 'A light rain. The moss drinks.',
  'journal.first.lichen': 'Lichen spreads over the stones.',
  'journal.first.clover': 'Clover takes root and feeds the soil.',
  'journal.mycelium': 'Threads of fungus spread under the lichen. A network is waking up.',
  'journal.discovery': 'Discovered: {name}.',
  'journal.drought': 'The ground is dry. Thirsty plants slow down.',
  'journal.era.2':
    'The first flowers open: Era II, the wildflower meadow, begins. The meadow itself comes in the next version.',

  'debug.title': 'Debug',
  'debug.speed': 'Speed',
  'debug.skipSeason': 'Skip a season',
  'debug.fill': 'Fill resources',
  'debug.export': 'Export save',
  'debug.import': 'Import save',
  'debug.importPrompt': 'Paste a save code:',
  'debug.exportPrompt': 'Copy this save code:',
  'debug.reset': 'Reset',
  'debug.resetConfirm': 'Erase this forest and start over?',
} as const;

export type MessageKey = keyof typeof en;
