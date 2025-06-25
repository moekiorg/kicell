import { GameUIEvent } from "@kycell/engine";

export function createUIEventHandler() {
  return (event: GameUIEvent) => {
    switch (event.type) {
      case "game_start":
        console.log(`\n=== ${event.data.title} ===`);
        console.log(`by ${event.data.author}`);
        break;

      case "location_display":
        console.log(`\n--- ${event.data.name} ---`);
        console.log(event.data.description + "\n");
        break;

      case "message_display":
        const category = event.data.category || "info";
        const prefix =
          category === "error"
            ? "❌ "
            : category === "success"
            ? "✅ "
            : category === "warning"
            ? "⚠️ "
            : "";
        console.log(`${prefix}${event.data.message}`);
        break;

      case "inventory_display":
        if (event.data.items.length === 0) {
          console.log("You are carrying nothing.");
        } else {
          const itemNames = event.data.items.map((item) => item.name);
          console.log(`You are carrying: ${itemNames.join(", ")}`);
        }
        break;

      case "game_over":
        const outcome = event.data.outcome === "victory" ? "🎉" : "💀";
        console.log(`\n${outcome} Game Over! ${outcome}`);
        console.log(event.data.message);
        break;

      case "entity_description":
        console.log(`--- ${event.data.name} ---`);
        console.log(event.data.description);
        break;

      case "conversation":
        console.log(`\n${event.data.characterName}: "${event.data.message}"`);
        break;

      case "debug_log":
        if (process.env.DEBUG || process.env.NODE_ENV === "development") {
          console.log(`🔍 [DEBUG] ${event.data.message}`);
        }
        break;

      default:
        console.log(`[DEBUG] Unhandled UI event: ${event.type}`);
        break;
    }
  };
}
