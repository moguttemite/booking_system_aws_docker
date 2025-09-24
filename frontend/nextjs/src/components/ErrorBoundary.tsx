/**
 * 错误边界组件
 * 捕获子组件中的JavaScript错误，并显示降级UI
 */

'use client';

import React, { Component, ReactNode } from 'react';
import { Alert, Button, Stack, Text, Title, Card, Group } from '@mantine/core';
import { IconAlertCircle, IconRefresh, IconHome } from '@tabler/icons-react';
import { analyzeError, ErrorInfo, ErrorBoundaryState, ErrorBoundaryProps } from '@/lib/errorHandler';

/**
 * 默认错误显示组件
 */
const DefaultErrorFallback: React.FC<{ error: ErrorInfo; retry: () => void }> = ({ error, retry }) => {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack align="center" spacing="md">
        <IconAlertCircle size={48} color="red" />
        <Title order={3} color="red">
          エラーが発生しました
        </Title>
        <Text color="dimmed" size="sm" align="center">
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
 * 错误边界类组件
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
      errorId: undefined
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 更新state，使下一次渲染显示降级UI
    const errorInfo = analyzeError(error, 'ErrorBoundary');
    return {
      hasError: true,
      error: errorInfo,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误信息
    const analyzedError = analyzeError(error, 'ErrorBoundary');
    analyzedError.details = {
      ...analyzedError.details,
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    };

    // 调用外部错误处理器
    if (this.props.onError) {
      this.props.onError(analyzedError);
    }

    // 在开发环境中记录详细错误信息
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', {
        error,
        errorInfo,
        analyzedError
      });
    }

    // 在生产环境中可以发送错误报告到监控服务
    if (process.env.NODE_ENV === 'production') {
      // TODO: 发送错误报告到监控服务
      // sendErrorReport(analyzedError);
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
      // 使用自定义fallback组件或默认组件
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
