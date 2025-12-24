const db = wx.cloud.database()

Page({
  data: {
    myStocks: []
  },

  onShow() {
    this.refreshData()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  async refreshData() {
    if (!wx.cloud) return;
    wx.showLoading({ title: '行情刷新中' })

    try {
      // 1. 从数据库获取自选股
      const res = await db.collection('user_stocks').get()
      const dbList = res.data || []

      if (dbList.length === 0) {
        this.setData({ myStocks: [] })
        wx.hideLoading()
        return
      }

      // 2. 先把数据库里的基础数据显示出来（防止云函数慢导致白屏）
      this.setData({ myStocks: dbList })

      // 3. 准备代码数组，发给云函数
      // 这里的逻辑处理：确保发给接口的是 sh600519 这种格式
      const codes = dbList.map(item => {
        let finalCode = item.code;
        // 如果 code 存反了变成了 "sh"，我们就尝试从 name 字段里救回来
        if (finalCode === 'sh' || finalCode === 'sz') {
          finalCode = item.name; 
        }
        
        // 补全格式：确保变成 sh600519
        if (!finalCode.startsWith('sh') && !finalCode.startsWith('sz')) {
          finalCode = (item.market || 'sh') + finalCode;
        }
        return finalCode;
      })

      // 4. 调用云函数获取实时价格
      const cloudRes = await wx.cloud.callFunction({
        name: 'getStockDetail',
        data: { stockList: codes }
      })

      console.log('行情数据返回：', cloudRes)
      console.log('云函数返回的原始对象:', cloudRes)
      console.log('行情列表具体内容:', cloudRes.result.data)
      
      if (cloudRes.result && cloudRes.result.data) {
        // 5. 成功拿到行情，更新数据
        console.log('即将更新页面数据...');
        this.setData({ 
          myStocks: cloudRes.result.data 
        }, () => {
          console.log('页面数据更新完成，当前 data 里的 myStocks 为:', this.data.myStocks)
        })
      }

    } catch (err) {
      console.error('刷新失败原因：', err)
      // 如果云函数挂了，保持显示数据库的基础数据
    } finally {
      wx.hideLoading()
    }
  }
})