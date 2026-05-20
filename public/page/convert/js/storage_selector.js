import { Modal }          from "../../../asset/js/modal/modal.js"
import { Common }         from "./common.js"
import { Archive }        from "./archive.js"
import { StorageManager } from "../../storage/js/storage_manager.js"
import { Loading }        from "../../../asset/js/loading/loading.js"

/**
 * StorageSelector
 * 保存ボタン押下時にクラウドストレージの保存先を選択するモーダルを表示する
 * 認証はマイページで事前に行う前提
 */
export class StorageSelector{

  constructor(){
    this.show()
  }

  /**
   * モーダルのコンテンツHTMLを生成
   */
  get_content(){
    const status = StorageManager.get_all_status()

    const pcloud_auth  = status.pcloud.authenticated
    const google_auth  = status.google_drive.authenticated

    const pcloud_class  = pcloud_auth ? "authenticated" : "unauthenticated"
    const google_class  = google_auth ? "authenticated" : "unauthenticated"
    const pcloud_label  = pcloud_auth ? "連携済み" : "未連携"
    const google_label  = google_auth ? "連携済み" : "未連携"

    return `
      <div class="storage-selector">
        <p class="storage-selector__description">保存先を選択してください</p>
        <ul class="storage-selector__list">
          <li class="storage-selector__item ${!google_auth ? 'storage-selector__item--disabled' : ''}" data-service="google_drive">
            <div class="storage-selector__icon storage-selector__icon--google">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M4.433 22l-1.766-3.062 7.57-13.104h3.53L6.2 18.938z" fill="#0066DA"/>
                <path d="M22 18.938H14.43l1.767 3.062h7.57L22 18.938z" fill="#00AC47"/>
                <path d="M11.77 5.834L8.238 12l-3.805-6.166L8.2 2.772z" fill="#EA4335"/>
                <path d="M15.467 5.834h-3.697L4.2 18.938l1.766 3.062z" fill="#00832D"/>
                <path d="M22 18.938l-3.767-6.52-3.766 6.52H22z" fill="#2684FC"/>
                <path d="M15.467 5.834L18.233 12 22 18.938l1.767-3.062z" fill="#FFBA00"/>
              </svg>
            </div>
            <div class="storage-selector__info">
              <span class="storage-selector__name">Google Drive</span>
              <span class="storage-selector__status ${google_class}">${google_label}</span>
            </div>
          </li>
          <li class="storage-selector__item ${!pcloud_auth ? 'storage-selector__item--disabled' : ''}" data-service="pcloud">
            <div class="storage-selector__icon storage-selector__icon--pcloud">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M19.5 10.5c-.2-3.1-2.8-5.5-6-5.5-2.3 0-4.3 1.3-5.3 3.2C5.6 8.5 3.5 10.8 3.5 13.5 3.5 16.5 6 19 9 19h10c2.2 0 4-1.8 4-4 0-2-1.5-3.7-3.5-4z" fill="#20B6E8"/>
              </svg>
            </div>
            <div class="storage-selector__info">
              <span class="storage-selector__name">pCloud</span>
              <span class="storage-selector__status ${pcloud_class}">${pcloud_label}</span>
            </div>
          </li>
          <li class="storage-selector__item" data-service="local">
            <div class="storage-selector__icon storage-selector__icon--local">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="#666"/>
              </svg>
            </div>
            <div class="storage-selector__info">
              <span class="storage-selector__name">ローカルダウンロード</span>
              <span class="storage-selector__status authenticated">常時利用可</span>
            </div>
          </li>
        </ul>
        ${(!pcloud_auth && !google_auth) ? '<p class="storage-selector__hint">※ クラウドストレージを利用するには<a href="./?mypage">マイページ</a>で連携設定を行ってください。</p>' : ''}
      </div>
    `
  }

  /**
   * モーダルを表示
   */
  show(){
    // localStorage から設定読み込み
    StorageManager.init()

    this.add_css()
    this.modal = new Modal({
      caption : "保存先の選択",
      content : this.get_content(),
      buttons : [],
      loaded  : this.bind_events.bind(this),
    })
  }

  /**
   * CSS読み込み
   */
  add_css(){
    if(document.querySelector("head link.storage-selector-css")){return}
    const link = document.createElement("link")
    link.classList.add("storage-selector-css")
    link.rel = "stylesheet"
    link.href = "page/convert/css/storage_selector.css"
    document.querySelector("head").appendChild(link)
  }

  /**
   * 各選択肢にイベントをバインド
   */
  bind_events(){
    const items = document.querySelectorAll(".storage-selector__item")
    for(const item of items){
      item.addEventListener("click", this.on_select.bind(this))
    }
  }

  /**
   * 保存先選択時の処理
   */
  on_select(e){
    const item = e.currentTarget
    const service = item.getAttribute("data-service")

    // 未認証のクラウドサービスを選択した場合
    if(service !== "local" && !StorageManager.is_authenticated(service)){
      alert("マイページでクラウドストレージの連携設定を行ってください。")
      return
    }
    
    Modal.close()

    switch(service){
      case "google_drive":
        this.save_to_cloud("google_drive")
        break
      case "pcloud":
        this.save_to_cloud("pcloud")
        break
      case "local":
        this.save_to_local()
        break
    }
  }

  /**
   * ローカルダウンロード（従来の処理）
   */
  save_to_local(){
    new Archive()
  }

  /**
   * クラウドストレージへの保存
   */
  async save_to_cloud(service){
    const filename = (Common.file_info.name || `book_${+new Date()}`) + `.${Common.download_ext}`

    // .yomii blob を生成
    new Loading()
    Loading.set_status("active")
    Common.download_area.setAttribute("data-loading", "progress")

    let blob
    try{
      blob = await this.create_yomii_blob()
    }catch(e){
      Loading.set_status("passive")
      Common.download_area.setAttribute("data-loading", "finish")
      alert(`ファイル生成に失敗しました: ${e.message}`)
      return
    }

    // アップロード（リトライ付き）
    const max_retry = 3
    let last_error
    for(let attempt = 0; attempt < max_retry; attempt++){
      try{
        const result = await StorageManager.upload(service, blob, filename, (rate) => {
          Loading.set_rate(rate)
        })
        Loading.set_status("passive")
        Common.download_area.setAttribute("data-loading", "finish")
        
        const svc_name = StorageManager.SERVICES[service]?.name || service
        alert(`${svc_name} にアップロード完了: ${filename}`)
        return
      }catch(e){
        last_error = e
        console.error(`${service} upload attempt ${attempt + 1} failed:`, e)
        if(e.message.includes("認証が必要") || e.message.includes("Log in required")){
          break
        }
        if(e.message.includes("over quota") || e.message.includes("容量")){
          break
        }
      }
    }

    Loading.set_status("passive")
    Common.download_area.setAttribute("data-loading", "finish")
    alert(`アップロードエラー: ${last_error.message}`)
  }

  /**
   * .yomii ファイルの Blob を生成
   */
  async create_yomii_blob(){
    const zip = new Zlib.Zip()

    const images = Common.img_area.querySelectorAll("img")
    for(let i = 0; i < images.length; i++){
      const response = await fetch(images[i].src)
      const blob = await response.blob()
      const arrayBuffer = await blob.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)
      const num = ("0000" + i).slice(-4)
      zip.addFile(data, {
        filename: this.stringToByteArray(`${num}.webp`),
      })
    }

    // ___setting.json
    const direction = Common.elm_direction.checked ? "left" : "right"
    const setting_data = {
      base_filename : Common.file_info.filename,
      name          : Common.file_info.name,
      direction     : direction,
      singles       : Common.file_info.singles,
      deletes       : Common.file_info.deletes,
    }
    const setting_json = JSON.stringify(setting_data, null, "  ")
    const setting_str = unescape(encodeURIComponent(setting_json))
    zip.addFile(this.stringToByteArray(setting_str), {
      filename: this.stringToByteArray(Common.setting_file),
    })

    const buf = zip.compress()
    return new Blob([buf], { type: "application/zip" })
  }

  stringToByteArray(str){
    const array = new Uint8Array(str.length)
    for(let i = 0; i < str.length; i++){
      array[i] = str.charCodeAt(i) & 0xff
    }
    return array
  }
}
