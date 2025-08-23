import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, message } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, UploadOutlined, UserOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';

const { Header, Sider, Content } = Layout;

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };
  
  const handleLogout = () => {
    message.success('退出登录成功');
    // 清除本地存储的用户信息
    localStorage.removeItem('user');
    // 跳转到登录页面
    navigate('/login');
  };
  
  const menuItems = [
    {
      key: 'logout',
      label: '退出登录',
      onClick: handleLogout
    }
  ];
  
  const handleMenuClick = ({ key }) => {
    switch (key) {
      case '1':
        navigate('/dashboard/image-category');
        break;
      case '2':
        navigate('/dashboard/image-management');
        break;
      case '3':
        navigate('/dashboard/role-management');
        break;
      case '4':
        navigate('/dashboard/user-management');
        break;
      default:
        break;
    }
  };
  
  // 根据当前路径确定选中的菜单项
  const getSelectedKey = () => {
    if (location.pathname.includes('image-category')) return '1';
    if (location.pathname.includes('image-management')) return '2';
    if (location.pathname.includes('role-management')) return '3';
    if (location.pathname.includes('user-management')) return '4';
    return '1';
  };
  
  return (
    <Layout className="main-layout">
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="logo" />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          onClick={handleMenuClick}
          items={[
            {
              key: '1',
              icon: <UserOutlined />,
              label: '图片分类',
            },
            {
              key: '2',
              icon: <VideoCameraOutlined />,
              label: '图片管理',
            },
            {
              key: '3',
              icon: <UploadOutlined />,
              label: '角色管理',
            },
            {
              key: '4',
              icon: <UserOutlined />,
              label: '用户管理',
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header className="main-header">
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: 'trigger',
            onClick: toggleCollapsed,
          })}
          <div className="user-info">
            <Dropdown menu={{ items: menuItems }}>
              <div>
                <Avatar size="small" icon={<UserOutlined />} />
                <span className="username">
                  {JSON.parse(localStorage.getItem('user') || '{}').username || '管理员'}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          className="main-content"
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;