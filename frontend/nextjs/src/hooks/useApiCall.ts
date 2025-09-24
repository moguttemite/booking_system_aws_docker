/**
 * 统一的API调用Hook
 * 提供标准化的API调用、错误处理和加载状态管理
 */

import { useState, useCallback } from 'react';
import { useErrorHandler } from '@/lib/errorHandler';
import { withErrorHandling, ApiErrorOptions } from '@/lib/apiErrorHandler';

// ==================== 类型定义 ====================

/**
 * API调用状态
 */
export interface ApiCallState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

/**
 * API调用选项
 */
export interface UseApiCallOptions extends ApiErrorOptions {
  initialData?: any;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  onFinally?: () => void;
}

/**
 * API调用返回值
 */
export interface UseApiCallReturn<T> extends ApiCallState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
}

// ==================== Hook实现 ====================

/**
 * 统一的API调用Hook
 */
export function useApiCall<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiCallOptions = {}
): UseApiCallReturn<T> {
  const {
    initialData = null,
    onSuccess,
    onError,
    onFinally,
    ...errorOptions
  } = options;

  const [state, setState] = useState<ApiCallState<T>>({
    data: initialData,
    loading: false,
    error: null,
    success: false
  });

  const { handleError } = useErrorHandler();

  /**
   * 执行API调用
   */
  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: false
    }));

    try {
      const result = await withErrorHandling(
        () => apiFunction(...args),
        apiFunction.name || 'API Call',
        errorOptions
      );

      setState(prev => ({
        ...prev,
        data: result,
        loading: false,
        success: true
      }));

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        success: false
      }));

      if (onError) {
        onError(error);
      } else {
        handleError(error, apiFunction.name || 'API Call');
      }

      return null;
    } finally {
      if (onFinally) {
        onFinally();
      }
    }
  }, [apiFunction, errorOptions, onSuccess, onError, onFinally, handleError]);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
      success: false
    });
  }, [initialData]);

  /**
   * 手动设置数据
   */
  const setData = useCallback((data: T | null) => {
    setState(prev => ({
      ...prev,
      data
    }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData
  };
}

// ==================== 专用Hook ====================

/**
 * 用于数据获取的Hook
 */
export function useApiQuery<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiCallOptions = {}
): UseApiCallReturn<T> {
  return useApiCall(apiFunction, {
    ...options,
    throwError: false // 查询操作通常不抛出错误
  });
}

/**
 * 用于数据变更的Hook
 */
export function useApiMutation<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiCallOptions = {}
): UseApiCallReturn<T> {
  return useApiCall(apiFunction, {
    ...options,
    throwError: true // 变更操作通常抛出错误
  });
}

/**
 * 用于删除操作的Hook
 */
export function useApiDelete<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiCallOptions = {}
): UseApiCallReturn<T> {
  return useApiCall(apiFunction, {
    ...options,
    throwError: true,
    customMessage: '削除操作に失敗しました'
  });
}

/**
 * 用于创建操作的Hook
 */
export function useApiCreate<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiCallOptions = {}
): UseApiCallReturn<T> {
  return useApiCall(apiFunction, {
    ...options,
    throwError: true,
    customMessage: '作成操作に失敗しました'
  });
}

/**
 * 用于更新操作的Hook
 */
export function useApiUpdate<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiCallOptions = {}
): UseApiCallReturn<T> {
  return useApiCall(apiFunction, {
    ...options,
    throwError: true,
    customMessage: '更新操作に失敗しました'
  });
}

// ==================== 批量操作Hook ====================

/**
 * 批量API调用Hook
 */
export function useBatchApiCall<T = any>(
  apiFunctions: Array<(...args: any[]) => Promise<T>>,
  options: UseApiCallOptions = {}
): {
  execute: (...args: any[]) => Promise<T[]>;
  results: T[];
  loading: boolean;
  error: string | null;
  success: boolean;
  reset: () => void;
} {
  const [state, setState] = useState({
    results: [] as T[],
    loading: false,
    error: null as string | null,
    success: false
  });

  const { handleError } = useErrorHandler();

  const execute = useCallback(async (...args: any[]): Promise<T[]> => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: false
    }));

    try {
      const results = await Promise.all(
        apiFunctions.map(apiFunction =>
          withErrorHandling(
            () => apiFunction(...args),
            apiFunction.name || 'Batch API Call',
            options
          )
        )
      );

      setState(prev => ({
        ...prev,
        results,
        loading: false,
        success: true
      }));

      if (options.onSuccess) {
        options.onSuccess(results);
      }

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        success: false
      }));

      if (options.onError) {
        options.onError(error);
      } else {
        handleError(error, 'Batch API Call');
      }

      return [];
    } finally {
      if (options.onFinally) {
        options.onFinally();
      }
    }
  }, [apiFunctions, options, handleError]);

  const reset = useCallback(() => {
    setState({
      results: [],
      loading: false,
      error: null,
      success: false
    });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
}

// ==================== 导出 ====================

export {
  type ApiCallState,
  type UseApiCallOptions,
  type UseApiCallReturn
};
