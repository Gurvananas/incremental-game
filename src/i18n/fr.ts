import type { MessageKey } from './en';

/** French texts. A missing key falls back to English. */
export const fr: Partial<Record<MessageKey, string>> = {
  'game.title': 'Sylve',

  'era.label': 'Ère {numeral} · {name}',
  'era.1': 'Friche',
  'era.2': 'Prairie fleurie',
  'era.3': 'Lande',
  'era.4': 'Forêt pionnière',
  'era.5': 'Forêt mature',
  'era.6': 'Forêt ancienne',

  'season.spring': 'Printemps',
  'season.summer': 'Été',
  'season.autumn': 'Automne',
  'season.winter': 'Hiver',
  'calendar.date': '{season}, jour {day}, an {year}',

  'resource.water': 'Eau',
  'resource.sap': 'Sève',
  'resource.humus': 'Humus',
  'resource.spores': 'Spores',

  'panel.resources': 'Ressources',
  'panel.journal': 'Journal',
  'tab.forest': 'Forêt',
  'tab.mycelium': 'Mycélium',

  'action.murmur': 'Murmurer',
  'action.murmur.effect': '+{amount} {resource}',
  'action.murmur.desc': 'Murmurer à la terre nue. Quelque chose remue.',

  'plant.grass.name': 'Herbes folles',
  'plant.grass.desc': 'Poussent partout, boivent un peu et changent la lumière en Sève.',
  'plant.moss.name': 'Mousse',
  'plant.moss.desc': "Retient l'eau comme une éponge et recueille la rosée du matin.",
  'plant.lichen.name': 'Lichen',
  'plant.lichen.desc':
    'Un champignon et une algue qui ne font qu’un. Il change lentement la pierre en sol, et libère des spores.',
  'plant.clover.name': 'Trèfle',
  'plant.clover.desc':
    "Ses racines abritent des bactéries qui fixent l'azote de l'air : toutes les plantes poussent mieux.",
  'plant.owned': '{count}',
  'plant.growing': '+{count} en croissance',

  'discovery.symbiosis.name': 'Symbiose',
  'discovery.symbiosis.desc': 'Les vivants s’en sortent mieux ensemble.',
  'discovery.rooting.name': 'Enracinement',
  'discovery.rooting.desc': 'Des racines qui vont plus loin retiennent davantage.',
  'discovery.flowering.name': 'Floraison',
  'discovery.flowering.desc': 'Les premières fleurs, et les premières graines.',
  'mycelium.intro':
    'Sous le lichen, des filaments de champignon relient le sol. Les Spores paient les découvertes.',
  'mycelium.done': 'Découvert',
  'mycelium.nothing': 'Plus rien à découvrir pour le moment.',

  'cost.wait': 'dans {duration}',
  'cost.overCap': 'il faut plus de stockage de {resource}',

  'effect.produces': '+{amount} {resource}/s',
  'effect.drinks': 'boit {amount} {resource}/s',
  'effect.storage': '+{amount} de stockage de {resource}',
  'effect.sapBonus': '+{percent} % de Sève pour chaque plante',
  'effect.growth': 'adulte en {days} jours',
  'effect.storageMultiplier': 'stockage de {resource} ×{factor}',
  'effect.unlocks': 'débloque {name}',
  'effect.era': 'ouvre l’Ère {numeral}',

  'breakdown.rain': 'Pluie',
  'breakdown.plant': '{name} ×{count}',
  'breakdown.season': 'Saison : ×{factor}',
  'breakdown.sapBonus': 'Azote : ×{factor}',
  'breakdown.waterShortage': "Manque d'eau : plantes à {percent} %",

  'journal.newGame': 'La pluie tombe sur la terre nue. Quelque chose attend.',
  'journal.welcomeBack': 'Pendant ton absence, {duration} se sont écoulées dans la forêt.',
  'journal.loadError':
    'La sauvegarde est illisible. Elle a été mise de côté, et une nouvelle forêt commence.',
  'journal.tooNew':
    "Cette sauvegarde vient d'une version plus récente du jeu. Une nouvelle forêt commence.",
  'journal.imported': 'Sauvegarde importée.',
  'journal.importFailed': 'Ce code de sauvegarde est illisible.',
  'journal.season.spring': 'Le printemps revient. Tout recommence.',
  'journal.season.summer': "L'été. La pluie se fait rare.",
  'journal.season.autumn': "L'automne. La pluie revient.",
  'journal.season.winter': "L'hiver tombe. La forêt retient son souffle.",
  'journal.first.grass': "Les premiers brins d'herbe percent la terre nue.",
  'journal.first.moss': 'Une pluie fine. La mousse boit.',
  'journal.first.lichen': 'Le lichen gagne les pierres.',
  'journal.first.clover': 'Le trèfle prend racine et nourrit le sol.',
  'journal.mycelium': 'Des filaments de champignon courent sous le lichen. Un réseau s’éveille.',
  'journal.discovery': 'Découverte : {name}.',
  'journal.drought': 'La terre est sèche. Les plantes assoiffées ralentissent.',
  'journal.era.2':
    "Les premières fleurs s'ouvrent : l'Ère II, la prairie fleurie, commence. La prairie elle-même arrive dans la prochaine version.",

  'debug.title': 'Debug',
  'debug.speed': 'Vitesse',
  'debug.skipSeason': 'Sauter une saison',
  'debug.fill': 'Remplir les ressources',
  'debug.export': 'Exporter',
  'debug.import': 'Importer',
  'debug.importPrompt': 'Colle un code de sauvegarde :',
  'debug.exportPrompt': 'Copie ce code de sauvegarde :',
  'debug.reset': 'Recommencer',
  'debug.resetConfirm': 'Effacer cette forêt et recommencer ?',
};
