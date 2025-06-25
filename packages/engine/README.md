# @kicell/engine

Game engine for executing immersive text game blueprints.

## Installation

```bash
npm install @kicell/engine
```

## Usage

```typescript
import { GameEngine } from "@kicell/engine";
import { Blueprint } from "@kicell/blueprint";

const engine = new GameEngine(blueprint, {
  aiProvider: {
    type: "gemini",
    apiKey: process.env.GEMINI_API_KEY,
  },
});

await engine.start();
```

## Features

- Natural language processing
- AI-powered conversations
- Object system with spatial relationships
- Save/load functionality
- Command processing
- Inventory management

For more information, visit the [main repository](https://github.com/moekiorg/kicell).
