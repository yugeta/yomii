export class Urlinfo{
  constructor(url){
    if(url){
      this.href = url
      if(url.match(/http(s):\/\//)){
        this.type = 'url'
      }
      else{
        this.type = 'path'
      }
    }
    else{
      this.href = location.href
      this.type = 'location'
    }
  }

  // --
  get url(){
    return `${this.origin}/${this.path}`
  }

  // ハッシュ
  get hash(){
    switch(this.type){
      case 'location':
        return location.hash
      case 'url':
      case 'path':
        const sp = this.href.split('#')
        return sp[1] || ''
    }
  }

  // クエリ文字列
  get query(){
    switch(this.type){
      case 'location':
        return location.search.replace(/^\?/,'')
      case 'url':
      case 'path':
        const sp = this.href.split('?')
        return sp[1] ? sp[1].split('#')[0] : ''
    }
  }

  // クエリを連想配列で取得
  get queries(){
    return Object.fromEntries(new Map(this.query.split('&').map(e => [e.split('=')[0],e.split('=').slice(1).join('=')]))) || {}
  }

  // ドメイン
  get host(){
    switch(this.type){
      case 'location':
      case 'path':
        return location.hostname
      case 'url':
        const sp = this.href.split('/')
        return sp[2].split(':')[0]
    }
  }

  // ポート
  get port(){
    switch(this.type){
      case 'location':
      case 'path':
        return location.port
      case 'url':
        const sp   = this.href.split('/')
        const host = sp[2].split(':')
        return host[1] ? Number(host[1]) : (sp[0] === 'https' ? 443 : 80)
    }
  }

  // プロトコル
  get protocol(){
    switch(this.type){
      case 'location':
      case 'path':
        return location.protocol.replace(/\:$/,'')
      case 'url':
        const sp = this.href.split('/')
        return sp[0]
    }
  }
  // 階層 + ファイル名
  get path(){
    switch(this.type){
      case 'location':
        return location.pathname
      case 'url':
        const sp   = this.href.split('/')
        const path = sp.slice(3).join('/')
        return path.split('?')[0]
      case 'path':
        const dir = location.href.split('/')
        return dir.slice(3,-1).join('/') +'/' + this.href
    }
  }
  // プロトコル + ホスト + ポート
  get origin(){
    switch(this.type){
      case 'location':
        return location.origin
      case 'url':
        const sp   = this.href.split('/')
        return sp.slice(0,2).join('/')
      case 'path':
        const post = this.port === 80 || this.port === 443 ? '' : `:${this.port}`;
        return `${this.protocol}://${this.host}${post}`
    }
  }

  // ファイル名
  get filename(){
    return this.path.split('/').pop()
  }

  // 階層
  get dir(){
    return this.path.split('/').slice(0,-1).join('/')
  }

}