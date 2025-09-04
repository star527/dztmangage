import { envConfig } from '../utils/envConfig.js';

// 获取完整的API基础URL
const getApiBaseUrl = () => {
  const baseUrl = envConfig.API_BASE_URL;
  // 如果是相对路径，确保以/开头
  if (baseUrl && baseUrl.startsWith('/')) {
    return baseUrl;
  }
  // 如果是完整URL，直接返回
  if (baseUrl && (baseUrl.startsWith('http://') || baseUrl.startsWith('https://'))) {
    return baseUrl;
  }
  // 默认返回/api
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

export const fetchCategories = async () => {
  const response = await fetch(`${API_BASE_URL}/categories`);
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
};

export const createCategory = async (category) => {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(category),
  });
  if (!response.ok) {
    throw new Error('Failed to create category');
  }
  return response.json();
};

export const updateCategory = async (id, category) => {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(category),
  });
  if (!response.ok) {
    throw new Error('Failed to update category');
  }
  return response.json();
};

export const deleteCategory = async (id) => {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete category');
  }
  return response.json();
};

export const login = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  
  const data = await response.json();
  
  if (!response.ok || !data.success) {
    throw new Error(data.message || '登录失败');
  }
  
  return data;
};

export const fetchImages = async (params = {}) => {
  // 构建基础URL
  let url = `${API_BASE_URL}/images`;
  
  // 构建查询参数
  const queryParams = [];
  Object.keys(params).forEach(key => {
    if (params[key]) {
      queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
    }
  });
  
  // 如果有查询参数，添加到URL末尾
  if (queryParams.length > 0) {
    url += '?' + queryParams.join('&');
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch images');
  }
  return response.json();
};

export const createImage = async (imageData) => {
  const response = await fetch(`${API_BASE_URL}/images`, {
    method: 'POST',
    body: imageData, // FormData will automatically set the correct Content-Type header
  });
  if (!response.ok) {
    throw new Error('Failed to create image');
  }
  return response.json();
};

export const updateImage = async (id, image) => {
  const response = await fetch(`${API_BASE_URL}/images/${id}`, {
    method: 'PUT',
    body: image, // Let the browser set the correct Content-Type header for FormData
  });
  if (!response.ok) {
    throw new Error('Failed to update image');
  }
  return response.json();
};

export const deleteImage = async (id) => {
  const response = await fetch(`${API_BASE_URL}/images/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete image');
  }
  return response.json();
};

export const fetchRoles = async () => {
  const response = await fetch(`${API_BASE_URL}/roles`);
  if (!response.ok) {
    throw new Error('Failed to fetch roles');
  }
  return response.json();
};

export const createRole = async (role) => {
  const response = await fetch(`${API_BASE_URL}/roles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(role),
  });
  if (!response.ok) {
    throw new Error('Failed to create role');
  }
  return response.json();
};

export const updateRole = async (id, role) => {
  const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(role),
  });
  if (!response.ok) {
    throw new Error('Failed to update role');
  }
  return response.json();
};

export const deleteRole = async (id) => {
  const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete role');
  }
  return response.json();
};

export const fetchUsers = async (params = {}) => {
  // 构建基础URL
  let url = `${API_BASE_URL}/users`;
  
  // 构建查询参数
  const queryParams = [];
  Object.keys(params).forEach(key => {
    if (params[key]) {
      queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
    }
  });
  
  // 如果有查询参数，添加到URL末尾
  if (queryParams.length > 0) {
    url += '?' + queryParams.join('&');
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
};

export const createUser = async (user) => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });
  if (!response.ok) {
    throw new Error('Failed to create user');
  }
  return response.json();
};

export const updateUser = async (id, user) => {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update user');
  }
  return response.json();
};

export const deleteUser = async (id) => {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete user');
  }
  return response.json();
};

export const resetUserPassword = async (id) => {
  const response = await fetch(`${API_BASE_URL}/users/${id}/reset-password`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to reset user password');
  }
  return response.json();
};