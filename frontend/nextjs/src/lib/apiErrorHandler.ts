/**
 * API错误处理包装器
 * 为API调用提供统一的错误处理
 */

import { analyzeError, ErrorCategory, ErrorSeverity, showErrorNotification } from './errorHandler';

// ==================== API错误处理配置 ====================

/**
 * API错误处理选项
 */
export interface ApiErrorOptions {
  showNotification?: boolean;
  customMessage?: string;
  context?: string;
  throwError?: boolean;
  logError?: boolean;
}

/**
 * 默认API错误处理选项
 */
const DEFAULT_OPTIONS: ApiErrorOptions = {
  showNotification: true,
  throwError: true,
  logError: true
};

// ==================== 错误处理函数 ====================

/**
 * 处理API错误
 */
export function handleApiError(
  error: unknown,
  apiName: string,
  options: ApiErrorOptions = {}
): never {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const context = opts.context || `API: ${apiName}`;
  
  // 分析错误
  const errorInfo = analyzeError(error, context);
  
  // 记录错误
  if (opts.logError) {
    console.error(`API Error [${apiName}]:`, {
      error,
      errorInfo,
      context
    });
  }
  
  // 显示通知
  if (opts.showNotification) {
    showErrorNotification(errorInfo, opts.customMessage);
  }
  
  // 重新抛出错误
  if (opts.throwError) {
    throw error;
  }
}

/**
 * 处理网络错误
 */
export function handleNetworkError(
  error: unknown,
  apiName: string,
  options: ApiErrorOptions = {}
): never {
  const errorInfo = analyzeError(error, `Network: ${apiName}`);
  
  // 如果是网络错误，显示特定消息
  if (errorInfo.category === ErrorCategory.NETWORK) {
    const networkOptions = {
      ...options,
      customMessage: 'ネットワーク接続を確認してください'
    };
    handleApiError(error, apiName, networkOptions);
  } else {
    handleApiError(error, apiName, options);
  }
}

/**
 * 处理认证错误
 */
export function handleAuthError(
  error: unknown,
  apiName: string,
  options: ApiErrorOptions = {}
): never {
  const errorInfo = analyzeError(error, `Auth: ${apiName}`);
  
  // 如果是认证错误，显示特定消息
  if (errorInfo.category === ErrorCategory.AUTHENTICATION) {
    const authOptions = {
      ...options,
      customMessage: 'ログインが必要です'
    };
    handleApiError(error, apiName, authOptions);
  } else {
    handleApiError(error, apiName, options);
  }
}

/**
 * 处理业务逻辑错误
 */
export function handleBusinessError(
  error: unknown,
  operation: string,
  options: ApiErrorOptions = {}
): never {
  const errorInfo = analyzeError(error, `Business: ${operation}`);
  
  // 如果是业务错误，显示特定消息
  if (errorInfo.category === ErrorCategory.BUSINESS) {
    const businessOptions = {
      ...options,
      customMessage: '操作を完了できませんでした'
    };
    handleApiError(error, operation, businessOptions);
  } else {
    handleApiError(error, operation, options);
  }
}

// ==================== API包装器 ====================

/**
 * API调用包装器
 */
export async function withErrorHandling<T>(
  apiCall: () => Promise<T>,
  apiName: string,
  options: ApiErrorOptions = {}
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    handleApiError(error, apiName, options);
  }
}

/**
 * 网络API调用包装器
 */
export async function withNetworkErrorHandling<T>(
  apiCall: () => Promise<T>,
  apiName: string,
  options: ApiErrorOptions = {}
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    handleNetworkError(error, apiName, options);
  }
}

/**
 * 认证API调用包装器
 */
export async function withAuthErrorHandling<T>(
  apiCall: () => Promise<T>,
  apiName: string,
  options: ApiErrorOptions = {}
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    handleAuthError(error, apiName, options);
  }
}

/**
 * 业务API调用包装器
 */
export async function withBusinessErrorHandling<T>(
  apiCall: () => Promise<T>,
  operation: string,
  options: ApiErrorOptions = {}
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    handleBusinessError(error, operation, options);
  }
}

// ==================== 错误分类工具 ====================

/**
 * 检查是否为网络错误
 */
export function isNetworkError(error: unknown): boolean {
  const errorInfo = analyzeError(error);
  return errorInfo.category === ErrorCategory.NETWORK;
}

/**
 * 检查是否为认证错误
 */
export function isAuthError(error: unknown): boolean {
  const errorInfo = analyzeError(error);
  return errorInfo.category === ErrorCategory.AUTHENTICATION;
}

/**
 * 检查是否为业务错误
 */
export function isBusinessError(error: unknown): boolean {
  const errorInfo = analyzeError(error);
  return errorInfo.category === ErrorCategory.BUSINESS;
}

/**
 * 检查是否为服务器错误
 */
export function isServerError(error: unknown): boolean {
  const errorInfo = analyzeError(error);
  return errorInfo.category === ErrorCategory.SERVER;
}

// ==================== 错误恢复工具 ====================

/**
 * 错误恢复策略
 */
export enum RecoveryStrategy {
  RETRY = 'retry',
  FALLBACK = 'fallback',
  IGNORE = 'ignore',
  REDIRECT = 'redirect'
}

/**
 * 错误恢复配置
 */
export interface RecoveryConfig {
  strategy: RecoveryStrategy;
  maxRetries?: number;
  retryDelay?: number;
  fallbackValue?: any;
  redirectUrl?: string;
}

/**
 * 带恢复策略的错误处理
 */
export async function handleErrorWithRecovery<T>(
  apiCall: () => Promise<T>,
  apiName: string,
  recoveryConfig: RecoveryConfig,
  options: ApiErrorOptions = {}
): Promise<T | any> {
  let lastError: unknown;
  let retryCount = 0;
  const maxRetries = recoveryConfig.maxRetries || 3;
  const retryDelay = recoveryConfig.retryDelay || 1000;

  while (retryCount < maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      retryCount++;

      // 如果不是网络错误，不重试
      if (!isNetworkError(error)) {
        break;
      }

      // 等待后重试
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // 所有重试都失败了，根据策略处理
  switch (recoveryConfig.strategy) {
    case RecoveryStrategy.RETRY:
      handleApiError(lastError, apiName, options);
      break;
    case RecoveryStrategy.FALLBACK:
      if (recoveryConfig.fallbackValue !== undefined) {
        return recoveryConfig.fallbackValue;
      }
      handleApiError(lastError, apiName, options);
      break;
    case RecoveryStrategy.IGNORE:
      // 静默忽略错误
      break;
    case RecoveryStrategy.REDIRECT:
      if (recoveryConfig.redirectUrl) {
        window.location.href = recoveryConfig.redirectUrl;
      }
      handleApiError(lastError, apiName, options);
      break;
  }

  throw lastError;
}

// ==================== 导出 ====================

export {
  type ApiErrorOptions,
  type RecoveryConfig
};
