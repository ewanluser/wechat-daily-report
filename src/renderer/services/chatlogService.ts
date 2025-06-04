import { 
  ChatlogContact, 
  ChatlogChatroom, 
  ChatlogMessage, 
  ChatlogSession,
  ChatlogConfig,
  ChatlogPrivateChat,
  ChatTarget
} from '../../shared/types';

class ChatlogService {
  private config: ChatlogConfig;

  constructor() {
    this.config = {
      baseUrl: 'http://127.0.0.1:5030',
      isConnected: false
    };
  }

  // 检查是否在Electron环境中
  private isElectron(): boolean {
    return !!(window as any).electronAPI;
  }

  // 配置chatlog连接
  async configure(baseUrl: string): Promise<boolean> {
    if (!this.isElectron()) {
      throw new Error('此应用只能在Electron环境中运行');
    }

    this.config.baseUrl = baseUrl;
    
    try {
      const result = await (window as any).electronAPI.chatlogConfigure(baseUrl);
      if (!result.success) {
        throw new Error(result.error);
      }
      
      await this.checkConnection();
      this.config.isConnected = true;
      return true;
    } catch (error) {
      this.config.isConnected = false;
      throw error;
    }
  }

  // 检查连接状态
  async checkConnection(): Promise<boolean> {
    if (!this.isElectron()) {
      throw new Error('此应用只能在Electron环境中运行');
    }

    try {
      const result = await (window as any).electronAPI.chatlogCheckConnection();
      if (!result.success) {
        throw new Error(result.error);
      }
      this.config.isConnected = result.connected;
      return this.config.isConnected;
    } catch (error: any) {
      console.error('Connection test failed:', error);
      this.config.isConnected = false;
      if (error.message?.includes('ECONNREFUSED')) {
        throw new Error('无法连接到 Chatlog 服务，请确保 Chatlog 已启动');
      } else {
        throw new Error(`连接失败: ${error.message || '未知错误'}`);
      }
    }
  }

  // 获取群聊列表
  async getChatrooms(): Promise<ChatlogChatroom[]> {
    if (!this.isElectron()) {
      throw new Error('此应用只能在Electron环境中运行');
    }

    try {
      const result = await (window as any).electronAPI.chatlogGetChatrooms();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    } catch (error: any) {
      console.error('获取群聊列表失败:', error);
      throw new Error(`获取群聊列表失败: ${error.message || '未知错误'}`);
    }
  }

  // 获取指定日期的聊天记录
  async getDailyMessages(talker: string, date: string): Promise<ChatlogMessage[]> {
    console.log('📥 开始获取聊天记录:', { talker, date });
    
    if (!this.isElectron()) {
      console.error('❌ 不在Electron环境中');
      throw new Error('此应用只能在Electron环境中运行');
    }

    try {
      console.log('📡 调用主进程API获取消息...');
      const result = await (window as any).electronAPI.chatlogGetDailyMessages(talker, date);
      console.log('📡 主进程API调用结果:', { success: result.success, dataLength: result.data?.length });
      
      if (!result.success) {
        console.error('❌ 主进程返回错误:', result.error);
        throw new Error(result.error);
      }
      
      console.log('✅ 成功获取聊天记录:', result.data.length, '条');
      return result.data;
    } catch (error: any) {
      console.error('❌ 获取聊天记录失败:', error);
      throw new Error(`获取聊天记录失败: ${error.message || '未知错误'}`);
    }
  }

  // 获取联系人列表
  async getContacts(): Promise<ChatlogContact[]> {
    if (!this.isElectron()) {
      throw new Error('此应用只能在Electron环境中运行');
    }

    try {
      const result = await (window as any).electronAPI.chatlogGetContacts();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    } catch (error: any) {
      console.error('获取联系人列表失败:', error);
      throw new Error(`获取联系人列表失败: ${error.message || '未知错误'}`);
    }
  }

  // 获取所有聊天对象（群聊+个人聊天）
  async getAllChatTargets(): Promise<ChatTarget[]> {
    if (!this.isElectron()) {
      throw new Error('此应用只能在Electron环境中运行');
    }

    try {
      // 并行获取群聊和联系人
      const [chatroomsResult, contactsResult] = await Promise.all([
        this.getChatrooms(),
        this.getContacts()
      ]);

      const targets: ChatTarget[] = [];

      // 添加群聊
      chatroomsResult.forEach(room => {
        // 使用正确的字段名：nickName（注意大小写）
        const displayName = room.nickName || room.nickname || room.remark || `群聊-${room.name.replace('@chatroom', '').slice(-6)}`;
        
        targets.push({
          id: room.name,
          name: displayName,
          type: 'group',
          rawData: room
        });
      });

      // 添加个人聊天
      contactsResult.forEach(contact => {
        const privateChat: ChatlogPrivateChat = {
          username: contact.username,
          nickname: contact.nickname,
          remark: contact.remark,
          wxid: contact.wxid,
          type: 'private'
        };

        // 使用正确的字段名：nickname（从API返回的数据中获取）
        const displayName = contact.nickname || contact.remark || `联系人-${contact.username}`;

        targets.push({
          id: contact.username,
          name: displayName,
          type: 'private',
          rawData: privateChat
        });
      });

      // 按类型和名称排序
      targets.sort((a, b) => {
        // 先按类型排序：群聊在前，个人聊天在后
        if (a.type !== b.type) {
          return a.type === 'group' ? -1 : 1;
        }
        // 再按名称排序
        return a.name.localeCompare(b.name, 'zh-CN');
      });

      return targets;
    } catch (error: any) {
      console.error('获取聊天对象列表失败:', error);
      throw new Error(`获取聊天对象列表失败: ${error.message || '未知错误'}`);
    }
  }

  // 获取会话列表（暂不实现）
  async getSessions(): Promise<ChatlogSession[]> {
    throw new Error('获取会话列表功能暂未实现');
  }

  // 获取聊天记录（暂不实现）
  async getChatMessages(params: {
    talker?: string;
    time?: string;
    limit?: number;
    offset?: number;
  }): Promise<ChatlogMessage[]> {
    throw new Error('通用聊天记录获取功能暂未实现，请使用getDailyMessages');
  }

  // 获取配置
  getConfig(): ChatlogConfig {
    return { ...this.config };
  }

  // 检查是否已连接
  isConnected(): boolean {
    return this.config.isConnected;
  }
}

export const chatlogService = new ChatlogService(); 