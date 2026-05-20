/**
 * Env
 * .env ファイルを読み込んで環境変数として提供する
 * 
 * フロントエンドのみの構成のため、.env ファイルを fetch で取得し、
 * KEY=VALUE 形式をパースする。
 * 
 * 使い方:
 *   await Env.load()
 *   const value = Env.get("GOOGLE_CLIENT_ID")
 */
export class Env{

  static _data = null
  static _loaded = false
  static ENV_PATH = ".env"

  /**
   * .env ファイルを読み込む（初回のみ）
   */
  static async load(){
    if(Env._loaded) return Env._data

    try{
      const response = await fetch(Env.ENV_PATH)
      if(!response.ok){
        console.warn(".env file not found or not accessible")
        Env._data = {}
        Env._loaded = true
        return Env._data
      }

      const text = await response.text()
      Env._data = Env.parse(text)
      Env._loaded = true
    }catch(e){
      console.warn(".env load error:", e)
      Env._data = {}
      Env._loaded = true
    }

    return Env._data
  }

  /**
   * .env テキストをパースして key-value オブジェクトにする
   */
  static parse(text){
    const result = {}
    const lines = text.split("\n")

    for(const line of lines){
      const trimmed = line.trim()
      // 空行・コメント行をスキップ
      if(!trimmed || trimmed.startsWith("#")) continue

      const eq_index = trimmed.indexOf("=")
      if(eq_index === -1) continue

      const key = trimmed.substring(0, eq_index).trim()
      let value = trimmed.substring(eq_index + 1).trim()

      // クォートを除去
      if((value.startsWith('"') && value.endsWith('"')) ||
         (value.startsWith("'") && value.endsWith("'"))){
        value = value.slice(1, -1)
      }

      result[key] = value
    }

    return result
  }

  /**
   * 環境変数を取得
   */
  static get(key, default_value = ""){
    if(!Env._data) return default_value
    return Env._data[key] || default_value
  }

  /**
   * 全環境変数を取得
   */
  static get_all(){
    return Env._data || {}
  }
}
