import { 
  ChatlogContact, 
  ChatlogChatroom, 
  ChatlogMessage, 
  ChatlogSession,
  ChatlogConfig 
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

  // 获取联系人列表（暂不实现）
  async getContacts(): Promise<ChatlogContact[]> {
    throw new Error('获取联系人列表功能暂未实现');
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