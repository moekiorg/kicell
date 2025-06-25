import { Blueprint, Location, GameObject, Character, ActionRule, EventRule, EntityId, Direction, ConversationalCharacter, Effect, Condition } from './types/blueprint.js';

// Public interfaces for fluent builders
export interface RoomBuilder {
  name(name: string): RoomBuilder;
  description(desc: string): RoomBuilder;
  isOutdoors(): RoomBuilder;
  isDark(): RoomBuilder;
  isNorthOf(otherRoom: RoomBuilder): RoomBuilder;
  isSouthOf(otherRoom: RoomBuilder): RoomBuilder;
  isEastOf(otherRoom: RoomBuilder): RoomBuilder;
  isWestOf(otherRoom: RoomBuilder): RoomBuilder;
  north(roomId: EntityId): RoomBuilder;
  south(roomId: EntityId): RoomBuilder;
  east(roomId: EntityId): RoomBuilder;
  west(roomId: EntityId): RoomBuilder;
  build(): Location;
}

export interface ThingBuilder {
  name(name: string): ThingBuilder;
  description(desc: string): ThingBuilder;
  at(room: RoomBuilder | EntityId): ThingBuilder;
  isPortable(): ThingBuilder;
  isFixed(): ThingBuilder;
  isOpenable(): ThingBuilder;
  isOpen(): ThingBuilder;
  isClosed(): ThingBuilder;
  isLocked(): ThingBuilder;
  isContainer(): ThingBuilder;
  isSupporter(): ThingBuilder;
  isClimbable(destination?: RoomBuilder): ThingBuilder;
  isEnterable(destination?: RoomBuilder): ThingBuilder;
  isReadable(textContent?: string): ThingBuilder;
  isBackdrop(): ThingBuilder;
  isScenery(): ThingBuilder;
  isVehicle(capacity?: number): ThingBuilder;
  requiresKey(keyId: EntityId): ThingBuilder;
  presentInRooms(roomIds: EntityId[]): ThingBuilder;
  portable(): ThingBuilder;
  build(): GameObject;
}

export interface CharacterBuilder {
  name(name: string): CharacterBuilder;
  description(desc: string): CharacterBuilder;
  at(room: RoomBuilder | EntityId): CharacterBuilder;
  conversational(config: ConversationalCharacter): CharacterBuilder;
  isConversational(config: ConversationalCharacter): CharacterBuilder;
  has(items: ThingBuilder | ThingBuilder[]): CharacterBuilder;
  build(): Character;
}

export interface PlayerBuilder {
  at(room: RoomBuilder): PlayerBuilder;
  isAt(room: RoomBuilder): Condition;
  getInitialLocation(): EntityId;
}

export interface RuleBuilder {
  onEnterRoom(room: RoomBuilder): RuleBuilder;
  onEnterLocation(room: RoomBuilder): RuleBuilder;
  everyTurn(): RuleBuilder;
  when(action: string, target: EntityId): RuleBuilder;
  about(topic: string): RuleBuilder;
  onEnter(room: RoomBuilder): RuleBuilder;
  if(conditions: Condition[]): RuleBuilder;
  then(effects: Effect[]): RuleBuilder;
  build(): EventRule | ActionRule;
}

export interface WorldBuilder {
  author(name: string): WorldBuilder;
  room(id: EntityId, builder?: (room: RoomBuilder) => RoomBuilder): WorldBuilder;
  location(id: EntityId, builder?: (room: RoomBuilder) => RoomBuilder): WorldBuilder;
  thing(id: EntityId, builder?: (thing: ThingBuilder) => ThingBuilder): WorldBuilder;
  object(id: EntityId, builder?: (thing: ThingBuilder) => ThingBuilder): WorldBuilder;
  character(id: EntityId, builder?: (char: CharacterBuilder) => CharacterBuilder): WorldBuilder;
  rule(builder?: (rule: RuleBuilder) => RuleBuilder): WorldBuilder;
  add(...entities: (RoomBuilder | ThingBuilder | CharacterBuilder | PlayerBuilder | RuleBuilder)[]): WorldBuilder;
  build(): Blueprint;
}

// Fluent API builders that match the example.scenario.ts pattern
class FluentRoomBuilder implements RoomBuilder {
  private room: Location;

  constructor(id: EntityId) {
    this.room = {
      id,
      name: '',
      description: '',
      connections: []
    };
  }

  name(name: string): RoomBuilder {
    this.room.name = name;
    return this;
  }

  description(desc: string): RoomBuilder {
    this.room.description = desc;
    return this;
  }

  isOutdoors(): RoomBuilder {
    if (!this.room.properties) {
      this.room.properties = {};
    }
    this.room.properties.is_outdoors = true;
    return this;
  }

  isDark(): RoomBuilder {
    if (!this.room.properties) {
      this.room.properties = {};
    }
    this.room.properties.is_dark = true;
    return this;
  }

  isNorthOf(otherRoom: RoomBuilder): RoomBuilder {
    this.room.connections.push({
      direction: 'north',
      to: (otherRoom as FluentRoomBuilder).room.id
    });
    return this;
  }

  isSouthOf(otherRoom: RoomBuilder): RoomBuilder {
    this.room.connections.push({
      direction: 'south',
      to: (otherRoom as FluentRoomBuilder).room.id
    });
    return this;
  }

  isEastOf(otherRoom: RoomBuilder): RoomBuilder {
    this.room.connections.push({
      direction: 'east',
      to: (otherRoom as FluentRoomBuilder).room.id
    });
    return this;
  }

  isWestOf(otherRoom: RoomBuilder): RoomBuilder {
    this.room.connections.push({
      direction: 'west',
      to: (otherRoom as FluentRoomBuilder).room.id
    });
    return this;
  }

  north(roomId: EntityId): RoomBuilder {
    this.room.connections.push({
      direction: 'north',
      to: roomId
    });
    return this;
  }

  south(roomId: EntityId): RoomBuilder {
    this.room.connections.push({
      direction: 'south',
      to: roomId
    });
    return this;
  }

  east(roomId: EntityId): RoomBuilder {
    this.room.connections.push({
      direction: 'east',
      to: roomId
    });
    return this;
  }

  west(roomId: EntityId): RoomBuilder {
    this.room.connections.push({
      direction: 'west',
      to: roomId
    });
    return this;
  }


  build(): Location {
    return this.room;
  }
}

class FluentThingBuilder implements ThingBuilder {
  private thing: GameObject;

  constructor(id: EntityId) {
    this.thing = {
      id,
      name: '',
      description: '',
      initial_location: ''
    };
  }

  name(name: string): ThingBuilder {
    this.thing.name = name;
    return this;
  }

  description(desc: string): ThingBuilder {
    this.thing.description = desc;
    return this;
  }

  at(room: RoomBuilder | EntityId): ThingBuilder {
    if (typeof room === 'string') {
      this.thing.initial_location = room;
    } else {
      this.thing.initial_location = (room as FluentRoomBuilder).build().id;
    }
    return this;
  }

  isPortable(): ThingBuilder {
    this.setProperty('portable', true);
    return this;
  }

  portable(): ThingBuilder {
    return this.isPortable();
  }

  isOpenable(): ThingBuilder {
    this.setProperty('openable', true);
    return this;
  }

  isOpen(): ThingBuilder {
    this.setProperty('is_open', true);
    return this;
  }

  isClosed(): ThingBuilder {
    this.setProperty('is_open', false);
    return this;
  }

  isLocked(): ThingBuilder {
    this.setProperty('locked', true);
    return this;
  }

  isContainer(): ThingBuilder {
    this.setProperty('container', true);
    return this;
  }

  isClimbable(destination?: RoomBuilder): ThingBuilder {
    this.setProperty('climbable', true);
    if (destination) {
      this.setProperty('climb_destination', (destination as FluentRoomBuilder).build().id);
    }
    return this;
  }

  isSupporter(): ThingBuilder {
    this.setProperty('supporter', true);
    return this;
  }

  isEnterable(destination?: RoomBuilder): ThingBuilder {
    this.setProperty('enterable', true);
    if (destination) {
      this.setProperty('enter_destination', (destination as FluentRoomBuilder).build().id);
    }
    return this;
  }

  isReadable(textContent?: string): ThingBuilder {
    this.setProperty('readable', true);
    if (textContent) {
      this.thing.text_content = textContent;
    }
    return this;
  }

  isFixed(): ThingBuilder {
    this.setProperty('portable', false);
    return this;
  }

  isBackdrop(): ThingBuilder {
    this.setProperty('backdrop', true);
    this.setProperty('portable', false);
    return this;
  }

  isScenery(): ThingBuilder {
    this.setProperty('scenery', true);
    this.setProperty('portable', false);
    return this;
  }

  isVehicle(capacity?: number): ThingBuilder {
    this.setProperty('vehicle', true);
    if (capacity) {
      this.setProperty('capacity', capacity);
    }
    return this;
  }

  requiresKey(keyId: EntityId): ThingBuilder {
    this.setProperty('required_key', keyId);
    return this;
  }

  presentInRooms(roomIds: EntityId[]): ThingBuilder {
    this.setProperty('present_in_rooms', roomIds);
    return this;
  }


  private setProperty(key: string, value: boolean | EntityId | number | EntityId[]) {
    if (!this.thing.properties) {
      this.thing.properties = {};
    }
    (this.thing.properties as any)[key] = value;
  }

  build(): GameObject {
    return this.thing;
  }
}

class FluentCharacterBuilder implements CharacterBuilder {
  private character: Character;

  constructor(id: EntityId) {
    this.character = {
      id,
      name: '',
      description: '',
      initial_location: ''
    };
  }

  name(name: string): CharacterBuilder {
    this.character.name = name;
    return this;
  }

  description(desc: string): CharacterBuilder {
    this.character.description = desc;
    return this;
  }

  at(room: RoomBuilder | EntityId): CharacterBuilder {
    if (typeof room === 'string') {
      this.character.initial_location = room;
    } else {
      this.character.initial_location = (room as FluentRoomBuilder).build().id;
    }
    return this;
  }

  conversational(config: ConversationalCharacter): CharacterBuilder {
    this.character.conversational = config;
    return this;
  }

  isConversational(config: ConversationalCharacter): CharacterBuilder {
    this.character.conversational = config;
    return this;
  }

  has(items: ThingBuilder | ThingBuilder[]): CharacterBuilder {
    if (!this.character.initial_inventory) {
      this.character.initial_inventory = [];
    }
    
    if (Array.isArray(items)) {
      for (const item of items) {
        this.character.initial_inventory.push((item as FluentThingBuilder).build().id);
      }
    } else {
      this.character.initial_inventory.push((items as FluentThingBuilder).build().id);
    }
    
    return this;
  }

  build(): Character {
    return this.character;
  }
}

class FluentPlayerBuilder implements PlayerBuilder {
  private playerId = 'player';
  private initialLocation: EntityId = '';

  at(room: RoomBuilder): PlayerBuilder {
    this.initialLocation = (room as FluentRoomBuilder).build().id;
    return this;
  }

  isAt(room: RoomBuilder): Condition {
    return { type: 'location_is', target: 'player', value: (room as FluentRoomBuilder).build().id };
  }

  getInitialLocation(): EntityId {
    return this.initialLocation;
  }
}

class FluentRuleBuilder implements RuleBuilder {
  private ruleType: 'action' | 'event' | null = null;
  private trigger?: { type: 'every_turn' | 'on_enter_location' | 'action'; value?: any; action?: string; target?: EntityId; topic?: string };
  private conditions: Condition[] = [];
  private effects: Effect[] = [];
  private ruleId: string;

  constructor(id: string) {
    this.ruleId = id;
  }

  onEnterRoom(room: RoomBuilder): RuleBuilder {
    this.ruleType = 'event';
    this.trigger = { type: 'on_enter_location', value: (room as FluentRoomBuilder).build().id };
    return this;
  }

  onEnterLocation(room: RoomBuilder): RuleBuilder {
    return this.onEnterRoom(room);
  }

  onEnter(room: RoomBuilder): RuleBuilder {
    this.ruleType = 'event';
    this.trigger = { type: 'on_enter_location', value: (room as FluentRoomBuilder).build().id };
    return this;
  }

  when(action: string, target: EntityId): RuleBuilder {
    this.ruleType = 'action';
    this.trigger = { type: 'action', action, target };
    return this;
  }

  about(topic: string): RuleBuilder {
    if (this.trigger && 'action' in this.trigger) {
      (this.trigger as any).topic = topic;
    }
    return this;
  }

  everyTurn(): RuleBuilder {
    this.ruleType = 'event';
    this.trigger = { type: 'every_turn' };
    return this;
  }

  if(conditions: Condition[]): RuleBuilder {
    this.conditions = conditions;
    return this;
  }

  then(effects: Effect[]): RuleBuilder {
    this.effects = effects;
    return this;
  }

  build(): EventRule | ActionRule | any {
    if (this.ruleType === 'action' && this.trigger && 'action' in this.trigger) {
      const actionRule: any = {
        id: this.ruleId,
        action: (this.trigger as any).action,
        target: (this.trigger as any).target,
        conditions: this.conditions,
        effects: this.effects
      };
      if ((this.trigger as any).topic) {
        actionRule.topic = (this.trigger as any).topic;
      }
      return actionRule;
    }
    
    return {
      id: this.ruleId,
      trigger: this.trigger!,
      ...(this.conditions.length > 0 && { conditions: this.conditions }),
      effects: this.effects
    };
  }
}

class FluentCounterBuilder {
  constructor(private key: string) {}

  add(value: number): Effect {
    return { type: 'add_counter', key: this.key, value };
  }

  set(value: number): Effect {
    return { type: 'set_counter', key: this.key, value };
  }

  greaterThan(value: number): Condition {
    return { type: 'counter_greater', key: this.key, value };
  }

  equals(value: number): Condition {
    return { type: 'counter_equals', key: this.key, value };
  }

  lessThan(value: number): Condition {
    return { type: 'counter_less', key: this.key, value };
  }
}

class FluentFlagBuilder {
  constructor(private key: string) {}

  set(value: boolean): Effect {
    return { type: 'set_flag', key: this.key, value };
  }

  is(value: boolean): Condition {
    return { type: 'flag_is', key: this.key, value };
  }
}

class FluentWorldBuilder implements WorldBuilder {
  private blueprint: Blueprint;
  private ruleCounter = 0;
  private playerLocation: EntityId = '';

  constructor(title: string) {
    this.blueprint = {
      meta: {
        title,
        author: '',
        version: '1.0.0',
        initial_player_location: ''
      },
      entities: {
        locations: [],
        objects: [],
        characters: []
      },
      rules: {
        action_rules: [],
        event_rules: []
      }
    };
  }

  author(name: string): WorldBuilder {
    this.blueprint.meta.author = name;
    return this;
  }

  room(id: EntityId, builder?: (room: RoomBuilder) => RoomBuilder): WorldBuilder {
    const roomBuilder = new FluentRoomBuilder(id);
    const room = builder ? builder(roomBuilder as RoomBuilder).build() : roomBuilder.build();
    this.blueprint.entities.locations.push(room);
    return this;
  }

  location(id: EntityId, builder?: (room: RoomBuilder) => RoomBuilder): WorldBuilder {
    return this.room(id, builder);
  }

  thing(id: EntityId, builder?: (thing: ThingBuilder) => ThingBuilder): WorldBuilder {
    const thingBuilder = new FluentThingBuilder(id);
    const thing = builder ? builder(thingBuilder as ThingBuilder).build() : thingBuilder.build();
    this.blueprint.entities.objects.push(thing);
    return this;
  }

  object(id: EntityId, builder?: (thing: ThingBuilder) => ThingBuilder): WorldBuilder {
    return this.thing(id, builder);
  }

  character(id: EntityId, builder?: (char: CharacterBuilder) => CharacterBuilder): WorldBuilder {
    const characterBuilder = new FluentCharacterBuilder(id);
    const character = builder ? builder(characterBuilder as CharacterBuilder).build() : characterBuilder.build();
    this.blueprint.entities.characters.push(character);
    return this;
  }

  rule(builder?: (rule: RuleBuilder) => RuleBuilder): WorldBuilder {
    const ruleBuilder = new FluentRuleBuilder(`rule_${this.ruleCounter++}`);
    const rule = builder ? builder(ruleBuilder as RuleBuilder).build() : ruleBuilder.build();
    
    if (rule && 'action' in rule) {
      this.blueprint.rules.action_rules.push(rule as any);
    } else {
      this.blueprint.rules.event_rules.push(rule as any);
    }
    return this;
  }


  add(...entities: (RoomBuilder | ThingBuilder | CharacterBuilder | PlayerBuilder | RuleBuilder)[]): WorldBuilder {
    for (const entity of entities) {
      if (entity instanceof FluentRoomBuilder) {
        this.blueprint.entities.locations.push(entity.build());
      } else if (entity instanceof FluentThingBuilder) {
        this.blueprint.entities.objects.push(entity.build());
      } else if (entity instanceof FluentCharacterBuilder) {
        this.blueprint.entities.characters.push(entity.build());
      } else if (entity instanceof FluentPlayerBuilder) {
        this.playerLocation = entity.getInitialLocation();
      } else if (entity instanceof FluentRuleBuilder) {
        this.blueprint.rules.event_rules.push(entity.build());
      }
    }
    return this;
  }

  build(): Blueprint {
    if (!this.playerLocation) {
      throw new Error('Player initial location must be set. Use k.player().at(room) and add it to the world.');
    }
    this.blueprint.meta.initial_player_location = this.playerLocation;
    this.createBidirectionalConnections();
    return this.blueprint;
  }

  private createBidirectionalConnections() {
    const reverseDirections: Record<Direction, Direction> = {
      'north': 'south',
      'south': 'north',
      'east': 'west',
      'west': 'east',
      'up': 'down',
      'down': 'up',
      'in': 'out',
      'out': 'in'
    };

    const locationMap = new Map<EntityId, Location>();
    for (const location of this.blueprint.entities.locations) {
      locationMap.set(location.id, location);
    }

    for (const location of this.blueprint.entities.locations) {
      for (const connection of location.connections) {
        const targetLocation = locationMap.get(connection.to);
        if (targetLocation && !connection.is_one_way) {
              const reverseDirection = reverseDirections[connection.direction];
          if (reverseDirection) {
            const hasReverseConnection = targetLocation.connections.some(
              conn => conn.direction === reverseDirection && conn.to === location.id
            );
            if (!hasReverseConnection) {
              targetLocation.connections.push({
                direction: reverseDirection,
                to: location.id
              });
            }
          }
        }
      }
    }
  }
}

// Main k API
export const k = {
  // Primary API
  room: (id: EntityId): RoomBuilder => new FluentRoomBuilder(id),
  thing: (id: EntityId): ThingBuilder => new FluentThingBuilder(id),
  character: (id: EntityId): CharacterBuilder => new FluentCharacterBuilder(id),
  player: (): PlayerBuilder => new FluentPlayerBuilder(),
  rule: (): RuleBuilder => new FluentRuleBuilder(`rule_${Date.now()}_${Math.random()}`),
  world: (title: string): WorldBuilder => new FluentWorldBuilder(title),
  counter: (key: string): FluentCounterBuilder => new FluentCounterBuilder(key),
  flag: (key: string): FluentFlagBuilder => new FluentFlagBuilder(key),
  
  // Backward compatibility aliases
  location: (id: EntityId): RoomBuilder => new FluentRoomBuilder(id),
  object: (id: EntityId): ThingBuilder => new FluentThingBuilder(id),
  
  // Specific thing types
  backdrop: (id: EntityId): ThingBuilder => new FluentThingBuilder(id).isBackdrop(),
  scenery: (id: EntityId): ThingBuilder => new FluentThingBuilder(id).isScenery(),
  vehicle: (id: EntityId, capacity?: number): ThingBuilder => new FluentThingBuilder(id).isVehicle(capacity),
  container: (id: EntityId): ThingBuilder => new FluentThingBuilder(id).isContainer(),
  supporter: (id: EntityId): ThingBuilder => new FluentThingBuilder(id).isSupporter(),
  
  // Effect helpers
  show: (content: string): Effect => ({ type: 'display_text', content }),
  give: (item: ThingBuilder): Effect => ({ type: 'add_to_inventory', target: 'player', item: (item as FluentThingBuilder).build().id }),
  end: (message: string): Effect => ({ type: 'end_game', outcome: 'victory', message }),
  
  // Effect namespace for compatibility
  effect: {
    show: (content: string): Effect => ({ type: 'display_text', content }),
    give: (itemId: EntityId): Effect => ({ type: 'add_to_inventory', target: 'player', item: itemId }),
    setState: (target: EntityId, key: string, value: any): Effect => ({ type: 'set_state', target, key, value })
  }
};