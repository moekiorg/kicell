import {
  INarrator,
  NarrativeContext,
  GeneratedDescription,
  AIProviderConfig,
} from "./types.js";
import { GeminiProvider } from "./providers/gemini-provider.js";

export class AINarrator implements INarrator {
  private provider: GeminiProvider;

  constructor(config: AIProviderConfig) {
    this.provider = new GeminiProvider(config);
  }

  async generateLocationDescription(
    context: NarrativeContext
  ): Promise<GeneratedDescription> {
    const location = context.blueprint.entities.locations.find(
      (l) => l.id === context.gameContext.currentLocation
    );

    if (!location) {
      return {
        text: "You find yourself in an undefined space.",
        confidence: 0.1,
        mood: "mysterious",
      };
    }

    // Get objects and characters at current location
    const objects = context.blueprint.entities.objects.filter(
      (o) => o.initial_location === location.id
    );
    const characters = context.blueprint.entities.characters.filter(
      (c) => c.initial_location === location.id && c.id !== "player"
    );

    const prompt = this.buildLocationPrompt(
      location,
      objects,
      characters,
      context
    );
    return this.provider.generateText(prompt, context);
  }

  async generateActionResponse(
    context: NarrativeContext
  ): Promise<GeneratedDescription> {
    if (!context.actionPerformed || !context.targetEntity) {
      return {
        text: "Something happens in response to your action.",
        confidence: 0.2,
        mood: "neutral",
      };
    }

    const targetObject = context.blueprint.entities.objects.find(
      (o) => o.id === context.targetEntity
    );
    const targetCharacter = context.blueprint.entities.characters.find(
      (c) => c.id === context.targetEntity
    );

    const prompt = this.buildActionPrompt(
      context.actionPerformed,
      targetObject || targetCharacter,
      context
    );

    return this.provider.generateText(prompt, context);
  }

  async generateObjectListing(
    objectNames: string[],
    context: NarrativeContext
  ): Promise<GeneratedDescription> {
    const prompt = `自然な日本語でアイテムの存在を描写してください：

アイテムリスト: ${objectNames.join("、")}
現在の場所: ${
      context.blueprint.entities.locations.find(
        (l) => l.id === context.gameContext.currentLocation
      )?.name
    }

箇条書きではなく、自然な文章で描写してください。「～が見える」「～がある」「～が置かれている」などの表現を使って、まるで小説のような描写にしてください。`;

    return this.provider.generateText(prompt, context);
  }

  async enhanceStaticDescription(
    originalText: string,
    context: NarrativeContext
  ): Promise<GeneratedDescription> {
    const prompt = `この描写を雰囲気のある詳細で強化してください：

元の文章: "${originalText}"

現在の状況:
- ターン数: ${context.gameContext.turnCount}
- 最近の行動: ${
      context.gameContext.recentActions.slice(-3).join(", ") || "なし"
    }

核となる意味を保ちながら、感覚的な詳細と雰囲気を追加してください。より没入感があり魅力的にしてください。日本語で回答してください。`;

    return this.provider.generateText(prompt, context);
  }

  private buildLocationPrompt(
    location: any,
    objects: any[],
    characters: any[],
    context: NarrativeContext
  ): string {
    const objectsList = objects.map((o) => o.name).join(", ");
    const charactersList = characters.map((c) => c.name).join(", ");

    // Build style examples section
    const styleExamplesText =
      context.styleExamples && context.styleExamples.length > 0
        ? `\n\n**文体の参考例（この作者の書き方を真似してください）**:\n${context.styleExamples
            .map((example, i) => `${i + 1}. "${example}"`)
            .join("\n")}`
        : "";

    return `この場所を設計者の文体で描写してください：

場所名: ${location.name}
基本情報: "${location.description}"${styleExamplesText}

**重要**: 以下の要素を自然に描写に織り込んでください：
存在するオブジェクト: ${objectsList || "なし"}
存在するキャラクター: ${charactersList || "なし"}

プレイヤーの状況:
- ターン数: ${context.gameContext.turnCount}
- 最近の行動: ${
      context.gameContext.recentActions.slice(-3).join(", ") || "なし"
    }

描写の要件:
- 上記の参考例と同じ文体・トーン・表現スタイルを使用
- 設計者の語彙選択や文章構造の特徴を真似る
- オブジェクトやキャラクターは環境の一部として自然に描写
- 元の基本情報の雰囲気を保持しつつ、五感的な詳細を追加
- 3-4文程度の適度な長さ

設計者の文体を忠実に再現して、日本語で美しく雰囲気のある描写を生成してください。`;
  }

  private buildActionPrompt(
    action: string,
    target: any,
    context: NarrativeContext
  ): string {
    const targetName = target?.name || context.objectInvolved || "何か";
    const targetDescription = target?.description || "オブジェクト";

    // Build style examples section
    const styleExamplesText =
      context.styleExamples && context.styleExamples.length > 0
        ? `\n\n**文体の参考例（この作者の書き方を真似してください）**:\n${context.styleExamples
            .slice(0, 5)
            .map((example, i) => `${i + 1}. "${example}"`)
            .join("\n")}`
        : "";

    return `この行動に対する設計者の文体での反応を生成してください：

行動: ${action}
対象: ${targetName} (${targetDescription})
ターン: ${context.gameContext.turnCount}${styleExamplesText}

「${targetName}」に対して「${action}」を実行した際の即座の感覚的体験と結果を描写してください。

描写の要件:
- 上記の参考例と同じ文体・トーン・表現スタイルを使用
- 設計者の語彙選択や文章構造の特徴を真似る
- プレイヤーが見るもの、聞くもの、感じるものに焦点を当てる
- 簡潔でありながら雰囲気のあるもの（1-2文程度）
- 元の世界観と一貫性を保つ

設計者の文体を忠実に再現して、日本語で回答してください。`;
  }

  async generateObjectsAndCharactersDescription(
    context: NarrativeContext
  ): Promise<GeneratedDescription> {
    const objects = context.objectsPresent || [];
    const characters = context.blueprint.entities.characters.filter(
      (c) =>
        c.initial_location === context.currentLocation?.id && c.id !== "player"
    );

    if (objects.length === 0 && characters.length === 0) {
      return {
        text: "",
        confidence: 1.0,
        mood: "neutral",
      };
    }

    const prompt = this.buildObjectsAndCharactersPrompt(
      objects,
      characters,
      context
    );
    return this.provider.generateText(prompt, context);
  }

  private buildObjectsAndCharactersPrompt(
    objects: any[],
    characters: any[],
    context: NarrativeContext
  ): string {
    const objectsList = objects
      .map((o) => `${o.name} - ${o.description}`)
      .join("\n");
    const charactersList = characters
      .map((c) => `${c.name} - ${c.description}`)
      .join("\n");

    // Build style examples section
    const styleExamplesText =
      context.styleExamples && context.styleExamples.length > 0
        ? `\n\n**文体の参考例（この作者の書き方を真似してください）**:\n${context.styleExamples
            .slice(0, 5)
            .map((example, i) => `${i + 1}. "${example}"`)
            .join("\n")}`
        : "";

    return `以下の存在を設計者の文体で自然に描写してください：

場所: ${context.currentLocation?.name}

存在するオブジェクト:
${objectsList || "なし"}

存在するキャラクター:
${charactersList || "なし"}${styleExamplesText}

描写の要件:
- 上記の参考例と同じ文体・トーン・表現スタイルを使用
- オブジェクトやキャラクターを場所の一部として自然に描写
- リスト形式ではなく、散文として美しく表現
- それぞれの存在感や雰囲気を感じられるように
- 2-3文程度の簡潔で印象的な描写
- 場所の説明と重複しないよう注意

設計者の文体を忠実に再現して、日本語で美しく描写してください。`;
  }

  async generateFullEnvironmentDescription(
    context: NarrativeContext
  ): Promise<GeneratedDescription> {
    const objects = context.objectsPresent || [];
    const characters = context.blueprint.entities.characters.filter(
      (c) =>
        c.initial_location === context.currentLocation?.id && c.id !== "player"
    );
    const exits = context.currentLocation?.connections || [];

    // If nothing to describe, return empty
    if (objects.length === 0 && characters.length === 0 && exits.length === 0) {
      return {
        text: "",
        confidence: 1.0,
        mood: "neutral",
      };
    }

    const prompt = this.buildFullEnvironmentPrompt(
      objects,
      characters,
      exits,
      context
    );
    return this.provider.generateText(prompt, context);
  }

  private buildFullEnvironmentPrompt(
    objects: any[],
    characters: any[],
    exits: any[],
    context: NarrativeContext
  ): string {
    const locationDescription = context.currentLocation?.description || "";

    // Filter out objects/characters already mentioned in location description
    const unmentionedobjects = objects.filter((obj) => {
      const objName = obj.name.toLowerCase();
      const locDesc = locationDescription.toLowerCase();
      return (
        !locDesc.includes(objName) &&
        !this.isImplicitlyMentioned(obj, locationDescription)
      );
    });

    const unmentionedCharacters = characters.filter((char) => {
      const charName = char.name.toLowerCase();
      const locDesc = locationDescription.toLowerCase();
      return (
        !locDesc.includes(charName) &&
        !this.isImplicitlyMentioned(char, locationDescription)
      );
    });

    const objectsList = unmentionedobjects
      .map((o) => `${o.name} - ${o.description}`)
      .join("\n");
    const charactersList = unmentionedCharacters
      .map((c) => `${c.name} - ${c.description}`)
      .join("\n");

    // Build exits information with destination names
    const exitsList = exits
      .map((exit) => {
        const targetLocation = context.blueprint.entities.locations.find(
          (l) => l.id === exit.to
        );
        const targetName = targetLocation ? targetLocation.name : exit.to;
        const targetDesc = targetLocation?.description || "";
        return `${exit.direction}方向 → ${targetName}${
          targetDesc ? ` (${targetDesc.slice(0, 50)}...)` : ""
        }`;
      })
      .join("\n");

    // Build style examples section
    const styleExamplesText =
      context.styleExamples && context.styleExamples.length > 0
        ? `\n\n**文体の参考例（この作者の書き方を真似してください）**:\n${context.styleExamples
            .slice(0, 5)
            .map((example, i) => `${i + 1}. "${example}"`)
            .join("\n")}`
        : "";

    return `以下の環境要素を設計者の文体で自然に描写してください：

現在の場所: ${context.currentLocation?.name}
場所の既存説明: "${locationDescription}"

**重要**: 既存の場所説明に含まれていない要素のみを描写してください

まだ言及されていないオブジェクト:
${objectsList || "なし"}

まだ言及されていないキャラクター:
${charactersList || "なし"}

利用可能な出口/経路:
${exitsList || "なし"}${styleExamplesText}

描写の要件:
- 上記の参考例と同じ文体・トーン・表現スタイルを使用
- 既存の場所説明と重複する内容は絶対に含めない
- 新しい情報のみを自然に描写
- リスト形式ではなく、散文として美しく表現
- 出口は「東には〜が見える」「〜の方向に道が続いている」のような自然な表現
- 2-3文程度の簡潔で印象的な描写
- 既存説明で十分な場合は何も出力しない

設計者の文体を忠実に再現し、重複を避けて、日本語で美しく補完的な描写を生成してください。`;
  }

  private isImplicitlyMentioned(
    entity: any,
    locationDescription: string
  ): boolean {
    const locationDesc = locationDescription.toLowerCase();

    // Check for common implicit references
    if (
      entity.name.includes("椅子") &&
      (locationDesc.includes("椅子") || locationDesc.includes("座る"))
    ) {
      return true;
    }
    if (entity.name.includes("木") && locationDesc.includes("木")) {
      return true;
    }
    if (
      entity.name.includes("本") &&
      (locationDesc.includes("本") || locationDesc.includes("書"))
    ) {
      return true;
    }

    return false;
  }
}

// Factory function for easy instantiation
export function createNarrator(config?: Partial<AIProviderConfig>): AINarrator {
  const defaultConfig: AIProviderConfig = {
    provider: "gemini",
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-2.5-flash-lite-preview-06-17",
  };

  // If no API key, fall back to template-based provider
  if (!defaultConfig.apiKey) {
    defaultConfig.provider = "local";
  }

  return new AINarrator({ ...defaultConfig, ...config });
}
