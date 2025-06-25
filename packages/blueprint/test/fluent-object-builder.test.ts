import { describe, it, expect } from 'vitest';
import { k } from '../src/k-api.js';

describe('FluentObjectBuilder Extended Methods', () => {
  it('should create object with isClosed property', () => {
    const room = k.room('room').name('Test Room');
    const box = k.thing('box')
      .name('Wooden Box')
      .description('A wooden box')
      .at(room)
      .isOpenable()
      .isClosed();

    const result = box.build();
    
    expect(result.properties?.is_open).toBe(false);
    expect(result.properties?.openable).toBe(true);
  });

  it('should create climbable object with destination', () => {
    const room = k.room('room').name('Ground');
    const highPlace = k.room('high_place').name('High Place');
    const pillar = k.thing('pillar')
      .name('Ancient Pillar')
      .description('A tall pillar')
      .at(room)
      .isClimbable(highPlace)
      .isFixed();

    const result = pillar.build();
    
    expect(result.properties?.climbable).toBe(true);
    expect(result.properties?.climb_destination).toBe('high_place');
    expect(result.properties?.portable).toBe(false);
  });

  it('should create supporter object', () => {
    const room = k.room('room').name('Test Room');
    const table = k.thing('table')
      .name('Marble Table')
      .description('A beautiful table')
      .at(room)
      .isSupporter()
      .isFixed();

    const result = table.build();
    
    expect(result.properties?.supporter).toBe(true);
    expect(result.properties?.portable).toBe(false);
  });

  it('should create enterable object with destination', () => {
    const garden = k.room('garden').name('Garden');
    const tentInside = k.room('tent_inside').name('Inside Tent');
    const tent = k.thing('tent')
      .name('Camping Tent')
      .description('A colorful tent')
      .at(garden)
      .isEnterable(tentInside)
      .isFixed();

    const result = tent.build();
    
    expect(result.properties?.enterable).toBe(true);
    expect(result.properties?.enter_destination).toBe('tent_inside');
  });

  it('should create readable object with text content', () => {
    const room = k.room('room').name('Test Room');
    const book = k.thing('book')
      .name('Magic Book')
      .description('An ancient book')
      .at(room)
      .isReadable('Chapter 1: The Beginning of Magic')
      .isPortable();

    const result = book.build();
    
    expect(result.properties?.readable).toBe(true);
    expect(result.text_content).toBe('Chapter 1: The Beginning of Magic');
    expect(result.properties?.portable).toBe(true);
  });

  it('should create container that is closed and locked', () => {
    const room = k.room('room').name('Test Room');
    const chest = k.thing('chest')
      .name('Treasure Chest')
      .description('A locked chest')
      .at(room)
      .isContainer()
      .isOpenable()
      .isClosed()
      .isLocked()
      .isFixed();

    const result = chest.build();
    
    expect(result.properties?.container).toBe(true);
    expect(result.properties?.openable).toBe(true);
    expect(result.properties?.is_open).toBe(false);
    expect(result.properties?.locked).toBe(true);
    expect(result.properties?.portable).toBe(false);
  });
});