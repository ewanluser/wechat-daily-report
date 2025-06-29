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

// 飞书配置类型
export interface FeishuConfig {
  appId: string;
  appSecret: string;
  isConnected: boolean;
}

// 飞书多维表格字段类型
export interface FeishuMessageRecord {
  messageContent: string;    // 消息内容
  timestamp: string;         // 时间
  sender: string;           // 发消息的人
  summary?: string;         // 消息总结（如果消息过长）
  messageType: string;      // 消息类型分类
  chatName: string;         // 群名/聊天对象
  date: string;             // 日期
  importance: 'high' | 'medium' | 'low';  // 重要程度
  // category: string;         // AI分类结果
  keywords?: string;        // 关键词标签
}

// 飞书导出配置
export interface FeishuExportConfig {
  startDate: string;
  endDate: string;
  chatTarget: ChatTarget;
  enableAIClassification: boolean;
  tableName?: string;
}

// Chatlog API 相关类型
export interface ChatlogContact {
  username: string;
  nickname: string;
  remark?: string;
  type?: 'friend' | 'stranger' | 'blacklist';
  avatar?: string;
  wxid?: string;
}

export interface ChatlogChatroom {
  name: string;
  nickName: string;
  username: string;
  nickname: string;
  owner?: string;
  remark?: string;
}

// 新增：个人聊天类型
export interface ChatlogPrivateChat {
  username: string;
  nickname: string;
  remark?: string;
  wxid?: string;
  avatar?: string;
  lastMessageTime?: number;
  messageCount?: number;
  isBlacklisted?: boolean;
  type: 'private';
}

// 扩展的聊天对象类型，统一群聊和个人聊天
export interface ChatTarget {
  id: string;          // 用于API调用的标识符
  name: string;        // 显示名称
  type: 'group' | 'private';
  avatar?: string;
  lastMessageTime?: number;
  messageCount?: number;
  // 原始数据
  rawData: ChatlogChatroom | ChatlogPrivateChat;
}

export interface ChatlogMessage {
  id?: string;
  seq?: number;
  type: number;
  talker: string;
  talkerName?: string;
  content: string;
  contents?: any;
  timestamp?: number;
  time?: string;
  sender?: string;
  senderName?: string;
  isChatRoom?: boolean;
  isSelf?: boolean;
  subType?: number;
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
  keywordTags?: string[];
  relatedTopics?: string[];
  sentimentTone?: 'positive' | 'neutral' | 'negative' | 'mixed';
}

export interface ActivityStats {
  totalMessages: number;
  activeUsers: string[];
  peakTimeRange: string;
  messageDistribution: Record<string, number>;
  averageMessageLength?: number;
  responseRate?: number;
  silentMembers?: string[];
  mediaStats?: {
    imageCount: number;
    linkCount: number;
    documentCount: number;
  };
}

export interface QuotableMessage {
  content: string;
  author: string;
  timestamp: string;
  context?: string;
  replyCount?: number;
  sentimentScore?: number;
  messageType?: 'insight' | 'humor' | 'decision' | 'question' | 'solution';
}

export interface MemberContribution {
  name: string;
  messageCount: number;
  qualityScore: number;
  specialties: string[];
  responseTime: string;
  initiatedTopics: number;
}

export interface ContentValue {
  knowledgeSharing: Array<{
    type: '技术分享' | '资源推荐' | '经验总结' | '问题解决';
    content: string;
    author: string;
    timestamp: string;
  }>;
  actionItems: Array<{
    task: string;
    assignee?: string;
    deadline?: string;
    context: string;
  }>;
  decisionsMade: Array<{
    decision: string;
    context: string;
    participants: string[];
    timestamp: string;
  }>;
}

export interface GroupHealth {
  participationBalance: number;
  topicDiversity: number;
  interactionQuality: number;
  overallHealthScore: number;
  recommendations: string[];
}

// 扩展日报类型以支持个人聊天
export interface DailyDigest {
  id: string;
  chatGroupId: string;
  chatGroupName: string;
  chatType: 'group' | 'private'; // 新增：聊天类型
  date: string;
  topicHighlights: TopicHighlight[];
  activityStats: ActivityStats;
  quotableMessages: QuotableMessage[];
  memberContributions?: MemberContribution[];
  contentValue?: ContentValue;
  groupHealth?: GroupHealth;
  // 个人聊天特有分析
  privateAnalysis?: {
    relationshipTone: 'friendly' | 'professional' | 'intimate' | 'neutral';
    conversationPatterns: string[];
    emotionalInsights: string[];
    communicationStyle: string;
  };
  trendInsights?: {
    comparedToPrevious: string;
    weeklyPattern?: string;
    seasonalTrends?: string;
  };
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
  chatlogGetContacts: () => Promise<{ success: boolean; data?: ChatlogContact[]; error?: string }>; // 新增
  chatlogGetDailyMessages: (talker: string, date: string) => Promise<{ success: boolean; data?: ChatlogMessage[]; error?: string }>;
  
  // 应用信息
  isElectron: boolean;
  platform: string;
}

export {}; 