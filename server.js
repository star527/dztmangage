import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { formatLocalTime } from './src/utils/timeUtils.js';

// 加载.env文件中的环境变量
import dotenv from 'dotenv';
dotenv.config();

// 环境配置
const isProduction = process.env.NODE_ENV === 'production';
const FRONTEND_URL = process.env.FRONTEND_URL || (isProduction ? 'https://www.dongzhentu.com' : 'http://localhost:5173');
const PORT = process.env.PORT || 3000;

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建数据库文件路径
const dataDir = path.resolve(__dirname, 'data');
// 确保 data 目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.resolve(dataDir, 'database.sqlite');

// 初始化数据库
const db = new Database(dbPath);
  
  // 创建 Express 应用
  const app = express();

// 基础中间件 - 必须在所有路由之前
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// 创建表结构
// 图片分类表
db.exec(`
  CREATE TABLE IF NOT EXISTS image_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 用户表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    nickname TEXT,
    role_id INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 如果users表中没有nickname列，添加它
try {
  db.exec('ALTER TABLE users ADD COLUMN nickname TEXT');
} catch (error) {
  // 如果列已经存在，忽略错误
  if (!error.message.includes('duplicate column name')) {
    console.error('Error adding nickname column:', error);
  }
}

// 如果users表中没有role_id列，添加它
try {
  db.exec('ALTER TABLE users ADD COLUMN role_id INTEGER DEFAULT 1');
} catch (error) {
  // 如果列已经存在，忽略错误
  if (!error.message.includes('duplicate column name')) {
    console.error('Error adding role_id column:', error);
  }
}

// 角色表
db.exec(`
  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 初始化数据
// 初始化角色数据
const checkExistingRoles = db.prepare('SELECT COUNT(*) AS count FROM roles').get();
if (checkExistingRoles.count === 0) {
  const insertDefaultRole = db.prepare(`
    INSERT INTO roles (name, description) VALUES (?, ?)
  `);
  insertDefaultRole.run('管理员', '系统管理员，拥有全部权限');
}

// 初始化用户数据 - 添加默认管理员
const checkExistingUsers = db.prepare('SELECT COUNT(*) AS count FROM users').get();
if (checkExistingUsers.count === 0) {
  // 注意：在生产环境中应该使用bcrypt加密密码，但为了简化示例，这里使用明文密码
  const insertDefaultUser = db.prepare(`
    INSERT INTO users (username, password, nickname, role_id) VALUES (?, ?, ?, ?)
  `);
  insertDefaultUser.run('admin', 'dzt123', '系统管理员', 1);
}

// 初始化分类数据
const checkExistingCategories = db.prepare('SELECT COUNT(*) AS count FROM image_categories').get();
if (checkExistingCategories.count === 0) {
  // 插入默认分类数据
  const insertDefaultCategories = db.prepare(`
    INSERT INTO image_categories (name, description) VALUES (?, ?)
  `);

  insertDefaultCategories.run('乾', '乾卦相关图片');
  insertDefaultCategories.run('坤', '坤卦相关图片');
  insertDefaultCategories.run('成人', '成人相关图片');
  insertDefaultCategories.run('儿童', '儿童相关图片');
  insertDefaultCategories.run('乾字', '乾字相关图片');
  insertDefaultCategories.run('坤字', '坤字相关图片');
}

// API 路由
// 健康检查路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 登录API
app.post('/api/login', (req, res) => {
  console.log('Login API called with:', req.body);
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }
  
  try {
    // 查询用户信息，包含密码（用于验证）
    const user = db.prepare('SELECT id, username, password, nickname, role_id FROM users WHERE username = ?').get(username);
    
    if (user) {
      // 验证密码
      const isPasswordValid = bcrypt.compareSync(password, user.password);
      
      if (isPasswordValid) {
        // 登录成功，返回用户信息（不包含密码）
        console.log('Login successful for user:', username);
        res.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            role_id: user.role_id
          },
          message: '登录成功'
        });
      } else {
        // 密码错误
        console.log('Login failed for user:', username, '- Invalid password');
        res.status(401).json({ success: false, message: '用户名或密码错误' });
      }
    } else {
      // 用户名不存在
      console.log('Login failed for user:', username, '- User not found');
      res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, message: '登录失败，请重试' });
  }
});

// 图片分类API路由
app.get('/api/categories', (req, res) => {
  console.log('API /api/categories called');
  try {
    const categories = db.prepare('SELECT * FROM image_categories').all();
    // 确保所有时间都以本地时间格式返回
    const formattedCategories = categories.map(category => ({
      ...category,
      created_at: formatLocalTime(category.created_at),
      updated_at: formatLocalTime(category.updated_at),
    }));
    console.log('Categories fetched:', formattedCategories);
    res.json(formattedCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', (req, res) => {
  console.log('Received request to create category:', req.body);
  const { name, description } = req.body;
  
  try {
    // 使用本地时间而不是UTC时间
    const localTime = formatLocalTime(new Date());
    const result = db.prepare('INSERT INTO image_categories (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)').run(name, description, localTime, localTime);
    const newCategory = db.prepare('SELECT * FROM image_categories WHERE id = ?').get(result.lastInsertRowid);
    // 确保所有时间都以本地时间格式返回
    const formattedCategory = {
      ...newCategory,
      created_at: localTime,
      updated_at: localTime
    };
    console.log('Created category:', formattedCategory);
    res.json(formattedCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  
  try {
    // 使用本地时间
    const localTime = formatLocalTime(new Date());
    const result = db.prepare('UPDATE image_categories SET name = ?, description = ?, updated_at = ? WHERE id = ?').run(name, description, localTime, id);
    if (result.changes === 0) {
      res.status(404).json({ error: '分类不存在' });
      return;
    }
    const updatedCategory = db.prepare('SELECT * FROM image_categories WHERE id = ?').get(id);
    // 确保所有时间都以本地时间格式返回
    const formattedCategory = {
      ...updatedCategory,
      created_at: formatLocalTime(updatedCategory.created_at),
      updated_at: formatLocalTime(updatedCategory.updated_at),
    };
    res.json(formattedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  
  try {
    // 检查是否有图片使用该分类
    const imagesWithCategory = db.prepare('SELECT COUNT(*) AS count FROM images WHERE category_id = ?').get(id);
    if (imagesWithCategory.count > 0) {
      return res.status(400).json({ error: '该分类下有图片，无法删除' });
    }
    
    const result = db.prepare('DELETE FROM image_categories WHERE id = ?').run(id);
    if (result.changes === 0) {
      res.status(404).json({ error: '分类不存在' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message });
  }
});

// 图片API路由
// 配置multer用于文件上传
import multer from 'multer';
const uploadDir = path.resolve(__dirname, 'public', 'uploads');

// 确保uploads目录存在
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

// 获取所有图片
app.get('/api/images', (req, res) => {
  console.log('API /api/images called');
  try {
    const images = db.prepare('SELECT * FROM images').all();
    // 确保所有时间都以本地时间格式返回
    const formattedImages = images.map(image => ({
      ...image,
      created_at: formatLocalTime(image.created_at),
      updated_at: formatLocalTime(image.updated_at),
    }));
    console.log('Images fetched:', formattedImages);
    res.json(formattedImages);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: error.message });
  }
});

// 上传图片
app.post('/api/images', upload.single('image'), (req, res) => {
  console.log('Received request to upload image:', req.body);
  
  if (!req.file) {
    return res.status(400).json({ error: '请上传图片文件' });
  }
  
  const { category_id, name, description } = req.body;
  
  if (!category_id || !name) {
    // 如果验证失败，删除已上传的文件
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: '分类ID和图片名称不能为空' });
  }
  
  try {
    // 检查分类是否存在
    const category = db.prepare('SELECT id FROM image_categories WHERE id = ?').get(category_id);
    if (!category) {
      // 如果分类不存在，删除已上传的文件
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: '分类不存在' });
    }
    
    // 保存图片信息到数据库
    const imagePath = '/uploads/' + req.file.filename;
    const createdAt = formatLocalTime(new Date());
    const result = db.prepare('INSERT INTO images (category_id, name, description, image_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      category_id,
      name,
      description || '',
      imagePath,
      createdAt,
      createdAt
    );
    
    const newImage = db.prepare('SELECT * FROM images WHERE id = ?').get(result.lastInsertRowid);
    // 确保返回的时间是本地时间格式
    const formattedImage = {
      ...newImage,
      created_at: createdAt,
      updated_at: createdAt
    };
    console.log('Created image:', formattedImage);
    res.json(formattedImage);
  } catch (error) {
    // 如果发生错误，删除已上传的文件
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error uploading image:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新图片
app.put('/api/images/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { category_id, name, description } = req.body;
  
  try {
    // 检查图片是否存在
    const existingImage = db.prepare('SELECT * FROM images WHERE id = ?').get(id);
    if (!existingImage) {
      // 如果没有上传新图片，直接返回错误
      if (!req.file) {
        return res.status(404).json({ error: '图片不存在' });
      }
      // 如果上传了新图片，删除它
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: '图片不存在' });
    }
    
    let imagePath = existingImage.image_path;
    
    // 如果上传了新图片，删除旧图片并更新路径
    if (req.file) {
      // 删除旧图片
      const oldImagePath = path.join(__dirname, 'public', existingImage.image_path);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      // 设置新图片路径
      imagePath = '/uploads/' + req.file.filename;
    }
    
    // 检查分类是否存在（如果提供了分类ID）
    if (category_id) {
      const category = db.prepare('SELECT id FROM image_categories WHERE id = ?').get(category_id);
      if (!category) {
        // 如果上传了新图片，删除它
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ error: '分类不存在' });
      }
    }
    
    // 更新图片信息
    const updatedAt = formatLocalTime(new Date());
    db.prepare('UPDATE images SET category_id = ?, name = ?, description = ?, image_path = ?, updated_at = ? WHERE id = ?').run(
      category_id || existingImage.category_id,
      name || existingImage.name,
      description || existingImage.description,
      imagePath,
      updatedAt,
      id
    );
    
    const updatedImage = db.prepare('SELECT * FROM images WHERE id = ?').get(id);
    // 确保返回的时间是本地时间格式
    const formattedImage = {
      ...updatedImage,
      created_at: formatLocalTime(updatedImage.created_at),
      updated_at: updatedAt
    };
    res.json(formattedImage);
  } catch (error) {
    // 如果发生错误，删除已上传的新图片
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error updating image:', error);
    res.status(500).json({ error: error.message });
  }
});

// 删除图片
app.delete('/api/images/:id', (req, res) => {
  const { id } = req.params;
  
  try {
    // 检查图片是否存在
    const image = db.prepare('SELECT * FROM images WHERE id = ?').get(id);
    if (!image) {
      return res.status(404).json({ error: '图片不存在' });
    }
    
    // 删除物理图片文件
    const imagePath = path.join(__dirname, 'public', image.image_path);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    // 从数据库中删除图片记录
    const result = db.prepare('DELETE FROM images WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '图片不存在' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: error.message });
  }
});

// 角色API路由
app.get('/api/roles', (req, res) => {
  console.log('API /api/roles called');
  try {
    const roles = db.prepare('SELECT * FROM roles').all();
    // 确保所有时间都以本地时间格式返回
    const formattedRoles = roles.map(role => ({
      ...role,
      created_at: formatLocalTime(role.created_at),
      updated_at: formatLocalTime(role.updated_at),
    }));
    console.log('Roles fetched:', formattedRoles);
    res.json(formattedRoles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/roles', (req, res) => {
  console.log('Received request to create role:', req.body);
  const { name, description } = req.body;
  
  try {
    // 使用本地时间
    const localTime = formatLocalTime(new Date());
    const result = db.prepare('INSERT INTO roles (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)').run(name, description, localTime, localTime);
    const newRole = db.prepare('SELECT * FROM roles WHERE id = ?').get(result.lastInsertRowid);
    // 确保所有时间都以本地时间格式返回
    const formattedRole = {
      ...newRole,
      created_at: localTime,
      updated_at: localTime
    };
    console.log('Created role:', formattedRole);
    res.json(formattedRole);
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/roles/:id', (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  
  try {
    // 使用本地时间
    const localTime = formatLocalTime(new Date());
    const result = db.prepare('UPDATE roles SET name = ?, description = ?, updated_at = ? WHERE id = ?').run(name, description, localTime, id);
    if (result.changes === 0) {
      res.status(404).json({ error: '角色不存在' });
      return;
    }
    const updatedRole = db.prepare('SELECT * FROM roles WHERE id = ?').get(id);
    // 确保所有时间都以本地时间格式返回
    const formattedRole = {
      ...updatedRole,
      created_at: formatLocalTime(updatedRole.created_at),
      updated_at: localTime
    };
    res.json(formattedRole);
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/roles/:id', (req, res) => {
  const { id } = req.params;
  
  try {
    // 检查是否有用户使用该角色
    const usersWithRole = db.prepare('SELECT COUNT(*) AS count FROM users WHERE role_id = ?').get(id);
    if (usersWithRole.count > 0) {
      res.status(400).json({ error: '该角色下有用户，无法删除' });
      return;
    }
    
    const result = db.prepare('DELETE FROM roles WHERE id = ?').run(id);
    if (result.changes === 0) {
      res.status(404).json({ error: '角色不存在' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: error.message });
  }
});

// 导入connect-history-api-fallback来解决SPA路由回退问题
import history from 'connect-history-api-fallback';

// 静态资源服务
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log(`Static files will be served from ${distPath}`);
  // 先提供静态文件访问
  app.use(express.static(distPath));
  // 然后应用SPA路由回退
  app.use(history({
    // 设置白名单，API请求不会被重定向
    rewrites: [
      { from: /^\/api\/.*/, to: function(context) { return context.parsedUrl.pathname; } }
    ]
  }));
} else {
  console.warn(`Warning: Static files directory not found at ${distPath}`);
}

// 提供public/uploads目录的静态文件访问
const publicUploadsPath = path.join(__dirname, 'public', 'uploads');
if (fs.existsSync(publicUploadsPath)) {
  console.log(`Uploads files will be served from ${publicUploadsPath}`);
  // 映射/uploads路径到public/uploads目录
  app.use('/uploads', express.static(publicUploadsPath));
}

// 额外提供根目录下uploads目录的静态文件访问
const rootUploadsPath = path.join(__dirname, 'uploads');
if (fs.existsSync(rootUploadsPath)) {
  console.log(`Root uploads files will be served from ${rootUploadsPath}`);
  // 如果public/uploads中找不到文件，则尝试从根目录uploads查找
  app.use('/uploads', express.static(rootUploadsPath));
}

// 用户API路由
app.get('/api/users', (req, res) => {
  console.log('API /api/users called');
  try {
    // 基本用户信息，不包含密码
    const users = db.prepare('SELECT id, username, nickname, role_id, created_at, updated_at FROM users').all();
    // 确保所有时间都以本地时间格式返回
    const formattedUsers = users.map(user => ({
      ...user,
      created_at: formatLocalTime(user.created_at),
      updated_at: formatLocalTime(user.updated_at),
    }));
    console.log('Users fetched:', formattedUsers);
    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', (req, res) => {
  console.log('Received request to create user:', req.body);
  const { username, password, nickname, role_id } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  
  try {
    // 使用本地时间
    const localTime = formatLocalTime(new Date());
    const result = db.prepare('INSERT INTO users (username, password, nickname, role_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(username, password, nickname, role_id || 1, localTime, localTime);
    const newUser = db.prepare('SELECT id, username, nickname, role_id, created_at, updated_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    // 确保所有时间都以本地时间格式返回
    const formattedUser = {
      ...newUser,
      created_at: localTime,
      updated_at: localTime
    };
    console.log('Created user:', formattedUser);
    res.json(formattedUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { username, nickname, role_id, old_password, new_password } = req.body;
  
  try {
    // 使用本地时间
    const localTime = formatLocalTime(new Date());
    // 如果提供了密码更新，则验证旧密码
    if (old_password && new_password) {
      const currentUser = db.prepare('SELECT password FROM users WHERE id = ?').get(id);
      if (!currentUser || currentUser.password !== old_password) {
        return res.status(401).json({ error: '旧密码错误' });
      }
      // 更新密码和其他信息
      db.prepare('UPDATE users SET username = ?, nickname = ?, role_id = ?, password = ?, updated_at = ? WHERE id = ?').run(username, nickname, role_id, new_password, localTime, id);
    } else {
      // 只更新其他信息，不更新密码
      db.prepare('UPDATE users SET username = ?, nickname = ?, role_id = ?, updated_at = ? WHERE id = ?').run(username, nickname, role_id, localTime, id);
    }
    
    const updatedUser = db.prepare('SELECT id, username, nickname, role_id, created_at, updated_at FROM users WHERE id = ?').get(id);
    // 确保所有时间都以本地时间格式返回
    const formattedUser = {
      ...updatedUser,
      created_at: formatLocalTime(updatedUser.created_at),
      updated_at: localTime
    };
    res.json(formattedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  
  try {
    // 不允许删除最后一个管理员用户
    const adminRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('管理员');
    const adminUsersCount = db.prepare('SELECT COUNT(*) AS count FROM users WHERE role_id = ?').get(adminRole.id);
    const userRole = db.prepare('SELECT role_id FROM users WHERE id = ?').get(id);
    
    if (userRole.role_id === adminRole.id && adminUsersCount.count <= 1) {
      return res.status(400).json({ error: '不能删除最后一个管理员用户' });
    }
    
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    if (result.changes === 0) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
});

// 重置用户密码API
app.post('/api/users/:id/reset-password', (req, res) => {
  const { id } = req.params;
  
  try {
    // 使用本地时间
    const localTime = formatLocalTime(new Date());
    // 重置密码为默认密码 dzt123
    db.prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?').run('dzt123', localTime, id);
    res.json({ success: true, message: '密码已重置为 dzt123' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: error.message });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404处理中间件
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.path}`);
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'API端点不存在' });
  } else {
    res.status(404).sendFile(path.join(distPath, 'index.html'));
  }
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`API Health Check: http://localhost:${PORT}/api/health`);
  console.log(`API Categories: http://localhost:${PORT}/api/categories`);
});