// pages/home/index.js

// 核心：可靠的二进制转 UTF-8 函数，解决流式中文乱码
const Utf8ArrayToStr = (array) => {
  let out, i, len, c, char2, char3;
  out = ""; len = array.length; i = 0;
  while (i < len) {
    c = array[i++];
    switch (c >> 4) {
      case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7: out += String.fromCharCode(c); break;
      case 12: case 13: char2 = array[i++]; out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F)); break;
      case 14: char2 = array[i++]; char3 = array[i++]; out += String.fromCharCode(((c & 0x0F) << 12) | ((char2 & 0x3F) << 6) | ((char3 & 0x3F) << 0)); break;
    }
  }
  return out;
}

Page({
  data: {
    reportText: '',
    loading: false,
    scrollTop: 0,
    isUserScrolling: false, // 锁定标记
    isTouching: false      // 触摸标记
  },

  requestTask: null, // 存储当前请求任务
  buffer: '',        // 数据缓冲区

  // 手指触摸屏幕，立刻停止自动滚动
  handleTouchStart() {
    this.setData({ isTouching: true });
  },

  // 手指离开屏幕
  handleTouchEnd() {
    this.setData({ isTouching: false });
  },

  // 监听滚动，判断是否需要“定格”
  onScroll(e) {
    const { scrollTop, scrollHeight } = e.detail;
    wx.createSelectorQuery().select('.report-card').boundingClientRect(res => {
      if (!res) return;
      // 只要用户在触摸，或者距离底部超过 80px，就锁定不滚动
      const distanceToBottom = scrollHeight - scrollTop - res.height;
      this.setData({ 
        isUserScrolling: distanceToBottom > 80 || this.data.isTouching 
      });
    }).exec();
  },

  fetchReportStream(e) {
    // 1. 防止重复点击：如果有正在进行的任务，先中止
    if (this.requestTask) {
      this.requestTask.abort();
    }

    const type = e.currentTarget.dataset.type;
    const dateText = new Date().toLocaleDateString('zh-CN');
    
    // 2. 初始化状态
    this.buffer = '';
    this.setData({ 
      loading: true, 
      reportText: '', 
      scrollTop: 0,
      isUserScrolling: false 
    });

    // 💡 修复 ByteString 报错：请确保 API_KEY 只有英文和数字
    const API_KEY = "你的KEY"; 

    this.requestTask = wx.request({
      url: 'https://api.deepseek.com/chat/completions',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY.trim()}` // 使用 trim() 去掉首尾可能的空格
      },
      enableChunked: true,
      data: {
        model: 'deepseek-chat',
        messages: [
          { role: "system", content: "你是一个专业的财经新闻助手。" },
          { role: "user", content: `整理一下[${dateText}]日的财经新闻${type}...` }
        ],
        stream: true 
      },
      success: () => {
        this.setData({ loading: false });
      },
      fail: (err) => {
        if (err.errMsg.indexOf('abort') === -1) {
          this.setData({ reportText: '请求失败：' + err.errMsg, loading: false });
        }
      }
    });

    // 监听流式返回
    this.requestTask.onChunkReceived((response) => {
      const chunkStr = Utf8ArrayToStr(new Uint8Array(response.data));
      this.buffer += chunkStr;
      
      let lines = this.buffer.split('\n');
      this.buffer = lines.pop(); // 保留不完整的行

      let newContent = '';
      for (let line of lines) {
        line = line.trim();
        if (!line || line === 'data: [DONE]') continue;
        if (line.startsWith('data: ')) {
          try {
            const json = JSON.parse(line.substring(6));
            newContent += json.choices[0].delta.content || '';
          } catch (e) {
            this.buffer = line + '\n' + this.buffer; // 解析失败回流缓冲区
          }
        }
      }

      if (newContent) {
        // 只有没在摸屏幕且没在上翻时才自动滚
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
})