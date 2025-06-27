import { AIConfig, ChatlogConfig, FeishuConfig } from '../../shared/types';

class ConfigService {
  private electronAPI: any;

  constructor() {
    this.electronAPI = (window as any).electronAPI;
    if (!this.electronAPI) {
      throw new Error('此应用只能在Electron环境中运行');
    }
  }

  // AI配置相关
  async saveAIConfig(config: AIConfig): Promise<void> {
    await this.electronAPI.setStoreValue('ai-config', config);
  }

  async loadAIConfig(): Promise<AIConfig | null> {
    return await this.electronAPI.getStoreValue('ai-config');
  }

  // Chatlog配置相关
  async saveChatlogConfig(config: ChatlogConfig): Promise<void> {
    await this.electronAPI.setStoreValue('chatlog-config', config);
  }

  async loadChatlogConfig(): Promise<ChatlogConfig | null> {
    return await this.electronAPI.getStoreValue('chatlog-config');
  }

  // 飞书配置相关
  async saveFeishuConfig(config: FeishuConfig): Promise<void> {
    await this.electronAPI.setStoreValue('feishu-config', config);
  }

  async loadFeishuConfig(): Promise<FeishuConfig | null> {
    return await this.electronAPI.getStoreValue('feishu-config');
  }

  // 通用配置方法
  async setConfig(key: string, value: any): Promise<void> {
    await this.electronAPI.setStoreValue(key, value);
  }

  async getConfig(key: string): Promise<any> {
    return await this.electronAPI.getStoreValue(key);
  }

  // 显示保存对话框
  async showSaveDialog(options: any): Promise<any> {
    return await this.electronAPI.showSaveDialog(options);
  }

  // 显示消息框
  async showMessageBox(options: any): Promise<any> {
    return await this.electronAPI.showMessageBox(options);
  }
}

export const configService = new ConfigService(); 