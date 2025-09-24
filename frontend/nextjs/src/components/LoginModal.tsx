"use client";

import { useState } from "react";
import {
  Modal,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Group,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import useLoginModal from "@/hooks/useLoginModal";
import useRegisterModal from "@/hooks/useRegisterModal";

import { loginApi } from "@/lib/api";
import useAuthStore from "@/store/useUserStore";

const LoginModal = () => {
  const { isOpen, close } = useLoginModal();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    console.log("Logging in with:", { email, password });
    try {
      const res = await loginApi({email, password});
      if (!res || !res.token) {
        throw new Error("ログイン失敗：トークンが取得できませんでした");
      }
      console.log("Login response:", res);
      
      // 后端现在直接返回用户ID，直接使用返回的数据
      const user = {
        id: res.id,
        name: res.name,
        email: email, // 使用登录时的email
        role: res.role
      };
      
      // 保存 token 和用户信息到状态管理  
      localStorage.setItem("token", res.token);
      useAuthStore.getState().setUser(user, res.token);

      notifications.show({
        title: "ログイン成功",
        message: "おかえりなさい！",
        color: "green",
      });

      // 跳转到个人页面
      router.push("/bookings");
      close();
    } catch (error) {
      // 不输出错误到控制台，只显示用户友好的错误消息
      // console.error("Login error:", error);
      notifications.show({
        title: "ログインエラー",
        message: "メールまたはパスワードが間違っています",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    close();
    // 打开注册模态框
    useRegisterModal.getState().open();

  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin();
    }
  }

  return (
    <Modal
      opened={isOpen}
      onClose={close}
      title="ログイン"
      centered
      size="md"
      radius="md"
    >
      <Stack gap="md">
        <TextInput
          label="メールアドレス"
          placeholder="example@example.com"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          required
        />
        <PasswordInput
          label="パスワード"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          required
        />
        <Group grow>
          <Button onClick={handleLogin} loading={loading}>
            ログイン
          </Button>
          <Button variant="outline" onClick={handleRegister}>
            新規登録
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default LoginModal;
