// cloudfunctions/getAIReport/index.js
const cloud = require('wx-server-sdk')
const axios = require('axios')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const DEEPSEEK_API_KEY = 'sk-c255d3d83f4e4d29bd3092391c27ffc4' // 确保填入你的Key

exports.main = async (event, context) => {
  const { dateText, reportType } = event; // 接收前端传来的时间和类型

  const prompt = `
    整理一下 [${dateText}] 的财经新闻${reportType}。
    
    请以专业财经主编的身份，用简报方式播报。要求如下：
    1. 选出今日最重要的 TOP 10 简报，按重要程度（1-5颗星）从高到低排序。
    2. 每条新闻必须包含以下固定格式：
       - 【重要程度】：根据事件影响力和关注度，展示 1-5 个实心五角星（如：★★★★★）。这是一个类型字段。
       - 【标题】：一句话概括。
       - 【评判】：给出“利好”、“利空”或“中性”的明确判断。
       - 【出处】：注明参考来源（如：财联社、新华社、证券时报等）。
       - 【白话解析】：用普通人听得懂的语言解释该新闻对投资或生活的影响。
    3. 风格要求：严谨、专业、接地气。
    4. 结尾：用一句话简洁总结全天/早间情绪，不要反问我。
  `;

  try {
    const response = await axios.post('https://api.deepseek.com/chat/completions', {
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "你是一个专业且高效的财经简报生成器。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.6 // 财经内容需要稳定性，调低随机性
    }, {
      headers: { 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` }
    });

    return { result: response.data.choices[0].message.content };
  } catch (err) {
    return { result: 'AI 思考超时，请重试', error: err.toString() };
  }
}