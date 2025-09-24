"use client";

import {
  Modal,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Group,
} from "@mantine/core";
import { useState, useEffect } from "react";
import { notifications } from "@mantine/notifications";
import useRegisterModal from "@/hooks/useRegisterModal";

const RegisterModal = () => {
  const { isOpen, close } = useRegisterModal();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // 新增确认密码
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setConfirmPassword(""); // 清空确认密码
    }
  }, [isOpen]);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      notifications.show({
        title: "入力エラー",
        message: "すべての項目を入力してください。",
        color: "red",
      });
      return;
    }

    if (password.length < 6) {
      notifications.show({
        title: "パスワードエラー",
        message: "パスワードは6文字以上で入力してください。",
        color: "red",
      });
      return;
    }

    if (password !== confirmPassword) {
      notifications.show({
        title: "確認エラー",
        message: "パスワードが一致しません。",
        color: "red",
      });
      return;
    }

    setLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

      const response = await fetch(`${apiBase}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "登録に失敗しました");
      }

      notifications.show({
        title: "登録成功",
        message: "アカウントが作成されました。",
        color: "green",
      });

      close();
    } catch (e: any) {
      notifications.show({
        title: "エラー",
        message: e.message,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRegister();
    }
  };

  return (
    <Modal
      opened={isOpen}
      onClose={close}
      title="新規登録"
      centered
      size="lg"
      radius="md"
      withCloseButton
    >
      <Stack gap="lg">
        <TextInput
          label="メールアドレス"
          placeholder="example@example.com"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          required
          autoFocus
        />
        <PasswordInput
          label="パスワード"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          required
        />
        <PasswordInput
          label="パスワード確認"
          placeholder="もう一度パスワードを入力"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          required
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={close} disabled={loading}>
            キャンセル
          </Button>
          <Button onClick={handleRegister} loading={loading}>
            {loading ? "登録中..." : "登録"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default RegisterModal;
