import React, { useState, useEffect, useMemo } from 'react';
import { 
  Modal, 
  Input, 
  List, 
  Avatar, 
  Typography, 
  Space, 
  Tabs, 
  Empty,
  Button,
  Tag,
  Spin
} from 'antd';
import { 
  SearchOutlined, 
  TeamOutlined, 
  UserOutlined,
  ClockCircleOutlined,
  StarOutlined,
  StarFilled
} from '@ant-design/icons';
import { ChatTarget } from '../../../shared/types';
import './styles.css';

const { Text } = Typography;
const { TabPane } = Tabs;

interface ChatSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (target: ChatTarget) => void;
  chatTargets: ChatTarget[];
  loading: boolean;
  selectedId?: string;
}

const ChatSelector: React.FC<ChatSelectorProps> = ({
  visible,
  onClose,
  onSelect,
  chatTargets,
  loading,
  selectedId
}) => {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentChats, setRecentChats] = useState<string[]>([]);

  // 从本地存储加载收藏和最近使用
  useEffect(() => {
    const savedFavorites = localStorage.getItem('chat-favorites');
    const savedRecents = localStorage.getItem('chat-recents');
    
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    if (savedRecents) {
      setRecentChats(JSON.parse(savedRecents));
    }
  }, []);

  // 过滤和搜索逻辑
  const filteredTargets = useMemo(() => {
    let targets = chatTargets;

    // 按标签页过滤
    if (activeTab === 'groups') {
      targets = targets.filter(t => t.type === 'group');
    } else if (activeTab === 'private') {
      targets = targets.filter(t => t.type === 'private');
    } else if (activeTab === 'favorites') {
      targets = targets.filter(t => favorites.includes(t.id));
    } else if (activeTab === 'recent') {
      // 按最近使用排序
      targets = targets.filter(t => recentChats.includes(t.id))
        .sort((a, b) => recentChats.indexOf(a.id) - recentChats.indexOf(b.id));
    }

    // 搜索过滤
    if (searchText) {
      targets = targets.filter(t => 
        t.name.toLowerCase().includes(searchText.toLowerCase()) ||
        t.id.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return targets;
  }, [chatTargets, activeTab, searchText, favorites, recentChats]);

  // 分组统计
  const stats = useMemo(() => {
    const groups = chatTargets.filter(t => t.type === 'group').length;
    const privateChats = chatTargets.filter(t => t.type === 'private').length;
    const favs = favorites.length;
    const recent = recentChats.length;
    
    return { groups, privateChats, favs, recent };
  }, [chatTargets, favorites, recentChats]);

  // 选择处理
  const handleSelect = (target: ChatTarget) => {
    // 更新最近使用
    const newRecents = [target.id, ...recentChats.filter(id => id !== target.id)].slice(0, 20);
    setRecentChats(newRecents);
    localStorage.setItem('chat-recents', JSON.stringify(newRecents));
    
    onSelect(target);
    onClose();
  };

  // 收藏切换
  const toggleFavorite = (targetId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const newFavorites = favorites.includes(targetId)
      ? favorites.filter(id => id !== targetId)
      : [...favorites, targetId];
    
    setFavorites(newFavorites);
    localStorage.setItem('chat-favorites', JSON.stringify(newFavorites));
  };

  // 渲染列表项
  const renderItem = (target: ChatTarget) => {
    const isSelected = target.id === selectedId;
    const isFavorite = favorites.includes(target.id);
    
    return (
      <List.Item
        key={target.id}
        className={`chat-item ${isSelected ? 'selected' : ''}`}
        onClick={() => handleSelect(target)}
        actions={[
          <Button
            type="text"
            size="small"
            icon={isFavorite ? <StarFilled /> : <StarOutlined />}
            onClick={(e) => toggleFavorite(target.id, e)}
            className={isFavorite ? 'favorite-btn active' : 'favorite-btn'}
          />
        ]}
      >
        <List.Item.Meta
          avatar={
            <Avatar 
              icon={target.type === 'group' ? <TeamOutlined /> : <UserOutlined />}
              style={{ 
                backgroundColor: target.type === 'group' ? '#52c41a' : '#1890ff' 
              }}
            />
          }
          title={
            <Space>
              <Text strong={isSelected}>{target.name}</Text>
              {target.type === 'group' && <Tag color="green">群聊</Tag>}
              {target.type === 'private' && <Tag color="blue">私聊</Tag>}
              {isFavorite && <StarFilled style={{ color: '#faad14', fontSize: '12px' }} />}
            </Space>
          }
          description={
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {target.id}
            </Text>
          }
        />
      </List.Item>
    );
  };

  return (
    <Modal
      title="选择聊天对象"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      className="chat-selector-modal"
      style={{ top: 20 }}
    >
      <div className="chat-selector-content">
        {/* 搜索框 */}
        <div className="search-section">
          <Input
            placeholder="搜索群聊或联系人..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            size="large"
          />
        </div>

        {/* 标签页 */}
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className="chat-tabs"
        >
          <TabPane 
            tab={`全部 (${chatTargets.length})`} 
            key="all"
          />
          <TabPane 
            tab={
              <Space>
                <ClockCircleOutlined />
                最近 ({stats.recent})
              </Space>
            } 
            key="recent"
          />
          <TabPane 
            tab={
              <Space>
                <StarOutlined />
                收藏 ({stats.favs})
              </Space>
            } 
            key="favorites"
          />
          <TabPane 
            tab={
              <Space>
                <TeamOutlined />
                群聊 ({stats.groups})
              </Space>
            } 
            key="groups"
          />
          <TabPane 
            tab={
              <Space>
                <UserOutlined />
                私聊 ({stats.privateChats})
              </Space>
            } 
            key="private"
          />
        </Tabs>

        {/* 列表内容 */}
        <div className="chat-list-container">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
              <Text type="secondary">加载聊天对象...</Text>
            </div>
          ) : filteredTargets.length === 0 ? (
            <Empty 
              description={searchText ? '没有找到匹配的聊天对象' : '暂无数据'}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              dataSource={filteredTargets}
              renderItem={renderItem}
              className="chat-list"
              pagination={{
                pageSize: 50,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                pageSizeOptions: ['20', '50', '100', '200']
              }}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ChatSelector; 