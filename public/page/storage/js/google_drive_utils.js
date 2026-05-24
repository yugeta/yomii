/**
 * Google Drive ユーティリティ関数（純粋関数）
 * 
 * テスト容易性のために副作用のない関数を分離
 */

/**
 * Google Drive API のファイルエントリを内部形式に変換
 * @param {object} api_file - Google Drive API files.list のファイルオブジェクト
 * @returns {{name: string, size: number, modified: string, is_folder: boolean, file_id: string}}
 */
export function transform_file_entry(api_file){
  const is_folder = api_file.mimeType === "application/vnd.google-apps.folder"
  const size = is_folder ? 0 : parseInt(api_file.size || "0", 10)

  let modified = ""
  if(api_file.modifiedTime){
    const d = new Date(api_file.modifiedTime)
    modified = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`
  }

  return {
    name      : api_file.name,
    size      : size,
    modified  : modified,
    is_folder : is_folder,
    file_id   : api_file.id,
  }
}

/**
 * ファイル一覧をフィルタリング
 * - 隠しファイル（ドットで始まる名前）を除外
 * - ディレクトリはすべて含む
 * - ファイルは .yomii 拡張子のみ含む
 * @param {Array} files - 内部形式のファイル配列
 * @returns {Array}
 */
export function filter_file_list(files){
  return files.filter(file => {
    if(file.name.startsWith(".")) return false
    if(file.is_folder || file.type === "dir") return true
    return file.name.endsWith(".yomii")
  })
}

/**
 * ファイル一覧をソート
 * - ディレクトリを先頭に
 * - 同一タイプ内では名前順（localeCompare）
 * @param {Array} files - 内部形式のファイル配列
 * @returns {Array}
 */
export function sort_file_list(files){
  return [...files].sort((a, b) => {
    const a_is_dir = a.is_folder || a.type === "dir"
    const b_is_dir = b.is_folder || b.type === "dir"
    if(a_is_dir && !b_is_dir) return -1
    if(!a_is_dir && b_is_dir) return 1
    return a.name.localeCompare(b.name)
  })
}

/**
 * バイト数を人間が読みやすい形式にフォーマット
 * - 1024MB 未満: MB 単位（小数点以下なし）
 * - 1024MB 以上: GB 単位（小数第1位まで）
 * @param {number} bytes - バイト数
 * @returns {string}
 */
export function format_storage_size(bytes){
  const mb = bytes / (1024 * 1024)
  if(mb < 1024){
    return `${Math.round(mb)}MB`
  }
  const gb = mb / 1024
  return `${gb.toFixed(1)}GB`
}

/**
 * 残り容量が少ないかチェック
 * @param {number} remaining_bytes - 残りバイト数
 * @returns {boolean} 500MB 未満なら true
 */
export function check_low_storage(remaining_bytes){
  return remaining_bytes < 500 * 1024 * 1024
}

/**
 * パンくずリスト配列を生成
 * @param {string} dir_path - フォルダパス（例: "manga/shonen"）
 * @returns {Array<{name: string, path: string}>|null} パンくずリスト配列、空パスの場合は null
 */
export function generate_breadcrumbs(dir_path){
  if(!dir_path) return null

  const segments = dir_path.split("/").filter(s => s)
  if(segments.length === 0) return null

  const breadcrumbs = [{ name: "Yomii", path: "" }]
  for(let i = 0; i < segments.length; i++){
    breadcrumbs.push({
      name : decodeURIComponent(segments[i].replace(/\+/g, " ")),
      path : segments.slice(0, i + 1).join("/"),
    })
  }
  return breadcrumbs
}

/**
 * ファイル数とサイズ合計を集計
 * - フォルダ（type="dir" or is_folder=true）は集計に含めない
 * @param {Array} files - 内部形式のファイル配列
 * @returns {{count: number, total_size: number}}
 */
export function aggregate_file_stats(files){
  let count = 0
  let total_size = 0
  for(const file of files){
    if(file.is_folder || file.type === "dir") continue
    count++
    total_size += file.size || 0
  }
  return { count, total_size }
}
