import { describe, it, expect } from 'vitest';
import { k } from '../src/k-api.js';

describe('k API with Conversation Features', () => {
  it('should create character with conversational abilities', () => {
    const living_room = k.location('living_room')
      .name('リビングルーム')
      .description('家族が集まる場所');
    
    const world = k.world('Test Game')
      .add(living_room, k.player().at(living_room))
      .character('father', char => char
        .name('父親')
        .description('頑固そうな男性')
        .at('living_room')
        .conversational({
          personality: "頑固で、疑り深い。娘のリリーを溺愛しているが、口数が少なくぶっきらぼう。",
          knowledge: [
            "自分はこの家の主である。",
            "最近、見知らぬ若者（プレイヤー）が家の周りをうろついていることに気づいている。"
          ],
          constraints: [
            "『手紙』や『裏庭の木』については何も知らない。",
            "プレイヤーを家から追い出すことはあっても、簡単には信用しない。",
            "娘の居場所や計画については絶対に口を割らない。"
          ]
        })
      )
      .build();

    const father = world.entities.characters[0];
    expect(father.conversational).toBeDefined();
    expect(father.conversational?.personality).toContain('頑固');
    expect(father.conversational?.knowledge).toHaveLength(2);
    expect(father.conversational?.constraints).toHaveLength(3);
  });

  it('should create rule with about topic', () => {
    const living_room = k.location('living_room').name('リビングルーム');
    
    const world = k.world('Test Game')
      .add(living_room, k.player().at(living_room))
      .character('father', char => char.name('父親').at('living_room'))
      .rule(rule => rule
        .when("ask", "father")
        .about("手紙")
        .then([
          k.effect.show("'手紙？' 父親は訝しげに眉をひそめた。『何のことだかさっぱり分からんな』"),
          k.effect.setState("father", "is_suspicious", true)
        ])
      )
      .build();

    const actionRule = world.rules.action_rules[0];
    expect(actionRule.action).toBe('ask');
    expect(actionRule.target).toBe('father');
    expect(actionRule.topic).toBe('手紙');
    expect(actionRule.effects).toHaveLength(2);
  });

  it('should build complete world with conversational characters', () => {
    const living_room = k.location('living_room')
      .name('リビングルーム')
      .description('家族が集まる場所');
    
    const world = k.world("Test Game")
      .add(living_room, k.player().at(living_room))
      .character('father', char => char
        .name('父親')
        .at('living_room')
        .conversational({
          personality: "頑固で疑り深い",
          knowledge: ["家の主"],
          constraints: ["手紙を知らない"]
        })
      )
      .rule(rule => rule
        .when("ask", "father")
        .about("手紙")
        .then([k.effect.show("知らないな")])
      )
      .build();
    
    expect(world.entities.characters).toHaveLength(1);
    expect(world.entities.characters[0].conversational).toBeDefined();
    expect(world.rules.action_rules).toHaveLength(1);
    expect(world.rules.action_rules[0].topic).toBe('手紙');
  });
});