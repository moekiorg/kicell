# @kicell/blueprint

Blueprint system for creating text adventure game worlds with integrated compiler.

## Installation

```bash
npm install @kicell/blueprint
```

## Usage

```typescript
import { k } from "@kicell/blueprint";

const room = k
  .room("start")
  .name("Starting Room")
  .description("A simple room to begin your adventure.");

const world = k.world("My Game").author("Your Name").add(room);

export default world;
```

## Features

- Fluent API for creating game worlds
- TypeScript support
- Integrated compiler
- Support for rooms, things, and characters
- Object type system (containers, supporters, vehicles, etc.)

For more information, visit the [main repository](https://github.com/moekiorg/kicell).
