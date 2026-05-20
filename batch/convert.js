#!/usr/bin/env node
/**
 * yomii-batch: ZIP/PDF を .yomii 形式に一括変換
 * 
 * 使い方:
 *   node convert.js ./input/           → ./output/ に出力
 *   node convert.js ./input/ ./out/    → ./out/ に出力
 *   node convert.js ./input/ --quality 0.5
 * 
 * オプション:
 *   --quality <0.1-1.0>   WebP 品質（デフォルト: 0.3）
 *   --max-size <px>       画像の最大サイズ（デフォルト: 1500）
 *   --help                ヘルプ表示
 */

import fs from "fs"
import path from "path"
import { pipeline } from "stream/promises"
import sharp from "sharp"
import archiver from "archiver"
import { createReadStream } from "fs"
import { Buffer } from "buffer"

// ============================================================
// 設定
// ============================================================
const DEFAULT_QUALITY  = 0.3
const DEFAULT_MAX_SIZE = 1500
const TARGET_EXTS      = [".zip", ".pdf"]
const IMAGE_EXTS       = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]

// ============================================================
// 引数パース
// ============================================================
function parse_args(){
  const args = process.argv.slice(2)
  const config = {
    input_dir  : null,
    output_dir : null,
    quality    : DEFAULT_QUALITY,
    max_size   : DEFAULT_MAX_SIZE,
  }

  const positional = []
  for(let i = 0; i < args.length; i++){
    switch(args[i]){
      case "--quality":
        config.quality = parseFloat(args[++i])
        break
      case "--max-size":
        config.max_size = parseInt(args[++i])
        break
      case "--help":
      case "-h":
        print_help()
        process.exit(0)
      default:
        positional.push(args[i])
    }
  }

  config.input_dir = positional[0] || null
  config.output_dir = positional[1] || null

  return config
}

function print_help(){
  console.log(`
yomii-batch: ZIP/PDF を .yomii 形式に一括変換

使い方:
  node convert.js <入力フォルダ> [出力フォルダ] [オプション]

オプション:
  --quality <0.1-1.0>   WebP 品質（デフォルト: ${DEFAULT_QUALITY}）
  --max-size <px>       画像の最大サイズ（デフォルト: ${DEFAULT_MAX_SIZE}）
  --help, -h            このヘルプを表示

例:
  node convert.js ./books/
  node convert.js ./books/ ./converted/ --quality 0.5
`)
}

// ============================================================
// メイン処理
// ============================================================
async function main(){
  const config = parse_args()

  if(!config.input_dir){
    console.error("エラー: 入力フォルダを指定してください")
    console.error("  node convert.js <入力フォルダ> [出力フォルダ]")
    process.exit(1)
  }

  const input_dir = path.resolve(config.input_dir)
  const output_dir = config.output_dir ? path.resolve(config.output_dir) : path.join(path.dirname(input_dir), "output")

  if(!fs.existsSync(input_dir)){
    console.error(`エラー: 入力フォルダが見つかりません: ${input_dir}`)
    process.exit(1)
  }

  // 出力フォルダ作成
  if(!fs.existsSync(output_dir)){
    fs.mkdirSync(output_dir, { recursive: true })
  }

  // 対象ファイルを検索
  const files = find_target_files(input_dir)
  if(files.length === 0){
    console.log("変換対象のファイルが見つかりませんでした。")
    process.exit(0)
  }

  console.log(`\n=== yomii-batch ===`)
  console.log(`入力: ${input_dir}`)
  console.log(`出力: ${output_dir}`)
  console.log(`品質: ${config.quality}`)
  console.log(`最大サイズ: ${config.max_size}px`)
  console.log(`対象: ${files.length} ファイル\n`)

  let success = 0
  let failed = 0

  for(let i = 0; i < files.length; i++){
    const file = files[i]
    const rel = path.relative(input_dir, file)
    const progress = `[${i + 1}/${files.length}]`
    
    try{
      console.log(`${progress} 変換中: ${rel}`)
      await convert_file(file, output_dir, config)
      success++
      console.log(`${progress} 完了: ${rel}`)
    }catch(e){
      failed++
      console.error(`${progress} 失敗: ${rel} - ${e.message}`)
    }
  }

  console.log(`\n=== 完了 ===`)
  console.log(`成功: ${success} / 失敗: ${failed} / 合計: ${files.length}`)
}

// ============================================================
// ファイル検索
// ============================================================
function find_target_files(dir){
  const results = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for(const entry of entries){
    const full_path = path.join(dir, entry.name)
    if(entry.isDirectory()){
      // サブフォルダも再帰的に検索
      results.push(...find_target_files(full_path))
    }else if(entry.isFile()){
      const ext = path.extname(entry.name).toLowerCase()
      if(TARGET_EXTS.includes(ext)){
        results.push(full_path)
      }
    }
  }

  return results
}

// ============================================================
// 変換処理
// ============================================================
async function convert_file(file_path, output_dir, config){
  const ext = path.extname(file_path).toLowerCase()
  const basename = path.basename(file_path, ext)
  const output_path = path.join(output_dir, `${basename}.yomii`)

  // 既に変換済みならスキップ
  if(fs.existsSync(output_path)){
    console.log(`  スキップ（既に存在）: ${basename}.yomii`)
    return
  }

  switch(ext){
    case ".zip":
      await convert_zip(file_path, output_path, config)
      break
    case ".pdf":
      await convert_pdf(file_path, output_path, config)
      break
  }
}

// ============================================================
// ZIP → .yomii
// ============================================================
async function convert_zip(zip_path, output_path, config){
  const { default: AdmZip } = await import("adm-zip")
  const zip = new AdmZip(zip_path)
  const entries = zip.getEntries()

  // 画像エントリーを抽出してソート
  const image_entries = entries
    .filter(entry => {
      if(entry.isDirectory) return false
      const ext = path.extname(entry.entryName).toLowerCase()
      return IMAGE_EXTS.includes(ext)
    })
    .sort((a, b) => a.entryName.localeCompare(b.entryName))

  if(image_entries.length === 0){
    throw new Error("画像ファイルが含まれていません")
  }

  // .yomii (ZIP) を作成
  const output = fs.createWriteStream(output_path)
  const archive = archiver("zip", { store: true }) // 無圧縮（画像は既に圧縮済み）
  archive.pipe(output)

  for(let i = 0; i < image_entries.length; i++){
    const entry = image_entries[i]
    const buffer = entry.getData()
    
    // WebP に変換
    const webp_buffer = await convert_image_to_webp(buffer, config)
    const num = String(i).padStart(4, "0")
    archive.append(webp_buffer, { name: `${num}.webp` })
  }

  // 設定ファイル
  const setting = {
    base_filename: path.basename(zip_path),
    name: path.basename(zip_path, path.extname(zip_path)),
    direction: "right",
    singles: [],
    deletes: [],
  }
  archive.append(JSON.stringify(setting, null, "  "), { name: "___setting.json" })

  await archive.finalize()
  await new Promise(resolve => output.on("close", resolve))
}

// ============================================================
// PDF → .yomii
// ============================================================
async function convert_pdf(pdf_path, output_path, config){
  // pdf-poppler or pdf2pic を使う代わりに、
  // sharp は PDF を直接読めないので、pdf-parse + canvas の代替として
  // ここでは poppler-utils の pdftoppm コマンドを使用
  const { execSync } = await import("child_process")
  const os = await import("os")
  
  const tmp_dir = path.join(os.tmpdir(), `yomii_pdf_${Date.now()}`)
  fs.mkdirSync(tmp_dir, { recursive: true })

  try{
    // pdftoppm で PNG に変換
    execSync(`pdftoppm -png -r 150 "${pdf_path}" "${tmp_dir}/page"`, {
      stdio: "pipe",
      timeout: 300000,
    })

    // 生成された PNG ファイルを取得
    const png_files = fs.readdirSync(tmp_dir)
      .filter(f => f.endsWith(".png"))
      .sort()

    if(png_files.length === 0){
      throw new Error("PDF からページを抽出できませんでした。pdftoppm がインストールされているか確認してください。")
    }

    // .yomii (ZIP) を作成
    const output = fs.createWriteStream(output_path)
    const archive = archiver("zip", { store: true })
    archive.pipe(output)

    for(let i = 0; i < png_files.length; i++){
      const png_path = path.join(tmp_dir, png_files[i])
      const buffer = fs.readFileSync(png_path)
      const webp_buffer = await convert_image_to_webp(buffer, config)
      const num = String(i).padStart(4, "0")
      archive.append(webp_buffer, { name: `${num}.webp` })
    }

    // 設定ファイル
    const setting = {
      base_filename: path.basename(pdf_path),
      name: path.basename(pdf_path, ".pdf"),
      direction: "right",
      singles: [],
      deletes: [],
    }
    archive.append(JSON.stringify(setting, null, "  "), { name: "___setting.json" })

    await archive.finalize()
    await new Promise(resolve => output.on("close", resolve))
  }finally{
    // 一時ファイル削除
    fs.rmSync(tmp_dir, { recursive: true, force: true })
  }
}

// ============================================================
// 画像 → WebP 変換
// ============================================================
async function convert_image_to_webp(buffer, config){
  let img = sharp(buffer)
  const metadata = await img.metadata()

  // リサイズ（最大サイズ制限）
  const w = metadata.width
  const h = metadata.height
  if(w > config.max_size || h > config.max_size){
    if(w > h){
      img = img.resize(config.max_size, null, { fit: "inside" })
    }else{
      img = img.resize(null, config.max_size, { fit: "inside" })
    }
  }

  // WebP に変換
  return img.webp({ quality: Math.round(config.quality * 100) }).toBuffer()
}

// ============================================================
// 実行
// ============================================================
main().catch(e => {
  console.error("致命的エラー:", e.message)
  process.exit(1)
})
