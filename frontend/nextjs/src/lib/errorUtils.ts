/**
 * 统一的错误处理工具函数
 * 提供标准化的错误处理模式
 */

import { useErrorHandler } from './errorHandler';
import { withErrorHandling, withNetworkErrorHandling, withAuthErrorHandling, withBusinessErrorHandling } from './apiErrorHandler';

/**
 * 错误处理配置
 */
export interface ErrorHandlingConfig {
  showNotification?: boolean;
  customMessage?: string;
  context?: string;
  throwError?: boolean;
  logError?: boolean;
}

/**
 * 默认错误处理配置
 */
const DEFAULT_CONFIG: ErrorHandlingConfig = {
  showNotification: true,
  throwError: true,
  logError: true
};

/**
 * 创建标准化的API调用函数
 */
export function createApiCall<T extends any[], R>(
  apiFunction: (...args: T) => Promise<R>,
  apiName: string,
  config: ErrorHandlingConfig = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  return async (...args: T): Promise<R> => {
    return withErrorHandling(
      () => apiFunction(...args),
      apiName,
      finalConfig
    );
  };
}

/**
 * 创建网络API调用函数
 */
export function createNetworkApiCall<T extends any[], R>(
  apiFunction: (...args: T) => Promise<R>,
  apiName: string,
  config: ErrorHandlingConfig = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  return async (...args: T): Promise<R> => {
    return withNetworkErrorHandling(
      () => apiFunction(...args),
      apiName,
      finalConfig
    );
  };
}

/**
 * 创建认证API调用函数
 */
export function createAuthApiCall<T extends any[], R>(
  apiFunction: (...args: T) => Promise<R>,
  apiName: string,
  config: ErrorHandlingConfig = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  return async (...args: T): Promise<R> => {
    return withAuthErrorHandling(
      () => apiFunction(...args),
      apiName,
      finalConfig
    );
  };
}

/**
 * 创建业务API调用函数
 */
export function createBusinessApiCall<T extends any[], R>(
  apiFunction: (...args: T) => Promise<R>,
  apiName: string,
  config: ErrorHandlingConfig = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  return async (...args: T): Promise<R> => {
    return withBusinessErrorHandling(
      () => apiFunction(...args),
      apiName,
      finalConfig
    );
  };
}

/**
 * 错误处理Hook工厂
 */
export function createErrorHandler() {
  const { handleError, handleApiError, handleNetworkError, handleAuthError, handleBusinessError, showSuccessNotification } = useErrorHandler();
  
  return {
    handleError,
    handleApiError,
    handleNetworkError,
    handleAuthError,
    handleBusinessError,
    showSuccessNotification,
    
    // 创建标准化的API调用函数
    createApiCall: <T extends any[], R>(
      apiFunction: (...args: T) => Promise<R>,
      apiName: string,
      config: ErrorHandlingConfig = {}
    ) => createApiCall(apiFunction, apiName, config),
    
    createNetworkApiCall: <T extends any[], R>(
      apiFunction: (...args: T) => Promise<R>,
      apiName: string,
      config: ErrorHandlingConfig = {}
    ) => createNetworkApiCall(apiFunction, apiName, config),
    
    createAuthApiCall: <T extends any[], R>(
      apiFunction: (...args: T) => Promise<R>,
      apiName: string,
      config: ErrorHandlingConfig = {}
    ) => createAuthApiCall(apiFunction, apiName, config),
    
    createBusinessApiCall: <T extends any[], R>(
      apiFunction: (...args: T) => Promise<R>,
      apiName: string,
      config: ErrorHandlingConfig = {}
    ) => createBusinessApiCall(apiFunction, apiName, config),
  };
}

/**
 * 错误恢复策略
 */
export enum ErrorRecoveryStrategy {
  RETRY = 'retry',
  FALLBACK = 'fallback',
  IGNORE = 'ignore',
  REDIRECT = 'redirect'
}

/**
 * 错误恢复配置
 */
export interface ErrorRecoveryConfig {
  strategy: ErrorRecoveryStrategy;
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
  recoveryConfig: ErrorRecoveryConfig,
  config: ErrorHandlingConfig = {}
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
      if (error instanceof Error && !error.message.includes('network')) {
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
    case ErrorRecoveryStrategy.RETRY:
      throw lastError;
    case ErrorRecoveryStrategy.FALLBACK:
      if (recoveryConfig.fallbackValue !== undefined) {
        return recoveryConfig.fallbackValue;
      }
      throw lastError;
    case ErrorRecoveryStrategy.IGNORE:
      return undefined;
    case ErrorRecoveryStrategy.REDIRECT:
      if (recoveryConfig.redirectUrl) {
        window.location.href = recoveryConfig.redirectUrl;
      }
      throw lastError;
  }

  throw lastError;
}

/**
 * 错误处理装饰器
 */
export function withErrorHandlingDecorator<T extends any[], R>(
  apiFunction: (...args: T) => Promise<R>,
  apiName: string,
  config: ErrorHandlingConfig = {}
) {
  return createApiCall(apiFunction, apiName, config);
}

/**
 * 网络错误处理装饰器
 */
export function withNetworkErrorHandlingDecorator<T extends any[], R>(
  apiFunction: (...args: T) => Promise<R>,
  apiName: string,
  config: ErrorHandlingConfig = {}
) {
  return createNetworkApiCall(apiFunction, apiName, config);
}

/**
 * 认证错误处理装饰器
 */
export function withAuthErrorHandlingDecorator<T extends any[], R>(
  apiFunction: (...args: T) => Promise<R>,
  apiName: string,
  config: ErrorHandlingConfig = {}
) {
  return createAuthApiCall(apiFunction, apiName, config);
}

/**
 * 业务错误处理装饰器
 */
export function withBusinessErrorHandlingDecorator<T extends any[], R>(
  apiFunction: (...args: T) => Promise<R>,
  apiName: string,
  config: ErrorHandlingConfig = {}
) {
  return createBusinessApiCall(apiFunction, apiName, config);
}

// 导出类型
export type {
  ErrorHandlingConfig,
  ErrorRecoveryConfig
};
