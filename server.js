import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

// 设置时区为Asia/Shanghai
process.env.TZ = 'Asia/Shanghai';

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

// 辅助函数：将数据库时间转换为本地时间
function convertDBTimeToLocal(dbTime) {
  if (!dbTime) return dbTime;
  // 数据库中存储的是UTC时间，需要先转换为Date对象，然后再转换为本地时间
  const date = new Date(dbTime + 'Z'); // 添加'Z'表示UTC时间
  return date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }).replace(/\//g, '-').replace(', ', ' ');
}

// 辅助函数：转换对象中的时间字段
function convertObjectTimeFields(obj) {
  if (!obj) return obj;
  const newObj = { ...obj };
  if (newObj.created_at) newObj.created_at = convertDBTimeToLocal(newObj.created_at);
  if (newObj.updated_at) newObj.updated_at = convertDBTimeToLocal(newObj.updated_at);
  return newObj;
}

// 辅助函数：转换数组中的时间字段
function convertArrayTimeFields(arr) {
  if (!arr || !Array.isArray(arr)) return arr;
  return arr.map(item => convertObjectTimeFields(item));
}

// 创建初始化标记表
db.exec(`
  CREATE TABLE IF NOT EXISTS init_flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flag_name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 创建图片分类表
db.exec(`
  CREATE TABLE IF NOT EXISTS image_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 创建图片表
db.exec(`
  CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_path TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES image_categories (id)
  )
`);

// 创建角色表
db.exec(`
  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 创建用户表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles (id)
  )
`);

// 检查是否已经初始化过数据
const initFlag = db.prepare('SELECT * FROM init_flags WHERE flag_name = ?').get('data_initialized');

if (!initFlag) {
  // 插入默认角色
  const insertDefaultRoles = db.prepare(`
    INSERT OR IGNORE INTO roles (name, description) VALUES (?, ?)
  `);

  insertDefaultRoles.run('管理员', '系统管理员');
  insertDefaultRoles.run('会员', '普通会员');

  // 插入默认管理员用户
  const insertDefaultAdmin = db.prepare(`
    INSERT OR IGNORE INTO users (role_id, username, password) VALUES (?, ?, ?)
  `);

  // 生成默认管理员密码
  const defaultPassword = 'dzt123'; // 在实际应用中，应该使用更安全的密码生成方法
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  insertDefaultAdmin.run(1, 'admin', hashedPassword);

  // 更新现有管理员用户的密码
  const updateAdminPassword = db.prepare(`
    UPDATE users SET password = ? WHERE username = ?
  `);
  updateAdminPassword.run(hashedPassword, 'admin');

  // 插入默认图片分类
  const insertDefaultCategories = db.prepare(`
    INSERT OR IGNORE INTO image_categories (name, description) VALUES (?, ?)
  `);

  insertDefaultCategories.run('乾', '乾卦相关图片');
  insertDefaultCategories.run('坤', '坤卦相关图片');
  insertDefaultCategories.run('成人', '成人相关图片');
  insertDefaultCategories.run('儿童', '儿童相关图片');
  insertDefaultCategories.run('乾字', '乾字相关图片');
  insertDefaultCategories.run('坤字', '坤字相关图片');
  
  // 设置初始化标记
  db.prepare('INSERT OR IGNORE INTO init_flags (flag_name) VALUES (?)').run('data_initialized');
}

// 配置 multer 中间件
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    // 确保上传目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 创建 Express 应用
const app = express();
const PORT = process.env.PORT || 3000;

// 配置 CORS
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// 中间件
app.use(express.json());

// API 路由
app.get('/api/categories', (req, res) => {
  console.log('API /api/categories called');
  const categories = db.prepare('SELECT * FROM image_categories').all();
  console.log('Categories fetched:', categories);
  res.json(convertArrayTimeFields(categories));
});

// 图片分类管理路由
app.post('/api/categories', (req, res) => {
  console.log('Received request to create category:', req.body);
  const { name, description } = req.body;
  
  try {
    const result = db.prepare('INSERT INTO image_categories (name, description) VALUES (?, ?)').run(name, description);
    const newCategory = db.prepare('SELECT * FROM image_categories WHERE id = ?').get(result.lastInsertRowid);
    console.log('Created category:', newCategory);
    res.json(convertObjectTimeFields(newCategory));
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', (req, res) => {
  console.log('Received request to update category:', req.body);
  const categoryId = req.params.id;
  const { name, description } = req.body;
  
  try {
    const result = db.prepare('UPDATE image_categories SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(name, description, categoryId);
    
    if (result.changes > 0) {
      const updatedCategory = db.prepare('SELECT * FROM image_categories WHERE id = ?').get(categoryId);
      console.log('Updated category:', updatedCategory);
      res.json(convertObjectTimeFields(updatedCategory));
    } else {
      res.status(404).json({ error: '分类不存在' });
    }
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: error.message });
  }
});

// 删除图片分类路由
app.delete('/api/categories/:id', (req, res) => {
  console.log('Received request to delete category with id:', req.params.id);
  const categoryId = req.params.id;
  
  try {
    const result = db.prepare('DELETE FROM image_categories WHERE id = ?').run(categoryId);
    
    if (result.changes > 0) {
      console.log('Deleted category with id:', categoryId);
      res.json({ message: '分类删除成功' });
    } else {
      res.status(404).json({ error: '分类不存在' });
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: '删除分类失败: ' + error.message });
  }
});

app.get('/api/images', (req, res) => {
  const { category_id, name } = req.query;
  let query = 'SELECT * FROM images WHERE 1=1';
  const params = [];
  
  if (category_id) {
    query += ' AND category_id = ?';
    params.push(category_id);
  }
  
  if (name) {
    query += ' AND name LIKE ?';
    params.push(`%${name}%`);
  }
  
  const images = db.prepare(query).all(...params);
  res.json(convertArrayTimeFields(images));
});

app.get('/api/roles', (req, res) => {
  const roles = db.prepare('SELECT * FROM roles').all();
  res.json(convertArrayTimeFields(roles));
});

app.get('/api/users', (req, res) => {
  const { role_id, username } = req.query;
  let query = 'SELECT * FROM users WHERE 1=1';
  const params = [];
  
  if (role_id) {
    query += ' AND role_id = ?';
    params.push(role_id);
  }
  
  if (username) {
    query += ' AND username LIKE ?';
    params.push(`%${username}%`);
  }
  
  const users = db.prepare(query).all(...params);
  res.json(convertArrayTimeFields(users));
});

// 用户登录路由
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  // 查询用户
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  // 验证用户和密码
  if (user) {
    // 使用 bcrypt 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
      res.json({ 
        success: true, 
        message: '登录成功',
        user: {
          id: user.id,
          username: user.username,
          role_id: user.role_id
        }
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }
  } else {
    res.status(401).json({ 
      success: false, 
      message: '用户名或密码错误' 
    });
  }
});

// 重置用户密码路由
app.post('/api/users/:id/reset-password', async (req, res) => {
  const userId = req.params.id;
  
  try {
    // 生成默认密码
    const defaultPassword = 'dzt123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    // 更新用户密码
    const result = db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, userId);
    
    if (result.changes > 0) {
      res.json({ success: true, message: '密码重置成功' });
    } else {
      res.status(404).json({ success: false, message: '用户不存在' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: '密码重置失败: ' + error.message });
  }
});

// 更新用户路由
app.put('/api/users/:id', async (req, res) => {
  const userId = req.params.id;
  const { username, role_id, old_password, new_password } = req.body;
  
  try {
    // 查询当前用户信息
    const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    
    if (!currentUser) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    // 准备更新数据
    let updateFields = [];
    let updateParams = [];
    
    // 更新用户名
    if (username && username !== currentUser.username) {
      updateFields.push('username = ?');
      updateParams.push(username);
    }
    
    // 更新角色
    if (role_id && role_id !== currentUser.role_id) {
      updateFields.push('role_id = ?');
      updateParams.push(role_id);
    }
    
    // 处理密码更新
    if (old_password && new_password) {
      // 验证旧密码
      const isPasswordValid = await bcrypt.compare(old_password, currentUser.password);
      if (!isPasswordValid) {
        return res.status(400).json({ success: false, message: '旧密码不正确' });
      }
      
      // 哈希新密码
      const hashedPassword = await bcrypt.hash(new_password, 10);
      updateFields.push('password = ?');
      updateParams.push(hashedPassword);
    }
    
    // 如果没有需要更新的字段
    if (updateFields.length === 0) {
      return res.json({ success: true, message: '没有需要更新的信息' });
    }
    
    // 添加更新时间字段
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // 执行更新
    updateParams.push(userId);
    const result = db.prepare(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`).run(...updateParams);
    
    if (result.changes > 0) {
      // 查询更新后的用户信息
      const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      // 移除密码字段再返回
      delete updatedUser.password;
      res.json(convertObjectTimeFields(updatedUser));
    } else {
      res.status(404).json({ success: false, message: '用户不存在' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: '用户信息更新失败: ' + error.message });
  }
});

// 图片管理路由
// 获取所有图片
app.get('/api/images', (req, res) => {
  try {
    console.log('Fetching all images from database');
    const images = db.prepare('SELECT * FROM images').all();
    console.log('Found images:', images);
    res.json(convertArrayTimeFields(images));
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取单张图片
app.get('/api/images/:id', (req, res) => {
  const imageId = req.params.id;
  
  try {
    const image = db.prepare('SELECT * FROM images WHERE id = ?').get(imageId);
    
    if (image) {
      res.json(convertObjectTimeFields(image));
    } else {
      res.status(404).json({ error: '图片不存在' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/images', upload.single('image'), (req, res) => {
  console.log('Received request to upload image:', req.body);
  console.log('File info:', req.file);
  
  const { category_id, name, description } = req.body;
  const image_path = req.file ? `/uploads/${req.file.filename}` : '';
  
  try {
    console.log('Inserting image into database with path:', image_path);
    const result = db.prepare('INSERT INTO images (category_id, name, description, image_path) VALUES (?, ?, ?, ?)').run(category_id, name, description, image_path);
    const newImage = db.prepare('SELECT * FROM images WHERE id = ?').get(result.lastInsertRowid);
    console.log('Inserted image:', newImage);
    res.json(convertObjectTimeFields(newImage));
  } catch (error) {
    console.error('Error inserting image:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/images/:id', upload.single('image'), (req, res) => {
  console.log('Received PUT request for image:', req.params.id);
  console.log('Request body:', req.body);
  console.log('Uploaded file:', req.file);
  console.log('Request body keys:', Object.keys(req.body));
  console.log('Category_id in request body:', req.body.category_id);
  
  const imageId = req.params.id;
  const { category_id, name, description } = req.body;
  
  try {
    // 先查询旧图片信息
    const oldImage = db.prepare('SELECT * FROM images WHERE id = ?').get(imageId);
    
    let result;
    if (req.file) {
      // 如果上传了新图片，则更新所有字段
      const image_path = `/uploads/${req.file.filename}`;
      console.log('Updating image with new file:', image_path);
      result = db.prepare('UPDATE images SET category_id = ?, name = ?, description = ?, image_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(category_id, name, description, image_path, imageId);
      
      // 删除旧图片文件
      if (oldImage && oldImage.image_path) {
        const oldPath = path.join(__dirname, oldImage.image_path);
        console.log('Deleting old image file:', oldPath);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
          console.log('Successfully deleted old image file');
        } else {
          console.log('Old image file not found');
        }
      }
    } else {
      // 如果没有上传新图片，则只更新其他字段
      console.log('Updating image without new file');
      result = db.prepare('UPDATE images SET category_id = ?, name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(category_id, name, description, imageId);
    }
    
    if (result.changes > 0) {
      const updatedImage = db.prepare('SELECT * FROM images WHERE id = ?').get(imageId);
      console.log('Updated image:', updatedImage);
      res.json(convertObjectTimeFields(updatedImage));
    } else {
      console.log('Image not found');
      res.status(404).json({ error: '图片不存在' });
    }
  } catch (error) {
    console.error('Error updating image:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/images/:id', (req, res) => {
  console.log('Received request to delete image with id:', req.params.id);
  const imageId = req.params.id;
  
  try {
    // 先查询图片信息以获取文件路径
    const image = db.prepare('SELECT * FROM images WHERE id = ?').get(imageId);
    console.log('Found image:', image);
    
    if (!image) {
      console.log('Image not found with id:', imageId);
      return res.status(404).json({ error: '图片不存在' });
    }
    
    // 从数据库中删除图片记录
    const result = db.prepare('DELETE FROM images WHERE id = ?').run(imageId);
    console.log('Delete result:', result);
    
    if (result.changes > 0) {
      // 如果数据库删除成功，同时删除上传目录中的文件
      if (image.image_path) {
        const fullPath = path.join(__dirname, image.image_path);
        console.log('Attempting to delete file at path:', fullPath);
        // 检查文件是否存在，如果存在则删除
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log('Successfully deleted file:', fullPath);
        } else {
          console.log('File not found at path:', fullPath);
        }
      }
      res.json({ message: '图片删除成功' });
    } else {
      res.status(404).json({ error: '图片不存在' });
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: error.message });
  }
});

// 角色管理路由
app.post('/api/roles', (req, res) => {
  const { name, description } = req.body;
  
  try {
    const result = db.prepare('INSERT INTO roles (name, description) VALUES (?, ?)').run(name, description);
    const newRole = db.prepare('SELECT * FROM roles WHERE id = ?').get(result.lastInsertRowid);
    res.json(convertObjectTimeFields(newRole));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/roles/:id', (req, res) => {
  const roleId = req.params.id;
  const { name, description } = req.body;
  
  try {
    const result = db.prepare('UPDATE roles SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(name, description, roleId);
    
    if (result.changes > 0) {
      const updatedRole = db.prepare('SELECT * FROM roles WHERE id = ?').get(roleId);
      res.json(convertObjectTimeFields(updatedRole));
    } else {
      res.status(404).json({ error: '角色不存在' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/roles/:id', (req, res) => {
  const roleId = req.params.id;
  
  try {
    const result = db.prepare('DELETE FROM roles WHERE id = ?').run(roleId);
    
    if (result.changes > 0) {
      res.json({ message: '角色删除成功' });
    } else {
      res.status(404).json({ error: '角色不存在' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 用户管理路由
app.post('/api/users', async (req, res) => {
  console.log('Received request to create user:', req.body);
  const { role_id, username, password } = req.body;
  
  try {
    // 检查必需字段
    if (!role_id || !username || !password) {
      console.log('Missing required fields:', { role_id, username, password });
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // 生成哈希密码
    console.log('Generating hash for password');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');
    
    const result = db.prepare('INSERT INTO users (role_id, username, password) VALUES (?, ?, ?)').run(role_id, username, hashedPassword);
    console.log('User inserted into database, result:', result);
    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    console.log('Retrieved new user from database:', newUser);
    
    // 移除密码字段再返回
    delete newUser.password;
    console.log('Sending response:', newUser);
    res.json(convertObjectTimeFields(newUser));
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Failed to create user: ' + error.message });
  }
});

app.put('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const { role_id, username } = req.body;
  
  try {
    const result = db.prepare('UPDATE users SET role_id = ?, username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(role_id, username, userId);
    
    if (result.changes > 0) {
      const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      // 移除密码字段再返回
      delete updatedUser.password;
      res.json(convertObjectTimeFields(updatedUser));
    } else {
      res.status(404).json({ error: '用户不存在' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  
  try {
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    
    if (result.changes > 0) {
      res.json({ message: '用户删除成功' });
    } else {
      res.status(404).json({ error: '用户不存在' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});