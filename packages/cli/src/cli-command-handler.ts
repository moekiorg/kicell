import { GameEngine } from "@kicell/engine";
import { CLISaveManager } from "./save-manager.js";

export async function handleCLICommands(
  input: string,
  engine: GameEngine,
  saveManager: CLISaveManager
): Promise<boolean> {
  const trimmed = input.trim();

  if (!trimmed.startsWith("/")) {
    return false;
  }

  const parts = trimmed.slice(1).split(/\s+/);
  const command = parts[0].toLowerCase();

  try {
    switch (command) {
      case "save":
        const filename = parts[1];
        const savePath = await saveManager.saveGame(engine, filename);
        console.log(`✅ ゲームを保存しました: ${savePath}`);
        return true;

      case "load":
        const loadFilename = parts[1];
        if (!loadFilename) {
          console.log(
            "❌ ロードするファイル名を指定してください。例: /load my_save.json"
          );
          return true;
        }
        await saveManager.loadGame(engine, loadFilename);
        console.log(`✅ ゲームを読み込みました: ${loadFilename}`);
        await engine.processCommand("look");
        return true;

      case "saves":
        const saves = await saveManager.listSaveFiles();
        if (saves.length === 0) {
          console.log("📁 セーブファイルが見つかりません。");
        } else {
          console.log("📁 利用可能なセーブファイル:");
          saves.forEach((save) => console.log(`   - ${save}`));
        }
        return true;

      case "help":
        console.log(`🎮 利用可能なコマンド:
- look: 周囲を見回す
- move [方向]: 指定した方向に移動
- take [アイテム]: アイテムを取る
- inventory: 持ち物を確認
- talk [キャラクター]: キャラクターと話す
- /save [ファイル名]: ゲームを保存 (ファイル名省略可)
- /load <ファイル名>: ゲームを読み込み
- /saves: セーブファイル一覧を表示
- /help: このヘルプを表示
- quit/exit: ゲームを終了

📂 セーブファイルは ${saveManager.getSaveDirectory()} に保存されます。
🚀 --continue オプションで最新のセーブデータから再開できます。`);
        return true;

      default:
        console.log(`❌ 不明なコマンド: /${command}`);
        return true;
    }
  } catch (error) {
    console.log(`❌ エラーが発生しました: ${error}`);
    return true;
  }
}
