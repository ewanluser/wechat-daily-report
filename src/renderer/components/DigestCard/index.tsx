import React, { useRef, useState } from 'react';
import { Typography, Button, Tag, Tooltip } from 'antd';
import { 
  DownloadOutlined, 
  MessageOutlined,
  UserOutlined,
  ClockCircleOutlined,
  BulbOutlined,
  StarOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  TrophyOutlined,
  FireOutlined,
  FileTextOutlined,
  WechatOutlined
} from '@ant-design/icons';
import { DailyDigest } from '../../../shared/types';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';
import { TextReportModal } from '../TextReport';
import './styles.css';

const { Text, Paragraph } = Typography;

interface DigestCardProps {
  digest: DailyDigest;
  textReport?: string;
  onDownload?: () => void;
  onViewTextReport?: () => void;
  onContactAuthor?: () => void;
}

const MOBILE_EXPORT_WIDTH = 750; // 适合手机的宽度

export const DigestCard: React.FC<DigestCardProps> = ({ 
  digest, 
  textReport, 
  onDownload, 
  onViewTextReport,
  onContactAuthor 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [showTextReport, setShowTextReport] = useState(false);

  const handleDownload = async () => {
    if (cardRef.current) {
      setExporting(true);
      await new Promise(r => setTimeout(r, 50));
      
      // 隐藏所有按钮
      const allButtons = cardRef.current.querySelectorAll('.download-btn, .text-report-btn, .contact-btn');
      const originalButtonStyles: string[] = [];
      allButtons.forEach((btn, index) => {
        const htmlBtn = btn as HTMLElement;
        originalButtonStyles[index] = htmlBtn.style.display;
        htmlBtn.style.display = 'none';
      });

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
        onclone: (clonedDoc: Document) => {
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
      
      // 恢复所有按钮的显示
      allButtons.forEach((btn, index) => {
        const htmlBtn = btn as HTMLElement;
        htmlBtn.style.display = originalButtonStyles[index] || '';
      });
      
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
    .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 'morning';

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
            {digest.activityStats.activeUsers.slice(0, 5).map((user: string, index: number) => (
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

          {/* 新增：回复率统计 */}
          {digest.activityStats.responseRate !== undefined && (
            <motion.div 
              className="stat-card"
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="stat-card-title">回复率</div>
              <div className="stat-card-value">
                <div className="stat-card-icon">
                  <ThunderboltOutlined />
                </div>
                {Math.round(digest.activityStats.responseRate * 100)}%
              </div>
            </motion.div>
          )}

          {/* 新增：多媒体统计 */}
          {digest.activityStats.mediaStats && (
            <motion.div 
              className="stat-card"
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="stat-card-title">多媒体内容</div>
              <div className="stat-card-value">
                <div className="stat-card-icon">
                  <FileTextOutlined />
                </div>
                {digest.activityStats.mediaStats.imageCount + 
                 digest.activityStats.mediaStats.linkCount + 
                 digest.activityStats.mediaStats.documentCount}
              </div>
            </motion.div>
          )}
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
              
              {digest.topicHighlights.slice(0, 3).map((topic, index) => (
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
                    {topic.significance === '高' && (
                      <Tag 
                        className="significance-tag-high"
                        style={{ marginLeft: 'auto' }}
                      >
                        🔥 重要
                      </Tag>
                    )}
                  </div>
                  <div className="topic-summary">{topic.summary}</div>
                  {topic.keywordTags && topic.keywordTags.length > 0 && (
                    <div style={{ margin: '8px 0' }}>
                      {topic.keywordTags.map((tag, tagIndex) => (
                        <Tag key={tagIndex} style={{ marginRight: '4px', fontSize: '12px' }}>
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  )}
                  <div className="topic-meta">
                    <span><ClockCircleOutlined style={{ marginRight: '6px' }} />{topic.timeRange}</span>
                    <span><UserOutlined style={{ marginRight: '6px' }} />{topic.participants.length}人参与</span>
                    {topic.sentimentTone && (
                      <span style={{ 
                        color: topic.sentimentTone === 'positive' ? '#52c41a' : 
                               topic.sentimentTone === 'negative' ? '#ff4d4f' : 
                               topic.sentimentTone === 'mixed' ? '#faad14' : '#999'
                      }}>
                        {topic.sentimentTone === 'positive' ? '😊 积极' : 
                         topic.sentimentTone === 'negative' ? '😔 消极' : 
                         topic.sentimentTone === 'mixed' ? '🤔 复杂' : '😐 中性'}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
          
          {digest.memberContributions && digest.memberContributions.length > 0 && (
            <motion.div 
              className="section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="section-header">
                <span className="section-icon">
                  <TrophyOutlined />
                </span>
                <h3 className="section-title">贡献排行</h3>
              </div>
              
              <div className="contributor-grid">
                {digest.memberContributions.slice(0, 3).map((member, index) => (
                  <motion.div 
                    key={index}
                    className="contributor-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + index * 0.1 }}
                  >
                    <div className="contributor-rank">#{index + 1}</div>
                    <div className="contributor-info">
                      <div className="contributor-name">{member.name}</div>
                      <div className="contributor-stats">
                        <span>{member.messageCount}条消息</span>
                        <span>质量分 {member.qualityScore}/10</span>
                      </div>
                      {member.specialties && member.specialties.length > 0 && (
                        <div className="contributor-specialties">
                          {member.specialties.slice(0, 2).map((specialty, sIndex) => (
                            <Tag key={sIndex} style={{ fontSize: '12px' }}>{specialty}</Tag>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {digest.contentValue && (
            <motion.div 
              className="section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="section-header">
                <span className="section-icon">
                  <FileTextOutlined />
                </span>
                <h3 className="section-title">价值内容</h3>
              </div>
              
              {digest.contentValue.knowledgeSharing && digest.contentValue.knowledgeSharing.length > 0 && (
                <div className="value-section">
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 10px' }}>
                    💡 知识分享
                  </h4>
                  {digest.contentValue.knowledgeSharing.slice(0, 2).map((item, index) => (
                    <div key={index} className="value-item">
                      <Tag style={{ marginRight: '8px', fontSize: '12px' }}>{item.type}</Tag>
                      <span>{item.content}</span>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        by {item.author} • {item.timestamp}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {digest.contentValue.actionItems && digest.contentValue.actionItems.length > 0 && (
                <div className="value-section">
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '10px 0 10px' }}>
                    📋 待办事项
                  </h4>
                  {digest.contentValue.actionItems.slice(0, 2).map((item, index) => (
                    <div key={index} className="value-item">
                      <span>{item.task}</span>
                      {item.assignee && (
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          负责人: {item.assignee}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {digest.groupHealth && (
            <motion.div 
              className="section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="section-header">
                <span className="section-icon">
                  <RiseOutlined />
                </span>
                <h3 className="section-title">群组健康度</h3>
              </div>
              
              <div className="health-score-container">
                <div className="health-score-main">
                  <div className="health-score-value">{digest.groupHealth.overallHealthScore}</div>
                  <div className="health-score-label">综合评分</div>
                </div>
                <div className="health-metrics">
                  <div className="health-metric">
                    <span>参与平衡</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill" 
                        style={{ width: `${digest.groupHealth.participationBalance * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="health-metric">
                    <span>话题多样性</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill" 
                        style={{ width: `${digest.groupHealth.topicDiversity * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="health-metric">
                    <span>互动质量</span>
                    <div className="metric-bar">
                      <div 
                        className="metric-fill" 
                        style={{ width: `${digest.groupHealth.interactionQuality * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {digest.quotableMessages.length > 0 && (
            <motion.div 
              className="section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="section-header">
                <span className="section-icon">
                  <StarOutlined />
                </span>
                <h3 className="section-title">群友金句</h3>
              </div>
              
              {digest.quotableMessages.slice(0, 3).map((message, index) => (
                <motion.div 
                  key={index}
                  className="topic-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
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
                    <span>—— {message.author}</span>
                    <span><ClockCircleOutlined style={{ marginRight: '6px' }} />{message.timestamp}</span>
                    {message.messageType && (
                      <Tag style={{ marginLeft: '8px', fontSize: '12px' }}>
                        {message.messageType === 'insight' ? '💡 洞察' : 
                         message.messageType === 'humor' ? '😄 幽默' : 
                         message.messageType === 'decision' ? '⚡ 决策' : 
                         message.messageType === 'question' ? '❓ 问题' : 
                         message.messageType === 'solution' ? '✅ 解决' : message.messageType}
                      </Tag>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

        </AnimatePresence>
        
        {/* 操作按钮 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          gap: '12px',
          marginTop: '32px',
          marginBottom: '8px',
          flexWrap: 'wrap'
        }}>
          <button
            className="download-btn"
            onClick={handleDownload}
          >
            <DownloadOutlined />
            保存为图片
          </button>
          {textReport && (
            <button
              className="text-report-btn"
              onClick={() => {
                setShowTextReport(true);
                onViewTextReport?.();
              }}
            >
              <FileTextOutlined />
              查看文本日报
            </button>
          )}
          <button
            className="contact-btn"
            onClick={() => onContactAuthor?.()}
            title="联系作者反馈问题或建议"
          >
            <WechatOutlined />
            联系作者
          </button>
        </div>
      </div>

      {/* 文本日报弹窗 */}
      {textReport && (
        <TextReportModal
          visible={showTextReport}
          onCancel={() => setShowTextReport(false)}
          textReport={textReport}
          chatName={digest.chatGroupName}
          date={digest.date}
        />
      )}
    </motion.div>
  );
}; 