'use client';
import { 
  Box, 
  Title, 
  Text, 
  Card, 
  Stack, 
  TextInput, 
  Button, 
  Group,
  Alert,
  Container
} from "@mantine/core";
import { IconLock, IconArrowLeft, IconAlertCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';

const ChangePasswordPage = () => {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证输入
    if (!currentPassword.trim()) {
      notifications.show({
        title: 'エラー',
        message: '現在のパスワードを入力してください',
        color: 'red'
      });
      return;
    }

    if (!newPassword.trim()) {
      notifications.show({
        title: 'エラー',
        message: '新しいパスワードを入力してください',
        color: 'red'
      });
      return;
    }

    if (newPassword.length < 8) {
      notifications.show({
        title: 'エラー',
        message: '新しいパスワードは8文字以上で入力してください',
        color: 'red'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      notifications.show({
        title: 'エラー',
        message: '新しいパスワードと確認用パスワードが一致しません',
        color: 'red'
      });
      return;
    }

    setLoading(true);
    
    try {
      // TODO: 这里应该调用API来修改密码
      // 目前只是模拟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      notifications.show({
        title: '成功',
        message: 'パスワードを変更しました',
        color: 'green'
      });
      
      // 返回上一页
      router.back();
    } catch (error) {
      notifications.show({
        title: 'エラー',
        message: 'パスワードの変更に失敗しました',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <Container size="sm" py="xl">
      <Card shadow="sm" padding="xl" radius="md" withBorder>
        {/* 头部 */}
        <Group mb="lg">
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={handleBack}
            size="sm"
          >
            戻る
          </Button>
        </Group>

        <Title order={2} mb="md" ta="center">
          <Group gap="xs" justify="center">
            <IconLock size={28} />
            パスワード変更
          </Group>
        </Title>

        <Text c="dimmed" ta="center" mb="xl">
          セキュリティのため、現在のパスワードの確認が必要です
        </Text>

        {/* 安全提示 */}
        <Alert icon={<IconAlertCircle size={16} />} color="blue" mb="lg">
          <Text size="sm">
            <strong>セキュリティのヒント:</strong>
            <br />
            • 8文字以上のパスワードを使用してください
            <br />
            • 英数字と記号を組み合わせてください
            <br />
            • 他のサービスで使用していないパスワードを使用してください
          </Text>
        </Alert>

        {/* 表单 */}
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="現在のパスワード"
              type="password"
              placeholder="現在のパスワードを入力"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.currentTarget.value)}
              required
              leftSection={<IconLock size={16} />}
            />

            <TextInput
              label="新しいパスワード"
              type="password"
              placeholder="新しいパスワードを入力（8文字以上）"
              value={newPassword}
              onChange={(e) => setNewPassword(e.currentTarget.value)}
              required
              leftSection={<IconLock size={16} />}
            />

            <TextInput
              label="新しいパスワード（確認）"
              type="password"
              placeholder="新しいパスワードを再入力"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.currentTarget.value)}
              required
              leftSection={<IconLock size={16} />}
            />

            <Group justify="space-between" mt="lg">
              <Button
                variant="outline"
                onClick={handleBack}
                size="md"
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                loading={loading}
                leftSection={<IconLock size={16} />}
                size="md"
              >
                パスワードを変更
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Container>
  );
};

export default ChangePasswordPage;
