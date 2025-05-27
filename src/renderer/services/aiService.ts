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

  // 生成日报
  async generateReport(
    messages: ChatlogMessage[], 
    chatName: string, 
    date: string
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
      
      console.log('🔍 开始生成结构化日报...');
      // 生成结构化日报
      const digest = await this.generateDigest(processedMessages, chatName, date);
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

  // 处理消息数据
  private processMessages(messages: ChatlogMessage[]) {
    return messages
      .filter(msg => msg.type === 1) // 只处理文本消息
      .map(msg => {
        // 修复时间戳处理 - Chatlog返回的时间可能是字符串格式
        let timestamp = 'Unknown';
        try {
          if (typeof msg.timestamp === 'string') {
            // 如果是ISO字符串格式
            timestamp = dayjs(msg.timestamp).format('HH:mm');
          } else if (typeof msg.timestamp === 'number') {
            // 如果是Unix时间戳
            timestamp = dayjs(msg.timestamp * 1000).format('HH:mm');
          }
        } catch (error) {
          console.warn('时间戳解析失败:', msg.timestamp);
          timestamp = 'Unknown';
        }

        return {
          sender: msg.talker || 'Unknown',
          content: msg.content || '',
          timestamp,
          time: msg.timestamp
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
    date: string
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

    console.log('🔍 准备发送给AI的数据长度:', messagesText.length);
    console.log('🔍 清理后的群聊名称:', cleanChatName);

    // 使用详细的中文prompt
    const prompt = `请深入分析以下微信群聊记录，提取关键信息生成详细的日报摘要。

群聊：${cleanChatName}
日期：${date}

聊天记录：
${messagesText}

请仔细分析聊天内容，返回以下JSON格式（所有内容必须用中文）：

{
  "topicHighlights": [
    {
      "title": "具体话题标题",
      "summary": "详细描述这个话题的完整背景、讨论过程、主要观点、结论等，让没有参与讨论的人也能完全理解发生了什么。至少100字的详细描述。",
      "participants": ["实际参与讨论的用户名"],
      "timeRange": "具体时间段",
      "category": "技术/学习/工作/生活/其他",
      "significance": "高|中|低"
    }
  ],
  "activityStats": {
    "totalMessages": 消息总数,
    "activeUsers": ["活跃用户列表"],
    "messageDistribution": {"morning": 0, "afternoon": 0, "evening": 0, "night": 0}
  },
  "quotableMessages": [
    {
      "content": "有价值的原始消息内容",
      "author": "发送者",
      "timestamp": "时间"
    }
  ],
  "followUps": [
    {
      "title": "具体的跟进事项标题",
      "description": "详细说明需要跟进什么、为什么需要跟进、预期结果等。包含足够的上下文信息。",
      "priority": "高|中|低",
      "deadline": "如果提到时间则填写，否则填空字符串",
      "assignee": "如果指定了负责人则填写，否则填空字符串"
    }
  ]
}

分析要求：
1. 话题摘要必须详细完整，包含讨论的来龙去脉
2. 跟进事项要具体可执行，不能只是泛泛的描述
3. 如果聊天内容较少，也要尽可能挖掘有价值的信息
4. 保持客观中性的语调
5. 重要：在JSON字符串值中避免使用双引号，如果必须使用引号请用单引号替代

只返回标准JSON格式，确保所有字符串值中不包含未转义的双引号：`;

    let response;
    try {
      console.log('🔍 开始调用AI API...');
      console.log('🔍 API配置:', {
        model: this.config!.model,
        provider: this.config!.provider,
        baseURL: this.client!.baseURL
      });
      
      // 使用实际的聊天分析prompt
      response = await this.client!.chat.completions.create({
        model: this.config!.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的微信群聊分析助手，擅长深度挖掘聊天记录中的有价值信息。请仔细分析每条消息的上下文关系，提供详细完整的话题总结和具体可执行的跟进事项。用中文输出标准JSON格式。重要：在JSON字符串中避免使用双引号，如需引用请用单引号。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000
      });
      console.log('🔍 AI API调用成功');
    } catch (apiError) {
      console.error('🔍 AI API调用失败:', apiError);
      console.error('🔍 API错误详情:', {
        message: apiError instanceof Error ? apiError.message : 'Unknown error',
        name: apiError instanceof Error ? apiError.name : 'Unknown',
        stack: apiError instanceof Error ? apiError.stack : 'No stack'
      });
      throw apiError;
    }

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('AI返回内容为空');
    }

    console.log('🔍 AI返回的原始内容:', content);
    console.log('🔍 AI返回内容长度:', content.length);
    console.log('🔍 AI返回内容前50字符:', content.substring(0, 50));

    // 尝试清理和提取JSON部分
    let cleanContent = content.trim();
    
    // 查找JSON部分（通常在```json和```之间，或者直接是JSON）
    const jsonMatch = cleanContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                     cleanContent.match(/```\s*([\s\S]*?)\s*```/) ||
                     cleanContent.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      cleanContent = jsonMatch[1] || jsonMatch[0];
      console.log('🔍 提取的JSON内容:', cleanContent);
    }

    try {
      // 使用更简单的方法处理JSON解析问题
      let sanitizedContent = cleanContent;
      
      // 替换可能导致问题的引号字符
      sanitizedContent = sanitizedContent
        .replace(/[\u201c\u201d]/g, '"') // 替换中文双引号为标准双引号
        .replace(/[\u2018\u2019]/g, "'") // 替换中文单引号为标准单引号
        .replace(/"/g, '"') // 替换全角引号
        .replace(/'/g, "'") // 替换全角单引号
        .trim();
      
      // 如果还是有问题，尝试手动修复常见的JSON格式错误
      if (sanitizedContent.includes('（"') || sanitizedContent.includes('"）')) {
        sanitizedContent = sanitizedContent
          .replace(/（"/g, '("')
          .replace(/"）/g, '")');
      }
      
      console.log('🔍 JSON清理后内容前500字符:', sanitizedContent.substring(0, 500));
      
      const result = JSON.parse(sanitizedContent);
      console.log('🔍 JSON解析成功:', result);
      
      // 构建完整的DailyDigest对象
      return {
        id: `digest-${date}`,
        chatGroupId: chatName,
        chatGroupName: chatName,
        date,
        topicHighlights: result.topicHighlights || [],
        activityStats: {
          totalMessages: messages.length,
          activeUsers: [...new Set(messages.map(m => m.sender))],
          peakTimeRange: this.calculatePeakTime(messages),
          messageDistribution: this.calculateTimeDistribution(messages),
          ...result.activityStats
        },
        quotableMessages: result.quotableMessages || [],
        followUps: result.followUps || []
      };
    } catch (parseError) {
      console.error('🔍 JSON解析失败:', parseError);
      console.error('🔍 尝试解析的内容:', cleanContent);
      
      // 如果JSON解析失败，返回一个基本的结构
      return {
        id: `digest-${date}`,
        chatGroupId: chatName,
        chatGroupName: chatName,
        date,
        topicHighlights: [{
          title: '数据解析失败',
          summary: 'AI返回的数据格式无法解析，可能是由于聊天内容过于复杂或API返回格式异常。建议检查API配置或重新尝试生成。原始AI返回内容已记录在日志中供调试使用。',
          participants: [...new Set(messages.map(m => m.sender))],
          timeRange: '全天',
          category: '错误',
          significance: 'low'
        }],
        activityStats: {
          totalMessages: messages.length,
          activeUsers: [...new Set(messages.map(m => m.sender))],
          peakTimeRange: this.calculatePeakTime(messages),
          messageDistribution: this.calculateTimeDistribution(messages)
        },
        quotableMessages: [],
        followUps: [{
          title: '重新生成日报',
          description: '由于解析失败，建议检查网络连接和API配置后重新生成日报',
          priority: '中'
        }]
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

请生成包含以下内容的详细日报：
1. 基本统计信息
2. 主要话题讨论
3. 重要决策和共识
4. 资源分享汇总
5. 待跟进事项
6. 群友精彩语录
7. 原始记录摘要（重要对话的完整记录）

格式要求：使用Markdown格式，结构清晰，便于阅读和存档。请用中文输出。`;

    console.log('📄 开始调用AI API生成文本日报...');
    try {
      const response = await this.client!.chat.completions.create({
        model: this.config!.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的会议记录整理员，擅长将聊天记录整理成结构化的文档报告。请用中文输出。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 3000
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