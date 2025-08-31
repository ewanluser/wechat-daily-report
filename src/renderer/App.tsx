import React, { useState } from 'react';
import { ConfigProvider, theme, Tabs, Layout } from 'antd';
import { FileTextOutlined, RobotOutlined } from '@ant-design/icons';
import DailyReport from './pages/DailyReport';
import CustomPrompt from './pages/CustomPrompt';
// 导入日志服务以确保在应用启动时初始化
import './services/logService';

const { darkAlgorithm } = theme;
const { TabPane } = Tabs;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('daily-report');

  const tabItems = [
    {
      key: 'daily-report',
      label: (
        <span>
          <FileTextOutlined />
          生成日报
        </span>
      ),
      children: <DailyReport />
    },
    {
      key: 'custom-prompt',
      label: (
        <span>
          <RobotOutlined />
          自定义处理
        </span>
      ),
      children: <CustomPrompt />
    }
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: darkAlgorithm,
        token: {
          colorPrimary: '#7B68EE',
          colorBgBase: '#13101F',
          colorTextBase: '#FFFFFF',
          borderRadius: 8,
          colorBgContainer: '#1F1A42',
          colorBorder: 'rgba(255, 255, 255, 0.1)',
        }
      }}
    >
      <div style={{ minHeight: '100vh', background: '#13101F' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          size="large"
          style={{
            padding: '16px 24px 0',
            background: '#1F1A42',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          items={tabItems}
        />
      </div>
    </ConfigProvider>
  );
};

export default App; 