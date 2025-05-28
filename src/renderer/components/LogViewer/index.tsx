import React, { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Select,
  Input,
  Button,
  Space,
  Tag,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  message,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  SearchOutlined,
  ClearOutlined,
  DownloadOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  BugOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { logService, LogEntry } from '../../services/logService';

const { Option } = Select;
const { Text, Paragraph } = Typography;
const { Search } = Input;

interface LogViewerProps {
  visible: boolean;
  onClose: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ visible, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      loadLogs();
      // 添加监听器实时更新日志
      logService.addListener(handleLogsUpdate);
    }

    return () => {
      logService.removeListener(handleLogsUpdate);
    };
  }, [visible]);

  useEffect(() => {
    applyFilters();
  }, [logs, levelFilter, searchKeyword]);

  const loadLogs = () => {
    const allLogs = logService.getAllLogs();
    setLogs(allLogs);
  };

  const handleLogsUpdate = (updatedLogs: LogEntry[]) => {
    setLogs(updatedLogs);
  };

  const applyFilters = () => {
    let filtered = logs;

    // 按级别过滤
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    // 按关键词搜索
    if (searchKeyword.trim()) {
      filtered = logService.searchLogs(searchKeyword);
      if (levelFilter !== 'all') {
        filtered = filtered.filter(log => log.level === levelFilter);
      }
    }

    setFilteredLogs(filtered);
  };

  const handleClearLogs = () => {
    logService.clearLogs();
    message.success('日志已清空');
  };

  const handleExportLogs = () => {
    try {
      const logData = logService.exportLogs();
      const blob = new Blob([logData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wechat-daily-report-logs-${dayjs().format('YYYY-MM-DD-HH-mm-ss')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('日志导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'info':
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
      case 'warn':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
      case 'debug':
        return <BugOutlined style={{ color: '#722ed1' }} />;
      default:
        return <InfoCircleOutlined />;
    }
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'info':
        return 'blue';
      case 'warn':
        return 'orange';
      case 'error':
        return 'red';
      case 'debug':
        return 'purple';
      default:
        return 'default';
    }
  };

  const getLogStats = () => {
    const stats = {
      total: logs.length,
      info: logs.filter(log => log.level === 'info').length,
      warn: logs.filter(log => log.level === 'warn').length,
      error: logs.filter(log => log.level === 'error').length,
      debug: logs.filter(log => log.level === 'debug').length,
    };
    return stats;
  };

  const stats = getLogStats();

  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: string) => (
        <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>
          {dayjs(timestamp).format('MM-DD HH:mm:ss.SSS')}
        </Text>
      ),
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: LogEntry['level']) => (
        <Tag color={getLevelColor(level)} icon={getLevelIcon(level)}>
          {level.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: string) => (
        <Text style={{ fontSize: '12px' }}>{source || '-'}</Text>
      ),
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (message: string, record: LogEntry) => (
        <Tooltip title="点击查看详情">
          <Text
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setSelectedLog(record);
              setDetailVisible(true);
            }}
          >
            {message}
          </Text>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <Modal
        title="应用日志"
        open={visible}
        onCancel={onClose}
        width={1000}
        footer={null}
        style={{ top: 20 }}
        bodyStyle={{ height: '80vh', padding: 0 }}
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* 统计信息 */}
          <Card size="small" style={{ margin: 16, marginBottom: 8 }}>
            <Row gutter={16}>
              <Col span={4}>
                <Statistic title="总计" value={stats.total} />
              </Col>
              <Col span={4}>
                <Statistic 
                  title="信息" 
                  value={stats.info} 
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={4}>
                <Statistic 
                  title="警告" 
                  value={stats.warn}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col span={4}>
                <Statistic 
                  title="错误" 
                  value={stats.error}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Col>
              <Col span={4}>
                <Statistic 
                  title="调试" 
                  value={stats.debug}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col span={4}>
                <Statistic 
                  title="已过滤" 
                  value={filteredLogs.length}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
          </Card>

          {/* 过滤和操作栏 */}
          <Card size="small" style={{ margin: '0 16px 8px 16px' }}>
            <Row gutter={[16, 8]} align="middle">
              <Col span={6}>
                <Select
                  value={levelFilter}
                  onChange={setLevelFilter}
                  style={{ width: '100%' }}
                  placeholder="按级别过滤"
                >
                  <Option value="all">全部级别</Option>
                  <Option value="info">信息</Option>
                  <Option value="warn">警告</Option>
                  <Option value="error">错误</Option>
                  <Option value="debug">调试</Option>
                </Select>
              </Col>
              <Col span={10}>
                <Search
                  placeholder="搜索日志内容..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onSearch={applyFilters}
                  allowClear
                />
              </Col>
              <Col span={8}>
                <Space>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={loadLogs}
                  >
                    刷新
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleExportLogs}
                  >
                    导出
                  </Button>
                  <Popconfirm
                    title="确定要清空所有日志吗？"
                    onConfirm={handleClearLogs}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button
                      danger
                      icon={<ClearOutlined />}
                    >
                      清空
                    </Button>
                  </Popconfirm>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* 日志表格 */}
          <div style={{ flex: 1, margin: '0 16px 16px 16px' }}>
            <Table
              columns={columns}
              dataSource={filteredLogs}
              rowKey="id"
              size="small"
              scroll={{ y: 'calc(100vh - 350px)' }}
              pagination={{
                total: filteredLogs.length,
                pageSize: 50,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              }}
            />
          </div>
        </div>
      </Modal>

      {/* 日志详情弹窗 */}
      <Modal
        title="日志详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {selectedLog && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>时间: </Text>
                  <Text>{dayjs(selectedLog.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')}</Text>
                </Col>
                <Col span={6}>
                  <Text strong>级别: </Text>
                  <Tag color={getLevelColor(selectedLog.level)} icon={getLevelIcon(selectedLog.level)}>
                    {selectedLog.level.toUpperCase()}
                  </Tag>
                </Col>
                <Col span={6}>
                  <Text strong>来源: </Text>
                  <Text>{selectedLog.source || '-'}</Text>
                </Col>
              </Row>
            </Card>
            
            <Card title="消息内容" size="small" style={{ marginBottom: 16 }}>
              <Paragraph>
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-word',
                  background: '#1f1f1f',
                  color: '#ffffff',
                  padding: '12px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  border: '1px solid #434343',
                  maxHeight: '300px',
                  overflow: 'auto',
                  margin: 0
                }}>
                  {selectedLog.message}
                </pre>
              </Paragraph>
            </Card>

            {selectedLog.details && (
              <Card title="详细信息" size="small">
                <Paragraph>
                  <pre style={{ 
                    whiteSpace: 'pre-wrap', 
                    wordBreak: 'break-word',
                    background: '#1f1f1f',
                    color: '#ffffff',
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    border: '1px solid #434343',
                    maxHeight: '400px',
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </Paragraph>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}; 