import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from '../pages/Login';
import MainLayout from '../components/Layout';
import ImageCategory from '../pages/ImageCategory';
import ImageManagement from '../pages/ImageManagement';
import RoleManagement from '../pages/RoleManagement';
import UserManagement from '../pages/UserManagement';

// 简单的认证检查函数
const isAuthenticated = () => {
  // 检查本地存储中是否有用户信息
  return !!localStorage.getItem('user');
};

// 创建受保护的路由组件
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const timeoutRef = useRef(null);

  // 重置超时计时器
  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      // 清除用户信息
      localStorage.removeItem('user');
      // 跳转到登录页
      window.location.href = '/login';
    }, 5 * 60 * 1000); // 5分钟
  };

  useEffect(() => {
    if (isAuthenticated()) {
      // 添加事件监听器来重置超时
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => {
        document.addEventListener(event, resetTimeout);
      });

      // 初始设置超时
      resetTimeout();

      // 清理函数
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        events.forEach(event => {
          document.removeEventListener(event, resetTimeout);
        });
      };
    }
  }, [location]);

  return isAuthenticated() ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><MainLayout><ImageCategory /></MainLayout></ProtectedRoute>}/>
        <Route index element={<ProtectedRoute><MainLayout><ImageCategory /></MainLayout></ProtectedRoute>} />
        <Route path="/dashboard/image-category" element={<ProtectedRoute><MainLayout><ImageCategory /></MainLayout></ProtectedRoute>} />
        <Route path="/dashboard/image-management" element={<ProtectedRoute><MainLayout><ImageManagement /></MainLayout></ProtectedRoute>} />
        <Route path="/dashboard/role-management" element={<ProtectedRoute><MainLayout><RoleManagement /></MainLayout></ProtectedRoute>} />
        <Route path="/dashboard/user-management" element={<ProtectedRoute><MainLayout><UserManagement /></MainLayout></ProtectedRoute>} />
        <Route path="/database/*" element={<ProtectedRoute><Navigate to="/login" /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;