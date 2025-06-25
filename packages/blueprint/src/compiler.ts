import { resolve, extname } from 'path';
import { writeFileSync } from 'fs';

export interface CompileOptions {
  outputPath?: string;
  pretty?: boolean;
}

export interface CompileResult {
  inputPath: string;
  outputPath: string;
  success: boolean;
  error?: string;
}

export async function compileScenario(
  filePath: string, 
  options: CompileOptions = {}
): Promise<CompileResult> {
  const resolvedPath = resolve(filePath);
  const ext = extname(resolvedPath);
  
  if (ext !== '.ts' && ext !== '.js') {
    return {
      inputPath: resolvedPath,
      outputPath: '',
      success: false,
      error: `サポートされていないファイルタイプ: ${ext}`
    };
  }

  try {
    const scenarioModule = await import(resolvedPath);
    const world = scenarioModule.default;
    
    if (!world) {
      return {
        inputPath: resolvedPath,
        outputPath: '',
        success: false,
        error: 'シナリオファイルはWorldをデフォルトエクスポートする必要があります'
      };
    }

    const blueprint = world.build();
    const indent = options.pretty !== false ? 2 : 0;
    const jsonContent = JSON.stringify(blueprint, null, indent);
    
    const outputPath = options.outputPath || resolvedPath.replace(/\.(ts|js)$/, '.json');
    writeFileSync(outputPath, jsonContent, 'utf-8');
    
    return {
      inputPath: resolvedPath,
      outputPath,
      success: true
    };
  } catch (error) {
    return {
      inputPath: resolvedPath,
      outputPath: '',
      success: false,
      error: `コンパイルエラー: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}