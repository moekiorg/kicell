export interface AppConfig {
  scenarioFile: string;
  continueFromSave: boolean;
}

export function parseArguments(args: string[]): AppConfig {
  let scenarioFile = "examples/example.scenario.json";
  let continueFromSave = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--continue") {
      continueFromSave = true;
    } else if (arg === "--help" || arg === "-h") {
      showHelp();
      process.exit(0);
    } else if (!arg.startsWith("--")) {
      scenarioFile = arg;
    }
  }

  return { scenarioFile, continueFromSave };
}

function showHelp(): void {
  console.log(`🎮 KyCell - Immersive Text Game Engine

使用方法:
  pnpm play [scenario-file] [options]

引数:
  scenario-file     ゲームシナリオファイル (デフォルト: examples/example.scenario.json)

オプション:
  --continue        最新のセーブデータから再開
  --help, -h        このヘルプを表示

例:
  pnpm play                           # 新しいゲームを開始
  pnpm play --continue                # 最新のセーブデータから再開
  pnpm play my-scenario.json          # カスタムシナリオで開始
  pnpm play my-scenario.json --continue  # カスタムシナリオの最新セーブから再開

ゲーム内コマンド:
  /help       - ゲーム内ヘルプを表示
  /save       - ゲームを保存
  /load       - セーブデータを読み込み
  /saves      - セーブファイル一覧
  quit/exit   - ゲーム終了`);
}