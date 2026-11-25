/**
 * English texts: the reference language. Every key used in the UI lives here.
 * Placeholders use {name} and must match across languages (checked by tests).
 */
export const en = {
  'game.title': 'Sylve',
  'game.tagline': 'Bare ground, waiting for life.',

  'season.spring': 'Spring',
  'season.summer': 'Summer',
  'season.autumn': 'Autumn',
  'season.winter': 'Winter',
  'calendar.date': '{season}, day {day}, year {year}',

  'resource.water': 'Water',
  'resource.sap': 'Sap',

  'panel.resources': 'Resources',
  'panel.forest': 'Forest',
  'panel.journal': 'Journal',
  'forest.empty': 'Nothing grows here yet. Rain falls on the bare ground.',

  'journal.newGame': 'Rain falls on bare ground. Something is waiting.',
  'journal.welcomeBack': 'While you were away, {duration} passed in the forest.',
  'journal.loadError': 'The save could not be read. It was kept aside, and a new forest begins.',
  'journal.tooNew': 'This save comes from a newer version of the game. A new forest begins.',
  'journal.imported': 'Save imported.',
  'journal.importFailed': 'This save code could not be read.',

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
