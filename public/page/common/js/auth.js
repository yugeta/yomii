/**
 * Auth
 * ユーザー認証状態の管理
 * 
 * Google ログインで取得した情報を localStorage に保存し、
 * 各ページからログイン状態を確認できるようにする。
 */
import { Env } from "./env.js"

export class Auth{

  // ============================================================
  // 設定値（.env から読み込み）
  // ============================================================
  static GOOGLE_CLIENT_ID = ""  // Env.load() 後に設定される

  // ============================================================
  // 定数
  // ============================================================
  static STORAGE_KEY = "yomii_user"

  // ============================================================
  // 初期化
  // ============================================================

  /**
   * .env から設定値を読み込む
   */
  static async init(){
    await Env.load()
    Auth.GOOGLE_CLIENT_ID = Env.get("GOOGLE_CLIENT_ID")
  }

  // ============================================================
  // ログイン状態
  // ============================================================

  /**
   * ログイン済みかどうか
   */
  static is_logged_in(){
    const user = Auth.get_user()
    return !!(user && user.id)
  }

  /**
   * ユーザー情報を取得
   */
  static get_user(){
    try{
      const raw = localStorage.getItem(Auth.STORAGE_KEY)
      if(!raw) return null
      return JSON.parse(raw)
    }catch(e){
      return null
    }
  }

  /**
   * ユーザー情報を保存
   */
  static save_user(data){
    localStorage.setItem(Auth.STORAGE_KEY, JSON.stringify(data))
  }

  /**
   * ログアウト
   */
  static logout(){
    localStorage.removeItem(Auth.STORAGE_KEY)
  }

  // ============================================================
  // ユーティリティ
  // ============================================================

  /**
   * JWT (Google credential) をデコード
   * ※ 署名検証はサーバーサイドで行うべきだが、
   *    クライアント表示用にペイロードを取得する
   */
  static decode_jwt(token){
    try{
      const parts = token.split(".")
      if(parts.length !== 3) return null
      const payload = parts[1]
      // Base64URL → Base64
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
      // UTF-8 対応デコード
      const decoded = decodeURIComponent(
        atob(base64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
      )
      return JSON.parse(decoded)
    }catch(e){
      console.error("JWT decode error:", e)
      return null
    }
  }

  /**
   * ログインが必要なページで呼び出す
   * 未ログインならログインページへリダイレクト
   */
  static require_login(){
    if(!Auth.is_logged_in()){
      location.href = "./?p=login"
      return false
    }
    return true
  }
}
