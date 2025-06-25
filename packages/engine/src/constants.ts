// Game Engine Constants
export const GAME_CONSTANTS = {
  // Command parsing
  COMMAND_CONFIDENCE_THRESHOLD: 0.3,
  
  // Recent actions tracking
  MAX_RECENT_ACTIONS: 5,
  
  // AI configuration
  DEFAULT_CONFIDENCE: 0.5,
  HIGH_CONFIDENCE_THRESHOLD: 0.8,
  LOW_CONFIDENCE_THRESHOLD: 0.1,
  
  // AI generation parameters
  MAX_OUTPUT_TOKENS: 200,
  TEMPERATURE: 0.3,
} as const;

// Direction aliases for command processing
export const DIRECTION_ALIASES = {
  'n': 'north',
  's': 'south',
  'e': 'east',
  'w': 'west',
  'u': 'up',
  'd': 'down',
} as const;

// Action aliases for command processing
export const ACTION_ALIASES = {
  'l': 'look',
  'i': 'inventory',
  'get': 'take',
  'pick': 'take',
  '手に取る': 'take',
  '取る': 'take',
  '落とす': 'drop',
  '置く': 'drop',
} as const;

// System commands that exit the game
export const EXIT_COMMANDS = ['quit', 'exit'] as const;

// Help commands
export const HELP_COMMANDS = ['help', '?'] as const;