App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env: '你的环境ID', // 如果只有一个环境，可以不填，默认取当前环境
        traceUser: true,
      })
    }
  }
})