"use client";

import { useState } from "react";
import {
  TextInput,
  PasswordInput,
  Button,
  Group,
  Box,
  Stack,
  Flex,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import useRegisterModal from "@/hooks/useRegisterModal";
// import RegisterModal from "./RegisterModal";

import RegisterModal from "@/components/RegisterModal";

import { loginApi } from "@/lib/api";
import useAuthStore from "@/store/useUserStore";

const HomePageLoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
        const res = await loginApi({email, password});
        if (!res || !res.token) {
        throw new Error("ログイン失敗：トークンが取得できませんでした");
        }
        
        // 构造用户对象以适配现有的状态管理
        const user = {
          id: res.id, // 使用后端返回的真实用户ID
          name: res.name,
          email: email, // 使用登录时的email
          role: res.role
        };
        
        // 保存 token 和用户信息到状态管理  
        useAuthStore.getState().setUser(user, res.token);

        notifications.show({
        title: "ログイン成功",
        message: "おかえりなさい！",
        color: "green",
        });

        // 根据角色重定向
        const role = res.role;
        if (role === "admin") {
          router.push("/admin");
        } else if (role === "teacher") {
          router.push("/teacher");
        } else {
          router.push("/bookings");
        }
        
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

  const registerModal = useRegisterModal();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
        e.preventDefault();
        handleLogin();
    }
  };

  return (
    <>
      <Box p="xl" w="100%" maw={800} mx="auto" mt="xl" 
          style={{ 
              borderRadius: 8, 
          }}
      >
        <Stack gap="md">
          {/* メールアドレス 行 */}
          <Flex align="center" gap="sm">
            <Text w={200}>メールアドレス</Text>
            <TextInput
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              w="100%"
            />
          </Flex>

          {/* パスワード 行 */}
          <Flex align="center" gap="sm">
            <Text w={200}>パスワード</Text>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              w="100%"
            />
          </Flex>

          {/* ログインボタン */}
          <Flex justify="flex-end">
            <Button onClick={handleLogin} loading={loading} variant="default">
              ログイン
            </Button>
          </Flex>

          {/* 新規登録案内文 + ボタン */}
          <Box>
            <Text size="sm" mb="xs">
              未登録の方はこちらから新規登録を行ってください。
            </Text>
            <Flex justify="flex-end">
              <Button variant="default" onClick={registerModal.open}>
                新規登録
              </Button>
            </Flex>
          </Box>
        </Stack>
      </Box>
      <RegisterModal />
    </>
  );
};

export default HomePageLoginForm;
