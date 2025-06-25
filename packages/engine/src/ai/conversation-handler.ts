import {
  IConversationHandler,
  ConversationContext,
  ConversationResponse,
  AIProviderConfig,
} from "./types.js";
import { GeminiProvider } from "./providers/gemini-provider.js";

export class ConversationHandler implements IConversationHandler {
  private provider: GeminiProvider;

  constructor(config: AIProviderConfig) {
    this.provider = new GeminiProvider(config);
  }

  async generateCharacterResponse(
    playerMessage: string,
    context: ConversationContext
  ): Promise<ConversationResponse> {
    const prompt = this.buildConversationPrompt(playerMessage, context);

    const result = await this.provider.generateText(prompt, {
      blueprint: context.blueprint,
      gameContext: context.gameContext,
    });

    return {
      text: result.text,
      confidence: result.confidence,
    };
  }

  private buildConversationPrompt(
    playerMessage: string,
    context: ConversationContext
  ): string {
    const recentHistory = context.conversationHistory
      .slice(-5)
      .map(
        (entry) =>
          `${entry.speaker === "player" ? "プレイヤー" : "キャラクター"}: ${entry.message
          }`
      )
      .join("\n");

    const currentLocation = context.blueprint.entities.locations.find(
      (l) => l.id === context.gameContext.currentLocation
    );

    return `あなたは以下の設定でキャラクターとして振る舞ってください：

【キャラクター設定】
性格: ${context.character.personality || "デフォルトの性格"}
${context.character.greeting
        ? `初回の挨拶: "${context.character.greeting}"`
        : ""
      }
${context.character.farewell
        ? `別れの挨拶: "${context.character.farewell}"`
        : ""
      }

【知識】
${context.character.knowledge?.map((k) => `- ${k}`).join("\n") || "なし"}

【制約】
${context.character.constraints?.map((c) => `- ${c}`).join("\n") || "なし"}

${context.character.topics
        ? `【話せるトピック】
${Object.entries(context.character.topics)
          .map(([topic, response]) => `- ${topic}: ${response}`)
          .join("\n")}`
        : ""
      }

【現在の状況】
場所: ${currentLocation?.name || "不明な場所"}
ターン数: ${context.gameContext.turnCount}

【最近の会話履歴】
${recentHistory || "なし"}

【プレイヤーの発言】
"${playerMessage}"

【指示】
- プレイヤーの質問や発言に、このキャラクターの性格と設定で自然に応答してください
- **重要**: 会話履歴を確認し、既に挨拶を交わしている場合は挨拶を繰り返さないでください
- 初回の挨拶：キャラクターの設定に合った自然な挨拶をしてください
- 既に会話したことがある場合：軽く「ああ」「どうしました？」「はい」程度の自然な反応に留める
- 質問や話題：キャラクターの性格と知識に基づいて答えてください  
- 知らないことを聞かれた場合：キャラクターらしい「わからない」の表現を使ってください
- 別れの挨拶：キャラクターに合った自然な別れの言葉を使ってください
- キャラクターの一人称、話し方、呼びかけ方は性格設定に従ってください
- 応答は会話内容のみを返してください。メタ情報や説明は含めないでください

キャラクターの応答:`;
  }
}

// Factory function
export function createConversationHandler(
  config?: Partial<AIProviderConfig>
): ConversationHandler {
  const defaultConfig: AIProviderConfig = {
    provider: "gemini",
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-2.5-flash-lite-preview-06-17",
  };

  // If no API key, fall back to template-based provider
  if (!defaultConfig.apiKey) {
    defaultConfig.provider = "local";
  }

  return new ConversationHandler({ ...defaultConfig, ...config });
}
