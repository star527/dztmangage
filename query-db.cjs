const Database = require('better-sqlite3');
const path = require('path');

// 数据库文件路径
const dbPath = path.resolve(__dirname, 'data', 'database.sqlite');

// 连接到数据库
const db = new Database(dbPath);

// 查询所有图片分类
const categories = db.prepare('SELECT * FROM image_categories').all();
console.log('Image Categories:', categories);

// 查询所有图片
const images = db.prepare('SELECT * FROM images').all();
console.log('Images:', images);

// 查询所有角色
const roles = db.prepare('SELECT * FROM roles').all();
console.log('Roles:', roles);

// 查询所有用户
const users = db.prepare('SELECT * FROM users').all();
console.log('Users:', users);

db.close();