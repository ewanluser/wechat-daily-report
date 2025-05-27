// AI 配置类型
export interface AIConfig {
  provider: 'openai' | 'openrouter' | 'custom';
  apiKey: string;
  model: string;
  baseUrl?: string;
}

// Chatlog 配置类型
export interface ChatlogConfig {
  baseUrl: string;
  isConnected: boolean;
}

// Chatlog API 相关类型
export interface ChatlogContact {
  username: string;
  nickname: string;
  remark?: string;
}

export interface ChatlogChatroom {
  name: string;
  nickName: string;
  username: string;
  nickname: string;
  owner?: string;
  remark?: string;
}

export interface ChatlogMessage {
  id: string;
  type: number;
  talker: string;
  content: string;
  timestamp: number;
  roomTopic?: string;
}

export interface ChatlogSession {
  id: string;
  talker: string;
  lastMessageTime: number;
  messageCount: number;
}

// 日报相关类型
export interface TopicHighlight {
  title: string;
  summary: string;
  participants: string[];
  timeRange: string;
  category: string;
  significance: string;
}

export interface ActivityStats {
  totalMessages: number;
  activeUsers: string[];
  peakTimeRange: string;
  messageDistribution: Record<string, number>;
}

export interface QuotableMessage {
  content: string;
  author: string;
  timestamp: string;
  context?: string;
}

export interface FollowUp {
  title: string;
  description: string;
  priority: '高' | '中' | '低';
  deadline?: string;
  assignee?: string;
}

export interface DailyDigest {
  id: string;
  chatGroupId: string;
  chatGroupName: string;
  date: string;
  topicHighlights: TopicHighlight[];
  activityStats: ActivityStats;
  quotableMessages: QuotableMessage[];
  followUps: FollowUp[];
}

export interface GeneratedReport {
  digest: DailyDigest;
  textReport: string;
  rawMessages: ChatlogMessage[];
  generatedAt: string;
}

// Electron API 类型
export interface ElectronAPI {
  // 存储相关
  getStoreValue: (key: string) => Promise<any>;
  setStoreValue: (key: string, value: any) => Promise<boolean>;
  
  // 对话框相关
  showSaveDialog: (options: any) => Promise<any>;
  showMessageBox: (options: any) => Promise<any>;
  
  // Chatlog API相关
  chatlogConfigure: (baseUrl: string) => Promise<{ success: boolean; error?: string }>;
  chatlogCheckConnection: () => Promise<{ success: boolean; connected?: boolean; error?: string }>;
  chatlogGetChatrooms: () => Promise<{ success: boolean; data?: ChatlogChatroom[]; error?: string }>;
  chatlogGetDailyMessages: (talker: string, date: string) => Promise<{ success: boolean; data?: ChatlogMessage[]; error?: string }>;
  
  // 应用信息
  isElectron: boolean;
  platform: string;
}

export {}; 