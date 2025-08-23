import crypto from 'crypto';

// 生成随机盐值
export const generateSalt = (length = 16) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

// 使用 SHA-256 和盐值加密密码
export const hashPassword = (password, salt) => {
  const hash = crypto.createHmac('sha256', salt);
  hash.update(password);
  return hash.digest('hex');
};

// 验证密码
export const verifyPassword = (password, hashedPassword, salt) => {
  const hash = hashPassword(password, salt);
  return hash === hashedPassword;
};

// 生成默认密码
export const generateDefaultPassword = () => {
  const defaultPassword = 'dzt123';
  const salt = generateSalt();
  const hashedPassword = hashPassword(defaultPassword, salt);
  return { password: hashedPassword, salt };
};