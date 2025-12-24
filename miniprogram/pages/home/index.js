// pages/home/index.js

// 在 Page 外部定义解码器，避免重复创建
const decoder = wx.getFileSystemManager(); 

Page({
  data: {
    reportText: '',
    loading: false,
    lastLineId: ''
  },

  fetchReportStream(e) {
    const type = e.currentTarget.dataset.type;
    const dateText = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    
    this.setData({ loading: true, reportText: '', lastLineId: '' });

    const requestTask = wx.request({
      url: 'https://api.deepseek.com/chat/completions',
      method: 'POST',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer 你的API_KEY'
      },
      enableChunked: true,
      data: {
        model: 'deepseek-chat',
        messages: [
          { role: "system", content: "你是一个专业的财经新闻助手。" },
          { role: "user", content: `整理一下[${dateText}]日的财经新闻${type}... (此处接你之前的完整Prompt)` }
        ],
        stream: true 
      }
    });

    requestTask.onChunkReceived((response) => {
      // 核心修复：使用小程序文件系统管理器的读取功能来正确解码 UTF-8
      // 这种方式比 atob 更能稳定处理中文
      const manager = wx.getFileSystemManager();
      const fileName = `${wx.env.USER_DATA_PATH}/chunk.txt`;
      
      manager.writeFileSync(fileName, response.data, 'binary');
      const chunkStr = manager.readFileSync(fileName, 'utf8');

      const lines = chunkStr.split('\n');
      let newText = '';

      for (let line of lines) {
        if (line.trim().startsWith('data: ')) {
          const dataStr = line.trim().substring(6);
          if (dataStr === '[DONE]') continue;
          try {
            const json = JSON.parse(dataStr);
            const content = json.choices[0].delta.content || '';
            newText += content;
          } catch (e) {}
        }
      }

      this.setData({
        reportText: this.data.reportText + newText,
        lastLineId: 'bottom' // 触发自动滚动
      });
    });
  }
});