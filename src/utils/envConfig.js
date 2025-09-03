// 环境配置文件
// 用于管理不同环境下的配置参数

// 根据当前环境获取配置
export const getEnvConfig = () => {
  // 在生产环境中，可以通过环境变量或其他方式设置
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    return {
      // 生产环境配置
      API_BASE_URL: process.env.API_BASE_URL || 'https://www.dongzhentu.com/api',
      FRONTEND_URL: process.env.FRONTEND_URL || 'https://www.dongzhentu.com'
    };
  } else {
    return {
      // 开发环境配置
      API_BASE_URL: 'http://localhost:3000/api',
      FRONTEND_URL: 'http://localhost:5173'
    };
  }
};

// 导出当前环境的配置
export const envConfig = getEnvConfig();