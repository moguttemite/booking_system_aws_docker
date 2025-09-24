"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Group,
  Text,
  Alert,
  Loader,
} from "@mantine/core";
import { IconAlertCircle, IconLock, IconCheck } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useUserStore";
import { loginApi } from "@/lib/api";

interface SessionExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, setUser } = useAuthStore();
  const router = useRouter();

  // 检查认证状态
  const checkAuthStatus = async () => {
    if (!user?.email) return false;
    
    setCheckingAuth(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBase}/check-auth-status`, {
        method: "GET",
        headers: {
          "accept": "application/json",
        },
      });
      
      const data = await response.json();
      return data.is_authenticated === true;
    } catch (error) {
      console.error("認証状態チェックエラー:", error);
      return false;
    } finally {
      setCheckingAuth(false);
    }
  };

  // 重新登录
  const handleRelogin = async () => {
    if (!user?.email || !password.trim()) {
      setError("パスワードを入力してください");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 调用登录API
      const loginResult = await loginApi({
        email: user.email,
        password: password,
      });

      if (loginResult && loginResult.token) {
        // 更新用户信息和token
        const updatedUser = {
          id: loginResult.id,
          name: loginResult.name,
          email: user.email,
          role: loginResult.role,
        };
        
        setUser(updatedUser, loginResult.token);
        
        // 显示成功消息
        notifications.show({
          title: "ログイン成功",
          message: "セッションが更新されました",
          color: "green",
          icon: <IconCheck size={16} />,
        });

        // 清空密码并关闭弹窗
        setPassword("");
        setError(null);
        onClose();
      } else {
        setError("ログインに失敗しました。再度お試しください。");
      }
    } catch (error: any) {
      // 不输出错误到控制台，只显示用户友好的错误消息
      // console.error("再ログインエラー:", error);
      
      // 根据错误类型显示不同的错误消息
      if (error.message?.includes("メールアドレスまたはパスワード")) {
        setError("パスワードが正しくありません。再度お試しください。");
      } else if (error.message?.includes("ログインに失敗しました")) {
        setError("ログインに失敗しました。再度お試しください。");
      } else {
        setError("ログインに失敗しました。再度お試しください。");
      }
    } finally {
      setLoading(false);
    }
  };

  // 处理弹窗关闭
  const handleClose = () => {
    // 如果用户没有重新登录就关闭弹窗，清除用户状态并重定向到主页
    if (!loading && !checkingAuth) {
      // 清除用户状态，防止重定向循环
      useAuthStore.getState().logout();
      router.push("/");
    }
    onClose();
  };

  // 处理回车键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      e.preventDefault();
      handleRelogin();
    }
  };

  // 当弹窗打开时自动检查认证状态
  useEffect(() => {
    if (isOpen && user?.email) {
      checkAuthStatus();
    }
  }, [isOpen, user?.email]);

  return (
    <Modal
      opened={isOpen}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconLock size={20} color="orange" />
          <Text size="lg" fw={600}>セッション期限切れ</Text>
        </Group>
      }
      centered
      size="md"
      radius="md"
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={true}
    >
      <Stack gap="md">
        {/* 说明文字 */}
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="セッションが期限切れです"
          color="orange"
          variant="light"
        >
          セキュリティのため、長時間操作がなかったためセッションが期限切れになりました。
          続行するには、パスワードを再入力してください。
        </Alert>

        {/* 用户信息显示 */}
        {user && (
          <div className="p-3 bg-gray-50 rounded-md">
            <Text size="sm" c="dimmed" mb="xs">ログイン中のユーザー:</Text>
            <Text size="md" fw={500}>{user.name}</Text>
            <Text size="sm" c="dimmed">{user.email}</Text>
          </div>
        )}

        {/* 密码输入 */}
        <PasswordInput
          label="パスワード"
          placeholder="パスワードを入力してください"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          required
          disabled={loading || checkingAuth}
        />

        {/* 错误消息 */}
        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="エラー"
            color="red"
            variant="light"
            withCloseButton
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* 操作按钮 */}
        <Group justify="flex-end" gap="sm">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            キャンセル
          </Button>
          <Button
            color="blue"
            onClick={handleRelogin}
            loading={loading}
            disabled={!password.trim() || checkingAuth}
            leftSection={loading ? <Loader size="xs" /> : <IconCheck size={16} />}
          >
            {loading ? "ログイン中..." : "ログイン"}
          </Button>
        </Group>

        {/* 加载状态 */}
        {checkingAuth && (
          <div className="text-center py-4">
            <Loader size="sm" />
            <Text size="sm" c="dimmed" mt="xs">認証状態を確認中...</Text>
          </div>
        )}
      </Stack>
    </Modal>
  );
};

export default SessionExpiredModal;
