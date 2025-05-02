import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import DailyReport from './pages/DailyReport';
import './App.css';

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<DailyReport />} />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;
