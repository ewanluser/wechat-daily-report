import React, { useRef, useState } from 'react';
import { Typography, List, Space, Button, Tag, Avatar, Tooltip } from 'antd';
import { 
  DownloadOutlined, 
  MessageOutlined,
  UserOutlined,
  ClockCircleOutlined,
  BulbOutlined,
  StarOutlined,
  ScheduleOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  TrophyOutlined,
  FireOutlined
} from '@ant-design/icons';
import { DailyDigest } from '../../types';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';
import './styles.css';

const { Text, Paragraph } = Typography;

interface DigestCardProps {
  digest: DailyDigest;
  onDownload?: () => void;
}

const MOBILE_EXPORT_WIDTH = 750; // 适合手机的宽度

export const DigestCard: React.FC<DigestCardProps> = ({ digest, onDownload }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleDownload = async () => {
    if (cardRef.current) {
      setExporting(true);
      await new Promise(r => setTimeout(r, 50));
      const btn = cardRef.current.querySelector('.download-btn');
      if (btn) (btn as HTMLElement).style.display = 'none';

      // 临时保存原样式
      const prevWidth = cardRef.current.style.width;
      const prevFontSize = cardRef.current.style.fontSize;
      const prevPadding = cardRef.current.style.padding;

      // 切换为移动端样式
      cardRef.current.style.width = `${MOBILE_EXPORT_WIDTH}px`;
      cardRef.current.style.fontSize = '15px';
      cardRef.current.style.padding = '12px';

      const canvas = await html2canvas(cardRef.current, { 
        backgroundColor: '#1F1A42', 
        scale: 2,
        onclone: (clonedDoc) => {
          // 对克隆的DOM设置明确的颜色值
          const clonedElement = clonedDoc.body.querySelector('.digest-card') as HTMLElement;
          if (clonedElement) {
            // 设置主要文本颜色
            const titles = clonedElement.querySelectorAll('.section-title, .topic-title, .card-header-title, .stat-card-value, .message-content');
            titles.forEach(el => {
              (el as HTMLElement).style.color = '#FFFFFF';
            });
            
            // 设置次要文本颜色
            const subtitles = clonedElement.querySelectorAll('.topic-summary, .topic-meta, .card-header-subtitle, .stat-card-title');
            subtitles.forEach(el => {
              (el as HTMLElement).style.color = 'rgba(255, 255, 255, 0.7)';
            });
          }
        }
      });

      // 恢复样式
      cardRef.current.style.width = prevWidth;
      cardRef.current.style.fontSize = prevFontSize;
      cardRef.current.style.padding = prevPadding;
      if (btn) (btn as HTMLElement).style.display = '';
      setExporting(false);

      const link = document.createElement('a');
      link.download = `${digest.chatGroupName}-${digest.date}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
    onDownload?.();
  };

  const timeDistribution = digest.activityStats.messageDistribution;
  const mostActiveTime = Object.entries(timeDistribution)
    .sort(([, a], [, b]) => b - a)[0][0];

  // 根据话题显示不同的图标
  const getCategoryIcon = (category: string) => {
    switch(category.toLowerCase()) {
      case '技术': return <ThunderboltOutlined />;
      case '公告': return <RiseOutlined />;
      case '讨论': return <BulbOutlined />;
      case '决策': return <TrophyOutlined />;
      case '热门': return <FireOutlined />;
      default: return <StarOutlined />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="digest-card"
      ref={cardRef}
    >
      {/* 头部信息 */}
      <div className="card-header">
        <div className="card-header-pattern"></div>
        <div className="card-header-content">
          <h2 className="card-header-title">{digest.chatGroupName}</h2>
          <div className="card-header-subtitle">
            <ClockCircleOutlined style={{ marginRight: '8px' }} />
            {digest.date} 群聊日报
          </div>
          <div className="avatar-group" style={{ marginTop: '20px' }}>
            {digest.activityStats.activeUsers.slice(0, 5).map((user, index) => (
              <Tooltip key={index} title={user} placement="top">
                <div 
                  className="avatar"
                  style={{ 
                    backgroundColor: [
                      '#f56a00', '#7265e6', '#ffbf00', 
                      '#00a2ae', '#87d068'
                    ][index % 5]
                  }}
                >
                  {user.charAt(0)}
                </div>
              </Tooltip>
            ))}
            {digest.activityStats.activeUsers.length > 5 && (
              <div className="avatar" style={{ backgroundColor: '#7B68EE' }}>
                +{digest.activityStats.activeUsers.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card-body">
        {/* 群聊统计 */}
        <div className="stat-cards-container">
          <motion.div 
            className="stat-card"
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="stat-card-title">消息总数</div>
            <div className="stat-card-value">
              <div className="stat-card-icon">
                <MessageOutlined />
              </div>
              {digest.activityStats.totalMessages}
            </div>
          </motion.div>
          
          <motion.div 
            className="stat-card"
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="stat-card-title">活跃成员</div>
            <div className="stat-card-value">
              <div className="stat-card-icon">
                <UserOutlined />
              </div>
              {digest.activityStats.activeUsers.length}
            </div>
          </motion.div>
          
          <motion.div 
            className="stat-card"
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="stat-card-title">最活跃时段</div>
            <div className="stat-card-value">
              <div className="stat-card-icon">
                <ClockCircleOutlined />
              </div>
              {mostActiveTime}
            </div>
          </motion.div>
        </div>

        {/* 话题精华 */}
        <AnimatePresence>
          {digest.topicHighlights.length > 0 && (
            <motion.div 
              className="section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="section-header">
                <span className="section-icon">
                  <BulbOutlined />
                </span>
                <h3 className="section-title">话题精华</h3>
              </div>
              
              {digest.topicHighlights.map((topic, index) => (
                <motion.div 
                  key={index}
                  className="topic-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                >
                  <div className="topic-title">
                    {getCategoryIcon(topic.category)}
                    {topic.title}
                    <Tag 
                      style={{ 
                        marginLeft: 'auto', 
                        background: topic.significance === '重要' 
                          ? 'linear-gradient(135deg, #ff4b1f, #ff9068)' 
                          : 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))'
                      }}
                    >
                      {topic.significance}
                    </Tag>
                  </div>
                  <div className="topic-summary">{topic.summary}</div>
                  <div className="topic-meta">
                    <span><ClockCircleOutlined style={{ marginRight: '6px' }} />{topic.timeRange}</span>
                    <span><UserOutlined style={{ marginRight: '6px' }} />{topic.participants.length}人参与</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
          
          {/* 群友金句 */}
          {digest.quotableMessages.length > 0 && (
            <motion.div 
              className="section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="section-header">
                <span className="section-icon">
                  <StarOutlined />
                </span>
                <h3 className="section-title">群友金句</h3>
              </div>
              
              {digest.quotableMessages.map((message, index) => (
                <motion.div 
                  key={index}
                  className="topic-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <div className="message-content" style={{ 
                    fontStyle: 'italic', 
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    margin: '0 0 10px'
                  }}>
                    "{message.content}"
                  </div>
                  <div className="topic-meta">
                    <span>—— {message.sender}</span>
                    <span><ClockCircleOutlined style={{ marginRight: '6px' }} />{message.timestamp}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
          
          {/* 待跟进事项 */}
          {digest.followUps.length > 0 && (
            <motion.div 
              className="section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="section-header">
                <span className="section-icon">
                  <ScheduleOutlined />
                </span>
                <h3 className="section-title">待跟进事项</h3>
              </div>
              
              {digest.followUps.map((item, index) => (
                <motion.div 
                  key={index}
                  className="topic-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <div className="topic-title" style={{ alignItems: 'flex-start' }}>
                    <Tag style={{ 
                      background: 
                        item.priority === '高' ? 'linear-gradient(135deg, #ff4b1f, #ff9068)' :
                        item.priority === '中' ? 'linear-gradient(135deg, #f7b733, #fc4a1a)' :
                        'linear-gradient(135deg, #56ab2f, #a8e063)',
                      marginRight: '8px',
                      marginTop: '2px'
                    }}>
                      {item.priority}
                    </Tag>
                    <div>{item.item}</div>
                  </div>
                  <div className="topic-meta" style={{ marginTop: '10px' }}>
                    {item.dueDate && (
                      <span><ClockCircleOutlined style={{ marginRight: '6px' }} />截止：{item.dueDate}</span>
                    )}
                    {item.assignee && (
                      <span><UserOutlined style={{ marginRight: '6px' }} />负责：{item.assignee}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 下载按钮 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          marginTop: '32px',
          marginBottom: '8px'
        }}>
          <button
            className="download-btn"
            onClick={handleDownload}
          >
            <DownloadOutlined />
            保存为图片
          </button>
        </div>
      </div>
    </motion.div>
  );
}; 