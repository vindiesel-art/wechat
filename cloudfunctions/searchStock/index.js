// cloudfunctions/searchStock/index.js
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const keyword = event.keyword
  if (!keyword) return { data: [] }

  try {
    // 换成腾讯财经的搜索接口，这个接口返回的是标准JSON，不容易出错
    const url = `https://smartbox.gtimg.cn/s3/?v=2&q=${encodeURIComponent(keyword)}&t=all`
    
    const response = await axios.get(url)
    
    // 腾讯接口返回格式类似: v_hint="sz000001~平安银行~PAYH~GP-A\nsh600519~贵州茅台..."
    const rawData = response.data
    const match = rawData.match(/"(.*)"/)
    
    if (!match || !match[1]) return { data: [] }

    const lines = match[1].split('\\n') // 注意这里是转义后的换行符
    const resultList = []

    for (let line of lines) {
      const parts = line.split('~')
      if (parts.length >= 2) {
        const fullCode = parts[0] // e.g. sz000001
        // 只筛选 A 股 (sh 或 sz 开头的)
        if (fullCode.startsWith('sh') || fullCode.startsWith('sz')) {
          resultList.push({
            code: fullCode,
            name: parts[1],
            market: fullCode.substring(0, 2)
          })
        }
      }
    }

    return { data: resultList }

  } catch (err) {
    console.error('搜索出错：', err)
    return { error: err.toString(), data: [] }
  }
}