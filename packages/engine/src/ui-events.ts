// UI Event types for decoupled engine-to-UI communication

export interface UIEvent {
  type: string;
  timestamp: number;
  data: any;
}

export interface GameStartEvent extends UIEvent {
  type: 'game_start';
  data: {
    title: string;
    author: string;
  };
}

export interface LocationDisplayEvent extends UIEvent {
  type: 'location_display';
  data: {
    name: string;
    description: string;
    objects: Array<{
      id: string;
      name: string;
    }>;
    characters: Array<{
      id: string;
      name: string;
    }>;
    exits: string[];
  };
}

export interface MessageDisplayEvent extends UIEvent {
  type: 'message_display';
  data: {
    message: string;
    category?: 'info' | 'error' | 'success' | 'warning';
  };
}

export interface InventoryDisplayEvent extends UIEvent {
  type: 'inventory_display';
  data: {
    items: Array<{
      id: string;
      name: string;
    }>;
  };
}

export interface EntityDescriptionEvent extends UIEvent {
  type: 'entity_description';
  data: {
    id: string;
    name: string;
    description: string;
    type: 'object' | 'character';
  };
}

export interface GameOverEvent extends UIEvent {
  type: 'game_over';
  data: {
    outcome: 'victory' | 'defeat';
    message: string;
  };
}

export interface ConversationEvent extends UIEvent {
  type: 'conversation';
  data: {
    characterId: string;
    characterName: string;
    message: string;
    topics?: string[];
  };
}

export interface CommandResultEvent extends UIEvent {
  type: 'command_result';
  data: {
    success: boolean;
    message?: string;
    action: string;
    target?: string;
  };
}

export interface DebugLogEvent extends UIEvent {
  type: 'debug_log';
  data: {
    message: string;
    level?: 'info' | 'warn' | 'error';
  };
}

export type GameUIEvent = 
  | GameStartEvent
  | LocationDisplayEvent
  | MessageDisplayEvent
  | InventoryDisplayEvent
  | EntityDescriptionEvent
  | GameOverEvent
  | ConversationEvent
  | CommandResultEvent
  | DebugLogEvent;

export interface UIEventHandler {
  (event: GameUIEvent): void;
}