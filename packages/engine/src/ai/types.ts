import { Blueprint, EntityId } from "@kicell/blueprint";

export interface GameContext {
  currentLocation: EntityId;
  inventory: Set<EntityId>;
  entityStates: Map<EntityId, Map<string, any>>;
  turnCount: number;
  recentActions: string[];
}

export interface NarrativeContext {
  blueprint: Blueprint;
  gameContext: GameContext;
  focusEntity?: EntityId;
  actionPerformed?: string;
  targetEntity?: EntityId;
  objectInvolved?: string;
  currentLocation?: any;
  objectsPresent?: any[];
  styleExamples?: string[];
}

export interface GeneratedDescription {
  text: string;
  mood?: "neutral" | "tense" | "mysterious" | "peaceful" | "exciting";
  confidence: number;
}

export interface INarrator {
  generateLocationDescription(
    context: NarrativeContext
  ): Promise<GeneratedDescription>;
  generateActionResponse(
    context: NarrativeContext
  ): Promise<GeneratedDescription>;
  generateObjectListing(
    objectNames: string[],
    context: NarrativeContext
  ): Promise<GeneratedDescription>;
  enhanceStaticDescription(
    originalText: string,
    context: NarrativeContext
  ): Promise<GeneratedDescription>;
  generateObjectsAndCharactersDescription(
    context: NarrativeContext
  ): Promise<GeneratedDescription>;
  generateFullEnvironmentDescription(
    context: NarrativeContext
  ): Promise<GeneratedDescription>;
}

export interface ConversationalCharacter {
  greeting?: string;
  topics?: Record<string, string>;
  farewell?: string;
  personality?: string;
  knowledge?: string[];
  constraints?: string[];
}

export interface ConversationContext {
  character: ConversationalCharacter;
  conversationHistory: Array<{
    speaker: "player" | "character";
    message: string;
    timestamp: number;
  }>;
  gameContext: GameContext;
  blueprint: Blueprint;
}

export interface ConversationResponse {
  text: string;
  action?: string;
  confidence: number;
}

export interface IConversationHandler {
  generateCharacterResponse(
    playerMessage: string,
    context: ConversationContext
  ): Promise<ConversationResponse>;
}

export interface AIProviderConfig {
  provider: "gemini" | "local";
  apiKey?: string;
  model?: string;
}
