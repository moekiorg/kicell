#!/usr/bin/env node

import { program } from "commander";
import { compileScenario } from "./compiler.js";

program
  .name("kicell-compile")
  .description("kicell Blueprint Compiler")
  .version("1.0.0");

program
  .argument("<scenario>", "TypeScript scenario file to compile")
  .option("-o, --output <path>", "Output JSON file path")
  .option("--no-pretty", "Disable pretty formatting")
  .action(async (scenarioPath: string, options: any) => {
    console.log("🔨 シナリオをコンパイル中...");

    const result = await compileScenario(scenarioPath, {
      outputPath: options.output,
      pretty: options.pretty,
    });

    if (result.success) {
      console.log(
        `✅ コンパイル成功: ${result.inputPath} → ${result.outputPath}`
      );
    } else {
      console.error(`❌ コンパイル失敗: ${result.error}`);
      process.exit(1);
    }
  });

program.parse();
