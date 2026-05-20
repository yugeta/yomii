import { PCloud }        from "./pcloud.js"
import { GoogleDrive }   from "./google_drive.js"
import { StorageConfig } from "./storage_config.js"

/**
 * StorageManager
 * クラウドストレージサービスの認証状態管理と統一インターフェース
 */
export class StorageManager{

  static SERVICES = {
    pcloud       : { name: "pCloud",       module: PCloud },
    google_drive : { name: "Google Drive", module: GoogleDrive },
  }

  /**
   * localStorage から設定値を読み込んで各モジュールに反映
   */
  static init(){
    StorageConfig.load_all()
  }

  /**
   * 指定サービスの認証状態を取得
   */
  static is_authenticated(service){
    const svc = StorageManager.SERVICES[service]
    if(!svc) return false
    return svc.module.is_authenticated()
  }

  /**
   * 全サービスの認証状態を取得
   */
  static get_all_status(){
    const result = {}
    for(const [key, svc] of Object.entries(StorageManager.SERVICES)){
      result[key] = {
        name           : svc.name,
        authenticated  : svc.module.is_authenticated(),
        token_data     : svc.module.get_token_data(),
      }
    }
    return result
  }

  /**
   * 指定サービスの認証を開始
   */
  static async authenticate(service){
    const svc = StorageManager.SERVICES[service]
    if(!svc) throw new Error(`Unknown service: ${service}`)
    return svc.module.start_auth()
  }

  /**
   * 指定サービスからログアウト
   */
  static logout(service){
    const svc = StorageManager.SERVICES[service]
    if(!svc) throw new Error(`Unknown service: ${service}`)
    svc.module.logout()
  }

  /**
   * 指定サービスにファイルをアップロード
   */
  static async upload(service, blob, filename, on_progress){
    const svc = StorageManager.SERVICES[service]
    if(!svc) throw new Error(`Unknown service: ${service}`)
    if(!svc.module.is_authenticated()){
      throw new Error(`${svc.name}: 認証が必要です。マイページで認証設定を行ってください。`)
    }
    return svc.module.upload_file(blob, filename, on_progress)
  }
}
