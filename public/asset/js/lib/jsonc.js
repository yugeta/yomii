
export class Jsonc{
  constructor(json){
    this.json = json
  }

  get data(){
    const json = this.convert(this.json)
    return this.parse(json)
  }

  convert(json){
    json = json.replace(/^[\s\t]+?/g , '')
    json = json.replace(/^[\s\t]*?\/\/.*?$/gm , '')
    json = json.replace(/\/\*.*?\*\//gm , '')
    return json
  }

  parse(json){
    try{
      return JSON.parse(json)
    }
    catch(err){
      console.warn(json , err)
    }
  }
}