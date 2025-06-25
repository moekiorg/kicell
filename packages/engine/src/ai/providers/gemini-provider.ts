import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProviderConfig, NarrativeContext, GeneratedDescription } from '../types.js';

export class GeminiProvider {
  private config: AIProviderConfig;
  private genAI: GoogleGenerativeAI;

  constructor(config: AIProviderConfig) {
    this.config = config;
    
    if (!config.apiKey) {
      throw new Error('Gemini API key is required');
    }
    
    this.genAI = new GoogleGenerativeAI(config.apiKey);
  }

  async generateText(prompt: string, context: NarrativeContext): Promise<GeneratedDescription> {
    const { model = 'gemini-2.5-flash-lite-preview-06-17' } = this.config;

    try {
      const genModel = this.genAI.getGenerativeModel({ 
        model,
        generationConfig: {
          temperature: 0.3,  // Lower temperature for more consistent formatting
          maxOutputTokens: 200,
          topP: 0.8,
          topK: 40
        }
      });

      // Use different system prompts for different tasks
      let fullPrompt;
      if (prompt.includes('command parser') || prompt.includes('Japanese input')) {
        // For command parsing, use only the command parser system prompt
        fullPrompt = this.getCommandParserSystemPrompt() + '\n\n' + prompt;
      } else {
        // For narrative generation, use the narrative system prompt
        fullPrompt = this.getSystemPrompt() + '\n\n' + prompt;
      }
      
      const result = await genModel.generateContent(fullPrompt);
      const response = result.response;
      const text = response.text().trim();

      return {
        text,
        confidence: 0.8,
        mood: this.detectMood(text)
      };
    } catch (error: any) {
      console.error('Gemini Provider Error:', error);
      return {
        text: 'The scene shifts before your eyes...',
        confidence: 0.1,
        mood: 'neutral'
      };
    }
  }

  private getSystemPrompt(): string {
    return `You are a skilled narrator for an immersive text adventure game. Your role is to enhance and expand descriptions to create atmosphere and engagement.

Guidelines:
- Keep descriptions concise but vivid (1-3 sentences)
- Use atmospheric language that fits the scene
- Focus on sensory details (sight, sound, smell, feel)
- Maintain consistency with the game world
- ALWAYS mention objects and characters that are explicitly listed in the prompt
- Integrate objects naturally into the atmospheric description
- Don't introduce NEW objects or characters beyond those listed
- Use present tense, second person ("you see...")
- Create mood appropriate to the situation

Respond with only the enhanced description, no additional commentary.`;
  }

  private getCommandParserSystemPrompt(): string {
    return `You are a precise command parser for a Japanese text adventure game. Your ONLY job is to convert Japanese input into exact English game commands.

CRITICAL: You must respond in EXACTLY this format:
COMMAND: <command>
CONFIDENCE: <number>
EXPLANATION: <explanation>

You must ALWAYS start each line with the exact keywords above. No variation allowed.

Available commands: look, take, get, drop, read, climb, examine, go, move, north, south, east, west, up, down, in, out, inventory, help, quit

Examples:
Input: "手紙を手に取る" -> 
COMMAND: take letter
CONFIDENCE: 0.9
EXPLANATION: Taking the letter

Input: "周りを見回す" ->
COMMAND: look
CONFIDENCE: 0.9
EXPLANATION: Looking around`;
  }

  private detectMood(text: string): 'neutral' | 'tense' | 'mysterious' | 'peaceful' | 'exciting' {
    const tenseWords = ['danger', 'shadow', 'fear', 'threat', 'dark', 'ominous'];
    const mysteriousWords = ['mysterious', 'strange', 'whisper', 'secret', 'hidden'];
    const peacefulWords = ['calm', 'serene', 'gentle', 'peaceful', 'quiet', 'soft'];
    const excitingWords = ['exciting', 'adventure', 'discovery', 'bright', 'energy'];

    const lowerText = text.toLowerCase();
    
    if (tenseWords.some(word => lowerText.includes(word))) return 'tense';
    if (mysteriousWords.some(word => lowerText.includes(word))) return 'mysterious';
    if (peacefulWords.some(word => lowerText.includes(word))) return 'peaceful';
    if (excitingWords.some(word => lowerText.includes(word))) return 'exciting';
    
    return 'neutral';
  }
}