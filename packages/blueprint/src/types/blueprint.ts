// world.blueprint.ts

// --- 基本型エイリアス ---
export type EntityId = string;
export type Direction = "north" | "south" | "east" | "west" | "up" | "down" | "in" | "out";

// --- エンティティ定義 ---

export interface LocationConnection {
  direction: Direction;
  to: EntityId;
  is_one_way?: boolean;
}

export interface Location {
  id: EntityId;
  name: string;
  description: string;
  connections: LocationConnection[];
  properties?: {
    is_dark?: boolean;
    is_outdoors?: boolean;
  };
}

export interface ObjectProperties {
  portable?: boolean;
  openable?: boolean;
  is_open?: boolean;
  locked?: boolean;
  unlocks_with?: EntityId;
  container?: boolean;
  supporter?: boolean;
  climbable?: boolean;
  edible?: boolean;
  readable?: boolean;
  backdrop?: boolean;
  scenery?: boolean;
  vehicle?: boolean;
  enterable?: boolean;
  capacity?: number;
  required_key?: EntityId;
  present_in_rooms?: EntityId[];
  climb_destination?: EntityId;
  enter_destination?: EntityId;
}

export interface GameObject {
  id: EntityId;
  name: string;
  description: string;
  initial_location: EntityId;
  properties?: ObjectProperties;
  text_content?: string;
}

export interface ConversationalCharacter {
  greeting?: string;
  topics?: Record<string, string>;
  farewell?: string;
  personality?: string;
  knowledge?: string[];
  constraints?: string[];
}

export interface Character {
  id: EntityId;
  name: string;
  description: string;
  initial_location: EntityId;
  initial_inventory?: EntityId[]; // キャラクターが最初から持っているアイテムのIDリスト
  state?: Record<string, any>; // 例: { anger_level: 0, is_suspicious: false }
  conversational?: ConversationalCharacter;
}


// --- ルールエンジン定義 ---

export type Condition =
  | { type: "location_is"; target: EntityId; value: EntityId }
  | { type: "has_item"; target: EntityId; value: EntityId }
  | { type: "state_equals"; target: EntityId; key: string; value: any }
  | { type: "state_not_equals"; target: EntityId; key: string; value: any }
  | { type: "counter_equals"; key: string; value: number }
  | { type: "counter_greater"; key: string; value: number }
  | { type: "counter_less"; key: string; value: number }
  | { type: "flag_is"; key: string; value: boolean };

export type Effect =
  | { type: "display_text"; content: string }
  | { type: "move_entity"; target: EntityId; destination: EntityId }
  | { type: "set_state"; target: EntityId; key: string; value: any }
  | { type: "add_to_inventory"; target: EntityId; item: EntityId }
  | { type: "remove_from_inventory"; target: EntityId; item: EntityId }
  | { type: "end_game"; outcome: "victory" | "defeat"; message: string }
  | { type: "set_counter"; key: string; value: number }
  | { type: "add_counter"; key: string; value: number }
  | { type: "set_flag"; key: string; value: boolean };

export interface ActionRule {
  id: string;
  action: string;
  target: EntityId;
  secondary_target?: EntityId;
  topic?: string;
  conditions: Condition[];
  effects: Effect[];
}

export interface EventRule {
  id: string;
  trigger: {
    type: "every_turn" | "on_enter_location" | "timed_event";
    value?: any; // 例: on_enter_locationの場合、場所ID
  };
  conditions?: Condition[];
  effects: Effect[];
}

// --- パーサーヒント定義 ---
export interface Synonym {
  primary: string;
  aliases: string[];
}
export interface ParserHints {
  synonyms: {
    verbs: Synonym[];
    nouns: Synonym[];
  };
}

// --- Blueprintルートオブジェクト ---

export interface Blueprint {
  meta: {
    title: string;
    author: string;
    version: string;
    initial_player_location: EntityId;
  };
  entities: {
    locations: Location[];
    objects: GameObject[];
    characters: Character[];
  };
  rules: {
    action_rules: ActionRule[];
    event_rules: EventRule[];
  };
  parser_hints?: ParserHints;
}