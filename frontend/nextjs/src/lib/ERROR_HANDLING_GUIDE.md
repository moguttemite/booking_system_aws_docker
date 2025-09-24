# 错误处理机制使用指南

## 概述

本项目实现了统一的错误处理机制，包括：
- 统一的错误处理 Hook
- 多种错误边界组件
- 标准化的 API 错误处理
- 错误恢复策略

## 1. 使用 useErrorHandler Hook

### 基本用法

```typescript
import { useErrorHandler } from '@/lib/errorHandler';

function MyComponent() {
  const { handleError, handleApiError, handleNetworkError, handleAuthError, showSuccessNotification } = useErrorHandler();
  
  const handleSomeAction = async () => {
    try {
      // 执行某些操作
      await someApiCall();
      showSuccessNotification('操作成功');
    } catch (error) {
      handleApiError(error, 'someApiCall');
    }
  };
}
```

### 错误处理选项

```typescript
const { handleError } = useErrorHandler();

// 自定义错误处理
handleError(error, 'MyComponent', '自定义错误消息');
```

## 2. 使用 API 错误处理包装器

### 网络错误处理

```typescript
import { withNetworkErrorHandling } from '@/lib/apiErrorHandler';

const fetchData = async () => {
  try {
    const data = await withNetworkErrorHandling(
      () => fetchSomeData(),
      'fetchSomeData',
      { 
        showNotification: true,
        customMessage: 'データの取得に失敗しました'
      }
    );
    return data;
  } catch (error) {
    // 错误已被处理
  }
};
```

### 认证错误处理

```typescript
import { withAuthErrorHandling } from '@/lib/apiErrorHandler';

const fetchUserData = async (token: string) => {
  try {
    const data = await withAuthErrorHandling(
      () => fetchUserData(token),
      'fetchUserData',
      { 
        showNotification: true,
        customMessage: 'ユーザー情報の取得に失敗しました'
      }
    );
    return data;
  } catch (error) {
    // 认证错误已被处理
  }
};
```

## 3. 使用错误边界组件

### 基本错误边界

```typescript
import ErrorBoundary from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### 专用错误边界

```typescript
import ApiErrorBoundary from '@/components/ApiErrorBoundary';
import NetworkErrorBoundary from '@/components/NetworkErrorBoundary';
import AuthErrorBoundary from '@/components/AuthErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <NetworkErrorBoundary>
        <AuthErrorBoundary>
          <ApiErrorBoundary>
            <MyComponent />
          </ApiErrorBoundary>
        </AuthErrorBoundary>
      </NetworkErrorBoundary>
    </ErrorBoundary>
  );
}
```

## 4. 使用统一的错误处理工具

### 创建标准化的 API 调用

```typescript
import { createErrorHandler } from '@/lib/errorUtils';

function MyComponent() {
  const errorHandler = createErrorHandler();
  
  // 创建标准化的 API 调用
  const fetchData = errorHandler.createApiCall(
    fetchSomeData,
    'fetchSomeData',
    { showNotification: true }
  );
  
  const handleFetch = async () => {
    try {
      const data = await fetchData();
      // 处理数据
    } catch (error) {
      // 错误已被处理
    }
  };
}
```

### 错误恢复策略

```typescript
import { handleErrorWithRecovery, ErrorRecoveryStrategy } from '@/lib/errorUtils';

const fetchDataWithRecovery = async () => {
  try {
    const data = await handleErrorWithRecovery(
      () => fetchSomeData(),
      'fetchSomeData',
      {
        strategy: ErrorRecoveryStrategy.RETRY,
        maxRetries: 3,
        retryDelay: 1000
      }
    );
    return data;
  } catch (error) {
    // 所有重试都失败了
  }
};
```

## 5. 错误处理最佳实践

### 1. 在组件中使用错误处理

```typescript
function MyComponent() {
  const { handleError, showSuccessNotification } = useErrorHandler();
  
  const handleAction = async () => {
    try {
      await someAction();
      showSuccessNotification('操作成功');
    } catch (error) {
      handleError(error, 'MyComponent');
    }
  };
}
```

### 2. 在 API 调用中使用错误处理

```typescript
import { withErrorHandling } from '@/lib/apiErrorHandler';

const fetchData = async () => {
  try {
    const data = await withErrorHandling(
      () => fetchSomeData(),
      'fetchSomeData',
      { 
        showNotification: true,
        customMessage: 'データの取得に失敗しました'
      }
    );
    return data;
  } catch (error) {
    // 错误已被处理
  }
};
```

### 3. 在 Hook 中使用错误处理

```typescript
import { useErrorHandler } from '@/lib/errorHandler';

function useMyData() {
  const { handleApiError } = useErrorHandler();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await fetchSomeData();
      setData(result);
    } catch (error) {
      handleApiError(error, 'fetchData');
    } finally {
      setLoading(false);
    }
  };
  
  return { data, loading, fetchData };
}
```

## 6. 错误类型和分类

### 错误类别

- `network`: 网络错误
- `auth`: 认证错误
- `authorization`: 授权错误
- `validation`: 验证错误
- `business`: 业务逻辑错误
- `server`: 服务器错误
- `unknown`: 未知错误

### 错误严重程度

- `low`: 低
- `medium`: 中
- `high`: 高
- `critical`: 严重

## 7. 自定义错误处理

### 自定义错误边界

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

const CustomErrorFallback = ({ error, retry }) => (
  <div>
    <h2>自定义错误显示</h2>
    <p>{error.message}</p>
    <button onClick={retry}>重试</button>
  </div>
);

function App() {
  return (
    <ErrorBoundary fallback={CustomErrorFallback}>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### 自定义错误处理函数

```typescript
import { useErrorHandler } from '@/lib/errorHandler';

function MyComponent() {
  const { handleError } = useErrorHandler();
  
  const customErrorHandler = (error: unknown) => {
    // 自定义错误处理逻辑
    console.error('Custom error handling:', error);
    handleError(error, 'MyComponent', '自定义错误消息');
  };
  
  return (
    <div>
      {/* 组件内容 */}
    </div>
  );
}
```

## 8. 调试和监控

### 开发环境调试

在开发环境中，错误信息会输出到控制台：

```typescript
if (process.env.NODE_ENV === 'development') {
  console.error('Error Details:', {
    ...errorInfo,
    originalError: errorInfo.details
  });
}
```

### 生产环境监控

在生产环境中，可以集成错误监控服务：

```typescript
if (process.env.NODE_ENV === 'production') {
  // 发送错误报告到监控服务
  // sendErrorReport(analyzedError);
}
```

## 总结

本错误处理机制提供了：

1. **统一的错误处理**: 所有错误都通过统一的接口处理
2. **分类错误处理**: 不同类型的错误有不同的处理策略
3. **错误边界保护**: 防止错误导致整个应用崩溃
4. **错误恢复**: 支持重试、降级等恢复策略
5. **用户友好**: 提供用户友好的错误提示
6. **开发友好**: 提供详细的错误信息和调试支持

使用这些工具可以大大提升应用的稳定性和用户体验。
