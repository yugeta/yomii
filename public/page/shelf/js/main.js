import { Load }  from './load.js'
import { View }  from './view.js'
import { Event } from './event.js'
import { Breadcrumps } from './breadcrumps.js'
import { Urlinfo } from "../../../asset/js/lib/urlinfo.js"

export class Main{
  constructor(options){
    this.options = options || {}
    if(!options){
      new Event()
      this.bind_tabs()
    }
    new Breadcrumps()

    const source = new Urlinfo().queries.source || "cache"
    this.set_active_tab(source)

    new Load({
      source   : source,
      dir      : new Urlinfo().queries.dir || '',
      callback : this.view.bind(this),
    })
  }

  view(load_cls){
    const empty_el = document.querySelector(".shelf-empty")
    const toolbar = document.querySelector(".cache-toolbar")
    const source = new URLSearchParams(location.search).get("source") || "cache"

    // キャッシュツールバーの表示制御
    if(toolbar){
      toolbar.style.display = (source === "cache") ? "" : "none"
    }

    if(load_cls.error_message){
      document.querySelector("ul.lists").innerHTML = ""
      if(empty_el){
        empty_el.style.display = ""
        empty_el.textContent = load_cls.error_message
      }
      return
    }

    if(!load_cls.datas || load_cls.datas.length === 0){
      document.querySelector("ul.lists").innerHTML = ""
      if(empty_el){
        empty_el.style.display = ""
        empty_el.innerHTML = this.get_empty_message(load_cls.source || new URLSearchParams(location.search).get("source") || "cache")
      }
      return
    }

    if(empty_el){
      empty_el.style.display = "none"
    }

    new View({
      datas: load_cls.datas,
    })

    // キャッシュタブの場合、容量情報を表示
    if(source === "cache" && toolbar){
      this.update_cache_info()
    }
  }

  async update_cache_info(){
    const { BookCache } = await import("../../storage/js/book_cache.js")
    const total = await BookCache.get_total_size()
    const info_el = document.querySelector(".cache-info")
    if(info_el){
      const mb = (total / (1024 * 1024)).toFixed(1)
      info_el.textContent = `使用量: ${mb} MB`
    }
  }

  bind_tabs(){
    const tabs = document.querySelectorAll(".shelf-tab")
    for(const tab of tabs){
      tab.addEventListener("click", this.on_tab_click.bind(this))
    }

    // ビュー切り替え
    const view_btns = document.querySelectorAll(".view-btn")
    for(const btn of view_btns){
      btn.addEventListener("click", this.on_view_toggle.bind(this))
    }

    // 保存済みのビュー設定を復元
    const saved_view = localStorage.getItem("yomii_shelf_view") || "icon"
    this.set_view(saved_view)
  }

  on_tab_click(e){
    const source = e.currentTarget.getAttribute("data-source")
    
    const params = new URLSearchParams(location.search)
    params.set("p", "shelf")
    params.set("source", source)
    params.delete("dir")
    location.search = params.toString()
  }

  on_view_toggle(e){
    const view = e.currentTarget.getAttribute("data-view")
    this.set_view(view)
    localStorage.setItem("yomii_shelf_view", view)
  }

  set_view(view){
    const lists = document.querySelector("ul.lists")
    if(lists){
      lists.setAttribute("data-view", view)
    }

    const btns = document.querySelectorAll(".view-btn")
    for(const btn of btns){
      if(btn.getAttribute("data-view") === view){
        btn.classList.add("active")
      }else{
        btn.classList.remove("active")
      }
    }
  }

  set_active_tab(source){
    const tabs = document.querySelectorAll(".shelf-tab")
    for(const tab of tabs){
      if(tab.getAttribute("data-source") === source){
        tab.classList.add("active")
      }else{
        tab.classList.remove("active")
      }
    }
  }

  get_empty_message(source){
    switch(source){
      case "cache":
        return `
          <p class="empty-title">本棚に書籍がありません</p>
          <p class="empty-help">書籍を追加するには：</p>
          <ol class="empty-steps">
            <li><a href="./?p=convert">アップロード</a>ページで書籍ファイル（ZIP/PDF）を変換する</li>
            <li>変換後、保存先で「pCloud」を選択してアップロードする</li>
            <li>「pCloud」タブから書籍を開くと、自動的にキャッシュされます</li>
          </ol>
        `
      case "pcloud":
        return `
          <p class="empty-title">pCloud に書籍がありません</p>
          <p class="empty-help">書籍を追加するには：</p>
          <ol class="empty-steps">
            <li><a href="./?p=convert">アップロード</a>ページで書籍ファイルを変換・保存する</li>
            <li>または、pCloud の <code>/yomii/</code> フォルダに .yomii ファイルを直接配置する</li>
          </ol>
          <p class="empty-note">※ <a href="./?p=mypage">マイページ</a>で pCloud 連携が完了している必要があります</p>
        `
      case "local":
        return `
          <p class="empty-title">ローカルフォルダが未設定です</p>
          <p class="empty-help"><a href="./?p=mypage">マイページ</a>で書籍フォルダを選択してください。</p>
          <p class="empty-note">※ .yomii ファイルが含まれるフォルダを指定します</p>
        `
      case "sample":
        return `
          <p class="empty-title">サンプル書籍がありません</p>
          <p class="empty-help">サーバーの <code>data/shelf/</code> フォルダにサンプル .yomii ファイルを配置してください。</p>
        `
      default:
        return `<p class="empty-title">書籍がありません</p>`
    }
  }
}

switch(document.readyState){
  case 'complete':
  case 'interactive':
    new Main()
    break
  default:
    window.addEventListener('DOMContentLoaded' , (()=>new Main()))
    break
}
