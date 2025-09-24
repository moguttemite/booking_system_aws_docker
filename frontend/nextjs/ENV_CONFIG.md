# 环境变量配置说明

## 创建 .env.local 文件

在 `frontend` 目录下创建 `.env.local` 文件，内容如下：

```bash
# 后端API基础URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# 后端端口
NEXT_PUBLIC_BACKEND_PORT=8000

# 前端端口
NEXT_PUBLIC_FRONTEND_PORT=3000

# 环境
NODE_ENV=development
```

## 环境变量说明

### NEXT_PUBLIC_API_BASE_URL
- **用途**: 后端API的基础URL地址
- **默认值**: `http://localhost:8000`
- **示例**: 
  - 开发环境: `http://localhost:8000`
  - 生产环境: `https://api.yourdomain.com`

### NEXT_PUBLIC_BACKEND_PORT
- **用途**: 后端服务端口号
- **默认值**: `8000`
- **注意**: 这个变量主要用于配置和文档，实际API调用使用 `NEXT_PUBLIC_API_BASE_URL`

### NEXT_PUBLIC_FRONTEND_PORT
- **用途**: 前端服务端口号
- **默认值**: `3000`
- **注意**: 这个变量主要用于配置和文档

### NODE_ENV
- **用途**: Node.js 环境标识
- **值**: `development` | `production` | `test`

## 使用方法

### 1. 在组件中使用

```tsx
// 获取API基础URL
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// 构建完整的API端点
const apiEndpoint = `${apiBase}/api/v1/users/login`;
```

### 2. 在工具函数中使用

```tsx
// sessionManager.ts
export const checkSessionAndShowModal = async (token: string): Promise<boolean> => {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${apiBase}/check-auth-status`, {
      // ... 配置
    });
    // ... 处理逻辑
  } catch (error) {
    // ... 错误处理
  }
};
```

## 注意事项

1. **NEXT_PUBLIC_ 前缀**: 只有以 `NEXT_PUBLIC_` 开头的环境变量才能在客户端代码中访问
2. **默认值**: 建议为所有环境变量提供合理的默认值
3. **安全性**: 不要在客户端暴露敏感信息（如数据库密码、API密钥等）
4. **版本控制**: `.env.local` 文件通常不应该提交到版本控制系统

## 部署配置

### 开发环境
- 使用 `.env.local` 文件
- 支持热重载

### 生产环境
- 在服务器上设置环境变量
- 或者在构建时通过 CI/CD 工具设置

## 示例配置

### 开发环境 (.env.local)
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NODE_ENV=development
```

### 生产环境 (服务器环境变量)
```bash
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
NODE_ENV=production
```

### Docker 环境
```dockerfile
ENV NEXT_PUBLIC_API_BASE_URL=http://backend:8000
ENV NODE_ENV=production
```

## 故障排除

### 环境变量未生效
1. 检查 `.env.local` 文件是否在正确位置
2. 重启开发服务器
3. 确认环境变量名称是否正确

### 类型错误
如果使用 TypeScript，可能需要声明环境变量类型：

```typescript
// types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_BASE_URL: string;
    NEXT_PUBLIC_BACKEND_PORT: string;
    NEXT_PUBLIC_FRONTEND_PORT: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
}
```
