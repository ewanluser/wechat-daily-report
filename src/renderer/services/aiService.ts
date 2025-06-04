import OpenAI from 'openai';
import { AIConfig, ChatlogMessage, DailyDigest, GeneratedReport } from '../../shared/types';
import dayjs from 'dayjs';

class AIService {
  private client: OpenAI | null = null;
  private config: AIConfig | null = null;

  // 配置AI服务
  configure(config: AIConfig) {
    this.config = config;
    
    const baseURL = config.provider === 'openrouter' 
      ? 'https://openrouter.ai/api/v1'
      : config.baseUrl || 'https://api.openai.com/v1';

    // 清理API密钥，只移除控制字符，保留ASCII可打印字符
    const cleanApiKey = String(config.apiKey).replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();

    this.client = new OpenAI({
      apiKey: cleanApiKey,
      baseURL,
      dangerouslyAllowBrowser: true,
      defaultHeaders: {
        'Content-Type': 'application/json',
        'User-Agent': 'wechat-daily-report/1.0.0'
      }
    });
    
    console.log('🤖 AI客户端配置完成:', { 
      provider: config.provider, 
      baseURL, 
      model: config.model,
      hasApiKey: !!cleanApiKey
    });
  }

  // 检查是否已配置
  isConfigured(): boolean {
    return this.client !== null && this.config !== null;
  }

  // 判断是否为个人聊天
  private isPrivateChat(messages: ChatlogMessage[]): boolean {
    // 分析消息发送者，如果只有2个不同的发送者，很可能是个人聊天
    const senders = new Set(messages.map(msg => msg.sender || msg.talker || 'unknown'));
    console.log('🔍 发送者分析:', { totalSenders: senders.size, senders: Array.from(senders) });
    return senders.size <= 2;
  }

  // 生成日报
  async generateReport(
    messages: ChatlogMessage[], 
    chatName: string, 
    date: string,
    chatType?: 'group' | 'private'
  ): Promise<GeneratedReport> {
    console.log('🤖 AI服务开始生成日报');
    console.log('📊 输入参数:', { 
      messagesCount: messages.length, 
      chatName, 
      date,
      isConfigured: this.isConfigured()
    });

    if (!this.client || !this.config) {
      console.error('❌ AI服务未配置');
      throw new Error('AI服务未配置，请先设置API密钥');
    }

    try {
      console.log('📝 开始处理消息数据...');
      // 处理消息数据
      const processedMessages = this.processMessages(messages);
      console.log('📝 消息处理完成，处理后数量:', processedMessages.length);
      
      // 判断聊天类型 - 优先使用传入的chatType参数
      let determinedChatType: 'group' | 'private';
      if (chatType) {
        determinedChatType = chatType;
        console.log('🔍 使用传入的聊天类型:', determinedChatType);
      } else {
        determinedChatType = this.isPrivateChat(messages) ? 'private' : 'group';
        console.log('🔍 自动判断聊天类型:', determinedChatType);
      }
      
      console.log('🔍 开始生成结构化日报...');
      // 生成结构化日报
      const digest = await this.generateDigest(processedMessages, chatName, date, determinedChatType);
      console.log('🔍 结构化日报生成完成');
      
      console.log('📄 开始生成文本日报...');
      // 生成文本日报
      const textReport = await this.generateTextReport(processedMessages, chatName, date, digest);
      console.log('📄 文本日报生成完成');

      const result = {
        digest,
        textReport,
        rawMessages: messages,
        generatedAt: new Date().toISOString()
      };

      console.log('✅ AI日报生成完全成功');
      return result;
    } catch (error) {
      console.error('❌ AI生成日报失败:', error);
      throw new Error(`生成日报失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 生成友好的用户名显示
  private generateFriendlyUserName(talker: string): string {
    if (!talker || talker === 'Unknown') {
      return 'Unknown';
    }
    
    let friendlyName = talker;
    
    // 如果talker是类似微信ID的格式，尝试提取更有意义的部分
    if (friendlyName.includes('@chatroom')) {
      // 这是群聊ID，可能是错误的数据，使用通用名称
      return '群聊';
    }
    
    if (friendlyName.includes('@')) {
      // 如果包含@符号，取@前面的部分
      friendlyName = friendlyName.split('@')[0];
    }
    
    // 如果是纯数字ID（如QQ号），生成友好名称
    if (/^\d+$/.test(friendlyName)) {
      const userNumber = friendlyName.substring(friendlyName.length - 4); // 取后4位
      return `用户${userNumber}`;
    }
    
    // 如果仍然很长，截取并添加省略号
    if (friendlyName.length > 12) {
      return `${friendlyName.substring(0, 8)}...`;
    }
    
    // 如果看起来像随机字符串，生成更友好的名称
    if (friendlyName.length > 8 && /^[a-zA-Z0-9]+$/.test(friendlyName)) {
      const hashCode = friendlyName.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const userIndex = Math.abs(hashCode) % 1000;
      return `用户${userIndex.toString().padStart(3, '0')}`;
    }
    
    return friendlyName;
  }

  // 处理消息数据
  private processMessages(messages: ChatlogMessage[]) {
    // 添加调试信息查看消息结构
    if (messages.length > 0) {
      console.log('🔍 原始消息样例:', messages[0]);
      console.log('🔍 所有可用字段:', Object.keys(messages[0]));
    }
    
    return messages
      .filter(msg => msg.type === 1) // 只处理文本消息
      .map(msg => {
        // 修复时间戳处理 - 使用time字段而不是timestamp
        let timestamp = 'Unknown';
        try {
          if (msg.time) {
            // 使用dayjs处理ISO字符串格式的时间
            timestamp = dayjs(msg.time).format('HH:mm');
          } else if (typeof msg.timestamp === 'string') {
            // 如果是ISO字符串格式
            timestamp = dayjs(msg.timestamp).format('HH:mm');
          } else if (typeof msg.timestamp === 'number') {
            // 如果是Unix时间戳
            timestamp = dayjs(msg.timestamp * 1000).format('HH:mm');
          }
        } catch (error) {
          console.warn('时间戳解析失败:', msg.time || msg.timestamp);
          timestamp = 'Unknown';
        }

        // 使用正确的字段获取用户信息
        // 优先使用senderName，其次使用sender，最后使用talker
        let userIdentifier = msg.senderName || msg.sender || msg.talker || 'Unknown';
        
        // 如果senderName不存在，从sender生成友好名称
        let friendlyName;
        if (msg.senderName) {
          friendlyName = msg.senderName;
        } else {
          friendlyName = this.generateFriendlyUserName(msg.sender || msg.talker || 'Unknown');
        }


        return {
          sender: friendlyName,
          content: msg.content || '',
          timestamp,
          time: msg.time || msg.timestamp,
          originalSender: msg.sender, // 保留原始sender以备后用
          originalTalker: msg.talker // 保留原始talker以备后用
        };
      })
      .sort((a, b) => {
        // 简化排序逻辑，按索引顺序
        return 0;
      });
  }

  // 生成结构化日报
  private async generateDigest(
    messages: any[], 
    chatName: string, 
    date: string,
    chatType: 'group' | 'private' = 'group'
  ): Promise<DailyDigest> {
    // 保留中文群聊名称
    const cleanChatName = String(chatName).replace(/[\u0000-\u001F\u007F-\u009F]/g, '').substring(0, 50);
    
    // 保留中文字符，增加消息数量和长度以提供更多上下文
    const cleanMessages = messages.slice(0, 50).map(m => ({
      timestamp: m.timestamp,
      sender: String(m.sender).replace(/[\u0000-\u001F\u007F-\u009F]/g, '').substring(0, 30), // 增加用户名长度
      content: String(m.content).replace(/[\u0000-\u001F\u007F-\u009F]/g, '').substring(0, 300) // 增加内容长度
    }));

    const messagesText = cleanMessages.map(m => 
      `[${m.timestamp}] ${m.sender}: ${m.content}`
    ).join('\n');

    // 提取实际的用户列表
    const actualUsers = [...new Set(cleanMessages.map(m => m.sender))].filter(user => user && user.trim());
    console.log('🔍 实际用户列表:', actualUsers);

    console.log('🔍 准备发送给AI的数据长度:', messagesText.length);
    console.log('🔍 清理后的群聊名称:', cleanChatName);

    // 使用简洁的中文prompt（限制内容数量，适合一图展示）
    const userExamples = actualUsers.slice(0, 3).map(u => `"${u}"`).join(', ');
    const allUsers = actualUsers.map(u => `"${u}"`).join(', ');
    
    // 为个人聊天和群聊定制不同的prompt
    const chatTypeText = chatType === 'private' ? '个人聊天' : '群聊';
    const analysisTarget = chatType === 'private' ? 
      `${chatTypeText}对象：${cleanChatName}` : 
      `${chatTypeText}：${cleanChatName}`;
    
    const prompt = chatType === 'private' ? 
      `分析微信个人聊天记录，生成简洁但信息丰富的JSON格式日报（适合一张图片展示）。

${analysisTarget}
日期：${date}
参与用户：${actualUsers.join(', ')}

聊天记录：
${messagesText}

返回以下JSON格式（针对个人聊天优化）：

{
  "topicHighlights": [
    {
      "title": "话题标题（简洁明了）",
      "summary": "话题详细描述（80-120字，包含关键信息和背景）",
      "participants": ["使用实际的用户名"],
      "timeRange": "时间段",
      "category": "工作/学习/生活/情感/决策/讨论/其他",
      "significance": "高|中|低",
      "keywordTags": ["关键词1", "关键词2"],
      "sentimentTone": "positive|neutral|negative|mixed"
    }
  ],
  "activityStats": {
    "totalMessages": ${messages.length},
    "activeUsers": ["必须使用实际用户名: ${allUsers}"],
    "messageDistribution": {"morning": 0, "afternoon": 0, "evening": 0, "night": 0},
    "averageMessageLength": 0,
    "responseRate": 0.0,
    "mediaStats": {
      "imageCount": 0,
      "linkCount": 0,
      "documentCount": 0
    }
  },
  "quotableMessages": [
    {
      "content": "精彩发言（有价值的个人表达）",
      "author": "必须使用实际的发送者用户名",
      "timestamp": "时间",
      "messageType": "insight|humor|decision|question|solution|emotion",
      "sentimentScore": 0.5
    }
  ],
  "privateAnalysis": {
    "relationshipTone": "friendly|professional|intimate|neutral",
    "conversationPatterns": ["对话模式描述1", "对话模式描述2"],
    "emotionalInsights": ["情感洞察1", "情感洞察2"],
    "communicationStyle": "沟通风格描述"
  },
  "contentValue": {
    "knowledgeSharing": [
      {
        "type": "经验分享|资源推荐|问题解决|学习交流",
        "content": "分享内容摘要",
        "author": "分享者",
        "timestamp": "时间"
      }
    ],
    "actionItems": [
      {
        "task": "待办事项描述",
        "assignee": "负责人（如有）",
        "context": "上下文"
      }
    ],
    "decisionsMade": [
      {
        "decision": "决策内容",
        "context": "决策背景",
        "participants": ["参与决策的用户"],
        "timestamp": "时间"
      }
    ]
  },
  "trendInsights": {
    "comparedToPrevious": "与往常相比的变化描述"
  }
}` :
      `分析微信群聊记录，生成简洁但信息丰富的JSON格式日报（适合一张图片展示）。

${analysisTarget}
日期：${date}
参与用户：${actualUsers.join(', ')}

聊天记录：
${messagesText}

返回以下JSON格式（保持简洁但信息丰富）：

{
  "topicHighlights": [
    {
      "title": "话题标题（简洁明了）",
      "summary": "话题详细描述（80-120字，包含关键信息和背景）",
      "participants": ["使用实际的用户名，如：${userExamples}"],
      "timeRange": "时间段",
      "category": "技术/学习/工作/生活/决策/讨论/其他",
      "significance": "高|中|低",
      "keywordTags": ["关键词1", "关键词2"],
      "sentimentTone": "positive|neutral|negative|mixed"
    }
  ],
  "activityStats": {
    "totalMessages": ${messages.length},
    "activeUsers": ["必须使用实际用户名: ${allUsers}"],
    "messageDistribution": {"morning": 0, "afternoon": 0, "evening": 0, "night": 0},
    "averageMessageLength": 0,
    "responseRate": 0.0,
    "silentMembers": ["较少发言的用户"],
    "mediaStats": {
      "imageCount": 0,
      "linkCount": 0,
      "documentCount": 0
    }
  },
  "quotableMessages": [
    {
      "content": "精彩发言（简洁有价值）",
      "author": "必须使用实际的发送者用户名",
      "timestamp": "时间",
      "messageType": "insight|humor|decision|question|solution",
      "sentimentScore": 0.5
    }
  ],
  "memberContributions": [
    {
      "name": "用户名",
      "messageCount": 0,
      "qualityScore": 8,
      "specialties": ["技术", "产品"],
      "responseTime": "快速|正常|较慢",
      "initiatedTopics": 0
    }
  ],
  "contentValue": {
    "knowledgeSharing": [
      {
        "type": "技术分享|资源推荐|经验总结|问题解决",
        "content": "分享内容摘要",
        "author": "分享者",
        "timestamp": "时间"
      }
    ],
    "actionItems": [
      {
        "task": "待办事项描述",
        "assignee": "负责人（如有）",
        "context": "上下文"
      }
    ],
    "decisionsMade": [
      {
        "decision": "决策内容",
        "context": "决策背景",
        "participants": ["参与决策的用户"],
        "timestamp": "时间"
      }
    ]
  },
  "groupHealth": {
    "participationBalance": 0.8,
    "topicDiversity": 0.7,
    "interactionQuality": 0.9,
    "overallHealthScore": 85,
    "recommendations": ["改进建议1", "改进建议2"]
  },
  "trendInsights": {
    "comparedToPrevious": "与往常相比的变化描述"
  }
}

重要要求：
1. topicHighlights 最多2-3个重要话题，但每个话题要有足够信息量
2. quotableMessages 最多2-3句精彩发言，选择最有价值的
3. memberContributions 展示前3-5名活跃贡献者
4. 所有数值字段要基于实际聊天内容进行合理估算
5. 必须使用聊天记录中的实际用户名
6. 返回完整有效的JSON，不要markdown标记
7. 新增字段要提供有价值的洞察，不是简单罗列
8. 重要性级别说明：
   - "高"：影响决策、解决重要问题、涉及多人的关键讨论
   - "中"：有价值的技术分享、经验交流、一般性讨论
   - "低"：日常闲聊、简单问答、个人感想

JSON格式严格要求：
- 必须返回完整的JSON对象，以{开始，以}结束
- 不要在JSON前后添加任何文字说明
- 不要使用\`\`\`json\`\`\`标记包裹
- 所有字符串值必须用双引号包围
- 字符串内容中的双引号必须转义为\\"
- 数组和对象的最后一个元素后不要加逗号
- 确保所有括号、中括号、大括号都正确闭合
- 返回的内容必须能直接通过JSON.parse()解析`;

    try {
      console.log('🔍 开始调用AI API...');
      
      const response = await this.client!.chat.completions.create({
        model: this.config!.model,
        messages: [
          {
            role: 'system',
            content: '你是一个JSON数据分析助手。请严格按照要求返回JSON格式，不要包含任何markdown标记或其他文字。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      });
      console.log('🔍 AI API调用成功');

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('AI返回内容为空');
      }

      console.log('🔍 AI返回的原始内容:', content);

      // 简单的JSON提取和解析
      let jsonStr = content.trim();
      
      // 移除可能的markdown标记
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // 查找JSON部分
      const startIndex = jsonStr.indexOf('{');
      const endIndex = jsonStr.lastIndexOf('}');
      
      if (startIndex !== -1 && endIndex !== -1) {
        jsonStr = jsonStr.substring(startIndex, endIndex + 1);
      }

      console.log('🔍 准备解析的JSON:', jsonStr);

      // 直接解析JSON
      const result = JSON.parse(jsonStr);
      console.log('🔍 JSON解析成功:', result);

      // 构建完整的DailyDigest对象
      const digest: DailyDigest = {
        id: `digest-${date}`,
        chatGroupId: chatName,
        chatGroupName: chatName,
        chatType,
        date,
        topicHighlights: result.topicHighlights || [],
        activityStats: {
          totalMessages: messages.length,
          activeUsers: actualUsers,
          peakTimeRange: this.calculatePeakTime(messages),
          messageDistribution: this.calculateTimeDistribution(messages)
        },
        quotableMessages: result.quotableMessages || [],
        // 为个人聊天添加特殊分析
        ...(chatType === 'private' && result.privateAnalysis ? {
          privateAnalysis: result.privateAnalysis
        } : {})
      };

      return digest;

    } catch (error) {
      console.error('❌ JSON解析失败:', error);
      
      // 如果解析失败，返回基本结构
      return {
        id: `digest-${date}`,
        chatGroupId: chatName,
        chatGroupName: chatName,
        chatType,
        date,
        topicHighlights: [{
          title: '解析失败',
          summary: `AI返回数据解析失败: ${error instanceof Error ? error.message : '未知错误'}`,
          participants: actualUsers,
          timeRange: '全天',
          category: '错误',
          significance: 'low'
        }],
        activityStats: {
          totalMessages: messages.length,
          activeUsers: actualUsers,
          peakTimeRange: this.calculatePeakTime(messages),
          messageDistribution: this.calculateTimeDistribution(messages)
        },
        quotableMessages: []
      };
    }
  }

  // 生成文本日报
  private async generateTextReport(
    messages: any[], 
    chatName: string, 
    date: string,
    digest: DailyDigest
  ): Promise<string> {
    // 保留中文字符，只清理控制字符
    const cleanMessages = messages.slice(0, 20).map(m => ({
      timestamp: m.timestamp,
      sender: String(m.sender).replace(/[\u0000-\u001F\u007F-\u009F]/g, ''),
      content: String(m.content).replace(/[\u0000-\u001F\u007F-\u009F]/g, '').substring(0, 200)
    }));

    const messagesText = cleanMessages.map(m => 
      `[${m.timestamp}] ${m.sender}: ${m.content}`
    ).join('\n');

    const prompt = `基于以下微信群聊记录和结构化摘要，生成详细的中文日报。

群聊名称：${chatName}
日期：${date}
消息总数：${messages.length}
活跃用户：${digest.activityStats.activeUsers.length}人

聊天记录：
${messagesText}

请生成包含以下内容的详细完整日报：
1. 基本统计信息（详细数据分析）
2. 主要话题讨论（深入分析每个话题的背景、过程、结果）
3. 重要决策和共识（如有）
4. 资源分享汇总（链接、文档、工具等）
5. 群友精彩语录（多选有价值的发言）
6. 关键信息时间线
7. 原始记录摘要（重要对话的完整记录）
8. 总结与展望

格式要求：使用Markdown格式，内容详细完整，便于存档和后续查阅。请用中文输出。`;

    console.log('📄 开始调用AI API生成文本日报...');
    try {
      const response = await this.client!.chat.completions.create({
        model: this.config!.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的会议记录整理员，擅长将聊天记录整理成详细完整的文档报告。请深入挖掘每个话题的细节，提供完整的上下文信息，生成便于存档和后续查阅的详细日报。请用中文输出。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 4000  // 增加文本日报的token限制
      });

      console.log('📄 文本日报AI API调用成功');
      return response.choices[0]?.message?.content || 'Failed to generate text report';
    } catch (apiError) {
      console.error('📄 文本日报AI API调用失败:', apiError);
      return 'Failed to generate text report due to API error';
    }
  }

  // 计算高峰时段
  private calculatePeakTime(messages: any[]): string {
    const hourCounts: { [hour: number]: number } = {};
    
    messages.forEach(msg => {
      const hour = parseInt(msg.timestamp.split(':')[0]);
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const maxHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0];

    return maxHour ? `${maxHour}:00 - ${parseInt(maxHour) + 1}:00` : '00:00 - 01:00';
  }

  // 计算时段分布
  private calculateTimeDistribution(messages: any[]) {
    const distribution = {
      morning: 0,   // 6:00-12:00
      afternoon: 0, // 12:00-18:00
      evening: 0,   // 18:00-24:00
      night: 0      // 0:00-6:00
    };

    messages.forEach(msg => {
      const hour = parseInt(msg.timestamp.split(':')[0]);
      if (hour >= 6 && hour < 12) {
        distribution.morning++;
      } else if (hour >= 12 && hour < 18) {
        distribution.afternoon++;
      } else if (hour >= 18 && hour < 24) {
        distribution.evening++;
      } else {
        distribution.night++;
      }
    });

    return distribution;
  }

  // 获取配置
  getConfig(): AIConfig | null {
    return this.config;
  }
}

export const aiService = new AIService(); 