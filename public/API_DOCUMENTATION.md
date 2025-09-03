# 东真图管理系统API接口文档

## 概述
本文档详细描述了大众密码管理后台系统的API接口，包括图片分类、图片、用户角色和用户相关的所有操作接口。

## 基础URL
所有API接口的基础URL为：`http://localhost:3000/api`

## 认证
除登录接口外，所有接口都需要用户登录后才能访问。

## 时间格式
所有时间字段均使用ISO 8601格式：`YYYY-MM-DD HH:MM:SS`

## 接口详情

## 图片分类接口

### 1. 获取所有图片分类
- **URL**: `GET /api/categories`
- **方法**: `GET`
- **描述**: 获取所有图片分类列表
- **权限**: 需要登录
- **响应**: 
  ```json
  [
    {
      "id": 1,
      "name": "分类名称",
      "description": "分类描述",
      "created_at": "2023-01-01 12:00:00",
      "updated_at": "2023-01-01 12:00:00"
    }
  ]
  ```

### 2. 创建图片分类
- **URL**: `POST /api/categories`
- **方法**: `POST`
- **描述**: 创建新的图片分类
- **权限**: 需要登录
- **请求体**: 
  ```json
  {
    "name": "分类名称",
    "description": "分类描述"
  }
  ```
- **响应**: 
  ```json
  {
    "id": 1,
    "name": "分类名称",
    "description": "分类描述",
    "created_at": "2023-01-01 12:00:00",
    "updated_at": "2023-01-01 12:00:00"
  }
  ```

### 3. 更新图片分类
- **URL**: `PUT /api/categories/:id`
- **方法**: `PUT`
- **描述**: 更新指定ID的图片分类
- **权限**: 需要登录
- **请求体**: 
  ```json
  {
    "name": "新的分类名称",
    "description": "新的分类描述"
  }
  ```
- **响应**: 
  ```json
  {
    "id": 1,
    "name": "新的分类名称",
    "description": "新的分类描述",
    "created_at": "2023-01-01 12:00:00",
    "updated_at": "2023-01-01 13:00:00"
  }
  ```

### 4. 删除图片分类
- **URL**: `DELETE /api/categories/:id`
- **方法**: `DELETE`
- **描述**: 删除指定ID的图片分类
- **权限**: 需要登录
- **响应**: 
  ```json
  {
    "message": "分类删除成功"
  }
  ```

## 图片接口

### 1. 获取所有图片
- **URL**: `GET /api/images`
- **方法**: `GET`
- **描述**: 获取所有图片列表
- **权限**: 需要登录
- **查询参数**:
  - `category_id`: 根据分类ID筛选
  - `name`: 根据图片名称模糊搜索
- **响应**: 
  ```json
  [
    {
      "id": 1,
      "category_id": 1,
      "name": "图片名称",
      "description": "图片描述",
      "image_path": "/uploads/image-1234567890.webp",
      "created_at": "2023-01-01 12:00:00",
      "updated_at": "2023-01-01 12:00:00"
    }
  ]
  ```

### 2. 获取单张图片
- **URL**: `GET /api/images/:id`
- **方法**: `GET`
- **描述**: 获取指定ID的图片信息
- **权限**: 需要登录
- **响应**: 
  ```json
  {
    "id": 1,
    "category_id": 1,
    "name": "图片名称",
    "description": "图片描述",
    "image_path": "/uploads/image-1234567890.webp",
    "created_at": "2023-01-01 12:00:00",
    "updated_at": "2023-01-01 12:00:00"
  }
  ```

### 3. 上传图片
- **URL**: `POST /api/images`
- **方法**: `POST`
- **描述**: 上传新图片
- **权限**: 需要登录
- **请求体** (multipart/form-data):
  - `image`: 图片文件
  - `category_id`: 分类ID
  - `name`: 图片名称
  - `description`: 图片描述
- **响应**: 
  ```json
  {
    "id": 1,
    "category_id": 1,
    "name": "图片名称",
    "description": "图片描述",
    "image_path": "/uploads/image-1234567890.webp",
    "created_at": "2023-01-01 12:00:00",
    "updated_at": "2023-01-01 12:00:00"
  }
  ```

### 4. 更新图片
- **URL**: `PUT /api/images/:id`
- **方法**: `PUT`
- **描述**: 更新指定ID的图片信息
- **权限**: 需要登录
- **请求体** (multipart/form-data):
  - `image`: 新的图片文件（可选）
  - `category_id`: 分类ID
  - `name`: 图片名称
  - `description`: 图片描述
- **响应**: 
  ```json
  {
    "id": 1,
    "category_id": 1,
    "name": "新的图片名称",
    "description": "新的图片描述",
    "image_path": "/uploads/image-1234567890.webp",
    "created_at": "2023-01-01 12:00:00",
    "updated_at": "2023-01-01 13:00:00"
  }
  ```

### 5. 删除图片
- **URL**: `DELETE /api/images/:id`
- **方法**: `DELETE`
- **描述**: 删除指定ID的图片
- **权限**: 需要登录
- **响应**: 
  ```json
  {
    "message": "图片删除成功"
  }
  ```

## 用户角色接口

### 1. 获取所有角色
- **URL**: `GET /api/roles`
- **方法**: `GET`
- **描述**: 获取所有用户角色列表
- **权限**: 需要登录
- **响应**: 
  ```json
  [
    {
      "id": 1,
      "name": "管理员",
      "description": "系统管理员",
      "created_at": "2023-01-01 12:00:00",
      "updated_at": "2023-01-01 12:00:00"
    }
  ]
  ```

### 2. 创建角色
- **URL**: `POST /api/roles`
- **方法**: `POST`
- **描述**: 创建新的用户角色
- **权限**: 需要登录
- **请求体**: 
  ```json
  {
    "name": "角色名称",
    "description": "角色描述"
  }
  ```
- **响应**: 
  ```json
  {
    "id": 1,
    "name": "角色名称",
    "description": "角色描述",
    "created_at": "2023-01-01 12:00:00",
    "updated_at": "2023-01-01 12:00:00"
  }
  ```

### 3. 更新角色
- **URL**: `PUT /api/roles/:id`
- **方法**: `PUT`
- **描述**: 更新指定ID的用户角色
- **权限**: 需要登录
- **请求体**: 
  ```json
  {
    "name": "新的角色名称",
    "description": "新的角色描述"
  }
  ```
- **响应**: 
  ```json
  {
    "id": 1,
    "name": "新的角色名称",
    "description": "新的角色描述",
    "created_at": "2023-01-01 12:00:00",
    "updated_at": "2023-01-01 13:00:00"
  }
  ```

### 4. 删除角色
- **URL**: `DELETE /api/roles/:id`
- **方法**: `DELETE`
- **描述**: 删除指定ID的用户角色
- **权限**: 需要登录
- **响应**: 
  ```json
  {
    "message": "角色删除成功"
  }
  ```

## 用户接口

### 1. 获取所有用户
- **URL**: `GET /api/users`
- **方法**: `GET`
- **描述**: 获取所有用户列表
- **权限**: 需要登录
- **查询参数**:
  - `role_id`: 根据角色ID筛选
  - `username`: 根据用户名模糊搜索
- **响应**: 
  ```json
  [
    {
      "id": 1,
      "role_id": 1,
      "username": "admin",
      "created_at": "2023-01-01 12:00:00",
      "updated_at": "2023-01-01 12:00:00"
    }
  ]
  ```

### 2. 用户登录
- **URL**: `POST /api/login`
- **方法**: `POST`
- **描述**: 用户登录验证
- **权限**: 无需登录
- **请求体**: 
  ```json
  {
    "username": "用户名",
    "password": "密码"
  }
  ```
- **响应** (成功):
  ```json
  {
    "success": true,
    "message": "登录成功",
    "user": {
      "id": 1,
      "username": "admin",
      "role_id": 1
    }
  }
  ```
- **响应** (失败):
  ```json
  {
    "success": false,
    "message": "用户名或密码错误"
  }
  ```

### 3. 创建用户
- **URL**: `POST /api/users`
- **方法**: `POST`
- **描述**: 创建新用户
- **权限**: 需要登录
- **请求体**: 
  ```json
  {
    "role_id": "角色ID",
    "username": "用户名",
    "password": "密码"
  }
  ```
- **响应**: 
  ```json
  {
    "id": 1,
    "role_id": 1,
    "username": "用户名",
    "created_at": "2023-01-01 12:00:00",
    "updated_at": "2023-01-01 12:00:00"
  }
  ```

### 4. 更新用户
- **URL**: `PUT /api/users/:id`
- **方法**: `PUT`
- **描述**: 更新指定ID的用户信息
- **权限**: 需要登录
- **请求体** (更新基本信息): 
  ```json
  {
    "role_id": "新的角色ID",
    "username": "新的用户名"
  }
  ```
  或者更新密码：
  ```json
  {
    "old_password": "旧密码",
    "new_password": "新密码"
  }
  ```
- **响应**: 
  ```json
  {
    "id": 1,
    "role_id": 1,
    "username": "新的用户名",
    "created_at": "2023-01-01 12:00:00",
    "updated_at": "2023-01-01 13:00:00"
  }
  ```

### 5. 重置用户密码
- **URL**: `POST /api/users/:id/reset-password`
- **方法**: `POST`
- **描述**: 重置指定ID用户的密码为默认密码
- **权限**: 需要登录
- **响应**: 
  ```json
  {
    "success": true,
    "message": "密码重置成功"
  }
  ```

### 6. 删除用户
- **URL**: `DELETE /api/users/:id`
- **方法**: `DELETE`
- **描述**: 删除指定ID的用户
- **权限**: 需要登录
- **响应**: 
  ```json
  {
    "message": "用户删除成功"
  }
  ```

## 错误响应格式
所有错误响应都遵循以下格式：
```json
{
  "error": "错误信息"
}
```
或
```json
{
  "success": false,
  "message": "错误信息"
}
```

## 注意事项
1. 所有更新操作都会自动更新`updated_at`字段
2. 删除图片时，系统会同时删除数据库记录和上传目录中的文件
3. 用户密码在数据库中以哈希形式存储
4. 创建用户时，密码会自动进行哈希处理

## 小程序公共访问接口

为支持小程序调用图片分类和图片数据，系统提供了一组无需登录即可访问的公共API接口。这些接口仅提供只读功能，确保数据安全性。

### 1. 获取所有图片分类（公共访问）
- **URL**: `GET /public/api/categories`
- **方法**: `GET`
- **描述**: 获取所有图片分类列表，无需登录认证
- **权限**: 无需登录
- **响应**: 
  ```json
  [
    {
      "id": 1,
      "name": "分类名称",
      "description": "分类描述",
      "created_at": "2023-01-01 12:00:00",
      "updated_at": "2023-01-01 12:00:00"
    }
  ]
  ```

### 2. 获取图片列表（公共访问）
- **URL**: `GET /public/api/images`
- **方法**: `GET`
- **描述**: 获取图片列表，无需登录认证
- **权限**: 无需登录
- **查询参数**:
  - `category_id`: 根据分类ID筛选
  - `name`: 根据图片名称模糊搜索
- **响应**: 
  ```json
  [
    {
      "id": 1,
      "category_id": 1,
      "name": "图片名称",
      "description": "图片描述",
      "image_path": "/uploads/image-1234567890.webp",
      "created_at": "2023-01-01 12:00:00",
      "updated_at": "2023-01-01 12:00:00"
    }
  ]
  ```

### 3. 获取单张图片（公共访问）
- **URL**: `GET /public/api/images/:id`
- **方法**: `GET`
- **描述**: 获取指定ID的图片信息，无需登录认证
- **权限**: 无需登录
- **响应**: 
  ```json
  {
    "id": 1,
    "category_id": 1,
    "name": "图片名称",
    "description": "图片描述",
    "image_path": "/uploads/image-1234567890.webp",
    "created_at": "2023-01-01 12:00:00",
    "updated_at": "2023-01-01 12:00:00"
  }
  ```

## 注意事项

1. 公共API接口仅提供数据读取功能，不支持创建、更新、删除操作
2. 为保证系统安全，公共API接口有访问频率限制
3. 图片文件访问路径为相对路径，小程序端需拼接完整域名访问
4. 在生产环境中，请确保使用HTTPS协议访问API，保障数据传输安全