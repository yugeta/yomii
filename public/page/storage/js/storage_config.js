import { GoogleDrive } from "./google_drive.js"

/**
 * StorageConfig
 * ユーザーが入力した API 設定（Client ID 等）を localStorage で管理する
 */
export class StorageConfig{

  static STORAGE_KEY = "yomii_storage_config"

  /**
   * 全サービスの設定を取得
   */
  static get_all(){
    try{
      const raw = localStorage.getItem(StorageConfig.STORAGE_KEY)
      if(!raw) return {}
      return JSON.parse(raw)
    }catch(e){
      return {}
    }
  }

  /**
   * 指定サービスの設定を取得
   */
  static get(service){
    const all = StorageConfig.get_all()
    return all[service] || null
  }

  /**
   * 指定サービスの設定を保存
   */
  static save(service, config){
    const all = StorageConfig.get_all()
    all[service] = config
    localStorage.setItem(StorageConfig.STORAGE_KEY, JSON.stringify(all))
  }

  /**
   * 指定サービスの設定を削除
   */
  static remove(service){
    const all = StorageConfig.get_all()
    delete all[service]
    localStorage.setItem(StorageConfig.STORAGE_KEY, JSON.stringify(all))
  }

  /**
   * localStorage から設定を読み込んで各モジュールの static プロパティに反映
   */
  static load_all(){
    const all = StorageConfig.get_all()

    // Google Drive
    if(all.google_drive){
      GoogleDrive.CLIENT_ID    = all.google_drive.client_id || ""
      GoogleDrive.REDIRECT_URI = all.google_drive.redirect_uri || ""
    }
  }

  /**
   * 指定サービスの設定が完了しているか
   */
  static is_configured(service){
    const config = StorageConfig.get(service)
    return !!(config && config.client_id)
  }
}
