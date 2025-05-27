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
  Alert
} from 'antd';
import { 
  SettingOutlined, 
  ThunderboltOutlined,
  CalendarOutlined,
  TeamOutlined,
  MessageOutlined,
  ApiOutlined,
  WechatOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { SettingsModal } from '../../components/Settings';
import { DigestCard } from '../../components/DigestCard';
import { ContactModal } from '../../components/ContactModal';
import { chatlogService } from '../../services/chatlogService';
import { aiService } from '../../services/aiService';
import { configService } from '../../services/configService';
import { ChatlogChatroom, DailyDigest, GeneratedReport } from '../../../shared/types';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const DailyReport: React.FC = () => {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);
  const [chatrooms, setChatrooms] = useState<ChatlogChatroom[]>([]);
  const [selectedChatroom, setSelectedChatroom] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(false);
  const [loadingChatrooms, setLoadingChatrooms] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    checkConfiguration();
  }, []);

  // 当配置状态改变时重新加载群聊列表
  useEffect(() => {
    if (isConfigured) {
      loadChatrooms();
    }
  }, [isConfigured]);

  const checkConfiguration = async () => {
    console.log('🔧 开始检查配置...');
    try {
      const aiConfig = await configService.loadAIConfig();
      const chatlogConfig = await configService.loadChatlogConfig();
      
      console.log('📋 加载的配置:', { 
        aiConfig: aiConfig ? { ...aiConfig, apiKey: aiConfig.apiKey ? '***已设置***' : '未设置' } : null,
        chatlogConfig 
      });
      
      if (aiConfig && aiConfig.apiKey && chatlogConfig && chatlogConfig.baseUrl) {
        console.log('✅ 配置项完整，开始配置服务...');
        
        // 配置AI服务
        aiService.configure(aiConfig);
        console.log('🤖 AI服务配置完成');
        
        // 测试Chatlog连接
        console.log('🔗 开始配置Chatlog连接...');
        await chatlogService.configure(chatlogConfig.baseUrl);
        console.log('🔗 Chatlog服务配置完成，开始测试连接...');
        const testResult = await chatlogService.checkConnection();
        console.log('🔗 Chatlog连接测试结果:', testResult);
        
        if (testResult) {
          setIsConfigured(true);
          console.log('✅ 配置检查完全通过');
        } else {
          setIsConfigured(false);
          console.log('❌ Chatlog连接失败');
        }
      } else {
        setIsConfigured(false);
        console.log('❌ 配置不完整:', {
          hasAIConfig: !!aiConfig,
          hasAPIKey: !!(aiConfig && aiConfig.apiKey),
          hasChatlogConfig: !!chatlogConfig,
          hasBaseUrl: !!(chatlogConfig && chatlogConfig.baseUrl)
        });
      }
    } catch (error) {
      console.error('❌ 配置检查失败:', error);
      setIsConfigured(false);
    }
  };

  const loadChatrooms = async () => {
    // 只有配置完成后才加载群聊列表
    if (!isConfigured) {
      console.log('配置未完成，跳过加载群聊列表');
      return;
    }

    setLoadingChatrooms(true);
    try {
      const rooms = await chatlogService.getChatrooms();
      setChatrooms(rooms);
      console.log(`成功加载 ${rooms.length} 个群聊`);
    } catch (error) {
      console.error('获取群聊列表失败:', error);
      message.error('获取群聊列表失败，请检查Chatlog服务是否正常运行');
      setChatrooms([]);
    } finally {
      setLoadingChatrooms(false);
    }
  };

  const handleGenerateReport = async () => {
    console.log('🚀 点击生成日报按钮');
    console.log('📊 当前状态:', {
      selectedChatroom,
      selectedDate,
      isConfigured,
      chatroomsLength: chatrooms.length
    });

    if (!selectedChatroom) {
      console.log('❌ 未选择群聊');
      message.warning('请选择要分析的群聊');
      return;
    }

    if (!isConfigured) {
      console.log('❌ 配置未完成');
      message.warning('请先配置AI服务和Chatlog连接');
      setSettingsVisible(true);
      return;
    }

    console.log('✅ 开始生成日报流程');
    setLoading(true);
    try {
      console.log('📥 开始获取聊天记录...', { selectedChatroom, selectedDate });
      // 获取聊天记录
      const messages = await chatlogService.getDailyMessages(selectedChatroom, selectedDate);
      console.log('📥 获取到聊天记录:', messages.length, '条');
      
      if (messages.length === 0) {
        console.log('❌ 该日期没有聊天记录');
        message.warning('该日期没有聊天记录');
        return;
      }

      // 获取选中群聊的名称
      const chatroom = chatrooms.find(room => room.name === selectedChatroom);
      const chatName = chatroom?.nickname || chatroom?.nickName || selectedChatroom;
      console.log('🏷️ 群聊名称:', chatName);

      console.log('🤖 开始AI生成日报...');
      // 生成日报
      const report = await aiService.generateReport(messages, chatName, selectedDate);
      console.log('✅ 日报生成成功:', report);
      setGeneratedReport(report);
      
      message.success('日报生成成功！');
    } catch (error) {
      console.error('❌ 生成日报失败:', error);
      message.error(`生成日报失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
      console.log('🏁 生成日报流程结束');
    }
  };

  const handleSettingsSave = async () => {
    setSettingsVisible(false);
    
    // 添加小延迟确保配置已保存
    setTimeout(async () => {
      await checkConfiguration();
      // 重新加载群聊列表
      loadChatrooms();
      message.success('配置已更新');
    }, 200);
  };

  return (
    <Layout style={{ height: '100vh', background: '#13101F' }}>
      <Header style={{ 
        background: '#1F1A42', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px'
      }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          微信群聊日报生成器
        </Title>
        <Space>
          <Button 
            type="text" 
            icon={<WechatOutlined />} 
            onClick={() => setContactVisible(true)}
            style={{ color: '#fff' }}
          >
            联系作者
          </Button>
          <Button 
            type="text" 
            icon={<SettingOutlined />} 
            onClick={() => setSettingsVisible(true)}
            style={{ color: '#fff' }}
          >
            设置
          </Button>
        </Space>
      </Header>

      <Content style={{ background: '#13101F', padding: '24px', overflow: 'auto' }}>
        {!isConfigured && (
          <Alert
            message="配置提醒"
            description="请先配置AI服务和Chatlog连接，然后重新加载页面"
            type="warning"
            showIcon
            style={{ marginBottom: '24px' }}
            action={
              <Button size="small" onClick={() => setSettingsVisible(true)}>
                立即配置
              </Button>
            }
          />
        )}

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={8}>
            <Card 
              title={
                <Space>
                  <TeamOutlined />
                  <span>选择群聊</span>
                </Space>
              }
              style={{ background: '#1F1A42', border: '1px solid rgba(255, 255, 255, 0.1)' }}
              headStyle={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff' }}
              bodyStyle={{ background: '#1F1A42' }}
            >
              <Select
                placeholder="请选择群聊"
                value={selectedChatroom}
                onChange={setSelectedChatroom}
                style={{ width: '100%', marginBottom: '16px' }}
                loading={loadingChatrooms}
                notFoundContent={loadingChatrooms ? <Spin size="small" /> : '暂无群聊数据'}
                showSearch
                allowClear
                filterOption={(input, option) => {
                  if (!input) return true;
                  const label = String(option?.label || option?.children || '');
                  return label.toLowerCase().includes(input.toLowerCase());
                }}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              >
                {chatrooms.map(room => (
                  <Option key={room.name} value={room.name}>
                    {room.nickname || room.nickName || room.name}
                  </Option>
                ))}
              </Select>
              
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <MessageOutlined style={{ marginRight: '4px' }} />
                共 {chatrooms.length} 个群聊可选
              </Text>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <CalendarOutlined />
                  <span>选择日期</span>
                </Space>
              }
              style={{ background: '#1F1A42', border: '1px solid rgba(255, 255, 255, 0.1)' }}
              headStyle={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff' }}
              bodyStyle={{ background: '#1F1A42' }}
            >
              <DatePicker
                value={dayjs(selectedDate)}
                onChange={(date) => setSelectedDate(date?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'))}
                style={{ width: '100%', marginBottom: '16px' }}
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
              
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <CalendarOutlined style={{ marginRight: '4px' }} />
                选择要分析的日期
              </Text>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <ThunderboltOutlined />
                  <span>生成日报</span>
                </Space>
              }
              style={{ background: '#1F1A42', border: '1px solid rgba(255, 255, 255, 0.1)' }}
              headStyle={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff' }}
              bodyStyle={{ background: '#1F1A42' }}
            >
              <Button
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={handleGenerateReport}
                loading={loading}
                disabled={!selectedChatroom || !isConfigured}
                style={{ width: '100%', marginBottom: '16px' }}
              >
                {loading ? '生成中...' : '生成日报'}
              </Button>
              
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <ApiOutlined style={{ marginRight: '4px' }} />
                {isConfigured ? '配置正常' : '需要配置'}
              </Text>
            </Card>
          </Col>
        </Row>

        {/* 生成的日报展示 */}
        {generatedReport && (
          <div style={{ marginTop: '32px' }}>
            <DigestCard
              digest={generatedReport.digest}
              textReport={generatedReport.textReport}
              onDownload={() => {
                message.success('日报卡片已下载');
              }}
              onViewTextReport={() => {
                // 这里可以添加文本日报查看的统计
              }}
              onContactAuthor={() => {
                setContactVisible(true);
              }}
            />
          </div>
        )}

        {/* 空状态 */}
        {!generatedReport && !loading && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '300px',
            marginTop: '32px'
          }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Text type="secondary">
                  选择群聊和日期，点击"生成日报"开始分析
                </Text>
              }
            />
          </div>
        )}
      </Content>

      {/* 设置弹窗 */}
      <SettingsModal
        visible={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        onSave={handleSettingsSave}
      />

      {/* 联系作者弹窗 */}
      <ContactModal
        visible={contactVisible}
        onCancel={() => setContactVisible(false)}
      />
    </Layout>
  );
};

export default DailyReport; 