/**
 * API错误边界组件
 * 专门用于捕获API调用相关的错误
 */

'use client';

import React, { Component, ReactNode } from 'react';
import { Alert, Button, Stack, Text, Title, Card, Group } from '@mantine/core';
import { IconAlertCircle, IconRefresh, IconHome } from '@tabler/icons-react';
import { analyzeError, ErrorInfo, ErrorBoundaryState, ErrorBoundaryProps } from '@/lib/errorHandler';

/**
 * API错误显示组件
 */
const ApiErrorFallback: React.FC<{ error: ErrorInfo; retry: () => void }> = ({ error, retry }) => {
  const getErrorTitle = (category: string) => {
    switch (category) {
      case 'network':
        return 'ネットワークエラー';
      case 'auth':
        return '認証エラー';
      case 'server':
        return 'サーバーエラー';
      default:
        return 'APIエラー';
    }
  };

  const getErrorDescription = (category: string) => {
    switch (category) {
      case 'network':
        return 'ネットワーク接続を確認してください';
      case 'auth':
        return 'ログインが必要です';
      case 'server':
        return 'サーバーに問題が発生しています';
      default:
        return '予期しないエラーが発生しました';
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack align="center" spacing="md">
        <IconAlertCircle size={48} color="red" />
        <Title order={3} color="red">
          {getErrorTitle(error.category)}
        </Title>
        <Text color="dimmed" size="sm" align="center">
          {getErrorDescription(error.category)}
        </Text>
        <Text size="xs" color="dimmed" align="center">
          {error.message}
        </Text>
        <Group spacing="sm">
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={retry}
            variant="outline"
            color="blue"
          >
            再試行
          </Button>
          <Button
            leftSection={<IconHome size={16} />}
            onClick={() => window.location.href = '/'}
            variant="outline"
            color="gray"
          >
            ホームに戻る
          </Button>
        </Group>
      </Stack>
    </Card>
  );
};

/**
 * API错误边界类组件
 */
class ApiErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
      errorId: undefined
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorInfo = analyzeError(error, 'ApiErrorBoundary');
    return {
      hasError: true,
      error: errorInfo,
      errorId: `api_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const analyzedError = analyzeError(error, 'ApiErrorBoundary');
    analyzedError.details = {
      ...analyzedError.details,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'ApiErrorBoundary'
    };

    if (this.props.onError) {
      this.props.onError(analyzedError);
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('ApiErrorBoundary caught an error:', {
        error,
        errorInfo,
        analyzedError
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorId: undefined
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || ApiErrorFallback;
      return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

export default ApiErrorBoundary;
