/**
 * 网络错误边界组件
 * 专门用于捕获网络连接相关的错误
 */

'use client';

import React, { Component, ReactNode } from 'react';
import { Alert, Button, Stack, Text, Title, Card, Group } from '@mantine/core';
import { IconWifiOff, IconRefresh, IconHome } from '@tabler/icons-react';
import { analyzeError, ErrorInfo, ErrorBoundaryState, ErrorBoundaryProps } from '@/lib/errorHandler';

/**
 * 网络错误显示组件
 */
const NetworkErrorFallback: React.FC<{ error: ErrorInfo; retry: () => void }> = ({ error, retry }) => {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack align="center" spacing="md">
        <IconWifiOff size={48} color="orange" />
        <Title order={3} color="orange">
          ネットワーク接続エラー
        </Title>
        <Text color="dimmed" size="sm" align="center">
          インターネット接続を確認してください
        </Text>
        <Text size="xs" color="dimmed" align="center">
          {error.message}
        </Text>
        <Group spacing="sm">
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={retry}
            variant="outline"
            color="orange"
          >
            再接続
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
 * 网络错误边界类组件
 */
class NetworkErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
      errorId: undefined
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorInfo = analyzeError(error, 'NetworkErrorBoundary');
    
    // 只捕获网络相关错误
    if (errorInfo.category !== 'network') {
      return { hasError: false };
    }
    
    return {
      hasError: true,
      error: errorInfo,
      errorId: `network_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const analyzedError = analyzeError(error, 'NetworkErrorBoundary');
    
    // 只处理网络错误
    if (analyzedError.category !== 'network') {
      return;
    }
    
    analyzedError.details = {
      ...analyzedError.details,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'NetworkErrorBoundary'
    };

    if (this.props.onError) {
      this.props.onError(analyzedError);
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('NetworkErrorBoundary caught an error:', {
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
      const FallbackComponent = this.props.fallback || NetworkErrorFallback;
      return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

export default NetworkErrorBoundary;
