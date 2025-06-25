export interface CommandMetadata {
  name: string;
  description: string;
  naturalLanguagePatterns: string[];
  parameters: Array<{
    name: string;
    type: 'string' | 'character' | 'object' | 'direction';
    required: boolean;
    description: string;
  }>;
  examples: string[];
}

export interface ICommandWithMetadata {
  getMetadata(): CommandMetadata;
}

export class CommandRegistry {
  private commands: Map<string, CommandMetadata> = new Map();

  registerCommand(commandName: string, metadata: CommandMetadata): void {
    this.commands.set(commandName, metadata);
  }

  getAllCommands(): Map<string, CommandMetadata> {
    return new Map(this.commands);
  }

  getCommand(commandName: string): CommandMetadata | undefined {
    return this.commands.get(commandName);
  }

  generateNLPDescription(): string {
    const commandDescriptions = Array.from(this.commands.values())
      .map(cmd => {
        const patterns = cmd.naturalLanguagePatterns.join('、');
        const params = cmd.parameters
          .map(p => `${p.name}(${p.type}${p.required ? ', 必須' : ', 任意'})`)
          .join(', ');
        const examples = cmd.examples.join('" / "');
        
        return `- ${cmd.name}: ${cmd.description}
  パターン: ${patterns}
  パラメータ: ${params || 'なし'}
  例: "${examples}"`;
      })
      .join('\n\n');

    return `【利用可能なコマンド】\n${commandDescriptions}`;
  }
}