import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  DatePicker,
  Select,
  Button,
  message,
  Space,
  Alert,
  Progress,
  Typography,
  Card,
  Switch,
  Input,
  Divider,
  Spin,
} from 'antd';
import {
  TeamOutlined,
  ExportOutlined,
  CalendarOutlined,
  MessageOutlined,
  RobotOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrBefore);
import { ChatTarget, FeishuExportConfig } from '../../../shared/types';
import { chatlogService } from '../../services/chatlogService';
import { feishuService } from '../../services/feishuService';
import { configService } from '../../services/configService';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;
const { Option } = Select;

interface FeishuExportModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: (url: string) => void;
}

interface ExportProgress {
  stage: 'preparing' | 'fetching' | 'processing' | 'uploading' | 'transferring' | 'completed' | 'error';
  progress: number;
  message: string;
  currentMessageIndex?: number;
  totalMessages?: number;
  url?: string;
}

export const FeishuExportModal: React.FC<FeishuExportModalProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [chatTargets, setChatTargets] = useState<ChatTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingChatTargets, setLoadingChatTargets] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [isFeishuConfigured, setIsFeishuConfigured] = useState(false);

  useEffect(() => {
    if (visible) {
      loadChatTargets();
      checkFeishuConfiguration();
    }
  }, [visible]);

  const checkFeishuConfiguration = async () => {
    try {
      const feishuConfig = await configService.loadFeishuConfig();
      if (feishuConfig && feishuConfig.appId && feishuConfig.appSecret) {
        feishuService.configure(feishuConfig);
        const isConnected = await feishuService.testConnection();
        setIsFeishuConfigured(isConnected);
      } else {
        setIsFeishuConfigured(false);
      }
    } catch (error) {
      setIsFeishuConfigured(false);
    }
  };

  const loadChatTargets = async () => {
    setLoadingChatTargets(true);
    try {
      const targets = await chatlogService.getAllChatTargets();
      setChatTargets(targets);
    } catch (error) {
      message.error('获取聊天对象列表失败，请检查Chatlog服务是否正常运行');
      setChatTargets([]);
    } finally {
      setLoadingChatTargets(false);
    }
  };

  const handleExport = async (values: any) => {
    if (!isFeishuConfigured) {
      message.error('请先配置飞书应用信息');
      return;
    }

    const selectedChatTarget = chatTargets.find(target => target.id === values.chatTarget);
    if (!selectedChatTarget) {
      message.error('请选择要导出的聊天对象');
      return;
    }

    const [startDate, endDate] = values.dateRange;
    const exportConfig: FeishuExportConfig = {
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
      chatTarget: selectedChatTarget,
      enableAIClassification: values.enableAIClassification || false,
      tableName: values.tableName || `${selectedChatTarget.name}-聊天记录-${dayjs().format('YYYY-MM-DD')}`,
    };

    setExporting(true);
    setExportProgress({
      stage: 'preparing',
      progress: 0,
      message: '准备导出...',
    });

    try {
      // 1. 获取日期范围内的所有消息
      setExportProgress({
        stage: 'fetching',
        progress: 10,
        message: '正在获取聊天记录...',
      });

      const allMessages: any[] = [];
      let currentDate = dayjs(exportConfig.startDate);
      const end = dayjs(exportConfig.endDate);

      while (currentDate.isSameOrBefore(end)) {
        const dateStr = currentDate.format('YYYY-MM-DD');
        try {
          const messages = await chatlogService.getDailyMessages(exportConfig.chatTarget.id, dateStr);
          allMessages.push(...messages);
          console.log(`获取 ${dateStr} 的消息: ${messages.length} 条`);
        } catch (error) {
          console.warn(`获取 ${dateStr} 的消息失败:`, error);
        }
        currentDate = currentDate.add(1, 'day');
      }

      if (allMessages.length === 0) {
        message.warning('选定时间段内没有聊天记录');
        return;
      }

      setExportProgress({
        stage: 'processing',
        progress: 30,
        message: `开始处理 ${allMessages.length} 条消息...`,
        totalMessages: allMessages.length,
      });

      // 2. 导出到飞书
      setExportProgress({
        stage: 'uploading',
        progress: 70,
        message: '正在创建多维表格并上传数据...',
      });

      const result = await feishuService.exportChatMessages(
        allMessages,
        exportConfig.chatTarget.name || '未知聊天对象',
        exportConfig.tableName || '聊天记录',
        exportConfig.enableAIClassification
      );

      setExportProgress({
        stage: 'transferring',
        progress: 90,
        message: '正在将多维表格转移给应用owner...',
      });

      // 给transferring阶段一点时间显示
      await new Promise(resolve => setTimeout(resolve, 1000));

      setExportProgress({
        stage: 'completed',
        progress: 100,
        message: '导出完成！已自动转移给应用owner',
        url: result.url,
      });

      message.success('成功导出到飞书多维表格！');
      
      if (onSuccess) {
        onSuccess(result.url);
      }

      // 3秒后自动关闭
      setTimeout(() => {
        handleCancel();
      }, 3000);

    } catch (error) {
      setExportProgress({
        stage: 'error',
        progress: 0,
        message: `导出失败: ${error instanceof Error ? error.message : '未知错误'}`,
      });
    } finally {
      setExporting(false);
    }
  };

  const handleCancel = () => {
    if (!exporting) {
      form.resetFields();
      setExportProgress(null);
      onCancel();
    }
  };

  const getProgressColor = () => {
    switch (exportProgress?.stage) {
      case 'error': return '#ff4d4f';
      case 'completed': return '#52c41a';
      case 'transferring': return '#722ed1'; // 紫色表示转移阶段
      default: return '#1890ff';
    }
  };

  return (
    <Modal
      title={
        <Space>
          <TeamOutlined />
          <span>导出到飞书多维表格</span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={
        exporting ? (
          <Button onClick={handleCancel} disabled={exporting}>
            {exporting ? '导出中...' : '关闭'}
          </Button>
        ) : (
          [
            <Button key="cancel" onClick={handleCancel}>
              取消
            </Button>,
            <Button
              key="export"
              type="primary"
              icon={<ExportOutlined />}
              onClick={() => form.submit()}
              disabled={!isFeishuConfigured || loadingChatTargets}
            >
              开始导出
            </Button>,
          ]
        )
      }
      width={600}
      destroyOnClose
      maskClosable={!exporting}
      closable={!exporting}
    >
      {!isFeishuConfigured && (
        <Alert
          message="请先配置飞书应用"
          description="请在设置中配置飞书应用的 App ID 和 App Secret"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {exporting && exportProgress && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>导出进度</Text>
            <Progress
              percent={exportProgress.progress}
              status={exportProgress.stage === 'error' ? 'exception' : exportProgress.stage === 'completed' ? 'success' : 'active'}
              strokeColor={getProgressColor()}
            />
            <Text>{exportProgress.message}</Text>
            {exportProgress.currentMessageIndex && exportProgress.totalMessages && (
              <Text type="secondary">
                处理进度: {exportProgress.currentMessageIndex}/{exportProgress.totalMessages}
              </Text>
            )}
            {exportProgress.url && (
              <Space>
                <Text>表格地址:</Text>
                <Button
                  type="link"
                  icon={<LinkOutlined />}
                  onClick={() => window.open(exportProgress.url, '_blank')}
                >
                  打开飞书多维表格
                </Button>
              </Space>
            )}
          </Space>
        </Card>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleExport}
        disabled={exporting}
      >
        <Form.Item
          label={
            <Space>
              <CalendarOutlined />
              <span>时间范围</span>
            </Space>
          }
          name="dateRange"
          rules={[{ required: true, message: '请选择时间范围' }]}
        >
          <RangePicker
            style={{ width: '100%' }}
            placeholder={['开始日期', '结束日期']}
            disabledDate={(current) => current && current > dayjs().endOf('day')}
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <MessageOutlined />
              <span>聊天对象</span>
            </Space>
          }
          name="chatTarget"
          rules={[{ required: true, message: '请选择聊天对象' }]}
        >
          <Select
            placeholder="请选择要导出的聊天对象"
            loading={loadingChatTargets}
            showSearch
            filterOption={(input, option) => {
              const target = chatTargets.find(t => t.id === option?.value);
              if (!target) return false;
              
              const searchText = input.toLowerCase();
              const targetName = (target.name || '').toLowerCase();
              const targetType = target.type === 'group' ? '群聊' : '私聊';
              
              return targetName.includes(searchText) || 
                     targetType.includes(searchText) ||
                     (target.id || '').toLowerCase().includes(searchText);
            }}
            optionFilterProp="children"
          >
            {chatTargets.map((target) => (
              <Option key={target.id} value={target.id}>
                <Space>
                  <span>{target.type === 'group' ? '👥' : '👤'}</span>
                  <span>{target.name}</span>
                  {target.messageCount && (
                    <Text type="secondary">({target.messageCount} 条消息)</Text>
                  )}
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="表格名称"
          name="tableName"
          tooltip="不填写将自动生成表格名称"
        >
          <Input placeholder="自定义多维表格名称（可选）" />
        </Form.Item>

        <Divider />

        <Form.Item
          label={
            <Space>
              <RobotOutlined />
              <span>AI智能分析</span>
            </Space>
          }
          name="enableAIClassification"
          valuePropName="checked"
          tooltip="开启后将使用AI对每条消息进行智能分类和摘要，但会增加导出时间"
        >
          <Switch />
        </Form.Item>

        <Alert
          message="导出说明"
          description={
            <div>
              <p>• 系统将为每条消息创建一行记录，包含消息内容、时间、发送人等信息</p>
              <p>• 开启AI分析后，将对每条消息进行智能分类和重要性评估</p>
              <p>• 消息过长时会自动生成摘要</p>
              <p>• 导出的表格将在您的飞书空间中创建</p>
              <p>• <strong>导出完成后，系统会自动将多维表格转移给应用owner，无需手动操作</strong></p>
              <p>• 导出时间取决于消息数量和是否开启AI分析</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Form>
    </Modal>
  );
}; 