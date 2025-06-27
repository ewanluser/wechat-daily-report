import { FeishuConfig, FeishuMessageRecord, ChatlogMessage } from '../../shared/types';
import { aiService } from './aiService';

interface FeishuAccessTokenResponse {
  code: number;
  msg: string;
  tenant_access_token?: string;
  expire?: number;
}

interface FeishuBitableResponse {
  code: number;
  msg: string;
  data?: {
    app?: {
      app_token: string;
      default_table_id: string;
      folder_token: string;
      name: string;
      url: string;
    };
  };
}

interface FeishuTableResponse {
  code: number;
  msg: string;
  data?: {
    table_id: string;
    name: string;
  };
}

class FeishuService {
  private config: FeishuConfig | null = null;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  // 配置飞书服务
  configure(config: FeishuConfig) {
    this.config = config;
    this.accessToken = null;
    this.tokenExpiry = 0;
  }

  // 检查是否已配置
  isConfigured(): boolean {
    return this.config !== null && this.config.appId !== '' && this.config.appSecret !== '';
  }

  // 获取访问令牌
  private async getAccessToken(): Promise<string> {
    if (!this.config) {
      throw new Error('飞书服务未配置');
    }

    // 检查token是否过期（提前5分钟刷新）
    const now = Date.now() / 1000;
    if (this.accessToken && now < this.tokenExpiry - 300) {
      return this.accessToken;
    }

    try {
      const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          app_id: this.config.appId,
          app_secret: this.config.appSecret,
        }),
      });

      const data: FeishuAccessTokenResponse = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`获取访问令牌失败: ${data.msg}`);
      }

      if (!data.tenant_access_token || !data.expire) {
        throw new Error('获取访问令牌响应格式错误');
      }

      this.accessToken = data.tenant_access_token;
      this.tokenExpiry = now + data.expire;
      
      return this.accessToken;
    } catch (error) {
      throw new Error(`获取飞书访问令牌失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 测试连接
  async testConnection(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      console.error('飞书连接测试失败:', error);
      return false;
    }
  }

  // 创建多维表格
  async createBitable(name: string, folderId?: string): Promise<string> {
    const token = await this.getAccessToken();
    
    try {
      const response = await fetch('https://open.feishu.cn/open-apis/bitable/v1/apps', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          name,
          folder_token: folderId,
        }),
      });

      const data: FeishuBitableResponse = await response.json();
      console.log('多维表格创建成功:', data);
      
      if (data.code !== 0) {
        throw new Error(`创建多维表格失败: ${data.msg}`);
      }

      if (!data?.data?.app?.app_token) {
        throw new Error('创建多维表格响应格式错误');
      }

      return data.data.app.app_token;
    } catch (error) {
      throw new Error(`创建多维表格失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 创建数据表
  async createTable(appToken: string, tableName: string): Promise<string> {
    const token = await this.getAccessToken();
    
    try {
      // 定义表格字段
      const fields = [
        { field_name: '消息内容', type: 1 }, // 文本
        { field_name: '时间', type: 1 }, // 文本
        { field_name: '发送人', type: 1 }, // 文本
        { field_name: '消息摘要', type: 1 }, // 文本
        { field_name: '消息类型', type: 3 }, // 单选
        { field_name: '群名', type: 1 }, // 文本
        { field_name: '日期', type: 5 }, // 日期
        { field_name: '重要程度', type: 3 }, // 单选
        { field_name: 'AI分类', type: 1 }, // 文本
        { field_name: '关键词', type: 1 }, // 文本
      ];

      const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          table: {
            name: tableName,
            default_view_name: '表格视图',
            fields,
          },
        }),
      });

      const data: FeishuTableResponse = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`创建数据表失败: ${data.msg}`);
      }

      if (!data.data?.table_id) {
        throw new Error('创建数据表响应格式错误');
      }

      return data.data.table_id;
    } catch (error) {
      throw new Error(`创建数据表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 使用AI对消息进行智能分类和处理
  private async processMessageWithAI(message: ChatlogMessage): Promise<{
    summary?: string;
    category: string;
    importance: 'high' | 'medium' | 'low';
    keywords?: string;
    messageType: string;
  }> {
    if (!aiService.isConfigured()) {
      // 如果AI服务未配置，返回默认值
      return {
        category: '普通消息',
        importance: 'medium',
        messageType: '文本消息',
      };
    }

    try {
      const content = message.content || '';
      
      // 如果消息过长，生成摘要
      let summary: string | undefined;
      if (content.length > 100) {
        const summaryPrompt = `请为以下消息生成简洁的摘要（不超过30字）：\n\n${content}`;
        summary = await this.callAI(summaryPrompt);
      }

      // 消息分类和重要性判断
      const analysisPrompt = `请分析以下消息，并返回JSON格式的结果：
{
  "category": "消息分类（如：工作讨论、技术分享、日常闲聊、重要通知等）",
  "importance": "重要程度（high/medium/low）",
  "messageType": "消息类型（如：问题咨询、信息分享、决策讨论、闲聊互动等）",
  "keywords": "关键词（用逗号分隔，最多3个）"
}

消息内容：${content}`;

      const analysisResult = await this.callAI(analysisPrompt);
      console.log('AI分析结果:', analysisResult);
      
      try {
        const parsed = JSON.parse(analysisResult);
        return {
          summary,
          category: parsed.category || '普通消息',
          importance: parsed.importance || 'medium',
          keywords: parsed.keywords,
          messageType: parsed.messageType || '文本消息',
        };
      } catch (parseError) {
        console.warn('AI分析结果解析失败，使用默认值:', parseError);
        return {
          summary,
          category: '普通消息',
          importance: 'medium',
          messageType: '文本消息',
        };
      }
    } catch (error) {
      console.warn('AI处理消息失败，使用默认值:', error);
      return {
        category: '普通消息',
        importance: 'medium',
        messageType: '文本消息',
      };
    }
  }

  // 调用AI服务
  private async callAI(prompt: string): Promise<string> {
    // 这里需要调用AI服务的底层方法
    const config = aiService.getConfig();
    if (!config) {
      throw new Error('AI服务未配置');
    }

    // 简化的AI调用，实际项目中可能需要更复杂的处理
    const response = await fetch(
      config.provider === 'openrouter' 
        ? 'https://openrouter.ai/api/v1/chat/completions'
        : config.baseUrl || 'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100000,
          temperature: 0.5,
        }),
      }
    );

    const data = await response.json();
    console.log('调用AI服务结果:', data);
    return data.choices?.[0]?.message?.content || '';
  }

  // 批量添加记录到多维表格
  async addRecordsToTable(
    appToken: string, 
    tableId: string, 
    records: FeishuMessageRecord[]
  ): Promise<void> {
    const token = await this.getAccessToken();
    const batchSize = 100; // 飞书API单次最多500条，我们使用100条保险

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      const requestRecords = batch.map(record => ({
        fields: {
          '消息内容': record.messageContent,
          '时间': record.timestamp,
          '发送人': record.sender,
          ...(record.summary && { '消息摘要': record.summary }),
          '消息类型': record.messageType,
          '群名': record.chatName,
          '日期': record.date,
          '重要程度': record.importance,
          'AI分类': record.category,
          ...(record.keywords && { '关键词': record.keywords }),
        },
      }));

      try {
        const response = await fetch(
          `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
              records: requestRecords,
            }),
          }
        );

        const data = await response.json();
        
        if (data.code !== 0) {
          throw new Error(`添加记录失败: ${data.msg}`);
        }

        console.log(`成功添加第 ${i + 1}-${Math.min(i + batchSize, records.length)} 条记录`);
        
        // 添加延迟避免频率限制
        if (i + batchSize < records.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        throw new Error(`批量添加记录失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
  }

  // 导出聊天记录到飞书多维表格
  async exportChatMessages(
    messages: ChatlogMessage[],
    chatName: string,
    tableName: string,
    enableAIClassification = true
  ): Promise<{ appToken: string; tableId: string; url: string }> {
    if (!this.isConfigured()) {
      throw new Error('飞书服务未配置');
    }

    try {
      // 1. 创建多维表格
      console.log('正在创建多维表格...');
      const appToken = await this.createBitable(tableName);
      
      // 2. 创建数据表
      console.log('正在创建数据表...');
      const tableId = await this.createTable(appToken, '聊天记录');
      
      // 3. 处理消息数据
      console.log('正在处理消息数据...');
      const processedRecords: FeishuMessageRecord[] = [];
      
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        console.log(`处理消息 ${i + 1}/${messages.length}`);
        
        let aiAnalysis: {
          category: string;
          importance: 'high' | 'medium' | 'low';
          messageType: string;
          keywords?: string;
          summary?: string;
        } = {
          category: '普通消息',
          importance: 'medium',
          messageType: '文本消息',
        };

        if (enableAIClassification) {
          try {
            aiAnalysis = await this.processMessageWithAI(message);
          } catch (error) {
            console.warn(`消息 ${i + 1} AI处理失败，使用默认值:`, error);
          }
        }

        const record: FeishuMessageRecord = {
          messageContent: message.content || '',
          timestamp: message.time || message.timestamp?.toString() || '',
          sender: message.senderName || message.sender || message.talker || 'Unknown',
          summary: aiAnalysis.summary,
          messageType: aiAnalysis.messageType,
          chatName: chatName,
          date: message.time ? message.time.split(' ')[0] : '',
          importance: aiAnalysis.importance,
          category: aiAnalysis.category,
          keywords: aiAnalysis.keywords,
        };

        processedRecords.push(record);
        
        // 每处理10条消息休息一下，避免API调用过于频繁
        if (enableAIClassification && (i + 1) % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // 4. 批量添加记录
      console.log('正在添加记录到表格...');
      await this.addRecordsToTable(appToken, tableId, processedRecords);

      const url = `https://feishu.cn/base/${appToken}`;
      
      return {
        appToken,
        tableId,
        url,
      };
    } catch (error) {
      throw new Error(`导出到飞书多维表格失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}

export const feishuService = new FeishuService(); 