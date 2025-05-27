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

        console.log('🔍 用户信息映射:', {
          senderName: msg.senderName,
          sender: msg.sender,
          talker: msg.talker,
          finalName: friendlyName
        });

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

    // 提取实际的用户列表
    const actualUsers = [...new Set(cleanMessages.map(m => m.sender))].filter(user => user && user.trim());
    console.log('🔍 实际用户列表:', actualUsers);

    console.log('🔍 准备发送给AI的数据长度:', messagesText.length);
    console.log('🔍 清理后的群聊名称:', cleanChatName);

    // 使用简洁的中文prompt（限制内容数量，适合一图展示）
    const prompt = `分析微信群聊记录，生成简洁的JSON格式日报（适合一张图片展示）。

群聊：${cleanChatName}
日期：${date}
参与用户：${actualUsers.join(', ')}

聊天记录：
${messagesText}

返回以下JSON格式（保持简洁）：

{
  "topicHighlights": [
    {
      "title": "话题标题（简洁明了）",
      "summary": "话题详细描述（80-120字，包含关键信息和背景）",
      "participants": ["使用实际的用户名，如：${actualUsers.slice(0, 3).map(u => `"${u}"`).join(', ')}"],
      "timeRange": "时间段",
      "category": "技术/学习/工作/生活/其他",
      "significance": "高|中|低"
    }
  ],
  "activityStats": {
    "totalMessages": ${messages.length},
    "activeUsers": ["必须使用实际用户名: ${actualUsers.map(u => `"${u}"`).join(', ')}"],
    "messageDistribution": {"morning": 0, "afternoon": 0, "evening": 0, "night": 0}
  },
  "quotableMessages": [
    {
      "content": "精彩发言（简洁有价值）",
      "author": "必须使用实际的发送者用户名",
      "timestamp": "时间"
    }
  ]
}

重要要求：
1. topicHighlights 最多2-3个重要话题，但每个话题要有足够信息量
2. quotableMessages 最多2-3句精彩发言，选择最有价值的
3. summary 要详细描述（80-120字），包含关键信息、背景和影响
4. 必须使用聊天记录中的实际用户名
5. 返回完整有效的JSON，不要markdown标记
6. 图片展示要简洁，但内容要有实质性信息`;

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
            content: '你是一个专业的微信群聊分析助手，擅长从聊天记录中提炼最有价值的信息。请选择最重要的2-3个话题，但要确保每个话题都有足够的信息量和价值。话题描述要详细具体，包含关键背景和影响。必须用中文输出标准JSON格式，不要包含任何markdown标记。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 6000  // 增加token限制以避免截断
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
    
    // 检测是否被截断并处理
    let actualContent = content;
    const finishReason = response.choices[0]?.finish_reason;
    console.log('🔍 AI返回完成原因:', finishReason);
    
    if (finishReason === 'length') {
      console.warn('⚠️ AI返回内容可能被截断，finish_reason为length');
      
      // 如果被截断，尝试用更高的token限制重新请求
      try {
        console.log('🔍 检测到截断，使用更高token限制重试...');
        const retryResponse = await this.client!.chat.completions.create({
          model: this.config!.model,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的微信群聊分析助手。请输出简洁但完整的JSON格式日报，确保JSON结构完整有效。优先保证JSON的完整性，可以适当简化内容描述。'
            },
            {
              role: 'user',
              content: prompt.replace('至少100字的详细描述', '50-80字的简洁描述').replace('详细说明需要跟进什么、为什么需要跟进、预期结果等。包含足够的上下文信息。', '简洁说明跟进事项和预期结果。')
            }
          ],
          temperature: 0.3,
          max_tokens: 8000  // 进一步增加token限制
        });
        
        const retryContent = retryResponse.choices[0]?.message?.content;
        if (retryContent && retryResponse.choices[0]?.finish_reason !== 'length') {
          console.log('🔍 重试成功，使用重试结果');
          console.log('🔍 重试内容长度:', retryContent.length);
          actualContent = retryContent;  // 使用重试的结果
          console.log('🔍 重试返回的原始内容:', actualContent);
        } else {
          console.log('🔍 重试仍被截断或失败，使用原始内容');
        }
      } catch (retryError) {
        console.error('🔍 重试失败，继续使用原始内容:', retryError);
      }
    }

    // 改进的JSON解析逻辑
    let cleanContent = actualContent.trim();
    
    // 1. 首先移除markdown标记
    cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // 2. 查找JSON部分（从第一个 { 到最后一个 }）
    const firstBrace = cleanContent.indexOf('{');
    const lastBrace = cleanContent.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
      console.log('🔍 提取的JSON内容:', cleanContent);
    }

    // 3. 使用增强的清理方法
    let sanitizedContent = cleanContent;
    
    try {
      
      // 替换可能导致问题的引号字符
      sanitizedContent = sanitizedContent
        .replace(/[\u201c\u201d]/g, '"') // 替换中文双引号为标准双引号
        .replace(/[\u2018\u2019]/g, "'") // 替换中文单引号为标准单引号
        .replace(/"/g, '"') // 替换全角引号
        .replace(/'/g, "'") // 替换全角单引号
        .trim();
      
      // 4. 修复常见的JSON格式错误
      // 处理可能的不完整数组或对象
      if (!sanitizedContent.endsWith('}')) {
        // 如果JSON不完整，尝试找到最后一个完整的对象或数组
        const stack: string[] = [];
        let lastValidPos = 0;
        
        for (let i = 0; i < sanitizedContent.length; i++) {
          const char = sanitizedContent[i];
          if (char === '{' || char === '[') {
            stack.push(char);
          } else if (char === '}' || char === ']') {
            const expected = char === '}' ? '{' : '[';
            if (stack.length > 0 && stack[stack.length - 1] === expected) {
              stack.pop();
              if (stack.length === 0) {
                lastValidPos = i + 1;
              }
            }
          }
        }
        
        if (lastValidPos > 0) {
          sanitizedContent = sanitizedContent.substring(0, lastValidPos);
          console.log('🔍 修复后的JSON内容:', sanitizedContent);
        }
      }
      
      // 5. 处理可能的尾随逗号问题
      sanitizedContent = sanitizedContent
        .replace(/,(\s*[}\]])/g, '$1') // 移除对象和数组末尾的逗号
        .replace(/,(\s*,)/g, ','); // 移除重复的逗号
      
      // 6. 处理字符串中的引号问题（这是最常见的错误源）
      // 查找并修复字符串值中的未转义引号
      try {
        // 尝试逐步修复常见的引号问题
        sanitizedContent = sanitizedContent
          // 修复字符串中的直接双引号（如 "说"这样"的内容" -> "说\"这样\"的内容"）
          .replace(/"([^"]*)"([^"]*)"([^"]*)"(\s*[,}\]])/g, '"$1\\"$2\\"$3"$4')
          // 修复可能的三重引号问题
          .replace(/"""([^"]*)"""/g, '"$1"')
          // 修复字符串末尾的引号问题
          .replace(/([^\\])"([^",}\]\s])/g, '$1\\"$2');
        
        console.log('🔍 引号修复后内容前500字符:', sanitizedContent.substring(0, 500));
      } catch (quoteError) {
        console.warn('🔍 引号修复失败，继续使用原内容:', quoteError);
      }
      
      console.log('🔍 JSON清理后内容前500字符:', sanitizedContent.substring(0, 500));
      
      const result = JSON.parse(sanitizedContent);
      console.log('🔍 JSON解析成功:', result);
      
      // 构建完整的DailyDigest对象，确保使用实际用户数据
      const digest = {
        id: `digest-${date}`,
        chatGroupId: chatName,
        chatGroupName: chatName,
        date,
        topicHighlights: (result.topicHighlights || []).map((topic: any) => ({
          ...topic,
          // 如果AI返回的participants是通用描述，替换为实际用户
          participants: topic.participants?.some((p: string) => p.includes('群成员') || p.includes('用户')) 
            ? actualUsers 
            : topic.participants?.filter((p: string) => actualUsers.includes(p)) || actualUsers
        })),
        activityStats: {
          totalMessages: messages.length,
          activeUsers: actualUsers,  // 强制使用实际用户列表
          peakTimeRange: this.calculatePeakTime(messages),
          messageDistribution: this.calculateTimeDistribution(messages),
          // 不使用AI返回的activeUsers，因为可能不准确
        },
        quotableMessages: (result.quotableMessages || []).map((msg: any) => ({
          ...msg,
          // 确保author是实际用户名
          author: actualUsers.find(user => msg.author?.includes(user)) || msg.author
        }))
      };
      
      console.log('🔍 构建的digest对象中的activeUsers:', digest.activityStats.activeUsers);
      return digest;
    } catch (parseError) {
      console.error('🔍 JSON解析失败:', parseError);
      console.error('🔍 尝试解析的内容:', cleanContent);
      console.error('🔍 解析错误位置:', parseError instanceof SyntaxError ? parseError.message : '未知错误');
      
      // 7. 基于错误位置的精确修复
      if (parseError instanceof SyntaxError && parseError.message.includes('position')) {
        const positionMatch = parseError.message.match(/position (\d+)/);
        if (positionMatch) {
          const errorPosition = parseInt(positionMatch[1]);
          console.log('🔍 尝试基于错误位置修复JSON...');
          
          try {
            let positionFixedContent = sanitizedContent;
            
            // 获取错误位置周围的内容
            const start = Math.max(0, errorPosition - 50);
            const end = Math.min(sanitizedContent.length, errorPosition + 50);
            const errorContext = sanitizedContent.substring(start, end);
            console.log('🔍 错误位置上下文:', errorContext);
            
            // 检查错误位置附近是否有引号问题
            const errorChar = sanitizedContent[errorPosition];
            const prevChar = sanitizedContent[errorPosition - 1];
            const nextChar = sanitizedContent[errorPosition + 1];
            
            console.log('🔍 错误字符:', { errorChar, prevChar, nextChar });
            
            // 尝试修复常见的问题
            if (errorChar === '"' && prevChar !== '\\' && prevChar !== ',' && prevChar !== ':' && prevChar !== '[') {
              // 可能是字符串中的未转义引号
              positionFixedContent = sanitizedContent.substring(0, errorPosition) + '\\"' + sanitizedContent.substring(errorPosition + 1);
              console.log('🔍 尝试转义引号修复');
            } else if (errorChar === '"' && nextChar && nextChar !== ',' && nextChar !== '}' && nextChar !== ']' && nextChar !== '\n' && nextChar !== ' ') {
              // 可能是字符串结束引号后缺少逗号
              positionFixedContent = sanitizedContent.substring(0, errorPosition + 1) + ',' + sanitizedContent.substring(errorPosition + 1);
              console.log('🔍 尝试添加逗号修复');
            }
            
            const result = JSON.parse(positionFixedContent);
            console.log('🔍 基于位置的JSON修复成功!', result);
            
            // 应用相同的用户数据修复逻辑
            const digest = {
              id: `digest-${date}`,
              chatGroupId: chatName,
              chatGroupName: chatName,
              date,
              topicHighlights: (result.topicHighlights || []).map((topic: any) => ({
                ...topic,
                participants: topic.participants?.some((p: string) => p.includes('群成员') || p.includes('用户')) 
                  ? actualUsers 
                  : topic.participants?.filter((p: string) => actualUsers.includes(p)) || actualUsers
              })),
              activityStats: {
                totalMessages: messages.length,
                activeUsers: actualUsers,
                peakTimeRange: this.calculatePeakTime(messages),
                messageDistribution: this.calculateTimeDistribution(messages),
              },
              quotableMessages: (result.quotableMessages || []).map((msg: any) => ({
                ...msg,
                author: actualUsers.find(user => msg.author?.includes(user)) || msg.author
              }))
            };
            return digest;
          } catch (positionError) {
            console.error('🔍 基于位置的修复也失败:', positionError);
          }
        }
      }
      
      // 6. 如果仍然失败，尝试一种更激进的修复方式
      try {
        console.log('🔍 尝试激进修复JSON...');
        let aggressiveContent = cleanContent;
        
        // 找到可能不完整的部分并尝试修复
        // 检查是否存在未闭合的数组或对象
        const openBraces = (aggressiveContent.match(/\{/g) || []).length;
        const closeBraces = (aggressiveContent.match(/\}/g) || []).length;
        const openBrackets = (aggressiveContent.match(/\[/g) || []).length;
        const closeBrackets = (aggressiveContent.match(/\]/g) || []).length;
        
        // 补充缺失的闭合符号
        if (openBraces > closeBraces) {
          aggressiveContent += '}'.repeat(openBraces - closeBraces);
        }
        if (openBrackets > closeBrackets) {
          aggressiveContent += ']'.repeat(openBrackets - closeBrackets);
        }
        
        console.log('🔍 激进修复后的内容:', aggressiveContent);
        const result = JSON.parse(aggressiveContent);
        console.log('🔍 激进修复JSON解析成功:', result);
        
        // 应用相同的用户数据修复逻辑  
        const digest = {
          id: `digest-${date}`,
          chatGroupId: chatName,
          chatGroupName: chatName,
          date,
          topicHighlights: (result.topicHighlights || []).map((topic: any) => ({
            ...topic,
            participants: topic.participants?.some((p: string) => p.includes('群成员') || p.includes('用户')) 
              ? actualUsers 
              : topic.participants?.filter((p: string) => actualUsers.includes(p)) || actualUsers
          })),
          activityStats: {
            totalMessages: messages.length,
            activeUsers: actualUsers,
            peakTimeRange: this.calculatePeakTime(messages),
            messageDistribution: this.calculateTimeDistribution(messages),
          },
          quotableMessages: (result.quotableMessages || []).map((msg: any) => ({
            ...msg,
            author: actualUsers.find(user => msg.author?.includes(user)) || msg.author
          }))
        };
        return digest;
      } catch (aggressiveError) {
        console.error('🔍 激进修复也失败:', aggressiveError);
        
        // 如果所有解析尝试都失败，返回一个基本的结构
        const errorMessage = finishReason === 'length' 
          ? 'AI返回内容被截断，建议增加模型的token限制或简化聊天记录内容。' 
          : 'AI返回的数据格式无法解析，可能是由于聊天内容过于复杂或API返回格式异常。';
          
        return {
          id: `digest-${date}`,
          chatGroupId: chatName,
          chatGroupName: chatName,
          date,
          topicHighlights: [{
            title: finishReason === 'length' ? '内容被截断' : '数据解析失败',
            summary: `${errorMessage}建议检查API配置或重新尝试生成。原始AI返回内容已记录在日志中供调试使用。当前finish_reason: ${finishReason}`,
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