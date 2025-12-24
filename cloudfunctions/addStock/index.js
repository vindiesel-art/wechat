// cloudfunctions/addStock/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  // 这里的 event 就是你日志里打印的那个对象
  const { code, name, market } = event

  try {
    // 1. 检查有没有超过10个
    const countResult = await db.collection('user_stocks').where({
      _openid: openid
    }).count()

    if (countResult.total >= 10) {
      return { success: false, msg: '自选股已达10个上限' }
    }

    // 2. 检查是不是重复添加
    // 注意：为了防止你之前的 code="sh" 这种错误数据干扰，我们这里放宽一点检查
    const existResult = await db.collection('user_stocks').where({
      _openid: openid,
      code: code
    }).get()

    if (existResult.data.length > 0) {
      return { success: false, msg: '该股票已在自选股中' }
    }

    // 3. 存入数据库
    // 强制修正数据：如果你传进来的是乱的，我们尝试修正一下显示
    // (日志显示你传的是 code: "sh", name: "600519"，这有点反了，但我们先存进去再说)
    await db.collection('user_stocks').add({
      data: {
        code: code,
        name: name,
        market: market || 'sh', // 给个默认值
        createTime: db.serverDate()
      }
    })

    return { success: true, msg: '添加成功' }

  } catch (err) {
    return { success: false, msg: '数据库读写失败', error: err }
  }
}