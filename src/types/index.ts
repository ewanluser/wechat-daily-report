export interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  type: 'text' | 'image' | 'link' | 'emoji';
  category?: '技术讨论' | '生活话题' | '职业发展' | '资源分享' | '日常交流' | '其他';
  tags?: string[];
  isHighlight?: boolean;
}

export interface ActivityStats {
  totalMessages: number;
  activeUsers: string[];
  peakTimeRange: string;
  messageDistribution: {
    morning: number;   // 早上 6:00-12:00
    afternoon: number; // 下午 12:00-18:00
    evening: number;   // 晚上 18:00-24:00
    night: number;     // 凌晨 0:00-6:00
  };
}

export interface HighlightTopic {
  title: string;
  summary: string;
  relatedMessages: ChatMessage[];
  participants: string[];
  timeRange: string;
  category: string;
  significance: '重要' | '有趣' | '信息量大';
}

export interface ResourceShare {
  type: '文章' | '链接' | '工具' | '项目' | '其他';
  title: string;
  sharedBy: string;
  timestamp: string;
  description: string;
  tags: string[];
}

export interface DailyDigest {
  id: string;
  chatGroupId: string;
  chatGroupName: string;
  date: string;
  
  // 话题精华
  topicHighlights: HighlightTopic[];
  
  // 群聊统计
  activityStats: ActivityStats;
  
  // 群友金句
  quotableMessages: Array<{
    content: string;
    sender: string;
    timestamp: string;
    context?: string;
  }>;
  
  // 待跟进事项
  followUps: Array<{
    item: string;
    dueDate?: string;
    assignee?: string;
    priority: '高' | '中' | '低';
  }>;
}

export interface CardStyle {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  secondaryColor: string;
  font: string;
  cardShadow: string;
} 