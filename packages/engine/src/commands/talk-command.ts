import { BaseCommand, CommandResult } from "./base-command.js";
import { IConversationHandler } from "../ai/index.js";
import { CommandMetadata, ICommandWithMetadata } from "../command-registry.js";

export class TalkCommand extends BaseCommand implements ICommandWithMetadata {
  private conversationHandler?: IConversationHandler;
  private conversationHistory: Map<string, Array<{speaker: "player" | "character"; message: string; timestamp: number}>> = new Map();

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

  async execute(target?: string, topic?: string): Promise<CommandResult> {
    if (!target) {
      return { success: false, message: "誰と話しますか？" };
    }

    const character = this.blueprint.entities.characters.find((char: any) => char.id === target);
    
    if (!character) {
      return { success: false, message: `${target}という人はここにいません。` };
    }
    
    if (character.initial_location !== this.gameState.getCurrentLocation()) {
      return { success: false, message: `${character.name}はここにいません。` };
    }

    let responseMessage = "";
    
    // Handle conversational characters
    if (character.conversational) {
      if (topic && character.conversational.topics?.[topic]) {
        // Use predefined topic response
        responseMessage = character.conversational.topics[topic];
      } else if (!topic) {
        // Check if we've talked before to avoid repeated greetings
        const characterHistory = this.conversationHistory.get(character.id) || [];
        if (characterHistory.length > 0) {
          // We've talked before, use AI for natural continuation
          if (this.conversationHandler) {
            try {
              const gameContext = this.gameState.getGameContext();
              const aiResponse = await this.conversationHandler.generateCharacterResponse("こんにちは", {
                character: character.conversational,
                conversationHistory: characterHistory,
                gameContext,
                blueprint: this.blueprint
              });
              responseMessage = aiResponse.text;
            } catch (error) {
              responseMessage = "はい、どうしましたか？";
            }
          } else {
            responseMessage = "はい、どうしましたか？";
          }
        } else {
          // First time meeting, use greeting
          responseMessage = character.conversational.greeting || "";
        }
      } else {
        // Always fallback to AI conversation handler for unknown topics
        if (this.conversationHandler) {
          try {
            const gameContext = this.gameState.getGameContext();
            
            // Get conversation history for this character
            const characterHistory = this.conversationHistory.get(character.id) || [];
            
            const aiResponse = await this.conversationHandler.generateCharacterResponse(topic, {
              character: character.conversational,
              conversationHistory: characterHistory,
              gameContext,
              blueprint: this.blueprint
            });
            responseMessage = aiResponse.text;
          } catch (error) {
            // Only fallback to greeting if AI fails completely
            responseMessage = `${character.name}は${topic}について何も知らないようです。`;
          }
        } else {
          responseMessage = `${character.name}は${topic}について何も知らないようです。`;
        }
      }
      
      // Record conversation history
      const history = this.conversationHistory.get(character.id) || [];
      const now = Date.now();
      
      history.push({
        speaker: "player",
        message: topic || "こんにちは",
        timestamp: now
      });
      
      history.push({
        speaker: "character", 
        message: responseMessage,
        timestamp: now
      });
      
      // Keep only recent conversation (last 10 entries)
      if (history.length > 10) {
        history.splice(0, history.length - 10);
      }
      
      this.conversationHistory.set(character.id, history);

      this.uiEventHandler({
        type: 'conversation',
        timestamp: Date.now(),
        data: {
          characterId: character.id,
          characterName: character.name,
          message: responseMessage,
          topics: Object.keys(character.conversational.topics || {})
        }
      });
      
      return { success: true };
    }
    
    // Non-conversational character - try AI fallback
    if (this.conversationHandler) {
      try {
        const gameContext = this.gameState.getGameContext();
        const characterHistory = this.conversationHistory.get(character.id) || [];
        const mockConversationalData = {
          greeting: `${character.name}です。`,
          personality: character.description
        };
        const aiResponse = await this.conversationHandler.generateCharacterResponse(topic || "こんにちは", {
          character: mockConversationalData,
          conversationHistory: characterHistory,
          gameContext,
          blueprint: this.blueprint
        });
        
        this.uiEventHandler({
          type: 'conversation',
          timestamp: Date.now(),
          data: {
            characterId: character.id,
            characterName: character.name,
            message: aiResponse.text
          }
        });
        
        return { success: true };
      } catch (error) {
        // Silent fallback
      }
    }
    
    this.emitMessage(`${character.name}は話に興味がないようです。`);
    return { success: true };
  }

  getMetadata(): CommandMetadata {
    return {
      name: "talk",
      description: "キャラクターと会話する",
      naturalLanguagePatterns: [
        "話す", "会話", "聞く", "質問", "尋ねる",
        "talk", "speak", "ask", "chat", "converse",
        "〜と話す", "〜に聞く", "〜に質問", "〜について聞く"
      ],
      parameters: [
        {
          name: "target",
          type: "character",
          required: true,
          description: "話したいキャラクター"
        },
        {
          name: "topic",
          type: "string",
          required: false,
          description: "話題（任意）"
        }
      ],
      examples: [
        "老人と話す",
        "賢者に宝物について聞く",
        "商人と会話",
        "talk to sage",
        "ask merchant about treasure"
      ]
    };
  }
}