import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { generateDefaultPassword } from '../utils/password.js';

// 创建数据库文件路径
const dbPath = path.resolve('./database.sqlite');

// 初始化数据库
const db = new Database(dbPath);

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
const { password: defaultPassword } = generateDefaultPassword();
insertDefaultAdmin.run(1, 'admin', defaultPassword);

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

export default db;