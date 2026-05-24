/**
 * ReadingHistory
 * 読書履歴の管理（localStorage）
 * 
 * キャッシュ（IndexedDB）とは独立して管理される。
 * BookCache.clear() の影響を受けない。
 */
export class ReadingHistory {

  static STORAGE_KEY = "yomii_reading_history"
  static MAX_ENTRIES = 500

  /**
   * 履歴一覧を取得（新しい順）
   * @returns {Array}
   */
  static list() {
    try {
      const raw = localStorage.getItem(ReadingHistory.STORAGE_KEY)
      if (!raw) return []
      const entries = JSON.parse(raw)
      return entries.sort((a, b) => (b.read_at || 0) - (a.read_at || 0))
    } catch (e) {
      return []
    }
  }

  /**
   * 読書履歴を記録
   * @param {object} entry - { name, source, source_path }
   */
  static record(entry) {
    if (!entry || !entry.name) return

    const entries = ReadingHistory.list()

    // 同じ source_path のエントリがあれば更新
    const key = entry.source_path || entry.name
    const index = entries.findIndex(e => (e.source_path || e.name) === key)

    if (index >= 0) {
      entries[index].read_at = Date.now()
      entries[index].read_count = (entries[index].read_count || 0) + 1
      // name や source が変わっていたら更新
      entries[index].name = entry.name
      entries[index].source = entry.source
    } else {
      entries.unshift({
        name: entry.name,
        source: entry.source || "unknown",
        source_path: entry.source_path || "",
        read_at: Date.now(),
        read_count: 1,
      })
    }

    // 上限を超えたら古い順に削除
    const trimmed = entries
      .sort((a, b) => (b.read_at || 0) - (a.read_at || 0))
      .slice(0, ReadingHistory.MAX_ENTRIES)

    ReadingHistory.save(trimmed)
  }

  /**
   * 最後に読んだ本を取得
   * @returns {object|null}
   */
  static get_last() {
    const entries = ReadingHistory.list()
    return entries.length > 0 ? entries[0] : null
  }

  /**
   * 指定ソースの履歴を取得
   * @param {string} source
   * @returns {Array}
   */
  static list_by_source(source) {
    return ReadingHistory.list().filter(e => e.source === source)
  }

  /**
   * 履歴を全削除
   */
  static clear() {
    localStorage.removeItem(ReadingHistory.STORAGE_KEY)
  }

  /**
   * 特定のエントリを削除
   * @param {string} source_path
   */
  static remove(source_path) {
    const entries = ReadingHistory.list()
    const filtered = entries.filter(e => (e.source_path || e.name) !== source_path)
    ReadingHistory.save(filtered)
  }

  /**
   * 保存
   */
  static save(entries) {
    try {
      localStorage.setItem(ReadingHistory.STORAGE_KEY, JSON.stringify(entries))
    } catch (e) {
      console.error("[ReadingHistory] save error:", e)
    }
  }
}
