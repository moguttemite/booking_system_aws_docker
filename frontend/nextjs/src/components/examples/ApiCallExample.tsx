/**
 * API调用示例组件
 * 展示如何使用统一的错误处理和API调用Hook
 */

'use client';

import React, { useEffect } from 'react';
import { Button, Card, Stack, Text, Group, Loader, Alert } from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useApiCall, useApiQuery, useApiMutation } from '@/hooks/useApiCall';
import { fetchUserById, updateCurrentUser } from '@/lib/api';
import { useErrorHandler } from '@/lib/errorHandler';
import useAuthStore from '@/store/useUserStore';

const ApiCallExample: React.FC = () => {
  const { token, user } = useAuthStore();
  const { handleError, showSuccessNotification } = useErrorHandler();

  // 示例1: 使用 useApiQuery 进行数据查询
  const {
    data: userData,
    loading: userLoading,
    error: userError,
    execute: fetchUser
  } = useApiQuery(fetchUserById, {
    showNotification: false, // 查询操作不显示通知
    onSuccess: (data) => {
      console.log('User data fetched:', data);
    }
  });

  // 示例2: 使用 useApiMutation 进行数据变更
  const {
    data: updateResult,
    loading: updateLoading,
    error: updateError,
    execute: updateUser,
    success: updateSuccess
  } = useApiMutation(updateCurrentUser, {
    onSuccess: (data) => {
      showSuccessNotification('ユーザー情報を更新しました');
    },
    onError: (error) => {
      console.error('Update failed:', error);
    }
  });

  // 示例3: 使用 useApiCall 进行自定义API调用
  const {
    data: customData,
    loading: customLoading,
    error: customError,
    execute: customCall
  } = useApiCall(async () => {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (Math.random() > 0.5) {
      throw new Error('Random error for demonstration');
    }
    return { message: 'Custom API call successful' };
  }, {
    context: 'Custom API Call',
    customMessage: 'カスタムAPI呼び出しに失敗しました'
  });

  // 组件挂载时获取用户数据
  useEffect(() => {
    if (token && user?.id) {
      fetchUser(user.id, token);
    }
  }, [token, user?.id, fetchUser]);

  const handleUpdateUser = () => {
    if (token && user?.id) {
      updateUser(
        { name: 'Updated Name' },
        token,
        user.id
      );
    }
  };

  const handleCustomCall = () => {
    customCall();
  };

  return (
    <Stack spacing="md">
      <Text size="lg" fw={600}>API调用示例</Text>
      
      {/* 查询示例 */}
      <Card withBorder>
        <Stack spacing="sm">
          <Text fw={500}>1. 数据查询示例 (useApiQuery)</Text>
          {userLoading && <Loader size="sm" />}
          {userError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              {userError}
            </Alert>
          )}
          {userData && (
            <Alert icon={<IconCheck size={16} />} color="green">
              ユーザー情報取得成功: {userData.name}
            </Alert>
          )}
          <Button onClick={() => token && user?.id && fetchUser(user.id, token)}>
            ユーザー情報を取得
          </Button>
        </Stack>
      </Card>

      {/* 变更示例 */}
      <Card withBorder>
        <Stack spacing="sm">
          <Text fw={500}>2. 数据变更示例 (useApiMutation)</Text>
          {updateLoading && <Loader size="sm" />}
          {updateError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              {updateError}
            </Alert>
          )}
          {updateSuccess && (
            <Alert icon={<IconCheck size={16} />} color="green">
              更新成功
            </Alert>
          )}
          <Button onClick={handleUpdateUser} loading={updateLoading}>
            ユーザー情報を更新
          </Button>
        </Stack>
      </Card>

      {/* 自定义调用示例 */}
      <Card withBorder>
        <Stack spacing="sm">
          <Text fw={500}>3. 自定义API调用示例 (useApiCall)</Text>
          {customLoading && <Loader size="sm" />}
          {customError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              {customError}
            </Alert>
          )}
          {customData && (
            <Alert icon={<IconCheck size={16} />} color="green">
              {customData.message}
            </Alert>
          )}
          <Button onClick={handleCustomCall} loading={customLoading}>
            カスタムAPI呼び出し
          </Button>
        </Stack>
      </Card>

      {/* 错误处理示例 */}
      <Card withBorder>
        <Stack spacing="sm">
          <Text fw={500}>4. 错误处理示例</Text>
          <Group>
            <Button
              color="red"
              onClick={() => handleError(new Error('Network error'), 'Network Test')}
            >
              ネットワークエラー
            </Button>
            <Button
              color="orange"
              onClick={() => handleError(new Error('Authentication failed'), 'Auth Test')}
            >
              認証エラー
            </Button>
            <Button
              color="green"
              onClick={() => showSuccessNotification('操作が成功しました')}
            >
              成功メッセージ
            </Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
};

export default ApiCallExample;
