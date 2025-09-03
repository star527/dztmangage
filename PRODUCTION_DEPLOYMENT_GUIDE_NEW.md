# 东真图管理系统 - 生产环境部署文档

## 一、准备工作

在部署到生产环境前，请确认您已准备好以下资料：

1. **生产环境服务器信息**
   - 服务器：阿里云ECS服务器
   - 公网IP：8.159.137.189
   - 控制面板：宝塔面板
   - 域名：www.dongzhentu.com
   - SSH登录：密钥登录方式

2. **数据库**
   - 当前项目使用SQLite，生产环境可以继续使用
   - 数据文件位于`data/database.sqlite`

3. **管理员密码**
   - 请准备一个安全的管理员密码，首次部署后需要设置

## 二、服务器环境要求

本项目需要部署在以下环境中：

- 操作系统：Linux (推荐 Ubuntu 20.04 或 CentOS 7)
- 服务器配置：2核2G CPU，3M固定带宽，40G ESSD Entry盘
- 数据库：SQLite (项目内置，无需额外安装)
- 依赖：Node.js 16.x 或更高版本
- 端口：3000 (需确保防火墙已开放)

## 三、端口设置说明

### 1. 推荐端口设置方案

**前端应用**：使用80/443端口（标准HTTP/HTTPS端口）
- 通过宝塔面板的网站管理功能直接配置域名访问

**后端API服务**：使用3000端口
- 在宝塔面板中开放此端口的访问权限
- 通过反向代理将API请求转发到这个端口

### 2. 端口设置步骤

#### 2.1 服务器防火墙设置

在宝塔面板中设置 3000 端口的步骤如下：

1. 登录宝塔面板（通常访问 `http://8.159.137.189:8888`）
2. 点击左侧菜单的「安全」
3. 点击「添加规则」
4. 在弹出的对话框中，输入：
   - 端口范围：3000
   - 备注：后端API服务端口
5. 点击「确定」添加规则

#### 2.2 在PM2管理器中配置端口

- 当您在宝塔面板中创建Node.js项目时，系统会自动检测并使用项目中的端口配置
- 本项目的server.js文件中已配置默认使用3000端口：`const PORT = process.env.PORT || 3000;`
- 如果需要修改端口，可以通过设置环境变量`PORT`来实现

#### 2.3 配置反向代理

- 在创建网站后，需要设置反向代理将API请求转发到3000端口
- 详细步骤请参考「七、生产环境部署步骤（宝塔面板版）- 6. 配置Nginx反向代理」章节

### 3. 为什么这样设置
- 80/443端口是Web服务的标准端口，用户可以直接通过域名访问，无需输入端口号
- 3000端口作为后端服务端口，与代码中的默认配置保持一致，减少修改
- 通过反向代理保护后端服务，提高安全性

## 四、需要修改的配置文件

### 1. API基础URL配置

**文件路径**：`src/services/api.js`

**当前配置**：
```javascript
import { envConfig } from '../utils/envConfig.js';
const API_BASE_URL = envConfig.API_BASE_URL;
```

**修改方法**：由于我们使用了环境配置文件，您可以通过以下两种方式设置：

方法一：修改环境配置文件
```javascript
// 在 src/utils/envConfig.js 中修改生产环境配置
if (isProduction) {
  return {
    API_BASE_URL: 'https://www.dongzhentu.com/api',
    FRONTEND_URL: 'https://www.dongzhentu.com'
  };
}
```

方法二：在宝塔面板中设置环境变量（推荐）
- 设置 `NODE_ENV=production`
- 设置 `API_BASE_URL=https://www.dongzhentu.com/api`
- 设置 `FRONTEND_URL=https://www.dongzhentu.com`

### 2. CORS跨域配置

**文件路径**：`server.js`

**当前配置**：
```javascript
// 环境配置 - 在生产环境中，可以通过环境变量设置
const isProduction = process.env.NODE_ENV === 'production';
const FRONTEND_URL = process.env.FRONTEND_URL || (isProduction ? 'https://www.dongzhentu.com' : 'http://localhost:5173');

// 配置 CORS
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
```

**修改方法**：由于我们已经配置了环境变量支持，您只需要在宝塔面板中设置`FRONTEND_URL`环境变量为您的域名：
`FRONTEND_URL=https://www.dongzhentu.com`

### 3. 默认密码配置（重要安全项）

**文件路径**：`server.js`

**当前配置**：
```javascript
// 注意：在生产环境中，请不要使用默认密码
// 应该在首次运行前手动设置一个安全的密码
if (!isProduction) {
  // 开发环境使用临时密码
  const defaultPassword = 'dzt123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  insertDefaultAdmin.run(1, 'admin', hashedPassword);
  
  // 更新现有管理员用户的密码
  const updateAdminPassword = db.prepare(`
    UPDATE users SET password = ? WHERE username = ?
  `);
  updateAdminPassword.run(hashedPassword, 'admin');
} else {
  console.log('生产环境注意：请手动设置管理员密码！');
}
```

**修改完成**：首次部署后需要通过数据库管理工具设置一个安全的管理员密码。

### 4. Vite构建配置

**文件路径**：`vite.config.js`

**当前配置**：
```javascript
export default defineConfig({
  plugins: [react()],
})
```

**可选修改**：根据生产环境需求添加配置，例如：
```javascript
export default defineConfig({
  plugins: [react()],
  base: '/', // 如果应用部署在子路径下，需要修改此值
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // 生产环境可以禁用sourcemap以提高性能
  }
})
```

## 五、构建前端应用

在修改完配置后，需要重新构建前端应用：

```bash
# 在项目根目录执行
npm run build
```

构建完成后，会在`dist`目录下生成生产环境的前端文件。

## 六、需要上传的文件

部署到生产环境时，需要上传以下文件和目录：

1. **前端文件**
   - `dist/` 目录：包含所有构建后的前端静态文件
   
2. **后端文件**
   - `server.js`：后端服务器主文件
   - `package.json` 和 `package-lock.json`：项目依赖配置
   
3. **其他必要文件**
   - `.gitignore`：防止不必要的文件被上传
   - 确保`uploads/`目录存在（用于存储上传的图片）
   - 确保`data/`目录存在（用于存储SQLite数据库）

## 七、生产环境部署步骤（宝塔面板版）

### 1. 通过SSH上传项目文件

由于您使用密钥登录，您可以使用以下命令上传项目文件：

```bash
# 在本地项目目录下执行
scp -r -i /path/to/your/private_key ./dist ./server.js ./package.json ./package-lock.json ./data ./uploads root@120.26.144.162:/www/wwwroot/dongzhentu.com
```

**注意**：请将`/path/to/your/private_key`替换为您的私钥文件路径。

### 2. 在宝塔面板中创建网站

1. 登录宝塔面板（访问 http://120.26.144.162:8888）
2. 点击左侧菜单的「网站」
3. 点击「添加站点」
4. 填写域名：`www.dongzhentu.com` 和 `dongzhentu.com`
5. 根目录设置为：`/www/wwwroot/dongzhentu.com/dist`
6. PHP版本选择：纯静态
7. 点击「提交」

### 3. 配置Node.js环境

**重要说明**：由于本项目是基于Node.js开发的全栈应用(使用Express作为后端框架，React作为前端框架)，在宝塔面板中应选择**Node.js环境**。

1. 在宝塔面板中，点击左侧菜单的「软件商店」
2. 搜索并安装「Node.js版本管理器」
3. 安装一个稳定版本的Node.js（如v16或v18）
4. 安装「PM2管理器」用于管理Node.js应用

### 4. 安装项目依赖

在部署后端服务之前，需要确保项目的所有依赖都已正确安装：

1. 在宝塔面板中，找到您的项目目录（`/www/wwwroot/dongzhentu.com`）
2. 点击项目目录旁边的「终端」按钮，打开Web终端
3. 在终端中执行以下命令安装所有依赖：
   ```bash
   npm install
   ```
4. 依赖安装完成后，您还需要安装Ant Design兼容包（解决React 19兼容性问题）：
   ```bash
   npm install @ant-design/compatible
   ```

### 5. 部署后端服务

1. 点击左侧菜单的「PM2管理器」
2. 点击「添加项目」
3. 填写以下信息：
   - 项目名称：`dztmangage-backend`
   - 项目路径：`/www/wwwroot/dongzhentu.com`
   - 启动文件：`server.js`
   - 端口：`3000`
   - 环境变量：
     ```
     NODE_ENV=production
     API_BASE_URL=https://www.dongzhentu.com/api
     FRONTEND_URL=https://www.dongzhentu.com
     ```
4. 点击「提交」启动后端服务

### 6. 配置Nginx反向代理

1. 返回「网站」管理页面
2. 找到您创建的网站，点击「设置」
3. 点击「反向代理」
4. 点击「添加反向代理」
5. 填写以下信息：
   - 代理名称：`api-proxy`
   - 目标URL：`http://127.0.0.1:3000`
   - 发送域名：`$host`
   - 代理目录：`/api`
6. 点击「提交」

### 7. 设置HTTPS证书

1. 在网站设置页面，点击「SSL」
2. 选择「Let's Encrypt」
3. 勾选您的域名
4. 点击「申请」并等待证书颁发
5. 勾选「强制HTTPS」
6. 点击「保存」

### 8. 设置管理员密码

首次部署后，需要设置管理员密码：

1. 在宝塔面板中，点击左侧菜单的「文件」
2. 导航到`/www/wwwroot/dongzhentu.com/data`目录
3. 找到`database.sqlite`文件，右键点击选择「打开方式」->「SQLite管理器」
4. 在SQLite管理器中，执行以下SQL语句：

```sql
-- 更新管理员密码
UPDATE users SET password = '$2b$10$examplehash' WHERE username = 'admin';
```

**注意**：上面的`$2b$10$examplehash`是示例，您需要先在本地生成加密后的密码。可以使用以下Node.js代码生成：

```javascript
const bcrypt = require('bcrypt');
const plainPassword = '您的安全密码';
bcrypt.hash(plainPassword, 10).then(hash => {
  console.log('加密后的密码:', hash);
});
```

### 9. 确保目录权限正确

为了确保应用正常运行，需要设置正确的文件权限：

1. 在宝塔面板中，点击左侧菜单的「文件」
2. 导航到`/www/wwwroot/dongzhentu.com`目录
3. 右键点击`uploads`目录，选择「权限」
4. 设置权限为`755`，并确保所有者为`www`
5. 对`data`目录执行同样的操作

## 八、安全建议

1. **使用HTTPS**：确保生产环境使用HTTPS协议
2. **设置强密码**：为所有用户账户设置强密码
3. **定期备份数据**：定期备份`data/`目录下的数据库文件
4. **限制文件上传**：配置文件上传大小限制和文件类型检查
5. **关闭开发模式**：确保生产环境没有启用开发模式的特性

## 九、性能优化建议

针对2核2G配置的服务器，建议采取以下优化措施：

1. **使用PM2进程管理**：确保应用稳定运行并自动重启
2. **优化SQLite性能**：
   - 确保数据库索引优化
   - 定期清理旧数据
3. **图片资源优化**：
   - 实现图片压缩功能
   - 考虑使用CDN加速静态资源
4. **系统监控**：
   - 监控CPU、内存和带宽使用情况
   - 及时扩容当资源使用率持续超过70%

## 十、后续维护

1. **监控服务状态**：使用pm2的监控功能或其他监控工具
2. **查看日志**：定期检查服务日志，及时发现问题
3. **更新依赖**：定期更新项目依赖，修复安全漏洞
4. **性能优化**：根据实际使用情况进行性能优化

如果您在部署过程中遇到问题，请随时联系技术支持。