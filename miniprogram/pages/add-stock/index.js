Page({
  data: {
    keyword: '',
    stockList: []
  },

  onInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  // pages/add-stock/index.js
  doSearch() {
    const kw = this.data.keyword;
    if (!kw) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '搜索中' });

    wx.cloud.callFunction({
      name: 'searchStock', // 必须和云函数文件夹名字完全一致
      data: {
        keyword: kw
      }
    }).then(res => {
      wx.hideLoading();
      console.log('结果在此：', res.result); // 在这里看有没有数据回传
      if (res.result && res.result.data) {
        this.setData({
          stockList: res.result.data
        });
      } else {
        wx.showToast({ title: '未找到相关股票', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('调用失败', err);
    });
  },

  onAddStock(e) {
    const stock = e.currentTarget.dataset.item;
    console.log('1. 准备添加股票：', stock); // 打印日志

    if (!stock) return;

    wx.showLoading({ title: '添加中...' })

    wx.cloud.callFunction({
      name: 'addStock',
      data: {
        code: stock.code || '600519',
        name: stock.name || '贵州茅台',
        market: stock.market || 'sh'
      }
    }).then(res => {
      wx.switchTab({ url: '/pages/watchlist/index' })
      console.log('2. 云函数返回结果：', res); // 关键！看这里打印了什么

      // 检查云函数是否真的返回了成功
      if (res.result && res.result.success) {
        wx.showToast({ title: '添加成功', icon: 'success' })
        
        // 延迟跳转，让用户看清提示
        setTimeout(() => {
          wx.switchTab({ url: '/pages/watchlist/index' })
        }, 1500)

      } else {
        // 如果失败，打印失败原因并弹窗
        const errorMsg = res.result ? res.result.msg : '未知错误';
        console.error('3. 添加失败原因：', errorMsg);
        wx.showModal({
          title: '添加失败',
          content: '错误信息：' + errorMsg,
          showCancel: false
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('4. 云函数调用彻底失败：', err);
      wx.showModal({
        title: '系统错误',
        content: '调用云函数报错：' + err.toString(),
        showCancel: false
      })
    })
  }

})