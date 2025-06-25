export interface ParsedCommand {
  command: string;
  args: string[];
}

export class CommandParser {
  parse(input: string): ParsedCommand {
    const trimmed = input.trim();

    if (trimmed.startsWith("/")) {
      const parts = trimmed.slice(1).split(" ");
      return {
        command: parts[0],
        args: parts.slice(1),
      };
    }

    throw new Error("Invalid command format");
  }
}
