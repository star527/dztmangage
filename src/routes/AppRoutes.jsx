import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import MainLayout from '../components/Layout';
import ImageCategory from '../pages/ImageCategory';
import ImageManagement from '../pages/ImageManagement';
import RoleManagement from '../pages/RoleManagement';
import UserManagement from '../pages/UserManagement';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<MainLayout><ImageCategory /></MainLayout>}/>
        <Route index element={<MainLayout><ImageCategory /></MainLayout>} />
        <Route path="/dashboard/image-category" element={<MainLayout><ImageCategory /></MainLayout>} />
        <Route path="/dashboard/image-management" element={<MainLayout><ImageManagement /></MainLayout>} />
        <Route path="/dashboard/role-management" element={<MainLayout><RoleManagement /></MainLayout>} />
        <Route path="/dashboard/user-management" element={<MainLayout><UserManagement /></MainLayout>} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;