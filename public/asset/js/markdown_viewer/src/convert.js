export class Convert{
  constructor(text){
    this.base_text = text
    this.lines = text.split('\n')
    const line_groups = Convert.get_line_datas(this.lines)
    Convert.adjust_list(line_groups , 'unorderd_list' , 'ul')
    Convert.adjust_list(line_groups , 'orderd_list' , 'ol')
    Convert.adjust_blockquote(line_groups , 'blockquote' , 'blockquote')
    Convert.hr_before_header(line_groups)
    this.text = Convert.replace_tag(line_groups)

    // console.log(line_groups)
    // console.log(line_groups.map(e => (e.tag||null) +" : "+ (e.type||null) +" : "+ (e.nest??null)))
  }

  static get_line_datas(lines){
    const datas = []
    let code_count = false
    let continue_flg = false
    let table_flg = false
    let prev_type = null
    for(let i=0; i<lines.length; i++){
      lines[i] = lines[i].replace(/\r^/,'')
      if(lines[i] === ''){continue}
      const data = Convert.get_line_data(lines[i] , i)
      // console.log(data)

      if(data.type === 'code'){
        code_count = code_count ? false : true
        continue_flg = code_count
        if(!code_count){
          prev_type = data.type
          continue
        }
      }

      // table-row追加
      if(data.type === 'table'){
        // 新規
        if(table_flg === false){
          table_flg = true
        }
        // 追加
        else{
          datas[datas.length-1].cols.push(data.cols[0])
          prev_type = data.type
          continue
        }
      }
      else if(table_flg){
        table_flg = false
      }

      // blockquote
      if(data.type === 'blockquote'){

      }
      else if(prev_type === 'blockquote' && data.type === null){
        datas.push(data)
        prev_type = data.type
        continue
      }

      if(data.type || !datas.length){
        datas.push(data)
      }
      else if(!datas[datas.length-1].strs){
        data.tag = 'p'
        datas.push(data)
      }
      else if(!continue_flg){
        datas.push(data)
      }
      else{
        datas[datas.length-1].strs.push(data.str)
      }

      // console.log(data.type,prev_type,code_count)
      // prev_type = data.type
      prev_type = continue_flg && prev_type ? prev_type : data.type
    }
    return datas
  }

  // ul,ol,code,blockquote,hr,header
  static get_line_data(str , num){

    // ul
    const unorderd_list = str.match(/^([\t {2}]*?)([\-\+\*]) (.*?)$/s)
    if(unorderd_list){
      return {
        type  : `unorderd_list`,
        tag   : 'li',
        nest  : Convert.get_nest(unorderd_list[1]),
        strs  : [unorderd_list[3]],
      }
    }

    // ol
    const orderd_list = str.match(/^([\t {2}]*?)([0-9]+?\.) (.*?)$/s)
    if(orderd_list){
      return {
        type  : `orderd_list`,
        tag   : 'li',
        nest  : Convert.get_nest(orderd_list[1]),
        strs  : [orderd_list[3]],
        close : true,
      }
    }

    // code
    const code = str.match(/^([\t {2}]*?)(\`{2,3})(.*?)$/s)
    if(code){
      return {
        str   : code[3],
        type  : `code`,
        tag   : 'code',
        nest  : Convert.get_nest(code[1]),
        strs  : [],
        close : true,
      }
    }

    // blockquote
    const blockquote = str.match(/^([\t {2}]*?)(\>+?) (.*?)$/s)
    if(blockquote){
      const blockquote_val  = str
      const blockquote_mark = blockquote_val.match(/^(>+ *)*/g)[0]
      const blockquote_nest = (blockquote_mark.match(/>/g) || []).length -1
      const blockquote_text = blockquote_val.replace(new RegExp(`^${blockquote_mark}`) , '')
      return{
        type  : `blockquote`,
        tag   : `blockquote`,
        nest  : blockquote_nest,
        strs  : [blockquote_text],
        mark  : blockquote_mark,
        close : false,
      }
    }

    // hr
    const horizontal_rule = str.match(/^([\t {2}]*?)([\-\=\*]{1,3})(.*?)$/s)
    if(horizontal_rule){
      return {
        type  : `hr`,
        tag   : `hr`,
        nest  : Convert.get_nest(horizontal_rule[1]),
        strs  : [horizontal_rule[3]],
        close : false,
      }
    }

    // header 1-6
    const header = str.match(/^([\t {2}]*?)(#{1,6})(.*?)$/s)
    if(header){
      const count = header[2].split('#').length-1
      return {
        type  : `header`,
        tag   : `h${count}`,
        count : count,
        nest  : Convert.get_nest(header[1]),
        strs  : [header[3]],
        close : true,
      }
    }

    // table
    const table = str.match(/^([\t {2}]*?)(\|.*?)$/s)
    if(table){
      return {
        type  : `table`,
        tag   : `table`,
        cols  : [str.split('|').slice(1)],
      }
    }

    // etc
    const etc = str.match(/^([\t {2}]*?)(.*?)$/s)
    return {
      str   : str,
      type  : null,
      nest  : Convert.get_nest(etc[1]),
      strs  : [etc[2]],
    }
  }

  static get_nest(indent_string){
    return indent_string ? indent_string.replace(/  /g , '\t').split('\t').length-1 : 0
  }

  static adjust_list(datas , type , tag){
    let prev_nest = null
    let prev_type = null
    let keep_nest = null
    for(let i=0; i<datas.length; i++){
      // keep
      if(keep_nest !== null && keep_nest > datas[i].nest){
        for(let j=keep_nest; j>=datas[i].nest; j--){
          datas.splice(i,0,{
            type : type,
            tag  : `/${tag}`,
            nest : j,
          })
          i++
        }
        keep_nest = null
      }
      // end
      if((datas[i].type !== type && prev_type === type)){
        if(prev_nest > datas[i].nest || datas[i].nest === 0){
          for(let j=prev_nest; j>=datas[i].nest; j--){
            datas.splice(i,0,{
              type : type,
              tag  : `/${tag}`,
              nest : j,
            })
            i++
          }
        }
        else{
          keep_nest = datas[i].nest
        }
      }
      // start
      if(datas[i].type === type){
        // end
        if(prev_nest && prev_nest > datas[i].nest){
          let diff = (prev_nest || 0) - datas[i].nest
          for(let j=0; j<diff; j++){
            datas.splice(i,0,{
              type : type,
              tag  : `/${tag}`,
              nest : datas[i].nest,
            })
            i++
          }
        }

        // start
        if(prev_type === null || prev_type !== type || prev_nest < datas[i].nest){
          datas.splice(i,0,{
            type : type,
            tag  : tag,
            nest : datas[i].nest,
          })
          i++
        }
      }
      prev_nest = datas[i].nest
      prev_type = datas[i].type
    }
  }

  static adjust_blockquote(datas , type , tag){
    let prev_nest = null
    let prev_type = null
    let keep_nest = null
    for(let i=0; i<datas.length; i++){
      // start
      if(datas[i].type === type){
        if(prev_type === null || prev_type !== type || (prev_nest !== null && prev_nest < datas[i].nest)){
          
          datas.splice(i,0,{
            type : type,
            tag  : tag,
            nest : datas[i].nest,
          })
          i++
          prev_nest = datas[i].nest
          prev_type = datas[i].type

          datas[i].type = null
          datas[i].tag  = null

          prev_nest = datas[i].nest
          
          continue
        }
        else if(prev_type === type && prev_nest >= datas[i].nest){
          datas[i].type = null
          datas[i].tag  = null
          continue
        }
      }
      else if(prev_nest !== null && datas[i].type !== type){
        if(prev_type === type){
          for(let j=0; j<=prev_nest; j++){
            datas.splice(i,0,{
              type : type,
              tag  : `/${tag}`,
            })
            i++
          }
          prev_nest = null
        }
      }
      prev_type = datas[i].type
    }
  }

  static replace_tag(datas){
    let html = []
    let current_type = null
    for(const data of datas){
      let str = Convert.lines2line(data.strs)
      if(data.tag){
        const tag = data.tag
        if(data.close){
          str = `<${tag}>${str}</${tag}>`
        }
        else if(tag === 'table'){
          str = Convert.set_table(data)
        }
        else{
          str = `<${tag}>${str}`
        }
      }
      else if(current_type === 'code'){
        str += '\n'
      }
      html.push(str)
      current_type = data.type || current_type
    }
    return html.join('\n')
  }

  static lines2line(strs){
    if(!strs || !strs.length){
      return ''
    }
    const arr = []
    const temp = Convert.temp(strs)
    for(const str of strs){
      arr.push(Convert.single_tag(str , temp))
    }
    return arr.join('\n')
  }

  static single_tag(str , temp){
    str = Convert.tag_br(str)
    str = Convert.tag_img(str , temp)
    str = Convert.tag_link(str)
    return str
  }

  static tag_link(text){
    const res = text.match(/^(.*?)\[(.+?)\]\((.+?)\)(.*?)$/)
    if(res){
      const sp = res[3].split(' ')
      const link  = sp[0].trim()
      const title = sp[1] ? `title="${sp.splice(1).join(' ').replace(/\"/g,'').replace(/\'/g,'').trim()}"` : ''
      return `${res[1]}<a href='${link}' ${title}/>${res[2]}</a>${res[4]}`
    }
    else{  
      return text
    }
  }

  static tag_br(str){
    const res = str.match(/(.+?)( {2,})$/s)
    if(res){
      str = `${res[1]}<br>`
    }
    return str
  }

  static tag_img(str , temps){
    const res0 = str.match(/^(.*?)!\[(.+?)\]\((.+?)( "(.*?)")*\)*$/)
    if(res0){
      const url   = res0[3]
      const alt   = res0[2]||''
      const title = res0[5]||''
      str = `${res0[1]}<img src='${url}' alt='${alt}' title='${title}'/>`
    }

    // temp
    const res1 = str.match(/^(.*?)!\[(.+?)\]\[(.+?)\](.*?)$/)
    if(res1){
      const temp = temps.find(e => e.key === res1[3])

      if(temp){
        const url   = temp.value
        const alt   = res1[2]||''
        const title = temp.title
        str = `${res1[1]}<img src='${url}' alt='${alt}' title='${title}'/>${res1[4]}`
      }
    }
    return str
  }

  static set_table(data){
    const aligns = []
    for(const cell of data.cols[1]){
      const str = cell.trim()
      if(!str){continue}
      const align = Convert.set_table_align(str)
      aligns.push(align)
    }

    const html = ['<table>'];
    // head
    html.push('<thead>')
    html.push('<tr>')
    for(let j=0; j<aligns.length; j++){
      const cell = data.cols[0][j] ?? ''
      html.push(`<th>${cell}</th>`)
    }
    html.push('</tr>')
    html.push('</thead>')

    

    html.push('<tbody>')
    for(let i=2; i<data.cols.length; i++){
      html.push('<tr>')
      for(let j=0; j<aligns.length; j++){
        const cell = data.cols[i][j] ?? ''
        html.push(`<td>${cell}</td>`)
      }
      html.push('</tr>')
    }
    html.push('</tbody>')
    html.push('<table>');

    return html.join('\n')
  }
  static set_table_align(str){
    if(str.match(/^\-+?:$/)){
      return 'right'
    }
    else if(str.match(/^:\-+?:$/)){
      return 'center';
    }
    else{
      return 'left'
    }
  }

  static temp(lines){
    if(!lines || !lines.length){return}
    const arr = []
    for(const line of lines){
      const res = line.match(/\[(.+?)\]\:(.+?)( "(.*?)")*\)*$/)
      if(!res){continue}
      arr.push({
        key   : res[1],
        value : (res[2] || '').trim(),
        title : res[4] || ''
      })
    }
    return arr
  }

  static hr_before_header(datas){
    for(let i=0; i<datas.length; i++){
      const before = i > 0 ? datas[i-1] : null
      const data   = datas[i]
      // console.log(data)
      if(data.type === 'hr' && !before.type){
        // console.log(data)
        before.type  = 'header'
        before.tag   = 'h1'
        before.close = true
      }
    }
  }
}


