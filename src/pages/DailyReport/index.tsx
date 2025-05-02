import React, { useState } from 'react';
import { Layout, Select, DatePicker, Empty, ConfigProvider, theme } from 'antd';
import { DigestCard } from '../../components/DigestCard';
import { DailyDigest } from '../../types';
import { groupMessages } from '../../data/messages';
import dayjs from 'dayjs';
import './styles.css';

const { Header, Content } = Layout;
const { darkAlgorithm } = theme;

const DailyReport: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(dayjs());

  // 获取可用的群聊列表
  const chatGroups = Object.entries(groupMessages).map(([id, group]) => ({
    id,
    name: group.name
  }));

  // 获取可用的日期列表（从消息数据中提取）
  const availableDates = selectedGroup
    ? Object.keys(groupMessages[selectedGroup]?.messages || {})
    : [];

  const handleGroupChange = (groupId: string) => {
    setSelectedGroup(groupId);
    const group = groupMessages[groupId];
    if (group) {
      // 自动选择最新的可用日期
      const dates = Object.keys(group.messages);
      if (dates.length > 0) {
        const latestDate = dayjs(dates[dates.length - 1]);
        setSelectedDate(latestDate);
      }
    }
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // 获取当前选择的日报数据
  const getCurrentDigest = (): DailyDigest | null => {
    const dateStr = selectedDate.format('YYYY-MM-DD');
    const group = groupMessages[selectedGroup];
    return group?.messages[dateStr]?.digest || null;
  };

  const digest = getCurrentDigest();

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
      <Layout className="daily-report">
        <Header className="header">
          <div className="header-controls">
            <Select
              placeholder="选择群聊"
              style={{ width: 200 }}
              value={selectedGroup}
              onChange={handleGroupChange}
              options={chatGroups.map(group => ({
                value: group.id,
                label: group.name
              }))}
            />
            <DatePicker
              value={selectedDate}
              onChange={handleDateChange}
              style={{ marginLeft: 16 }}
              disabledDate={(current) => {
                if (!selectedGroup) return true;
                const dateStr = current.format('YYYY-MM-DD');
                return !groupMessages[selectedGroup]?.messages[dateStr];
              }}
            />
          </div>
        </Header>
        <Content className="content">
          {digest ? (
            <DigestCard
              digest={digest}
            />
          ) : (
            <div className="center-container">
              <Empty description={
                !selectedGroup 
                  ? "请选择群聊" 
                  : "所选日期没有可用的消息记录"
              } />
            </div>
          )}
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default DailyReport; 