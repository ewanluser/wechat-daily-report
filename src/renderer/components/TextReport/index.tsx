import React, { useState } from 'react';
import { Modal, Button, message, Typography } from 'antd';
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { configService } from '../../services/configService';
import './styles.css';

const { Text } = Typography;

interface TextReportModalProps {
  visible: boolean;
  onCancel: () => void;
  textReport: string;
  chatName: string;
  date: string;
}

export const TextReportModal: React.FC<TextReportModalProps> = ({
  visible,
  onCancel,
  textReport,
  chatName,
  date
}) => {
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopy = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(textReport);
      message.success('已复制到剪贴板');
    } catch (error) {
      message.error('复制失败');
    } finally {
      setCopying(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const result = await configService.showSaveDialog({
        title: '保存文本日报',
        defaultPath: `${chatName}-${date}-日报.md`,
        filters: [
          { name: 'Markdown Files', extensions: ['md'] },
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        // 在实际应用中，这里需要调用文件写入API
        // 目前只是模拟下载
        const blob = new Blob([textReport], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${chatName}-${date}-日报.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        message.success('文本日报已下载');
      }
    } catch (error) {
      message.error('下载失败');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal
      title={`${chatName} - ${date} 文本日报`}
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="copy" icon={<CopyOutlined />} loading={copying} onClick={handleCopy}>
          复制文本
        </Button>,
        <Button key="download" icon={<DownloadOutlined />} loading={downloading} onClick={handleDownload}>
          下载文件
        </Button>,
        <Button key="close" type="primary" onClick={onCancel}>
          关闭
        </Button>
      ]}
      className="text-report-modal"
    >
      <div className="text-report-content">
        <pre>{textReport}</pre>
      </div>
    </Modal>
  );
}; 