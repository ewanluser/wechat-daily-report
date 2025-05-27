import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Tabs, 
  Form, 
  Input, 
  Select, 
  Button, 
  message, 
  Space,
  Typography,
  Card,
  Alert
} from 'antd';
import { 
  SettingOutlined, 
  ApiOutlined, 
  CloudOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { AIConfig, ChatlogConfig } from '../../../shared/types';
import { configService } from '../../services/configService';
import { aiService } from '../../services/aiService';
import { chatlogService } from '../../services/chatlogService';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

interface SettingsModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onCancel,
  onSave
}) => {
  const [aiForm] = Form.useForm();
  const [chatlogForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [chatlogStatus, setChatlogStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');

  useEffect(() => {
    if (visible) {
      loadConfigs();
      checkChatlogStatus();
    }
  }, [visible]);

  const loadConfigs = async () => {
    try {
      const aiConfig = await configService.loadAIConfig();
      const chatlogConfig = await configService.loadChatlogConfig();
      
      if (aiConfig) {
        aiForm.setFieldsValue(aiConfig);
      }
      
      if (chatlogConfig) {
        chatlogForm.setFieldsValue(chatlogConfig);
      }
    } catch (error) {
      message.error('加载配置失败');
    }
  };

  const checkChatlogStatus = async () => {
    try {
      const isConnected = await chatlogService.checkConnection();
      setChatlogStatus(isConnected ? 'connected' : 'disconnected');
    } catch (error) {
      setChatlogStatus('disconnected');
    }
  };

  const handleAIConfigSave = async (values: AIConfig) => {
    setLoading(true);
    try {
      // 配置AI服务
      aiService.configure(values);
      
      // 保存配置
      await configService.saveAIConfig(values);
      
      message.success('AI配置保存成功');
    } catch (error) {
      message.error('AI配置保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChatlogConfigSave = async (values: any) => {
    setLoading(true);
    try {
      // 测试连接
      await chatlogService.configure(values.baseUrl);
      
      const config: ChatlogConfig = {
        baseUrl: values.baseUrl,
        isConnected: true
      };
      
      // 保存配置
      await configService.saveChatlogConfig(config);
      setChatlogStatus('connected');
      
      message.success('Chatlog配置保存成功');
    } catch (error) {
      setChatlogStatus('disconnected');
      message.error(`Chatlog连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const testChatlogConnection = async () => {
    const values = chatlogForm.getFieldsValue();
    if (!values.baseUrl) {
      message.warning('请先输入Chatlog服务地址');
      return;
    }

    setTestingConnection(true);
    try {
      await chatlogService.configure(values.baseUrl);
      setChatlogStatus('connected');
      message.success('连接测试成功');
    } catch (error) {
      setChatlogStatus('disconnected');
      message.error(`连接测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = async () => {
    try {
      const aiValues = await aiForm.validateFields();
      const chatlogValues = await chatlogForm.validateFields();
      
      await handleAIConfigSave(aiValues);
      await handleChatlogConfigSave(chatlogValues);
      
      onSave();
    } catch (error) {
      // 表单验证失败
    }
  };

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          <span>设置</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="save" type="primary" loading={loading} onClick={handleSave}>
          保存
        </Button>
      ]}
      width={600}
      destroyOnClose
    >
      <Tabs defaultActiveKey="ai" size="small">
        <TabPane
          tab={
            <Space>
              <CloudOutlined />
              <span>AI配置</span>
            </Space>
          }
          key="ai"
        >
          <Card size="small">
            <Form
              form={aiForm}
              layout="vertical"
              onFinish={handleAIConfigSave}
            >
              <Form.Item
                label="服务提供商"
                name="provider"
                rules={[{ required: true, message: '请选择服务提供商' }]}
                initialValue="openrouter"
              >
                <Select>
                  <Select.Option value="openrouter">OpenRouter</Select.Option>
                  <Select.Option value="openai">OpenAI</Select.Option>
                  <Select.Option value="custom">自定义</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="API密钥"
                name="apiKey"
                rules={[{ required: true, message: '请输入API密钥' }]}
              >
                <Input.Password 
                  placeholder="请输入API密钥"
                  autoComplete="off"
                />
              </Form.Item>

              <Form.Item
                label="模型"
                name="model"
                rules={[{ required: true, message: '请输入模型名称' }]}
                initialValue="anthropic/claude-3.7-sonnet"
              >
                <Input placeholder="例如: anthropic/claude-3.7-sonnet, gpt-4o-mini" />
              </Form.Item>

              <Form.Item
                label="自定义API地址"
                name="baseUrl"
                tooltip="仅在选择自定义提供商时需要填写"
              >
                <Input placeholder="https://api.example.com/v1" />
              </Form.Item>

              <Alert
                message="提示"
                description="推荐使用OpenRouter，支持多种模型且价格较低。请妥善保管您的API密钥。"
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            </Form>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <Space>
              <ApiOutlined />
              <span>Chatlog连接</span>
              {chatlogStatus === 'connected' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
              {chatlogStatus === 'disconnected' && <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            </Space>
          }
          key="chatlog"
        >
          <Card size="small">
            <Form
              form={chatlogForm}
              layout="vertical"
              onFinish={handleChatlogConfigSave}
            >
              <Form.Item
                label="Chatlog服务地址"
                name="baseUrl"
                rules={[{ required: true, message: '请输入Chatlog服务地址' }]}
                initialValue="http://127.0.0.1:5030"
              >
                <Input 
                  placeholder="http://127.0.0.1:5030" 
                  addonBefore="服务地址"
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button 
                    onClick={testChatlogConnection}
                    loading={testingConnection}
                  >
                    测试连接
                  </Button>
                  <Text type={chatlogStatus === 'connected' ? 'success' : 'danger'}>
                    {chatlogStatus === 'connected' && '✓ 已连接'}
                    {chatlogStatus === 'disconnected' && '✗ 未连接'}
                    {chatlogStatus === 'unknown' && '状态未知'}
                  </Text>
                </Space>
              </Form.Item>

              <Alert
                message="使用说明"
                description={
                  <div>
                    <p>1. 请确保已启动Chatlog服务 (运行 `chatlog server`)</p>
                    <p>2. 默认服务地址为 http://127.0.0.1:5030</p>
                    <p>3. 如果无法连接，请检查Chatlog是否正常运行</p>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            </Form>
          </Card>
        </TabPane>
      </Tabs>
    </Modal>
  );
}; 