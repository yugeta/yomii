export class Convert{
  constructor(str){
    this.str = str
  }

  // 任意文字列の中から、{{key}}という文字列を、{key:val}で置換する処理
  double_bracket = function(data){
    if(!this.str || typeof this.str !== 'string'){return null}
    let str = this.str
    if(data){
      const reg = new RegExp('{{(.*?)}}','g')
      const arr = []
      let res = []
      while ((res = reg.exec(str)) !== null) {
        arr.push(res[1])
      }
      for(let key of arr){
        let val = this.get_data_value(data , key)
        val = val === null || val === undefined ? '' : val
        str = str.split('{{'+String(key)+'}}').join(val)
      }
    }
    return str
  }
  get_data_value(data , key){
    if(typeof data[key] === 'undefined'){
      return ''
    }
    if(key === '' || key === undefined || key === null){
      return ''
    }
    if(key.indexOf('.') === -1){
      return data[key]
    }

    const keys = key.split('.')
    let d = data
    for(const k of keys){
      if(d[k] === undefined || d[k] === null){
        return ''
      }
      else if(typeof d[k] === 'object'){
        d = d[k]
        continue
      }
      else{
        return d[k]
      }
    }
  }

  get jwt_decode(){
    const base64Url = this.str.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const str1 = atob(base64)
    const str2 = escape(str1)
    const str3 = decodeURIComponent(str2)
    return JSON.parse(str3)
  }
}