import { BaseCommand, CommandResult } from "./base-command.js";
import { CommandMetadata } from "../command-registry.js";
import { IConversationHandler } from "../ai/index.js";

export class CheckYourInventoryCommand extends BaseCommand {
  private conversationHandler?: IConversationHandler;

  constructor(
    blueprint: any,
    gameState: any,
    uiEventHandler: any,
    inventorySystem: any,
    conversationHandler?: IConversationHandler
  ) {
    super(blueprint, gameState, uiEventHandler, inventorySystem);
    this.conversationHandler = conversationHandler;
  }
  async execute(target?: string): Promise<CommandResult> {
    if (!target) {
      return { success: false, message: "誰の持ち物を見せてもらいますか？" };
    }

    const character = this.blueprint.entities.characters.find(
      (char: any) => char.id === target
    );

    if (!character) {
      return { success: false, message: `${target}という人はここにいません。` };
    }

    if (character.initial_location !== this.gameState.getCurrentLocation()) {
      return { success: false, message: `${character.name}はここにいません。` };
    }

    const items = this.inventorySystem.getInventoryItems(target);

    const itemNames = items.map((itemId) => {
      const item = this.blueprint.entities.objects.find(
        (obj: any) => obj.id === itemId
      );
      return item ? item.name : itemId;
    });

    let responseMessage = "";

    if (!this.conversationHandler || !character.conversational) {
      const simpleMessage =
        items.length === 0
          ? "申し訳ないが、今は特に持ち物といえるものはないのじゃ。"
          : `わしが持っているのは${itemNames.join("と")}じゃ。`;

      this.uiEventHandler({
        type: "conversation",
        timestamp: Date.now(),
        data: {
          characterId: character.id,
          characterName: character.name,
          message: simpleMessage,
        },
      });

      return { success: true };
    }
    const gameContext = this.gameState.getGameContext();
    const prompt =
      items.length === 0
        ? "プレイヤーが持ち物について聞いているが、あなたは何も持っていない。自然に答えてください。"
        : `プレイヤーが持ち物について聞いている。あなたの持ち物は「${itemNames.join(
            "、"
          )}」です。自然に答えてください。`;

    const aiResponse = await this.conversationHandler.generateCharacterResponse(
      prompt,
      {
        character: character.conversational,
        conversationHistory: [],
        gameContext,
        blueprint: this.blueprint,
      }
    );
    responseMessage = aiResponse.text;

    this.uiEventHandler({
      type: "conversation",
      timestamp: Date.now(),
      data: {
        characterId: character.id,
        characterName: character.name,
        message: responseMessage,
      },
    });

    return { success: true };
  }

  getMetadata(): CommandMetadata {
    return {
      name: "check_your_inventory",
      description: "キャラクターの持ち物を確認する",
      naturalLanguagePatterns: [
        "何か持っていませんか",
        "持ち物を見せてください", 
        "何をお持ちですか",
        "アイテムを見せて",
        "あなたの持ち物は",
        "見せて",
        "check his bag",
        "check your bag",
        "what do you have",
        "show me your items"
      ],
      parameters: [
        {
          name: "target", 
          type: "character",
          required: true,
          description: "持ち物を確認したいキャラクター",
        },
      ],
      examples: [
        "何か持っていませんか",
        "持ち物を見せてください",
        "老人の持ち物を確認",
        "check his bag"
      ],
    };
  }
}
