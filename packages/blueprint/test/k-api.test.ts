import { describe, it, expect } from 'vitest';
import { k } from '../src/k-api.js';

describe('k API - Basic world creation', () => {
  it('should create a simple world with one location', () => {
    const room = k.room('room')
      .name('Room')
      .description('A simple room');
    
    const world = k.world('Test World')
      .author('Test Author')
      .add(room, k.player().at(room))
      .build();

    expect(world.meta.title).toBe('Test World');
    expect(world.meta.author).toBe('Test Author');
    expect(world.meta.initial_player_location).toBe('room');
    expect(world.entities.locations).toHaveLength(1);
    expect(world.entities.locations[0].id).toBe('room');
  });
});

describe('k API - Locations with connections', () => {
  it('should create locations with bidirectional connections', () => {
    const room1 = k.room('room1')
      .name('Room 1')
      .description('First room')
      .north('room2');
    
    const room2 = k.room('room2')
      .name('Room 2')
      .description('Second room');
    
    const world = k.world('Connected World')
      .add(room1, room2, k.player().at(room1))
      .build();

    expect(world.entities.locations).toHaveLength(2);
    expect(world.entities.locations[0].connections).toHaveLength(1);
    expect(world.entities.locations[0].connections[0]).toEqual({
      direction: 'north',
      to: 'room2'
    });
    expect(world.entities.locations[1].connections).toHaveLength(1);
    expect(world.entities.locations[1].connections[0]).toEqual({
      direction: 'south',
      to: 'room1'
    });
  });
});

describe('k API - Objects', () => {
  it('should create objects with properties', () => {
    const room = k.room('room').name('Room');
    
    const world = k.world('Object World')
      .add(room, k.player().at(room))
      .thing('key', obj => obj
        .name('Golden Key')
        .description('A shiny golden key')
        .at('room')
        .isPortable()
      )
      .build();

    expect(world.entities.objects).toHaveLength(1);
    expect(world.entities.objects[0]).toEqual({
      id: 'key',
      name: 'Golden Key',
      description: 'A shiny golden key',
      initial_location: 'room',
      properties: { portable: true }
    });
  });
});

describe('k API - Characters', () => {
  it('should create conversational characters', () => {
    const room = k.room('room').name('Room');
    
    const world = k.world('Character World')
      .add(room, k.player().at(room))
      .character('npc', char => char
        .name('Bob')
        .description('A friendly NPC')
        .at('room')
        .conversational({
          personality: 'Friendly and helpful',
          knowledge: ['The key is hidden under the mat'],
          constraints: ['Never mentions the secret door']
        })
      )
      .build();

    expect(world.entities.characters).toHaveLength(1);
    expect(world.entities.characters[0].conversational).toBeDefined();
    expect(world.entities.characters[0].conversational?.personality).toBe('Friendly and helpful');
  });
});

describe('k API - Rules', () => {
  it('should create action rules', () => {
    const room = k.room('room').name('Room');
    
    const world = k.world('Rule World')
      .add(room, k.player().at(room))
      .thing('key', obj => obj.name('Key').at('room'))
      .rule(rule => rule
        .when('take', 'key')
        .then([
          k.effect.show('You picked up the key!'),
          k.effect.give('key')
        ])
      )
      .build();

    expect(world.rules.action_rules).toHaveLength(1);
    expect(world.rules.action_rules[0].action).toBe('take');
    expect(world.rules.action_rules[0].target).toBe('key');
    expect(world.rules.action_rules[0].effects).toHaveLength(2);
  });

  it('should create event rules', () => {
    const room = k.room('room').name('Room');
    const world = k.world('Event World')
      .add(room, k.player().at(room))
      .rule(rule => rule
        .onEnter(room)
        .then([
          k.effect.show('Welcome to the room!')
        ])
      )
      .build();

    expect(world.rules.event_rules).toHaveLength(1);
    expect(world.rules.event_rules[0].trigger.type).toBe('on_enter_location');
    expect(world.rules.event_rules[0].trigger.value).toBe('room');
  });
});