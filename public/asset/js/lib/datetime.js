
export class Datetime{
  static get_ymd_his(){
    const dt = new Date()
    const y  = dt.getFullYear()
    const m  = ('0'+(dt.getMonth()+1)).slice(-2)
    const d  = ('0'+ dt.getDate()).slice(-2)
    const h  = ('0'+ dt.getHours()).slice(-2)
    const i  = ('0'+ dt.getMinutes()).slice(-2)
    const s  = ('0'+ dt.getSeconds()).slice(-2)
    return `${y}${m}${d}${h}${i}${s}`
  }
}