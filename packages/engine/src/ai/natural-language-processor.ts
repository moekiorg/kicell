import { Blueprint, ActionRule } from "@kycell/blueprint";
import { AIProviderConfig, GameContext } from "./types.js";
import { GeminiProvider } from "./providers/gemini-provider.js";

export interface NaturalLanguageInput {
  text: string;
  gameContext: GameContext;
  blueprint: Blueprint;
  availableCommands?: string; // 利用可能なコマンドの説明
}

export interface ParsedAction {
  action: string;
  target?: string;
  topic?: string;
  confidence: number;
  isConversation: boolean;
  characterTarget?: string;
  playerItem?: string; // プレイヤーのアイテム（交換用）
  targetItem?: string; // 相手のアイテム（交換用）
}

export interface INaturalLanguageProcessor {
  parseInput(input: NaturalLanguageInput): Promise<ParsedAction>;
}

export class NaturalLanguageProcessor implements INaturalLanguageProcessor {
  private provider: GeminiProvider;

  constructor(config: AIProviderConfig) {
    this.provider = new GeminiProvider(config);
  }

  async parseInput(input: NaturalLanguageInput): Promise<ParsedAction> {
    const prompt = this.buildParsingPrompt(input);

    const result = await this.provider.generateText(prompt, {
      blueprint: input.blueprint,
      gameContext: input.gameContext,
    });

    const parsed = this.parseAIResponse(result.text, input);
    return parsed;
  }

  private buildParsingPrompt(input: NaturalLanguageInput): string {
    const currentLocation = input.blueprint.entities.locations.find(
      (l) => l.id === input.gameContext.currentLocation
    );

    const availableObjects = input.blueprint.entities.objects.filter(
      (o) => o.initial_location === input.gameContext.currentLocation
    );

    const availableCharacters = input.blueprint.entities.characters.filter(
      (c) =>
        c.initial_location === input.gameContext.currentLocation &&
        c.id !== "player"
    );

    const inventoryObjects = Array.from(input.gameContext.inventory)
      .map((id) => input.blueprint.entities.objects.find((o) => o.id === id))
      .filter(Boolean);

    const inventory = inventoryObjects.map((o) => o!.name);

    return `以下のプレイヤーの入力を解析して、適切なアクションを判定してください：

【プレイヤーの入力】
"${input.text}"

【現在の状況】
場所: ${currentLocation?.name || "不明"}
持ち物: ${inventory.length > 0 ? inventory.join(", ") : "なし"}

【この場所にあるオブジェクト】
${
  availableObjects
    .map((o) => `- ${o.name} (ID: ${o.id}) - targetには必ずIDを使用`)
    .join("\n") || "なし"
}

【インベントリ内のオブジェクト】
${
  inventoryObjects
    .map((o) => `- ${o!.name} (ID: ${o!.id}) - targetには必ずIDを使用`)
    .join("\n") || "なし"
}

【この場所にいるキャラクター】
${
  availableCharacters.map((c) => `- ${c.name} (ID: ${c.id})`).join("\n") ||
  "なし"
}

【現在の場所の出口】
${
  currentLocation?.connections
    .map((conn) => {
      const destination = input.blueprint.entities.locations.find(
        (l) => l.id === conn.to
      );
      return `- ${conn.direction}: ${destination?.name || conn.to}`;
    })
    .join("\n") || "なし"
}

${input.availableCommands}

以下のJSON形式で回答してください：
{
  "action": "アクション名",
  "target": "対象オブジェクト名またはID（該当する場合）",
  "topic": "話題（askアクションの場合）",
  "characterTarget": "対象キャラクター名またはID（会話の場合）",
  "playerItem": "プレイヤーが渡すアイテムID（tradeの場合）",
  "targetItem": "相手から受け取るアイテムID（tradeの場合）",
  "isConversation": true/false,
  "confidence": 0.0-1.0の信頼度
}

**重要**: targetやcharacterTargetには必ずオブジェクト/キャラクターのIDを使用してください

**質問の処理**:
- 以下の質問パターンは、キャラクターがいる場合はtalkアクションとして処理：
  * 「これは何ですか」「この〇〇はなんですか」「その〇〇は？」
  * 「〇〇について」「〇〇はどう？」「〇〇を教えて」

**渡すアクションの処理**:
- 「〇〇を渡す」「〇〇をあげる」「〇〇を手渡す」「〇〇を与える」→ action: "give", target: オブジェクトID
- キャラクターが指定されている場合: characterTarget: キャラクターID
- 例: 「老人にコインを渡す」→ action: "give", target: "coin", characterTarget: "老人"
- 例: 「コインを渡す」→ action: "give", target: "coin" (その場にいるキャラクターに自動的に渡す)

**持ち物確認の処理**:
- 自分の持ち物確認：「持ち物を確認」「check bag」「check my bag」「check inventory」「バッグの中身」「インベントリ」「何を持っている」→ action: "check_my_inventory"
- 英語例: "check bag", "check my bag", "check inventory", "what do I have", "my items"
- 相手の持ち物確認：「老人の持ち物を確認」「老人が何を持っているか」「check his bag」→ action: "check_your_inventory", characterTarget: キャラクターID
- 相手への持ち物確認（敬語・依頼表現）：「何か持っていませんか」「持ち物を見せてください」「何をお持ちですか」「アイテムを見せて」「あなたの持ち物は」「見せて」→ action: "check_your_inventory", characterTarget: その場にいるキャラクターID
- **重要**: 「見せてください」「見せて」「お持ちですか」「持っていませんか」は相手への質問なので必ずcheck_your_inventoryを使う
- 例: 「持ち物を見せてください」→ action: "check_your_inventory", characterTarget: old_man (その場にいるキャラクター)

**挨拶の処理**:
- 挨拶のみの場合、その場所にいる最初のキャラクターを自動選択
- 特定のキャラクターが明示されている場合はそのキャラクターを指定`;
  }

  private parseAIResponse(
    aiResponse: string,
    input: NaturalLanguageInput
  ): ParsedAction {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);

        if (parsed.action === "talk" && !parsed.characterTarget) {
          const conversationalCharacters =
            input.blueprint.entities.characters.filter(
              (c) =>
                c.initial_location === input.gameContext.currentLocation &&
                c.id !== "player" &&
                c.conversational
            );

          if (conversationalCharacters.length > 0) {
            parsed.characterTarget = conversationalCharacters[0].id;
          }
        }

        return {
          action: parsed.action || "unknown",
          target: parsed.target,
          topic: parsed.topic,
          characterTarget: parsed.characterTarget,
          playerItem: parsed.playerItem,
          targetItem: parsed.targetItem,
          isConversation: parsed.isConversation || false,
          confidence: parsed.confidence || 0.5,
        };
      } catch (error) {
        console.warn("Failed to parse AI response JSON:", error);
      }
    }

    return {
      action: "unknown",
      isConversation: false,
      confidence: 0.1,
    };
  }
}

export function createNaturalLanguageProcessor(
  config?: Partial<AIProviderConfig>
): NaturalLanguageProcessor {
  const defaultConfig: AIProviderConfig = {
    provider: "gemini",
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-2.5-flash-lite-preview-06-17",
  };

  // If using local provider, don't include API key
  if (config?.provider === "local") {
    return new NaturalLanguageProcessor({
      provider: "local",
      model: "fallback",
    });
  }

  return new NaturalLanguageProcessor({ ...defaultConfig, ...config });
}
