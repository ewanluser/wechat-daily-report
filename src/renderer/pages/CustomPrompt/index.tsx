import React, { useState, useEffect } from 'react';
import {
  Layout,
  Typography,
  Select,
  DatePicker,
  Button,
  message,
  Space,
  Row,
  Col,
  Card,
  Spin,
  Empty,
  Alert,
  Input,
  List,
  Checkbox,
  Divider,
  Avatar,
  Tag,
  Tooltip
} from 'antd';
import {
  SettingOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  MessageOutlined,
  ApiOutlined,
  SendOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  RobotOutlined,
  UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { SettingsModal } from '../../components/Settings';
import { ContactModal } from '../../components/ContactModal';
import { LogViewer } from '../../components/LogViewer';
import ChatSelector from '../../components/ChatSelector';
import { chatlogService } from '../../services/chatlogService';
import { aiService } from '../../services/aiService';
import { configService } from '../../services/configService';
import { logService } from '../../services/logService';
import { ChatlogMessage, ChatTarget, ChatlogChatroom, ChatlogContact } from '../../../shared/types';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface SelectedMessage extends ChatlogMessage {
  selected: boolean;
  uniqueId: string;
}

const CustomPrompt: React.FC = () => {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);
  const [logViewerVisible, setLogViewerVisible] = useState(false);
  const [chatSelectorVisible, setChatSelectorVisible] = useState(false);
  const [chatTargets, setChatTargets] = useState<ChatTarget[]>([]);
  const [selectedChatTarget, setSelectedChatTarget] = useState<ChatTarget | null>(null);
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().format('YYYY-MM-DD'), // Default to today
    dayjs().format('YYYY-MM-DD')
  ]);
  const [messages, setMessages] = useState<SelectedMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  // Debug state changes
  useEffect(() => {
    console.log('🔄 CustomPrompt state changed:', {
      chatTargetsLength: chatTargets.length,
      loading,
      isConfigured,
      selectedChatTarget: selectedChatTarget?.name,
      dateRange: dateRange
    });
  }, [chatTargets, loading, isConfigured, selectedChatTarget, dateRange]);

  // Debug messages state changes
  useEffect(() => {
    console.log('💬 Messages state changed:', {
      messagesCount: messages.length,
      selectedCount: messages.filter(msg => msg.selected).length,
      firstMessage: messages[0] ? {
        uniqueId: messages[0].uniqueId,
        selected: messages[0].selected,
        sender: messages[0].sender,
        senderName: messages[0].senderName,
        talker: messages[0].talker,
        content: messages[0].content?.substring(0, 30)
      } : null
    });
  }, [messages]);

  useEffect(() => {
    logService.info('CustomPrompt page initialized', { timestamp: new Date().toISOString() }, 'CustomPrompt');
    checkConfiguration();
  }, []);

  useEffect(() => {
    if (isConfigured && selectedChatTarget) {
      loadMessages();
    }
  }, [isConfigured, selectedChatTarget, dateRange]);

  // Auto-load chat targets when configured
  useEffect(() => {
    if (isConfigured && chatTargets.length === 0) {
      console.log('🚀 Auto-loading chat targets when configured');
      loadChatTargets();
    }
  }, [isConfigured, chatTargets.length]);

  const checkConfiguration = async () => {
    logService.info('🔧 开始检查配置...', null, 'CustomPrompt');
    try {
      const aiConfig = await configService.loadAIConfig();
      const chatlogConfig = await configService.loadChatlogConfig();

      logService.info('📋 加载的配置', {
        aiConfig: aiConfig ? { ...aiConfig, apiKey: aiConfig.apiKey ? '***已设置***' : '未设置' } : null,
        chatlogConfig
      }, 'CustomPrompt');

      if (aiConfig && aiConfig.apiKey && chatlogConfig && chatlogConfig.baseUrl) {
        logService.info('✅ 配置项完整，开始配置服务...', null, 'CustomPrompt');

        aiService.configure(aiConfig);
        logService.info('🤖 AI服务配置完成', null, 'CustomPrompt');

        await chatlogService.configure(chatlogConfig.baseUrl);
        const testResult = await chatlogService.checkConnection();
        logService.info('🔗 Chatlog连接测试结果', { connected: testResult }, 'CustomPrompt');

        if (testResult) {
          console.log('✅ Configuration check passed, calling loadChatTargets');
          setIsConfigured(true);
          logService.info('✅ 配置检查完全通过', null, 'CustomPrompt');
          loadChatTargets();
        } else {
          console.log('❌ Chatlog connection test failed');
          setIsConfigured(false);
          logService.info('❌ Chatlog连接测试失败', null, 'CustomPrompt');
        }
      } else {
        setIsConfigured(false);
        logService.info('❌ 配置项不完整', null, 'CustomPrompt');
      }
    } catch (error) {
      logService.error('配置检查失败', error, 'CustomPrompt');
      message.error('配置检查失败，请检查设置');
      setIsConfigured(false);
    }
  };

  const loadChatTargets = async () => {
    if (!isConfigured) {
      console.log('❌ loadChatTargets: not configured');
      return;
    }

    console.log('🚀 loadChatTargets: starting...');
    setLoading(true);
    logService.info('📡 开始加载聊天对象...', null, 'CustomPrompt');

    try {
      console.log('🔗 Calling chatlogService.getAllChatTargets()...');
      const targets = await chatlogService.getAllChatTargets();
      console.log('✅ getAllChatTargets returned:', targets.length, 'targets');

      setChatTargets(targets);
      console.log('📝 setChatTargets called with:', targets.length, 'targets');
      logService.info(`📋 成功加载 ${targets.length} 个聊天对象`, null, 'CustomPrompt');

      // Log first few targets for debugging
      if (targets.length > 0) {
        console.log('🎯 First target:', targets[0]);
      }
    } catch (error) {
      console.error('❌ loadChatTargets error:', error);
      logService.error('加载聊天对象异常', error, 'CustomPrompt');
      message.error('加载聊天对象失败');
    } finally {
      setLoading(false);
      console.log('🏁 loadChatTargets: finished');
    }
  };

  const loadMessages = async () => {
    if (!selectedChatTarget || !isConfigured) return;

    setLoadingMessages(true);
    const [startDate, endDate] = dateRange;
    logService.info('📡 开始加载消息...', {
      chatTarget: selectedChatTarget.id,
      dateRange: `${startDate} - ${endDate}`
    }, 'CustomPrompt');

    try {
      // Generate array of dates in the range
      const dates: string[] = [];
      let currentDate = dayjs(startDate);
      const endDateObj = dayjs(endDate);

      while (currentDate.isSameOrBefore(endDateObj)) {
        dates.push(currentDate.format('YYYY-MM-DD'));
        currentDate = currentDate.add(1, 'day');
      }

      console.log('📅 Generated date range:', dates);

      // Fetch messages for each date in parallel
      const messagePromises = dates.map(date =>
        chatlogService.getDailyMessages(selectedChatTarget.id, date)
          .catch(error => {
            console.warn(`Failed to load messages for ${date}:`, error);
            return []; // Return empty array for failed requests
          })
      );

      const results = await Promise.all(messagePromises);
      console.log('📊 Message fetch results:', results.map(r => r.length));

      // Flatten and combine all messages
      let allMessages: ChatlogMessage[] = [];
      results.forEach(result => {
        if (Array.isArray(result)) {
          allMessages = allMessages.concat(result);
        }
      });

      // Sort messages by timestamp (newest first)
      allMessages.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      console.log('📋 Total messages loaded:', allMessages.length);

      const messagesWithSelection = allMessages.map((msg: ChatlogMessage, index: number) => ({
        ...msg,
        selected: false,
        // Create a unique ID using timestamp and index as fallback
        uniqueId: msg.id || `${msg.timestamp || Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
      }));

      setMessages(messagesWithSelection);
      logService.info(`📋 成功加载 ${messagesWithSelection.length} 条消息 (${dates.length} 天)`, null, 'CustomPrompt');

      if (messagesWithSelection.length === 0) {
        message.info(`所选时间范围内没有找到消息 (${startDate} - ${endDate})`);
      }
    } catch (error) {
      logService.error('加载消息异常', error, 'CustomPrompt');
      message.error('加载消息失败');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleMessageSelect = (messageId: string, checked: boolean) => {
    console.log('🎯 handleMessageSelect called:', { messageId, checked });
    setMessages(prev => prev.map(msg => {
      const isMatch = msg.uniqueId === messageId;
      if (isMatch) {
        console.log('Selected message:', {
          uniqueId: msg.uniqueId,
          sender: msg.sender,
          senderName: msg.senderName,
          talker: msg.talker,
          content: msg.content?.substring(0, 50)
        });
      }
      return isMatch ? { ...msg, selected: checked } : msg;
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    console.log('🎯 handleSelectAll called:', { checked });
    setMessages(prev => prev.map(msg => {
      console.log('Setting message selected:', { uniqueId: msg.uniqueId, checked });
      return { ...msg, selected: checked };
    }));
  };

  const generatePrompt = async () => {
    const selectedMessages = messages.filter(msg => msg.selected);
    if (selectedMessages.length === 0) {
      message.warning('请至少选择一条消息');
      return;
    }

    if (!customPrompt.trim()) {
      message.warning('请输入自定义提示词');
      return;
    }

    setGenerating(true);
    logService.info('🤖 开始生成AI响应...', { messageCount: selectedMessages.length }, 'CustomPrompt');

    try {
      // 构建完整的提示词
      const [startDate, endDate] = dateRange;
      const messagesText = selectedMessages.map(msg => {
        const timestamp = dayjs(msg.timestamp).format('MM/DD HH:mm:ss');
        const date = dayjs(msg.timestamp).format('YYYY/MM/DD');
        const senderName = msg.senderName || msg.sender || '未知';
        const userId = msg.sender || msg.talker || 'unknown';
        return `[${date} ${timestamp}] ${userId}:${senderName}: ${msg.content}`;
      }).join('\n');

      const fullPrompt = `${customPrompt.trim()}\n\n时间范围：${startDate} - ${endDate}\n消息内容：\n${messagesText}`;

      logService.info('📝 构建的完整提示词', { prompt: fullPrompt }, 'CustomPrompt');
      

      // 调用AI服务
      const response = await aiService.generateCustomResponse(fullPrompt);
      setGeneratedResponse(response);
      logService.info('✅ AI响应生成完成', null, 'CustomPrompt');
      message.success('AI响应生成完成');

    } catch (error) {
      logService.error('生成AI响应失败', error, 'CustomPrompt');
      message.error('生成AI响应失败，请检查网络连接和API配置');
    } finally {
      setGenerating(false);
    }
  };

  const getMessageTypeIcon = (type: number) => {
    switch (type) {
      case 1: return <MessageOutlined />;
      default: return <MessageOutlined />;
    }
  };

  const getMessageTypeText = (type: number) => {
      switch (type) {
      case 1: return '文本';
      case 3: return '图片';
      case 34: return '语音';
      case 43: return '视频';
      case 49: return '链接';
      default: return '其他';
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#13101F' }}>
      <Header style={{
        background: '#1F1A42',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <RobotOutlined style={{ fontSize: '24px', color: '#7B68EE', marginRight: '12px' }} />
          <Title level={3} style={{ color: '#FFFFFF', margin: 0 }}>
            自定义消息处理
          </Title>
        </div>
        <Space>
          <Tooltip title="设置">
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => setSettingsVisible(true)}
              style={{ color: '#FFFFFF' }}
            />
          </Tooltip>
          <Tooltip title="联系人">
            <Button
              type="text"
              icon={<MessageOutlined />}
              onClick={() => setContactVisible(true)}
              style={{ color: '#FFFFFF' }}
            />
          </Tooltip>
          <Tooltip title="日志">
            <Button
              type="text"
              icon={<ApiOutlined />}
              onClick={() => setLogViewerVisible(true)}
              style={{ color: '#FFFFFF' }}
            />
          </Tooltip>
        </Space>
      </Header>

      <Content style={{ padding: '24px' }}>
        {!isConfigured && (
          <Alert
            message="服务未配置"
            description="请先配置AI服务和Chatlog服务"
            type="warning"
            showIcon
            style={{ marginBottom: '24px' }}
            action={
              <Button
                size="small"
                type="primary"
                onClick={() => setSettingsVisible(true)}
              >
                去配置
              </Button>
            }
          />
        )}

        <Row gutter={24}>
          {/* 左侧：消息选择区 */}
          <Col span={12}>
            <Card
              title={
                <Space>
                  <MessageOutlined />
                  消息选择
                </Space>
              }
              style={{ height: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%', marginBottom: '16px' }}>
                <Space>
                  <Button
                    type="primary"
                    onClick={() => {
                      console.log('🎯 Opening ChatSelector:', {
                        chatTargetsLength: chatTargets.length,
                        loading,
                        isConfigured,
                        chatTargetsSample: chatTargets.slice(0, 3)
                      });
                      setChatSelectorVisible(true);
                    }}
                    disabled={!isConfigured}
                  >
                    选择聊天对象 ({chatTargets.length})
                  </Button>
                  <DatePicker.RangePicker
                    value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
                    onChange={(dates) => {
                      if (dates && dates[0] && dates[1]) {
                        setDateRange([
                          dates[0].format('YYYY-MM-DD'),
                          dates[1].format('YYYY-MM-DD')
                        ]);
                      }
                    }}
                    disabled={!isConfigured}
                    format="YYYY/MM/DD"
                    placeholder={['开始日期', '结束日期']}
                    style={{ minWidth: '240px' }}
                  />
                  <Button
                    onClick={loadMessages}
                    loading={loadingMessages}
                    disabled={!selectedChatTarget || !isConfigured}
                  >
                    加载消息
                  </Button>
                  {chatTargets.length === 0 && isConfigured && (
                    <Button
                      onClick={() => {
                        console.log('🔄 Manually triggering loadChatTargets');
                        loadChatTargets();
                      }}
                      loading={loading}
                    >
                      重新加载聊天对象
                    </Button>
                  )}
                </Space>

                {selectedChatTarget && (
                  <Alert
                    message={`已选择：${selectedChatTarget.name} (${dateRange[0]} - ${dateRange[1]})`}
                    type="info"
                    showIcon
                    style={{ padding: '8px 12px' }}
                  />
                )}
              </Space>

              <Divider />

              {messages.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <Space>
                    <Checkbox
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      checked={messages.every(msg => msg.selected)}
                      indeterminate={messages.some(msg => msg.selected) && !messages.every(msg => msg.selected)}
                    >
                      全选 ({messages.filter(msg => msg.selected).length}/{messages.length})
                    </Checkbox>
                  </Space>
                </div>
              )}

              <div style={{ height: '400px', overflow: 'auto' }}>
                {loadingMessages ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: '16px', color: '#666' }}>加载消息中...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <Empty description="暂无消息数据" />
                ) : (
                  <List
                    dataSource={messages}
                    renderItem={(item) => (
                      <List.Item
                        style={{
                          padding: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          marginBottom: '8px',
                          background: item.selected ? 'rgba(123, 104, 238, 0.1)' : 'transparent'
                        }}
                      >
                        <div style={{ width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <Checkbox
                              checked={item.selected}
                              onChange={(e) => handleMessageSelect(item.uniqueId, e.target.checked)}
                              style={{ marginRight: '12px' }}
                            />
                            <Avatar
                              size="small"
                              icon={<UserOutlined />}
                              style={{ marginRight: '8px' }}
                            />
                            <div style={{ marginRight: '12px' }}>
                              <Text strong style={{ color: '#FFFFFF', display: 'block', fontSize: '14px' }}>
                                {item.senderName || item.sender || '未知'}
                              </Text>
                              <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                                ID: {item.sender || item.talker || 'unknown'}
                              </Text>
                            </div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {dayjs(item.timestamp).format('HH:mm:ss')}
                            </Text>
                            <Tag style={{ marginLeft: '8px' }}>
                              {getMessageTypeText(item.type)}
                            </Tag>
                          </div>
                          <Paragraph
                            ellipsis={{ rows: 2, expandable: true }}
                            style={{ color: '#CCCCCC', margin: 0, fontSize: '14px' }}
                          >
                            {item.content}
                          </Paragraph>
                        </div>
                      </List.Item>
                    )}
                  />
                )}
              </div>
            </Card>
          </Col>

          {/* 右侧：提示词和结果区 */}
          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {/* 自定义提示词 */}
              <Card
                title={
                  <Space>
                    <ThunderboltOutlined />
                    自定义提示词
                  </Space>
                }
              >
                <TextArea
                  placeholder="请输入您的自定义提示词，例如：请分析这些消息中的关键信息，并给出总结..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={6}
                  style={{ marginBottom: '16px' }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={generatePrompt}
                  loading={generating}
                  disabled={messages.filter(msg => msg.selected).length === 0 || !customPrompt.trim()}
                  block
                >
                  {generating ? '生成中...' : '生成AI响应'}
                </Button>
              </Card>

              {/* 生成结果 */}
              <Card
                title={
                  <Space>
                    <CheckCircleOutlined />
                    AI响应结果
                  </Space>
                }
                style={{ height: '400px' }}
              >
                <div style={{ height: '320px', overflow: 'auto' }}>
                  {generating ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                      <div style={{ marginTop: '16px', color: '#666' }}>AI正在思考中...</div>
                    </div>
                  ) : generatedResponse ? (
                    <div style={{ padding: '16px' }}>
                      <Paragraph
                        style={{
                          color: '#FFFFFF',
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap',
                          margin: 0
                        }}
                      >
                        {generatedResponse}
                      </Paragraph>
                    </div>
                  ) : (
                    <Empty description="暂无生成结果" />
                  )}
                </div>
              </Card>
            </Space>
          </Col>
        </Row>
      </Content>

      {/* 模态框 */}
      <SettingsModal
        visible={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        onSave={checkConfiguration}
      />
      <ContactModal
        visible={contactVisible}
        onCancel={() => setContactVisible(false)}
      />
      <LogViewer
        visible={logViewerVisible}
        onClose={() => setLogViewerVisible(false)}
      />
      <ChatSelector
        visible={chatSelectorVisible}
        onClose={() => setChatSelectorVisible(false)}
        onSelect={(chatTarget) => {
          setSelectedChatTarget(chatTarget);
          setChatSelectorVisible(false);
        }}
        chatTargets={chatTargets}
        loading={loading}
      />
    </Layout>
  );
};

export default CustomPrompt;
