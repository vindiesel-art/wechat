const Utf8ArrayToStr = (array) => {
  let out, i, len, c;
  let char2, char3;
  out = "";
  len = array.length;
  i = 0;
  while (i < len) {
    c = array[i++];
    switch (c >> 4) {
      case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
        out += String.fromCharCode(c);
        break;
      case 12: case 13:
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
        break;
      case 14:
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(((c & 0x0F) << 12) | ((char2 & 0x3F) << 6) | ((char3 & 0x3F) << 0));
        break;
    }
  }
  return out;
}

Page({
  data: {
    reportText: '',
    loading: false,
    buffer: '',
    scrollTop: 0,
    isUserScrolling: false, // 逻辑锁定
    isTouching: false      // 物理触摸锁定
  },

  // 1. 记录用户手指按在屏幕上的瞬间
  handleTouchStart() {
    this.setData({ isTouching: true });
  },

  // 2. 记录手指离开屏幕
  handleTouchEnd() {
    this.setData({ isTouching: false });
  },

  // 3. 滚动监听
  onScroll(e) {
    const { scrollTop, scrollHeight } = e.detail;
    wx.createSelectorQuery().select('.report-card').boundingClientRect(res => {
      if (!res) return;
      const containerHeight = res.height;
      const distanceToBottom = scrollHeight - scrollTop - containerHeight;
      
      // 关键判断：如果距离底部 > 80px 或者 正在触摸，则锁定
      if (distanceToBottom > 80 || this.data.isTouching) {
        this.data.isUserScrolling = true;
      } else {
        this.data.isUserScrolling = false;
      }
    }).exec();
  },

  fetchReportStream(e) {
    // 初始化逻辑...
    const requestTask = wx.request({
      // ... 之前的请求配置 ...
      enableChunked: true,
      data: {
        // ... 之前的 prompt 配置 ...
        stream: true 
      }
    });

    requestTask.onChunkReceived((response) => {
      // ... 二进制转字符串及 JSON 解析逻辑 ...

      if (newContent) {
        // 只有当用户既没在摸屏幕，也没在往上看时，才滚动
        const shouldScroll = !this.data.isUserScrolling && !this.data.isTouching;
        
        this.setData({
          reportText: this.data.reportText + newContent
        }, () => {
          if (shouldScroll) {
            this.setData({ scrollTop: 999999 });
          }
        });
      }
    });
  }
});