import { FeishuConfig, FeishuMessageRecord, ChatlogMessage } from '../../shared/types';
import { aiService } from './aiService';
import dayjs from 'dayjs';
import { chatlogService } from './chatlogService';

// 微信消息类型枚举
enum WeChatMessageType {
  TEXT = 1,        // 文本消息
  IMAGE = 3,       // 图片消息
  VIDEO = 43,      // 视频消息
  LINK = 49,       // 链接消息
}

// 支持的消息类型列表
const SUPPORTED_MESSAGE_TYPES = [
  WeChatMessageType.TEXT,
  WeChatMessageType.IMAGE,
  WeChatMessageType.VIDEO,
  WeChatMessageType.LINK,
];

// 检查消息类型是否被支持
function isSupportedMessageType(messageType: number): boolean {
  return SUPPORTED_MESSAGE_TYPES.includes(messageType);
}

// 获取消息类型的描述
function getMessageTypeDescription(messageType: number): string {
  switch (messageType) {
    case WeChatMessageType.TEXT:
      return '文本消息';
    case WeChatMessageType.IMAGE:
      return '图片消息';
    case WeChatMessageType.VIDEO:
      return '视频消息';
    case WeChatMessageType.LINK:
      return '链接消息';
    default:
      return '未知消息类型';
  }
}

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

interface FeishuUploadResponse {
  code: number;
  msg: string;
  data?: {
    file_token?: string;  // 新API返回的是file_token
    media_id?: string;    // 有些API可能会返回media_id
    url?: string;         // 媒体文件URL
    tmp_url?: string;     // 临时URL
    file_size?: number;   // 文件大小
    mime_type?: string;   // MIME类型
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
        { field_name: '消息分类', type: 3 }, // 单选
        { field_name: '群名', type: 1 }, // 文本
        { field_name: '日期', type: 5 }, // 日期
        { field_name: '重要程度', type: 3 }, // 单选
        { field_name: '关键词', type: 1 }, // 文本
        { field_name: '附件', type: 17 }, // 附件
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

  // 参考aiService优化的消息处理方法
  private async processMessages(messages: ChatlogMessage[], appToken: string) {
    // 添加调试信息查看消息结构
    if (messages.length > 0) {
      console.log('🔍 飞书服务 - 原始消息样例:', messages[0]);
      console.log('🔍 飞书服务 - 所有可用字段:', Object.keys(messages[0]));
      
      // 统计消息类型分布
      const messageTypeStats = messages.reduce((stats, msg) => {
        const typeDesc = getMessageTypeDescription(msg.type);
        const key = `${typeDesc}(${msg.type})`;
        stats[key] = (stats[key] || 0) + 1;
        return stats;
      }, {} as Record<string, number>);
      
      console.log('🔍 飞书服务 - 消息类型分布:', messageTypeStats);
    }
    
    const filteredMessages = messages
      .filter(msg => isSupportedMessageType(msg.type))
      .filter(msg => (msg.type !== WeChatMessageType.LINK) || msg.content || msg.contents);
    
    // 第一步：基本处理每条消息，不包括附件上传
    const processedMessages: Array<{
      id: string; // 添加唯一ID用于后续关联上传结果
      sender: string;
      content: string;
      timestamp: string;
      time: string;
      messageType: string;
      originalSender: string | undefined;
      originalTalker: string;
      originalMessage: ChatlogMessage;
      fileToken: string | null;
    }> = [];
    
    // 第二步：创建上传任务数组
    interface UploadTask {
      messageId: string;
      messageType: number;
      localUrl: string;
    }
    
    const uploadTasks: UploadTask[] = [];
    
    // 处理每条消息的基本信息
    for (const msg of filteredMessages) {
      // 生成唯一ID
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // 修复时间戳处理 - 使用time字段而不是timestamp
      let timestamp = 'Unknown';
      let formattedTime = '';
      try {
        if (msg.time) {
          // 使用dayjs处理ISO字符串格式的时间
          const parsed = dayjs(msg.time);
          timestamp = parsed.format('HH:mm');
          formattedTime = msg.time;
        } else if (typeof msg.timestamp === 'string') {
          // 如果是ISO字符串格式
          const parsed = dayjs(msg.timestamp);
          timestamp = parsed.format('HH:mm');
          formattedTime = msg.timestamp;
        } else if (typeof msg.timestamp === 'number') {
          // 如果是Unix时间戳
          const parsed = dayjs(msg.timestamp * 1000);
          timestamp = parsed.format('HH:mm');
          formattedTime = parsed.toISOString();
        }
      } catch (error) {
        console.warn('🔍 飞书服务 - 时间戳解析失败:', msg.time || msg.timestamp);
        timestamp = 'Unknown';
        formattedTime = '';
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

      // 获取清洗后的消息内容
      const cleanContent = this.getMessageContent(msg);

      // 检查是否需要上传附件
      if ((msg.type === WeChatMessageType.IMAGE || msg.type === WeChatMessageType.VIDEO)) {
        // 尝试从消息内容中提取本地URL
        const localUrl = this.extractLocalUrl(msg);
        if (localUrl) {
          // 添加到上传任务队列
          uploadTasks.push({
            messageId,
            messageType: msg.type,
            localUrl
          });
        }
      }

      const processedMessage = {
        id: messageId,
        sender: friendlyName,
        content: cleanContent,
        timestamp,
        time: formattedTime,
        messageType: getMessageTypeDescription(msg.type),
        originalSender: msg.sender, // 保留原始sender以备后用
        originalTalker: msg.talker, // 保留原始talker以备后用
        originalMessage: msg, // 保留原始消息对象
        fileToken: null // 初始为null，后续更新
      };

      processedMessages.push(processedMessage);
    }
    
    // 第三步：并行执行所有上传任务
    if (uploadTasks.length > 0) {
      console.log(`🔍 飞书服务 - 开始并行上传 ${uploadTasks.length} 个附件...`);
      
      interface UploadResult {
        messageId: string;
        fileToken: string | null;
      }
      
              // 只处理第一个任务进行测试
        // const uploadResults: UploadResult[] = await Promise.all(
          // [uploadTasks[0]].map(async (task): Promise<UploadResult> => {
        
        // 处理所有任务
        const uploadResults: UploadResult[] = await Promise.all(
          uploadTasks.map(async (task): Promise<UploadResult> => {
          try {
            let fileToken: string | null = null;
            
            fileToken = await this.uploadMediaToFeishu(task.localUrl, appToken, task.messageType === WeChatMessageType.IMAGE ? 'image' : 'video');
            
            return {
              messageId: task.messageId,
              fileToken
            };
          } catch (error) {
            console.warn(`🔍 飞书服务 - 上传附件失败 (messageId: ${task.messageId}):`, error);
            return {
              messageId: task.messageId,
              fileToken: null
            };
          }
        })
      );
      
      console.log(`🔍 飞书服务 - 附件上传完成，成功: ${uploadResults.filter(r => r.fileToken).length}/${uploadTasks.length}`);
      
      // 第四步：将上传结果合并回消息
      for (const result of uploadResults) {
        if (result.fileToken) {
          const message = processedMessages.find(msg => msg.id === result.messageId);
          if (message) {
            message.fileToken = result.fileToken;
          }
        }
      }
    }

    console.log('🔍 飞书服务 - 消息处理完成:', processedMessages);

    // 按时间排序
    return processedMessages.sort((a, b) => {
      if (a.time && b.time) {
        return dayjs(a.time).valueOf() - dayjs(b.time).valueOf();
      }
      return 0;
    });
  }

  // 参考aiService的用户名生成方法
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

  // 优化消息内容提取方法
  private getMessageContent(message: ChatlogMessage): string {
    let content = '';
    
    // 根据消息类型处理不同的内容
    switch (message.type) {
      case WeChatMessageType.TEXT:
        // 文本消息
        content = message.content || '';
        break;
        
      case WeChatMessageType.IMAGE:
        // 图片消息
        content = message.contents?.md5 ? '[图片]' : (message.content || '[图片]');
        break;
        
      case WeChatMessageType.VIDEO:
        // 视频消息
        content = '[视频]';
        break;
        
      case WeChatMessageType.LINK:
        // 链接消息
        if (message.contents?.title) {
          content = `[${message.contents.title}]${message.contents.url ? `(${message.contents.url})` : ''}`;
        } else if (message.contents?.url) {
          content = `[链接](${message.contents.url})`;
        } else {
          content = message.content || '[链接]';
        }
        break;
        
      default:
        // 其他类型消息
        content = message.content || '';
        break;
    }
    
    // 数据清洗：去除控制字符但保留中文字符
    content = String(content)
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 去除控制字符
      .trim();
    
    // 限制内容长度
    if (content.length > 1000) {
      content = content.substring(0, 997) + '...';
    }
    
    return content;
  }

  // 优化批量AI处理方法
  private async processBatchMessagesWithAI(messages: any[]): Promise<Array<{
    summary?: string;
    importance: 'high' | 'medium' | 'low';
    keywords?: string;
    category: string;
  }>> {
    if (!aiService.isConfigured()) {
      console.log('🔍 飞书服务 - AI服务未配置，返回默认值');
      return messages.map(() => ({
        importance: 'medium' as const,
        category: '日常聊天',
      }));
    }

    try {
      // console.log('🔍 飞书服务 - 开始处理消息数据...');
      // // 使用优化后的消息处理方法 - 这里已经包含了附件上传
      // const processedMessages = await this.processMessages(messages);
      // console.log('🔍 飞书服务 - 消息处理完成，处理后数量:', processedMessages.length);

      // 构造批量分析的prompt
      const messagesText = messages.map((message, index) => {
        // 添加附件信息到分析内容
        const content = message.content;
        
        return `[消息${index + 1}] 发送人: ${message.sender}\n时间: ${message.timestamp}\n内容: ${content}`;
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
    "category": "消息类型",
    "keywords": "关键词（用逗号分隔）"
  }
]

需要分析的消息：
${messagesText}`;

      console.log('🔍 飞书服务 - 开始调用AI分析...');
      const analysisResult = await this.callAI(batchPrompt);
      console.log('🔍 飞书服务 - AI批量分析完成');
      
      try {
        const parsed = JSON.parse(analysisResult);
        if (Array.isArray(parsed) && parsed.length === messages.length) {
          console.log('🔍 飞书服务 - AI分析结果解析成功');
          return parsed.map(result => ({
            summary: result.summary,
            importance: result.importance || 'medium',
            keywords: result.keywords,
            category: result.category || '日常聊天',
          }));
        } else {
          console.warn('🔍 飞书服务 - AI批量分析结果格式不正确，使用默认值');
          return messages.map(() => ({
            importance: 'medium' as const,
            category: '日常聊天',
          }));
        }
      } catch (parseError) {
        console.warn('🔍 飞书服务 - AI批量分析结果解析失败，使用默认值:', parseError);
        return messages.map(() => ({
          importance: 'medium' as const,
          category: '日常聊天',
        }));
      }
    } catch (error) {
      console.warn('🔍 飞书服务 - AI批量处理消息失败，使用默认值:', error);
      return messages.map(() => ({
        importance: 'medium' as const,
        category: '日常聊天',
      }));
    }
  }

  // 从消息中提取本地URL
  private extractLocalUrl(message: ChatlogMessage): string | null {
    try {
      // 获取图片或视频文件名
      const mediaFile = message.contents?.imgfile || message.contents?.videofile;
      if (!mediaFile) {
        return null;
      }
      
      console.log('🔍 飞书服务 - 提取到媒体文件:', mediaFile);
      
      // 返回文件名，不带路径
      // downloadFile方法会处理正确的URL构造
      return mediaFile;
    } catch (error) {
      console.warn('🔍 飞书服务 - 提取本地URL失败:', error);
      return null;
    }
  }

  // 从本地URL下载文件
  private async downloadFile(url: string): Promise<{ buffer: Uint8Array; filename: string; contentType: string }> {
    try {
      console.log('🔍 飞书服务 - 开始下载文件:', url);

      // 使用chatlogService获取资源
      const result = await chatlogService.getResource(url);
      
      // 检查chatlogService是否返回成功
      if (!result.success || !result.data) {
        throw new Error(`通过chatlogService获取资源失败: ${result.error || '未知错误'}`);
      }
      
      // 获取二进制数据并转换为Uint8Array
      let buffer: Uint8Array;
      const rawData = result.data;
      
      if (rawData instanceof Uint8Array) {
        buffer = rawData;
      } else if (rawData instanceof ArrayBuffer) {
        buffer = new Uint8Array(rawData);
      } else if (typeof rawData === 'object') {
        // 可能是某种二进制对象，尝试转换
        buffer = new Uint8Array(rawData);
      } else {
        throw new Error('无法处理的数据类型: ' + typeof rawData);
      }
      
      console.log('🔍 飞书服务 - 获取到文件response:', {
        url, 
        contentType: result.headers?.['content-type'],
        size: buffer.length
      });
      
      if (buffer.length === 0) {
        throw new Error('获取文件数据失败，数据为空');
      }
      
      console.log('🔍 飞书服务 - 文件buffer大小:', buffer.length);
      
      // 获取contentType
      const contentType = result.headers?.['content-type'] || 'application/octet-stream';
      
      let filename = `file_${new Date().getTime()}`;
      
      // 根据内容类型添加适当的扩展名
      if (!filename.includes('.')) {
        if (contentType.includes('image/png')) {
          filename += '.png';
        } else if (contentType.includes('image/jpeg')) {
          filename += '.jpg';
        } else if (contentType.startsWith('video/')) {
          filename += '.mp4';
        }
      }
      
      console.log('🔍 飞书服务 - 文件下载完成:', {
        filename,
        contentType,
        size: buffer.length
      });
      
      return { buffer, filename, contentType };
    } catch (error) {
      console.error('🔍 飞书服务 - 下载文件失败', url, error);
      
      if (error instanceof Error) {
        console.error('错误详情:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      throw new Error(`下载文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 从file_token获取预览URL
  getAssetPreviewUrl(fileToken: string): string {
    if (!fileToken) return '';
    return `https://open.feishu.cn/open-apis/drive/v1/medias/${fileToken}/download`;
  }
  
  // 统一上传媒体文件到飞书
  private async uploadMediaToFeishu(fileUrl: string, appToken: string, fileType: 'image' | 'video'): Promise<string | null> {
    try {
      console.log(`🔍 飞书服务 - 开始上传${fileType === 'image' ? '图片' : '视频'}:`, fileUrl);
      
      const token = await this.getAccessToken();
      
      // 从chatlogService获取资源
      const { buffer, filename, contentType } = await this.downloadFile(fileUrl);
      console.log('下载文件完成', fileUrl, buffer.length, filename, contentType);
      
      if (buffer.length === 0) {
        console.error(`🔍 飞书服务 - 下载文件失败，文件内容为空:`, fileUrl);
        return null;
      }
      
      // 创建FormData - 注意：不要手动设置Content-Type和boundary
      const formData = new FormData();
      
      // 设置正确的参数，根据飞书API文档
      formData.append('parent_type', fileType === 'image' ? 'bitable_image' : 'bitable_file');
      formData.append('parent_node', appToken);
      formData.append('size', String(buffer.length));
      formData.append('file_name', filename);
      
      // 添加元数据 - 根据飞书文档，这是必须的
      const fileMetadata = {
        name: filename,
        size: buffer.length
      };
      formData.append('file_meta', JSON.stringify(fileMetadata));
      
      // 添加实际文件内容，需要将Uint8Array转为Blob
      // 确保使用正确的MIME类型
      const mimeType = fileType === 'image' 
        ? (filename.endsWith('.png') ? 'image/png' : 'image/jpeg') 
        : (contentType || 'application/octet-stream');
        
      // 创建Blob
      const blob = new Blob([buffer], { type: mimeType });
      
      // 添加文件到FormData - 键名必须是'file'
      formData.append('file', blob, filename);
      
      // 打印上传信息以便调试
      console.log(`🔍 飞书服务 - 上传${fileType}信息:`, {
        parent_type: fileType === 'image' ? 'bitable_image' : 'bitable_file',
        parent_node: appToken,
        file_size: buffer.length,
        file_name: filename,
        mime_type: mimeType
      });
      
      try {
        // 调用飞书API - 注意：不要手动设置Content-Type，让浏览器自动处理
        const response = await fetch('https://open.feishu.cn/open-apis/drive/v1/medias/upload_all', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
            // 让浏览器自动设置Content-Type和boundary
          },
          body: formData,
        });

        // 检查响应状态
        if (!response.ok) {
          console.error(`🔍 飞书服务 - ${fileType}上传HTTP错误:`, response.status, response.statusText);
          return null;
        }

        const data = await response.json();
        console.log(`🔍 飞书服务 - ${fileType}上传结果:`, data);
        
        if (data.code !== 0) {
          console.warn(`🔍 飞书服务 - ${fileType}上传失败:`, data.msg);
          return null;
        }

        // 根据文档，上传成功后返回file_token
        const fileToken = data.data?.file_token;
        console.log(`🔍 飞书服务 - ${fileType}上传成功，获取到file_token:`, fileToken);
        
        return fileToken || null;
      } catch (fetchError) {
        console.error(`🔍 飞书服务 - 调用飞书API失败:`, fetchError);
        return null;
      }
    } catch (error) {
      console.error(`🔍 飞书服务 - ${fileType}上传异常:`, error);
      
      // 尝试显示更多错误信息
      if (error instanceof Error) {
        console.error(`🔍 飞书服务 - 错误详情:`, {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      return null;
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
          '时间': record.timestamp,
          '发送人': record.sender,
          ...(record.summary && { '消息摘要': record.summary }),
          '消息类型': record.messageType,
          '消息分类': record.category,
          '群名': record.chatName,
          '日期': new Date(record.date).getTime(),
          '重要程度': record.importance,
          ...(record.keywords && { '关键词': record.keywords }),
          ...(record.fileToken && { '附件': [{ file_token: record.fileToken }] }),
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
    // console.log('原始messages', messages);

    try {
      // 1. 创建多维表格
      console.log('正在创建多维表格...');
      const appToken = await this.createBitable(tableName);
      
      // 2. 创建数据表
      console.log('正在创建数据表...');
      const tableId = await this.createTable(appToken, '聊天记录');
      
      // 3. 处理消息数据
      console.log('🔍 飞书服务 - 正在处理消息数据...');
      
      // 使用新的processMessages方法预处理消息
      const validMessages = await this.processMessages(messages, appToken);
      console.log(`🔍 飞书服务 - 有效消息数量: ${validMessages.length}`);
      
      const processedRecords: FeishuMessageRecord[] = [];
      const batchSize = 100; // 每批处理100条消息
      
      const totalBatches = Math.ceil(validMessages.length / batchSize);
      console.log(`🔍 飞书服务 - 将分${totalBatches}批处理`);

      for (let i = 0; i < validMessages.length; i += batchSize) {
        const batch = validMessages.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        
        console.log(`🔍 飞书服务 - 正在处理第 ${batchNumber}/${totalBatches} 批消息 (${batch.length} 条)`);
        
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
          importance: 'high' | 'medium' | 'low';
          category: string;
          keywords?: string;
          summary?: string;
        }>;

        if (enableAIClassification) {
          try {
            console.log(`🔍 飞书服务 - 开始AI分析第 ${batchNumber} 批消息...`);
            // 使用原始消息进行AI分析，处理消息的过程中会自动上传附件
            // const originalMessages = batch.map(msg => msg.originalMessage);
            batchAnalysis = await this.processBatchMessagesWithAI(batch);
            console.log(`🔍 飞书服务 - 第 ${batchNumber} 批AI分析完成`);
          } catch (error) {
            console.warn(`🔍 飞书服务 - 第 ${batchNumber} 批AI处理失败，使用默认值:`, error);
            batchAnalysis = batch.map(() => ({
              importance: 'medium' as const,
              category: '日常聊天',
            }));
          }
        } else {
          batchAnalysis = batch.map(() => ({
            importance: 'medium' as const,
            category: '日常聊天',
          }));
        }

        // 为当前批次的每条消息创建记录
        for (let j = 0; j < batch.length; j++) {
          const message = batch[j];
          const aiAnalysis = batchAnalysis[j];

          const record: FeishuMessageRecord = {
            messageContent: message.content,
            timestamp: message.timestamp || '',
            sender: message.sender,
            summary: aiAnalysis.summary,
            messageType: message.messageType,
            category: aiAnalysis.category,
            chatName: chatName,
            date: message.time ? dayjs(message.time).format('YYYY-MM-DD') : '',
            importance: aiAnalysis.importance,
            keywords: aiAnalysis.keywords,
            fileToken: message.fileToken || undefined,
          };

          processedRecords.push(record);
        }

        // 批次间稍作休息，避免API调用过于频繁
        if (enableAIClassification && i + batchSize < validMessages.length) {
          console.log('🔍 飞书服务 - 等待3秒后处理下一批...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      console.log(`🔍 飞书服务 - 消息处理完成，共处理 ${processedRecords.length} 条有效记录`);

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