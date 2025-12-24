// cloudfunctions/getStockDetail/index.js
const cloud = require('wx-server-sdk')
const axios = require('axios')
const iconv = require('iconv-lite') // 引入解码库

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  let { stockList } = event
  if (!stockList || stockList.length === 0) return { data: [] }

  const cleanCodes = stockList.map(code => {
    code = code.toLowerCase().trim();
    if (/^\d{6}$/.test(code)) return 'sh' + code;
    return code;
  });

  try {
    const url = `https://qt.gtimg.cn/q=${cleanCodes.join(',')}`
    
    // 关键点 1: 必须设置返回类型为 arraybuffer
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    
    // 关键点 2: 使用 iconv-lite 将 GBK 转为 utf8 字符串
    const rawData = iconv.decode(response.data, 'gbk')

    const lines = rawData.split(';')
    const results = lines.map(line => {
      const parts = line.split('~')
      if (parts.length < 33) return null;
      return {
        code: parts[2],
        name: parts[1],          // 此时解码后的中文名就正常了
        price: parseFloat(parts[3]).toFixed(2),
        change: parseFloat(parts[31]),
        changePercent: parts[32],
      }
    }).filter(item => item !== null)

    return { data: results }
  } catch (err) {
    return { data: [], error: err.toString() }
  }
}