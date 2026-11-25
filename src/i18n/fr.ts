import type { MessageKey } from './en';

/** French texts. A missing key falls back to English. */
export const fr: Partial<Record<MessageKey, string>> = {
  'game.title': 'Sylve',
  'game.tagline': 'Une terre nue, qui attend la vie.',

  'season.spring': 'Printemps',
  'season.summer': 'Été',
  'season.autumn': 'Automne',
  'season.winter': 'Hiver',
  'calendar.date': '{season}, jour {day}, an {year}',

  'resource.water': 'Eau',
  'resource.sap': 'Sève',

  'panel.resources': 'Ressources',
  'panel.forest': 'Forêt',
  'panel.journal': 'Journal',
  'forest.empty': 'Rien ne pousse encore. La pluie tombe sur la terre nue.',

  'journal.newGame': 'La pluie tombe sur la terre nue. Quelque chose attend.',
  'journal.welcomeBack': 'Pendant ton absence, {duration} se sont écoulées dans la forêt.',
  'journal.loadError':
    'La sauvegarde est illisible. Elle a été mise de côté, et une nouvelle forêt commence.',
  'journal.tooNew':
    "Cette sauvegarde vient d'une version plus récente du jeu. Une nouvelle forêt commence.",
  'journal.imported': 'Sauvegarde importée.',
  'journal.importFailed': 'Ce code de sauvegarde est illisible.',

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
