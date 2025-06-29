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
  ExclamationCircleOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { AIConfig, ChatlogConfig, FeishuConfig } from '../../../shared/types';
import { configService } from '../../services/configService';
import { aiService } from '../../services/aiService';
import { chatlogService } from '../../services/chatlogService';
import { feishuService } from '../../services/feishuService';

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
  const [feishuForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testingFeishuConnection, setTestingFeishuConnection] = useState(false);
  const [chatlogStatus, setChatlogStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');
  const [feishuStatus, setFeishuStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');

  useEffect(() => {
    if (visible) {
      loadConfigs();
      checkChatlogStatus();
      checkFeishuStatus();
    }
  }, [visible]);

  const loadConfigs = async () => {
    try {
      const aiConfig = await configService.loadAIConfig();
      const chatlogConfig = await configService.loadChatlogConfig();
      const feishuConfig = await configService.loadFeishuConfig();
      
      if (aiConfig) {
        aiForm.setFieldsValue(aiConfig);
      }
      
      if (chatlogConfig) {
        chatlogForm.setFieldsValue(chatlogConfig);
      }
      
      if (feishuConfig) {
        feishuForm.setFieldsValue(feishuConfig);
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

  const checkFeishuStatus = async () => {
    try {
      const feishuConfig = await configService.loadFeishuConfig();
      if (feishuConfig && feishuConfig.appId && feishuConfig.appSecret) {
        feishuService.configure(feishuConfig);
        const isConnected = await feishuService.testConnection();
        setFeishuStatus(isConnected ? 'connected' : 'disconnected');
      } else {
        setFeishuStatus('disconnected');
      }
    } catch (error) {
      setFeishuStatus('disconnected');
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

  const handleFeishuConfigSave = async (values: any) => {
    setLoading(true);
    try {
      const config: FeishuConfig = {
        appId: values.appId,
        appSecret: values.appSecret,
        isConnected: false
      };
      
      // 测试连接
      feishuService.configure(config);
      const isConnected = await feishuService.testConnection();
      
      config.isConnected = isConnected;
      
      // 保存配置
      await configService.saveFeishuConfig(config);
      setFeishuStatus(isConnected ? 'connected' : 'disconnected');
      
      if (isConnected) {
        message.success('飞书配置保存成功');
      } else {
        message.warning('飞书配置已保存，但连接测试失败，请检查App ID和App Secret');
      }
    } catch (error) {
      setFeishuStatus('disconnected');
      message.error(`飞书配置失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const testFeishuConnection = async () => {
    const values = feishuForm.getFieldsValue();
    if (!values.appId || !values.appSecret) {
      message.warning('请先输入App ID和App Secret');
      return;
    }

    setTestingFeishuConnection(true);
    try {
      const config: FeishuConfig = {
        appId: values.appId,
        appSecret: values.appSecret,
        isConnected: false
      };
      
      feishuService.configure(config);
      const isConnected = await feishuService.testConnection();
      setFeishuStatus(isConnected ? 'connected' : 'disconnected');
      
      if (isConnected) {
        message.success('飞书连接测试成功');
      } else {
        message.error('飞书连接测试失败，请检查App ID和App Secret');
      }
    } catch (error) {
      setFeishuStatus('disconnected');
      message.error(`飞书连接测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setTestingFeishuConnection(false);
    }
  };

  const handleSave = async () => {
    try {
      const aiValues = await aiForm.validateFields();
      const chatlogValues = await chatlogForm.validateFields();
      
      // 飞书配置是可选的，所以即使验证失败也要继续
      let feishuValues = null;
      try {
        feishuValues = await feishuForm.validateFields();
      } catch (error) {
        // 飞书配置验证失败，但不阻止保存其他配置
        console.log('飞书配置验证失败，跳过保存:', error);
      }
      
      await handleAIConfigSave(aiValues);
      await handleChatlogConfigSave(chatlogValues);
      
      if (feishuValues) {
        await handleFeishuConfigSave(feishuValues);
      }
      
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
                initialValue="openai/gpt-4o-mini"
              >
                <Input placeholder="例如: openai/gpt-4o-mini" />
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

        <TabPane
          tab={
            <Space>
              <TeamOutlined />
              <span>飞书集成</span>
              {feishuStatus === 'connected' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
              {feishuStatus === 'disconnected' && <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            </Space>
          }
          key="feishu"
        >
          <Card size="small">
            <Form
              form={feishuForm}
              layout="vertical"
              onFinish={handleFeishuConfigSave}
            >
              <Form.Item
                label="App ID"
                name="appId"
                rules={[{ required: true, message: '请输入飞书应用的App ID' }]}
              >
                <Input 
                  placeholder="请输入飞书应用的App ID" 
                  autoComplete="off"
                />
              </Form.Item>

              <Form.Item
                label="App Secret"
                name="appSecret"
                rules={[{ required: true, message: '请输入飞书应用的App Secret' }]}
              >
                <Input.Password 
                  placeholder="请输入飞书应用的App Secret"
                  autoComplete="off"
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button 
                    onClick={testFeishuConnection}
                    loading={testingFeishuConnection}
                  >
                    测试连接
                  </Button>
                  <Text type={feishuStatus === 'connected' ? 'success' : 'danger'}>
                    {feishuStatus === 'connected' && '✓ 已连接'}
                    {feishuStatus === 'disconnected' && '✗ 未连接'}
                    {feishuStatus === 'unknown' && '状态未知'}
                  </Text>
                </Space>
              </Form.Item>

              <Alert
                message="配置说明"
                description={
                  <div>
                    <p><strong>1. 创建飞书应用：</strong></p>
                    <p>访问 <a href="https://open.feishu.cn/app" target="_blank" rel="noopener noreferrer">飞书开放平台</a> 创建企业自建应用</p>
                    <p><strong>2. 获取凭证：</strong></p>
                    <p>在应用管理页面的「凭证与基础信息」中获取 App ID 和 App Secret</p>
                    <p><strong>3. 权限配置：</strong></p>
                    <p>需要开通「多维表格」相关权限，包括创建、编辑多维表格的权限</p>
                    <p><strong>4. 注意事项：</strong></p>
                    <p>• 请妥善保管您的 App Secret</p>
                    <p>• 导出功能将创建新的多维表格并写入数据</p>
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