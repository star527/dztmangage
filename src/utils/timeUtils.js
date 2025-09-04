// 时间格式化工具函数

// 将ISO时间字符串转换为中国标准时间(CST，UTC+8)格式
export const formatLocalTime = (isoString) => {
  if (!isoString) return '';
  
  try {
    const date = new Date(isoString);
    // 检查日期是否有效
    if (isNaN(date.getTime())) return isoString;
    
    // 转换为中国标准时间(CST，UTC+8)字符串，格式为"2025-08-24 00:00:00"
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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