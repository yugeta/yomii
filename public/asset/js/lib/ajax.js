'use strict'
export const ver = "0.0.1"

const settings = {
  query    : {}, // Array , Object each ok ( ex: {a:"1"} or ["a=1"] )
  method   : "get", // post | get
  async    : true,
  content  : "application/x-www-form-urlencoded",  // default-content-type
}

/**
 * Ajax tool
 */

export class Ajax{

  constructor(options){
    if(!options
    ||!options.url){
      return
    }
    this.options = this.setOptions(options)
    this.setQueries()
    this.flow()
  }

  setOptions(options){
    for(var i in settings){
      options[i] = (typeof options[i] === "undefined") ? settings[i] : options[i]
    }
    return options
  }

  setQueries(){
    if(!this.options || !this.options.query || typeof this.options.query !== "object"){return}
    this.queries = []
    // Arrayの場合の処理
		if(this.options.query.constructor === Array){
      for(let q of this.options.query){
        var sp = q.split("=")
        this.queries.push(sp[0] +"="+ encodeURIComponent(sp.slice(1)))
      }
		}
    // Objectの場合の処理
    else{
      for(var i in this.options.query){
				this.queries.push(i +"="+ encodeURIComponent(this.options.query[i]))
			}
    }
  }

  createHttpRequest = function(){
		if(window.ActiveXObject){ //Win ie用
			try{
        return new ActiveXObject("Msxml2.XMLHTTP") //MSXML2以降用;
      }
			catch(e){
				try{
          return new ActiveXObject("Microsoft.XMLHTTP") //旧MSXML用;
        }
				catch(e2){return null}
			}
		}
		else if(window.XMLHttpRequest){
      return new XMLHttpRequest() //Win ie以外のXMLHttpRequestオブジェクト実装ブラウザ用;
    }
		else{return null}
	}

  flow(){
    this.req = this.createHttpRequest()
		if(!this.req){return}
    this.open()
    this.setFormat()
    this.onLoadProc()
		this.send()
  }

  open(){
    this.req.open(this.options.method , this.options.url , this.options.async);
  }

  setFormat(){
    this.type()
    this.content()
    this.setCustom()
    this.setHeader()
  }

  /**
   * タイプ（種別）の情報セット
   */
  type(){
    this.options.type = this.options.type || this.getType()
    switch(this.options.type){
      case 'audio':
      case 'mp3':
        this.req.responseType = 'arraybuffer'
        this.req.mode = 'binary'
        break
      case 'image':
        break
    }
  }
  getType(){
    switch(this.options.ext){
      case 'mp3':
        return 'audio'
      default:
        return 'text'
    }
  }

  /**
   * Content-Typeのセット
   */
  content(){
    if(!this.options.content){return}
    this.req.setRequestHeader('Content-Type', this.options.content)
  }

  /**
   * property情報の付与
   */
  setCustom(costoms){
    if(!costoms){return}
    for(let key in costoms){
      this.req[key] = costoms[key]
    }
  }

  /**
   * header情報のセット
   */
  setHeader(headers){
    if(!headers){return}
    for(let key in headers){
      this.req.setRequestHeader(key, headers[key])
    }
  }

  /**
   * ajaxrequest送信
   */
  send(){
    const queries = this.queries.length ? this.queries.join("&") : null
    this.req.send(queries);
  }

  readyState(res){
    switch(this.req.status) {
      case 200:
        switch(this.req.readyState){
          // 読み込み途中
          case 1:
          case 2:
          case 3:
            this.progress(res)
            break
          // 取得完了
          case 4:
            this.success(res)
            break
        }
        break;

      default:
        this.error(res)
        break
    }
  }

  onLoadProc(res){
    this.req.onreadystatechange = this.readyState.bind(this)
    // this.req.onload = (function(res){
    //   console.log(res)
    // }).bind(this)
  }

  success(res){
    if(this.options.success){
      this.options.success({
        data     : this.getData(this.req) ,
        options  : this.options , 
        request  : this.req , 
        response : res , 
        header   : this.getHeader(this.req)
      })
    }
  }

  progress(res){
    if(this.options.process){
      this.options.process({
        data     : this.getData(this.req),
        options  : this.options , 
        request  : this.req , 
        response : res , 
        header   : this.getHeader(this.req)
      })
    }
  }

  error(res){
    if(this.options.error){
      this.options.error({
        data     : this.getData(this.req),
        options  : this.options , 
        request  : this.req , 
        response : res , 
        header   : this.getHeader(this.req)
      })
    }
  }

  getData(req){
    switch(req.mode){
      case 'binary':
        return req.response

      case 'text':
      default:
        return req.responseText
    }
    
  }

  getHeader(req){
    const headers = {}
    const datas = req.getAllResponseHeaders().trim().split(/[\r\n]+/);
    for(let data of datas){
      const sp = data.split(':')
      const key = sp[0].trim()
      const val = sp[1].replace(/"/g,'').trim()
      headers[key] = val
    }
    return headers
  }
  /**
   * Header情報の,Date-formatをunix-timeに変換する
   */
  convertHeaderValue(key, val){
    switch(key){
      case 'last-modified':
      case 'date':
        const val2 = val ? Date.parse(val) : null
        val = isNaN(val2) ? val : val2
        break
    }
    return val
  }

}
