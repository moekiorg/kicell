# Kycell

Kycellは、テキストアドベンチャーゲームを簡単に作成できる統合開発環境です。直感的なBlueprint DSLでゲーム世界を設計し、高性能なゲームエンジンで実行できます。

## パッケージ構成

- **@kycell/blueprint** - ゲーム世界設計用のFluent API＋コンパイラー
- **@kycell/engine** - Blueprint実行用ゲームエンジン  
- **@kycell/cli** - コマンドライン実行環境

## クイックスタート

### インストール
```bash
npm install @kycell/blueprint @kycell/engine @kycell/cli
```

### ゲーム作成
```typescript
import { k } from "@kycell/blueprint";

// 場所の定義
const forest = k.room("forest")
  .name("深い森")
  .description("古い木々に囲まれた薄暗い森。");

const clearing = k.room("clearing")
  .name("森の空き地")
  .description("森の中の小さな空き地。陽光が差し込んでいる。");

// 場所の接続
forest.isNorthOf(clearing);

// オブジェクトの定義
const key = k.thing("golden_key")
  .name("黄金の鍵")
  .description("美しく光る黄金の鍵。")
  .at(forest)
  .isPortable();

// キャラクターの定義
const sage = k.character("wise_sage")
  .name("賢者")
  .description("森に住む古い賢者。")
  .at(forest)
  .isConversational({
    greeting: "ようこそ、若き冒険者よ。",
    topics: {
      "森": "この森には古い秘密が眠っている。",
      "鍵": "その鍵は特別な扉を開く。"
    },
    farewell: "気をつけて行くのだ。"
  });

// ワールドの構築
export default k.world("森の冒険")
  .author("作者名")
  .add(forest, clearing, key, sage, k.player().at(forest));
```

### コンパイルと実行

**1. 環境設定**
```bash
# .envファイルを作成してGemini API keyを設定
cp .env.example .env
# .envファイルを編集してAPIキーを設定
```

**2. コンパイルと実行**
```bash
# Blueprintをコンパイル
pnpm compile game.ts

# ゲーム実行
pnpm play game.json
```

## Blueprint DSL 文法

### 基本構造
```typescript
import { k } from "@kycell/blueprint";

export default k.world("ゲームタイトル")
  .author("作者名")
  .add(/* エンティティやルール */, k.player().at(startingRoom));
```

### Room（場所）
場所は`Room`クラスとして実装され、プレイヤーやオブジェクトを収容できます。

```typescript
const room = k.room("room_id")
  .name("場所の名前")
  .description("場所の説明")
  .isOutdoors()           // 屋外フラグ
  .isDark();              // 暗闇フラグ

// 方向での接続（自動的に双方向接続）
roomA.isNorthOf(roomB);
roomA.isSouthOf(roomB);
roomA.isEastOf(roomB);
roomA.isWestOf(roomB);
```

### Thing（オブジェクト）
基本的なオブジェクト：
```typescript
const thing = k.thing("thing_id")
  .name("オブジェクトの名前")
  .description("オブジェクトの説明")
  .at(room)               // 初期配置場所
  .isPortable()           // 持ち運び可能
  .isFixed()              // 固定（持ち運び不可）
  .isOpenable()           // 開くことができる
  .isOpen()               // 開いた状態
  .isClosed()             // 閉じた状態
  .isLocked()             // 鍵がかかっている
  .isContainer()          // 容器
  .isSupporter()          // 支持体（上に物を置ける）
  .isClimbable(destination) // 登ることができる
  .isEnterable(destination) // 中に入ることができる
  .isReadable(content);   // 読むことができる
```

### 特殊なオブジェクトタイプ
```typescript
// 背景オブジェクト（複数の部屋に存在）
const sky = k.backdrop("sky")
  .name("空")
  .description("青い空が広がっている。")
  .presentInRooms(["forest", "clearing", "field"]);

// 風景オブジェクト（装飾的、固定）
const flowers = k.scenery("flowers")
  .name("花")
  .description("美しい野の花が咲いている。")
  .at(clearing);

// 乗り物
const horse = k.vehicle("horse", 2) // 容量2人
  .name("馬")
  .description("立派な白い馬。")
  .at(field)
  .requiresKey("bridle");

// 便利なヘルパー
const chest = k.container("chest")
  .name("宝箱")
  .isLocked();

const table = k.supporter("table")
  .name("テーブル")
  .isFixed();
```

### Character（キャラクター）
```typescript
const character = k.character("character_id")
  .name("キャラクターの名前")
  .description("キャラクターの説明")
  .at(location)           // 初期配置場所
  .has([thing1, thing2])   // 初期所持アイテム
  .isConversational({     // 会話可能キャラクター
    greeting: "挨拶メッセージ",
    topics: {
      "トピック1": "応答メッセージ1",
      "トピック2": "応答メッセージ2"
    },
    farewell: "別れのメッセージ"
  });
```

### ルールシステム
```typescript
const rule = k.rule()
  .onEnterRoom(room)         // 場所に入った時
  .everyTurn()               // 毎ターン
  .if([                      // 条件（オプション）
    k.flag("flag_name").is(true),
    k.counter("counter_name").greaterThan(5)
  ])
  .then([                    // 効果
    k.show("表示するメッセージ"),
    k.give(thing),
    k.flag("flag_name").set(false),
    k.counter("counter_name").add(1)
  ]);
```

### 条件と効果
```typescript
// 条件
k.player().isAt(room)
k.flag("flag_name").is(true)
k.counter("counter_name").equals(5)
k.counter("counter_name").greaterThan(10)

// 効果
k.show("メッセージ")          // テキスト表示
k.give(thing)               // アイテムを渡す
k.flag("flag_name").set(true) // フラグ設定
k.counter("count").add(5)   // カウンター操作
k.end("勝利メッセージ")      // ゲーム終了
```

## 特徴

- **直感的なFluent API** - 自然言語に近い記述でゲーム世界を構築
- **強力なオブジェクトシステム** - 容器、支持体、登攀可能オブジェクトなど豊富な機能
- **柔軟なルールエンジン** - 条件と効果の組み合わせで複雑なゲームロジックを実現
- **会話システム** - NPCとの自然な対話機能
- **統合コンパイラー** - TypeScriptからJSONへの自動変換
- **AI連携** - 自然言語処理による入力解析

## ライセンス

MIT
