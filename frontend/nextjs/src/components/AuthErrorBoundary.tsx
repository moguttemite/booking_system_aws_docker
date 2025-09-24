/**
 * 认证错误边界组件
 * 专门用于捕获认证相关的错误
 */

'use client';

import React, { Component, ReactNode } from 'react';
import { Alert, Button, Stack, Text, Title, Card, Group } from '@mantine/core';
import { IconLock, IconRefresh, IconHome } from '@tabler/icons-react';
import { analyzeError, ErrorInfo, ErrorBoundaryState, ErrorBoundaryProps } from '@/lib/errorHandler';
import useAuthStore from '@/store/useUserStore';

/**
 * 认证错误显示组件
 */
const AuthErrorFallback: React.FC<{ error: ErrorInfo; retry: () => void }> = ({ error, retry }) => {
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack align="center" spacing="md">
        <IconLock size={48} color="red" />
        <Title order={3} color="red">
          認証エラー
        </Title>
        <Text color="dimmed" size="sm" align="center">
          ログインが必要です
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
            onClick={handleLogout}
            variant="outline"
            color="red"
          >
            ログイン画面へ
          </Button>
        </Group>
      </Stack>
    </Card>
  );
};

/**
 * 认证错误边界类组件
 */
class AuthErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
      errorId: undefined
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorInfo = analyzeError(error, 'AuthErrorBoundary');
    
    // 只捕获认证相关错误
    if (errorInfo.category !== 'auth') {
      return { hasError: false };
    }
    
    return {
      hasError: true,
      error: errorInfo,
      errorId: `auth_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const analyzedError = analyzeError(error, 'AuthErrorBoundary');
    
    // 只处理认证错误
    if (analyzedError.category !== 'auth') {
      return;
    }
    
    analyzedError.details = {
      ...analyzedError.details,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'AuthErrorBoundary'
    };

    if (this.props.onError) {
      this.props.onError(analyzedError);
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('AuthErrorBoundary caught an error:', {
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
      const FallbackComponent = this.props.fallback || AuthErrorFallback;
      return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;
