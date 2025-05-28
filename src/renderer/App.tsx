import React from 'react';
import { ConfigProvider, theme } from 'antd';
import DailyReport from './pages/DailyReport';
// 导入日志服务以确保在应用启动时初始化
import './services/logService';

const { darkAlgorithm } = theme;

const App: React.FC = () => {
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
      <DailyReport />
    </ConfigProvider>
  );
};

export default App; 