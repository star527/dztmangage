// 环境配置文件
// 用于管理不同环境下的配置参数

// 检测是否在浏览器环境中
const isBrowser = typeof window !== 'undefined';

// 根据当前环境获取配置
export const getEnvConfig = () => {
  // 在生产环境中，可以通过环境变量或其他方式设置
  const isProduction = process.env.NODE_ENV === 'production';
  
  // 如果在浏览器环境中，提供完整的URL以避免URL构造错误
  if (isBrowser) {
    // 使用当前页面的协议和主机名
    const protocol = window.location.protocol;
    const host = window.location.host;
    return {
      API_BASE_URL: `${protocol}//${host}/api`,
    };
  }
  
  if (isProduction) {
    return {
      // 生产环境配置
      API_BASE_URL: process.env.API_BASE_URL || '/api',
    };
  } else {
    return {
      // 开发环境配置
      API_BASE_URL: '/api',
    };
  }
};

// 导出当前环境的配置
export const envConfig = getEnvConfig();