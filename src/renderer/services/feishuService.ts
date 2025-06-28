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

// 添加新的接口定义
interface FeishuAppInfoResponse {
  code: number;
  msg: string;
  data?: {
    app?: {
      app_id: string;
      app_name: string;
      description: string;
      avatar_url: string;
      owner?: {
        owner_id: string;
      };
      status: number;
      scopes: string[];
      back_home_url: string;
      i18n_name: Record<string, string>;
      i18n_description: Record<string, string>;
      primary_language: string;
      common_categories: string[];
      app_scene_type: number;
    };
  };
}

interface FeishuTransferResponse {
  code: number;
  msg: string;
  data?: any;
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

  // 获取应用信息
  async getAppInfo(): Promise<{ ownerId: string; appName: string }> {
    const token = await this.getAccessToken();
    
    try {
      const response = await fetch(`https://open.feishu.cn/open-apis/application/v6/applications/${this.config?.appId}?lang=zh_cn`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
      });

      const data: FeishuAppInfoResponse = await response.json();
      console.log('获取应用信息成功:', data);
      
      if (data.code !== 0) {
        throw new Error(`获取应用信息失败: ${data.msg}`);
      }

      if (!data?.data?.app) {
        throw new Error('获取应用信息响应格式错误');
      }

      const app = data.data.app;
      const owner = app.owner;

      if (!owner || !owner.owner_id) {
        throw new Error('应用owner信息不完整');
      }

      return {
        ownerId: owner.owner_id,
        appName: app.app_name,
      };
    } catch (error) {
      throw new Error(`获取应用信息失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 将多维表格转移给指定用户
  async transferBitableToOwner(appToken: string, ownerId: string): Promise<void> {
    const token = await this.getAccessToken();
    
    try {
      const response = await fetch(`https://open.feishu.cn/open-apis/drive/v1/permissions/${appToken}/members/transfer_owner?type=bitable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          member_type: 'openid',
          member_id: ownerId,
        }),
      });

      const data: FeishuTransferResponse = await response.json();
      console.log('转移多维表格结果:', data);
      
      if (data.code !== 0) {
        throw new Error(`转移多维表格失败: ${data.msg}`);
      }

      console.log('成功将多维表格转移给owner');
    } catch (error) {
      throw new Error(`转移多维表格失败: ${error instanceof Error ? error.message : '未知错误'}`);
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
        // { field_name: '消息内容分类', type: 3 }, // 单选
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

  // 批量使用AI对消息进行智能分类和处理
  private async processBatchMessagesWithAI(messages: ChatlogMessage[]): Promise<Array<{
    summary?: string;
    // category: string;
    importance: 'high' | 'medium' | 'low';
    keywords?: string;
    messageType: string;
  }>> {
    if (!aiService.isConfigured()) {
      // 如果AI服务未配置，返回默认值数组
      return messages.map(() => ({
        // category: '普通消息',
        importance: 'medium' as const,
        messageType: '文本消息',
      }));
    }

    try {
      // 构造批量分析的prompt
      const messagesText = messages.map((message, index) => {
        const content = this.getMessageContent(message);
        return `[消息${index + 1}] 发送人: ${message.senderName || message.sender || message.talker || 'Unknown'}\n内容: ${content}`;
      }).join('\n\n');

      const batchPrompt = `请分析以下${messages.length}条聊天消息，为每条消息返回JSON格式的分析结果。

分析要求：
1. 为每条消息生成摘要（如果内容超过50字）
2. 评估重要程度（high/medium/low）
3. 识别消息类型（如：问题咨询、信息分享、决策讨论、闲聊互动、通知公告等）
4. 提取关键词（用逗号分隔，最多3个）

请返回一个JSON数组，数组中每个元素对应一条消息的分析结果：
[
  {
    "summary": "消息摘要（可选，仅当消息较长时）",
    "importance": "重要程度（high/medium/low）",
    "messageType": "消息类型",
    "keywords": "关键词（用逗号分隔）"
  }
]

需要分析的消息：
${messagesText}`;

      const analysisResult = await this.callAI(batchPrompt);
      console.log('AI批量分析结果:', analysisResult);
      
      try {
        const parsed = JSON.parse(analysisResult);
        if (Array.isArray(parsed) && parsed.length === messages.length) {
          return parsed.map(result => ({
            summary: result.summary,
            // category: result.category || '普通消息',
            importance: result.importance || 'medium',
            keywords: result.keywords,
            messageType: result.messageType || '文本消息',
          }));
        } else {
          console.warn('AI批量分析结果格式不正确，使用默认值');
          return messages.map(() => ({
            // category: '普通消息',
            importance: 'medium' as const,
            messageType: '文本消息',
          }));
        }
      } catch (parseError) {
        console.warn('AI批量分析结果解析失败，使用默认值:', parseError);
        return messages.map(() => ({
          // category: '普通消息',
          importance: 'medium' as const,
          messageType: '文本消息',
        }));
      }
    } catch (error) {
      console.warn('AI批量处理消息失败，使用默认值:', error);
      return messages.map(() => ({
        // category: '普通消息',
        importance: 'medium' as const,
        messageType: '文本消息',
      }));
    }
  }

  // 使用AI对消息进行智能分类和处理（保留原方法作为兼容）
  private async processMessageWithAI(message: ChatlogMessage): Promise<{
    summary?: string;
    // category: string;
    importance: 'high' | 'medium' | 'low';
    keywords?: string;
    messageType: string;
  }> {
    const results = await this.processBatchMessagesWithAI([message]);
    return results[0];
  }

  // 提取消息内容的辅助方法
  private getMessageContent(message: ChatlogMessage): string {
    if (message.content) {
      return message.content;
    }
    if (message.contents) {
      if (message.contents.md5) {
        return '[图片]';
      }
      if (message.contents.title) {
        return `[${message.contents.title}]${message.contents.url ? `(${message.contents.url})` : ''}`;
      }
    }
    return '';
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
          temperature: 0.1,
        })
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
          '时间': new Date(record.date).toLocaleTimeString(),
          '发送人': record.sender,
          ...(record.summary && { '消息摘要': record.summary }),
          '消息类型': record.messageType,
          '群名': record.chatName,
          '日期': new Date(record.timestamp).getTime(),
          '重要程度': record.importance,
          // '消息内容分类': record.category,
          ...(record.keywords && { '关键词': record.keywords }),
        },
      }));

      // console.log('requestRecords', requestRecords);

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
    enableAIClassification = true,
    onProgress?: (progress: { 
      currentBatch: number; 
      totalBatches: number; 
      currentMessage: number; 
      totalMessages: number; 
      message: string; 
    }) => void
  ): Promise<{ appToken: string; tableId: string; url: string }> {
    if (!this.isConfigured()) {
      throw new Error('飞书服务未配置');
    }
    // console.log('messages', messages);

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
      const batchSize = 100; // 每批处理100条消息
      
      // 先过滤掉"拍了拍"消息
      const validMessages = messages.filter(message => {
        const content = this.getMessageContent(message);
        return !content.includes('拍了拍');
      });

      const totalBatches = Math.ceil(validMessages.length / batchSize);
      console.log(`有效消息数量: ${validMessages.length}，将分${totalBatches}批处理`);

      for (let i = 0; i < validMessages.length; i += batchSize) {
        const batch = validMessages.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        
        console.log(`正在处理第 ${batchNumber}/${totalBatches} 批消息 (${batch.length} 条)`);
        
        // 调用进度回调
        if (onProgress) {
          onProgress({
            currentBatch: batchNumber,
            totalBatches: totalBatches,
            currentMessage: i + 1,
            totalMessages: validMessages.length,
            message: `正在处理第 ${batchNumber}/${totalBatches} 批消息 (${batch.length} 条)`
          });
        }

        let batchAnalysis: Array<{
          // category: string;
          importance: 'high' | 'medium' | 'low';
          messageType: string;
          keywords?: string;
          summary?: string;
        }>;

        if (enableAIClassification) {
          try {
            console.log(`开始AI分析第 ${batchNumber} 批消息...`);
            batchAnalysis = await this.processBatchMessagesWithAI(batch);
            console.log(`第 ${batchNumber} 批AI分析完成`);
          } catch (error) {
            console.warn(`第 ${batchNumber} 批AI处理失败，使用默认值:`, error);
            batchAnalysis = batch.map(() => ({
              // category: '普通消息',
              importance: 'medium' as const,
              messageType: '文本消息',
            }));
          }
        } else {
          batchAnalysis = batch.map(() => ({
            // category: '普通消息',
            importance: 'medium' as const,
            messageType: '文本消息',
          }));
        }

        // 为当前批次的每条消息创建记录
        for (let j = 0; j < batch.length; j++) {
          const message = batch[j];
          const aiAnalysis = batchAnalysis[j];

          const record: FeishuMessageRecord = {
            messageContent: this.getMessageContent(message),
            timestamp: message.time || message.timestamp?.toString() || '',
            sender: message.senderName || message.sender || message.talker || 'Unknown',
            summary: aiAnalysis.summary,
            messageType: aiAnalysis.messageType,
            chatName: chatName,
            date: message.time ? message.time.split(' ')[0] : '',
            importance: aiAnalysis.importance,
            // category: aiAnalysis.category,
            keywords: aiAnalysis.keywords,
          };

          processedRecords.push(record);
        }

        // 批次间稍作休息，避免API调用过于频繁
        if (enableAIClassification && i + batchSize < validMessages.length) {
          console.log('等待3秒后处理下一批...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      console.log(`消息处理完成，共处理 ${processedRecords.length} 条有效记录`);

      // 4. 批量添加记录
      console.log('正在添加记录到表格...');
      await this.addRecordsToTable(appToken, tableId, processedRecords);

      // 5. 自动获取应用信息并转移给owner
      console.log('正在获取应用owner信息...');
      try {
        const appInfo = await this.getAppInfo();
        console.log('应用owner信息:', appInfo);
        
        console.log('正在将多维表格转移给owner...');
        await this.transferBitableToOwner(appToken, appInfo.ownerId);
        console.log('成功将多维表格转移给owner:', appInfo.ownerId);
      } catch (error) {
        console.warn('转移多维表格给owner失败，但导出已完成:', error);
        // 转移失败不影响导出结果，只记录警告
      }

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