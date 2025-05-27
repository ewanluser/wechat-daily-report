import React from 'react';
import { Modal, Typography, Space, Button, Divider } from 'antd';
import { 
  WechatOutlined, 
  GithubOutlined, 
  MailOutlined, 
  CloseOutlined,
  HeartOutlined,
  StarOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import './styles.css';

const { Title, Text, Paragraph } = Typography;

interface ContactModalProps {
  visible: boolean;
  onCancel: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  visible,
  onCancel
}) => {
  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={520}
      className="contact-modal"
      closable={false}
      maskStyle={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)'
      }}
    >
      <div className="contact-modal-content">
        {/* 关闭按钮 */}
        <button className="close-btn" onClick={onCancel}>
          <CloseOutlined />
        </button>

        {/* 头部区域 */}
        <div className="modal-header">
          <div className="header-background"></div>
          <div className="header-content">
            <div className="app-icon">
              <HeartOutlined />
            </div>
            <Title level={3} style={{ color: '#fff', margin: '16px 0 8px', textAlign: 'center' }}>
              微信日报助手
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center', display: 'block' }}>
              让群聊记录更有价值，让团队协作更高效
            </Text>
          </div>
        </div>

        {/* 二维码区域 */}
        <div className="qr-section">
          <div className="qr-card">
            <div className="qr-header">
              <WechatOutlined className="wechat-icon" />
              <span>扫码添加作者微信</span>
            </div>
            <div className="qr-content">
              <div className="qr-image-container">
                <img 
                  src="images/wx.jpg" 
                  alt="微信二维码" 
                  className="qr-image"
                />
                <div className="qr-overlay">
                  <div className="scan-line"></div>
                </div>
              </div>
              <div className="qr-text">
                <div className="qr-title">微信扫码</div>
                <div className="qr-desc">
                  长按识别或扫描二维码
                  <br />
                  添加好友开始交流
                </div>
                <div className="qr-tips">
                  • 遇到问题随时咨询
                  <br />
                  • 功能建议和反馈
                  <br />
                  • 使用经验分享
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 联系方式区域 */}
        <div className="contact-section">
          <div className="contact-grid">
            <div className="contact-item wechat">
              <div className="contact-icon">
                <WechatOutlined />
              </div>
              <div className="contact-info">
                <div className="contact-title">微信交流</div>
                <div className="contact-desc">扫码添加好友</div>
              </div>
            </div>
            
            <div className="contact-item github">
              <div className="contact-icon">
                <GithubOutlined />
              </div>
              <div className="contact-info">
                <div className="contact-title">GitHub</div>
                <div className="contact-desc">mengjian-github</div>
              </div>
            </div>
            
            <div className="contact-item email">
              <div className="contact-icon">
                <MailOutlined />
              </div>
              <div className="contact-info">
                <div className="contact-title">邮箱联系</div>
                <div className="contact-desc">通过微信获取</div>
              </div>
            </div>
          </div>
        </div>

        <Divider style={{ margin: '24px 0', borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* 反馈区域 */}
        <div className="feedback-section">
          <div className="feedback-header">
            <StarOutlined style={{ color: '#faad14', marginRight: '8px' }} />
            <span style={{ color: '#fff', fontWeight: 600 }}>使用反馈</span>
          </div>
          <div className="feedback-items">
            <div className="feedback-item">
              <QuestionCircleOutlined />
              <span>遇到问题或有功能建议？欢迎随时联系</span>
            </div>
            <div className="feedback-item">
              <HeartOutlined />
              <span>觉得工具有用？给个 ⭐ 支持一下</span>
            </div>
            <div className="feedback-item">
              <WechatOutlined />
              <span>也欢迎分享给更多需要的朋友</span>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="modal-footer">
          <Button 
            type="primary" 
            size="large" 
            onClick={onCancel}
            className="close-button"
            block
          >
            知道了
          </Button>
        </div>
      </div>
    </Modal>
  );
}; 