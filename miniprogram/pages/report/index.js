const db = wx.cloud.database()

Page({
  data: {
    reportText: '点击下方按钮，生成你的专属日报 👇',
    loading: false
  },

  // 点击按钮时触发
  async generateReport() {
    this.setData({ loading: true, reportText: '' })

    try {
      // 1. 先去拿最新的股票数据（为了省事，这里直接读数据库，
      // 如果想更精准，应该先调用 getStockDetail 拿到最新实时价格再给 AI，
      // 这里为了演示方便，假设数据库里存的数据够用了，或者你可以复用 watchlist 的逻辑）
      const dbRes = await db.collection('user_stocks').get()
      const myStocks = dbRes.data || []

      if (myStocks.length === 0) {
        this.setData({ loading: false, reportText: '你还没有添加自选股，AI 没法分析呀~' })
        return
      }

      // 2. 调用刚才写的 AI 云函数
      const aiRes = await wx.cloud.callFunction({
        name: 'getAIReport',
        data: {
          stocks: myStocks // 把你的股票发给 AI
        }
      })

      // 3. 显示结果
      this.setData({
        reportText: aiRes.result.result,
        loading: false
      })

    } catch (err) {
      console.error(err)
      this.setData({
        loading: false,
        reportText: '生成失败，请检查网络或 API Key 余额。'
      })
    }
  }
})