import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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