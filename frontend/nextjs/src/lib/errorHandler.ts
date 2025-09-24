/**
 * 统一的错误处理工具
 * 提供标准化的错误分类、处理和用户提示
 */

import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';

// ==================== 错误类型定义 ====================

/**
 * 错误严重程度
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 错误类别
 */
export enum ErrorCategory {
  NETWORK = 'network',           // 网络错误
  AUTHENTICATION = 'auth',       // 认证错误
  AUTHORIZATION = 'authorization', // 授权错误
  VALIDATION = 'validation',     // 验证错误
  BUSINESS = 'business',         // 业务逻辑错误
  SERVER = 'server',            // 服务器错误
  UNKNOWN = 'unknown'           // 未知错误
}

/**
 * 错误信息接口
 */
export interface ErrorInfo {
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  code?: string | number;
  details?: any;
  timestamp: Date;
  context?: string;
}

/**
 * 用户友好的错误消息映射
 */
const ERROR_MESSAGES: Record<ErrorCategory, Record<ErrorSeverity, string>> = {
  [ErrorCategory.NETWORK]: {
    [ErrorSeverity.LOW]: 'ネットワーク接続が不安定です',
    [ErrorSeverity.MEDIUM]: 'ネットワークエラーが発生しました',
    [ErrorSeverity.HIGH]: 'サーバーに接続できません',
    [ErrorSeverity.CRITICAL]: 'ネットワーク接続が完全に失われました'
  },
  [ErrorCategory.AUTHENTICATION]: {
    [ErrorSeverity.LOW]: 'ログイン情報を確認してください',
    [ErrorSeverity.MEDIUM]: '認証に失敗しました',
    [ErrorSeverity.HIGH]: 'セッションが期限切れです',
    [ErrorSeverity.CRITICAL]: 'アカウントがロックされました'
  },
  [ErrorCategory.AUTHORIZATION]: {
    [ErrorSeverity.LOW]: 'この操作を実行する権限がありません',
    [ErrorSeverity.MEDIUM]: 'アクセスが拒否されました',
    [ErrorSeverity.HIGH]: '管理者権限が必要です',
    [ErrorSeverity.CRITICAL]: 'セキュリティ違反が検出されました'
  },
  [ErrorCategory.VALIDATION]: {
    [ErrorSeverity.LOW]: '入力内容を確認してください',
    [ErrorSeverity.MEDIUM]: '入力データが無効です',
    [ErrorSeverity.HIGH]: '必須項目が不足しています',
    [ErrorSeverity.CRITICAL]: 'データ形式が正しくありません'
  },
  [ErrorCategory.BUSINESS]: {
    [ErrorSeverity.LOW]: '操作を完了できませんでした',
    [ErrorSeverity.MEDIUM]: 'ビジネスルールに違反しています',
    [ErrorSeverity.HIGH]: 'データの整合性エラーが発生しました',
    [ErrorSeverity.CRITICAL]: 'システムの状態が不正です'
  },
  [ErrorCategory.SERVER]: {
    [ErrorSeverity.LOW]: 'サーバーが一時的に利用できません',
    [ErrorSeverity.MEDIUM]: 'サーバーエラーが発生しました',
    [ErrorSeverity.HIGH]: 'サーバーが過負荷状態です',
    [ErrorSeverity.CRITICAL]: 'サーバーが停止しています'
  },
  [ErrorCategory.UNKNOWN]: {
    [ErrorSeverity.LOW]: '予期しないエラーが発生しました',
    [ErrorSeverity.MEDIUM]: 'システムエラーが発生しました',
    [ErrorSeverity.HIGH]: '重大なエラーが発生しました',
    [ErrorSeverity.CRITICAL]: 'システムが停止しました'
  }
};

// ==================== 错误分析工具 ====================

/**
 * 分析错误并返回错误信息
 */
export function analyzeError(error: unknown, context?: string): ErrorInfo {
  const timestamp = new Date();
  
  // 处理不同类型的错误
  if (error instanceof Error) {
    return analyzeErrorInstance(error, context, timestamp);
  }
  
  if (typeof error === 'string') {
    return {
      message: error,
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      timestamp,
      context
    };
  }
  
  // 处理网络错误
  if (error && typeof error === 'object' && 'name' in error) {
    if (error.name === 'AbortError') {
      return {
        message: 'リクエストがタイムアウトしました',
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        code: 'TIMEOUT',
        timestamp,
        context
      };
    }
  }
  
  // 默认处理
  return {
    message: '予期しないエラーが発生しました',
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    details: error,
    timestamp,
    context
  };
}

/**
 * 分析Error实例
 */
function analyzeErrorInstance(error: Error, context?: string, timestamp?: Date): ErrorInfo {
  const message = error.message;
  const timestamp_ = timestamp || new Date();
  
  // 网络相关错误
  if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
    return {
      message,
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      timestamp: timestamp_,
      context
    };
  }
  
  // 认证相关错误
  if (message.includes('認証') || message.includes('ログイン') || message.includes('セッション') || 
      message.includes('token') || message.includes('unauthorized')) {
    return {
      message,
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      timestamp: timestamp_,
      context
    };
  }
  
  // 授权相关错误
  if (message.includes('権限') || message.includes('アクセス') || message.includes('forbidden')) {
    return {
      message,
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.HIGH,
      timestamp: timestamp_,
      context
    };
  }
  
  // 验证相关错误
  if (message.includes('入力') || message.includes('必須') || message.includes('validation')) {
    return {
      message,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
      timestamp: timestamp_,
      context
    };
  }
  
  // 业务逻辑错误
  if (message.includes('講座') || message.includes('予約') || message.includes('講師')) {
    return {
      message,
      category: ErrorCategory.BUSINESS,
      severity: ErrorSeverity.MEDIUM,
      timestamp: timestamp_,
      context
    };
  }
  
  // 服务器错误
  if (message.includes('サーバー') || message.includes('server') || message.includes('500')) {
    return {
      message,
      category: ErrorCategory.SERVER,
      severity: ErrorSeverity.HIGH,
      timestamp: timestamp_,
      context
    };
  }
  
  // 默认处理
  return {
    message,
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    timestamp: timestamp_,
    context
  };
}

// ==================== 错误显示工具 ====================

/**
 * 获取错误颜色
 */
function getErrorColor(severity: ErrorSeverity): string {
  switch (severity) {
    case ErrorSeverity.LOW:
      return 'blue';
    case ErrorSeverity.MEDIUM:
      return 'orange';
    case ErrorSeverity.HIGH:
      return 'red';
    case ErrorSeverity.CRITICAL:
      return 'dark';
    default:
      return 'red';
  }
}

/**
 * 显示错误通知
 */
export function showErrorNotification(errorInfo: ErrorInfo, customMessage?: string): void {
  const userMessage = customMessage || ERROR_MESSAGES[errorInfo.category][errorInfo.severity];
  const color = getErrorColor(errorInfo.severity);
  
  notifications.show({
    title: 'エラー',
    message: userMessage,
    color,
    autoClose: errorInfo.severity === ErrorSeverity.CRITICAL ? false : 5000,
    withCloseButton: true
  });
  
  // 记录错误到控制台（开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Details:', {
      ...errorInfo,
      originalError: errorInfo.details
    });
  }
}

/**
 * 显示成功通知
 */
export function showSuccessNotification(message: string, title: string = '成功'): void {
  notifications.show({
    title,
    message,
    color: 'green',
    autoClose: 3000
  });
}

// ==================== 错误处理Hook ====================

/**
 * 错误处理Hook
 */
export function useErrorHandler() {
  /**
   * 处理错误
   */
  const handleError = useCallback((error: unknown, context?: string, customMessage?: string): void => {
    const errorInfo = analyzeError(error, context);
    showErrorNotification(errorInfo, customMessage);
  }, []);
  
  /**
   * 处理API错误
   */
  const handleApiError = useCallback((error: unknown, apiName: string): void => {
    handleError(error, `API: ${apiName}`);
  }, [handleError]);
  
  /**
   * 处理网络错误
   */
  const handleNetworkError = useCallback((error: unknown): void => {
    const errorInfo = analyzeError(error, 'Network');
    if (errorInfo.category === ErrorCategory.NETWORK) {
      showErrorNotification(errorInfo);
    } else {
      handleError(error, 'Network');
    }
  }, [handleError]);
  
  /**
   * 处理认证错误
   */
  const handleAuthError = useCallback((error: unknown): void => {
    const errorInfo = analyzeError(error, 'Authentication');
    if (errorInfo.category === ErrorCategory.AUTHENTICATION) {
      showErrorNotification(errorInfo);
    } else {
      handleError(error, 'Authentication');
    }
  }, [handleError]);
  
  /**
   * 处理业务错误
   */
  const handleBusinessError = useCallback((error: unknown, operation: string): void => {
    handleError(error, `Business: ${operation}`);
  }, [handleError]);
  
  return {
    handleError,
    handleApiError,
    handleNetworkError,
    handleAuthError,
    handleBusinessError,
    showSuccessNotification
  };
}

// ==================== 错误边界工具 ====================

/**
 * 错误边界状态
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: ErrorInfo;
  errorId?: string;
}

/**
 * 错误边界Props
 */
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: ErrorInfo; retry: () => void }>;
  onError?: (error: ErrorInfo) => void;
}