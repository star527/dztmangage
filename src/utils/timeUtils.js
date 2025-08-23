// 时间格式化工具函数

// 将ISO时间字符串转换为本地时间格式
export const formatLocalTime = (isoString) => {
  if (!isoString) return '';
  
  try {
    const date = new Date(isoString);
    // 检查日期是否有效
    if (isNaN(date.getTime())) return isoString;
    
    // 转换为本地时间字符串
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error('时间格式化错误:', error);
    return isoString;
  }
};

// 批量转换对象中的时间字段
export const convertObjectTimeFields = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const timeFields = ['created_at', 'updated_at'];
  const result = { ...obj };
  
  timeFields.forEach(field => {
    if (obj[field]) {
      result[field] = formatLocalTime(obj[field]);
    }
  });
  
  return result;
};

// 批量转换数组中对象的时间字段
export const convertArrayTimeFields = (arr) => {
  if (!Array.isArray(arr)) return arr;
  
  return arr.map(item => convertObjectTimeFields(item));
};