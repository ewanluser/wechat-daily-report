import { ChatMessage, DailyDigest } from '../types';

interface GroupData {
  name: string;
  messages: Record<string, {
    messages: ChatMessage[];
    digest: DailyDigest;
  }>;
}

export const groupMessages: Record<string, GroupData> = {
  'group1': {
    name: '示例群聊',
    messages: {
      '2025-04-30': {
        messages: [
          {
            id: '1',
            content: '早上好！',
            sender: '张三',
            timestamp: '09:00',
            type: 'text',
            category: '日常交流'
          },
          {
            id: '2',
            content: '今天天气真不错',
            sender: '李四',
            timestamp: '09:05',
            type: 'text',
            category: '日常交流'
          },
          {
            id: '3',
            content: '[链接|技术分享：如何提高代码质量]',
            sender: '王五',
            timestamp: '10:00',
            type: 'link',
            category: '资源分享',
            tags: ['技术分享', '编程']
          },
          {
            id: '4',
            content: '@王五 这篇文章写得很好，我们项目中可以借鉴',
            sender: '赵六',
            timestamp: '10:15',
            type: 'text',
            category: '技术讨论'
          },
          {
            id: '5',
            content: '周末有人一起去爬山吗？',
            sender: '张三',
            timestamp: '11:30',
            type: 'text',
            category: '生活话题',
            tags: ['户外活动']
          }
        ],
        digest: {
          id: 'digest-2025-04-30',
          chatGroupId: 'group1',
          chatGroupName: '示例群聊',
          date: '2025-04-30',
          topicHighlights: [
            {
              title: '技术交流与分享',
              summary: '群成员分享了关于代码质量的技术文章，并就如何在项目中应用进行了讨论。',
              relatedMessages: [
                {
                  id: '3',
                  content: '[链接|技术分享：如何提高代码质量]',
                  sender: '王五',
                  timestamp: '10:00',
                  type: 'link',
                  category: '资源分享',
                  tags: ['技术分享', '编程']
                },
                {
                  id: '4',
                  content: '@王五 这篇文章写得很好，我们项目中可以借鉴',
                  sender: '赵六',
                  timestamp: '10:15',
                  type: 'text',
                  category: '技术讨论'
                }
              ],
              participants: ['王五', '赵六'],
              timeRange: '10:00 - 10:15',
              category: '技术讨论',
              significance: '重要'
            },
            {
              title: '日常社交活动',
              summary: '群成员讨论了周末户外活动的安排，计划组织爬山活动。',
              relatedMessages: [
                {
                  id: '5',
                  content: '周末有人一起去爬山吗？',
                  sender: '张三',
                  timestamp: '11:30',
                  type: 'text',
                  category: '生活话题',
                  tags: ['户外活动']
                }
              ],
              participants: ['张三'],
              timeRange: '11:30',
              category: '生活话题',
              significance: '有趣'
            }
          ],
          activityStats: {
            totalMessages: 5,
            activeUsers: ['张三', '李四', '王五', '赵六'],
            peakTimeRange: '09:00 - 10:00',
            messageDistribution: {
              morning: 5,
              afternoon: 0,
              evening: 0,
              night: 0
            }
          },
          quotableMessages: [
            {
              content: '今天天气真不错',
              sender: '李四',
              timestamp: '09:05',
              context: '日常问候'
            }
          ],
          followUps: [
            {
              item: '讨论代码质量改进方案',
              dueDate: '2025-05-01',
              assignee: '王五',
              priority: '高'
            },
            {
              item: '组织周末爬山活动',
              dueDate: '2025-05-04',
              assignee: '张三',
              priority: '中'
            }
          ]
        }
      }
    }
  }
}; 