"use client";
import { useState, useEffect, useMemo } from "react";
import useAuthStore from '@/store/useUserStore';
import { fetchAllUsers } from '@/lib/api';
import { checkSessionAndShowModal } from '@/lib/sessionManager';
import { 
  Title, 
  Table, 
  Button, 
  Select, 
  Modal, 
  Text, 
  TextInput,
  Group,
  Paper,
  Stack,
  Badge,
  Alert
} from "@mantine/core";
import { IconSearch, IconUser, IconMail, IconShield, IconRefresh } from "@tabler/icons-react";
import type { User } from "@/types";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(false);
  const token = useAuthStore(state => state.token);
  const [searchEmail, setSearchEmail] = useState("");
  const [filterRole, setFilterRole] = useState("");

  // 过滤后的用户列表
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const emailMatch = searchEmail ? user.email.toLowerCase().includes(searchEmail.toLowerCase()) : true;
      const roleMatch = filterRole ? user.role === filterRole : true;
      return emailMatch && roleMatch;
    });
  }, [users, searchEmail, filterRole]);

  // 登录状态检测
  useEffect(() => {
    const checkSession = async () => {
      if (!token) {
        setError("認証トークンが見つかりません");
        setLoading(false);
        return;
      }

      try {
        setSessionChecking(true);
        const isValid = await checkSessionAndShowModal(token);
        if (isValid) {
          setSessionChecked(true);
        } else {
          setError("セッションが期限切れです。再度ログインしてください。");
          setLoading(false);
        }
      } catch (error) {
        console.error('セッション確認エラー:', error);
        setError("セッションの確認に失敗しました");
        setLoading(false);
      } finally {
        setSessionChecking(false);
      }
    };

    checkSession();
  }, [token]);

  // 获取用户数据
  useEffect(() => {
    if (sessionChecked && token) {
      setLoading(true);
      setError(null);
      fetchAllUsers(token)
        .then(setUsers)
        .catch(err => {
          console.error("fetchAllUsers error", err);
          setError(err.message || "ユーザーデータの取得に失敗しました");
        })
        .finally(() => setLoading(false));
    }
  }, [sessionChecked, token]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'student': return '学生';
      case 'teacher': return '講師';
      case 'admin': return '管理者';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student': return 'blue';
      case 'teacher': return 'green';
      case 'admin': return 'red';
      default: return 'gray';
    }
  };

  if (sessionChecking || loading) {
    return (
      <Stack gap="md">
        <Title order={2}>ユーザー一覧</Title>
        <Paper p="xl" ta="center">
          <Text c="dimmed">
            {sessionChecking ? 'セッションを確認中...' : '読み込み中...'}
          </Text>
        </Paper>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack gap="md">
        <Title order={2}>ユーザー一覧</Title>
        <Alert color="red" title="エラー">
          {error}
        </Alert>
        {error.includes("セッションが期限切れ") && (
          <Alert color="blue" title="解決方法">
            ログインし直してください。ページを再読み込みするか、管理者ダッシュボードに戻ってください。
          </Alert>
        )}
      </Stack>
    );
  }

  // 刷新数据函数
  const handleRefresh = async () => {
    if (!token) {
      setError("認証トークンが見つかりません");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // 先检查登录状态
      const isValid = await checkSessionAndShowModal(token);
      if (!isValid) {
        setError("セッションが期限切れです。再度ログインしてください。");
        return;
      }
      
      // 登录状态有效，继续获取数据
      const usersData = await fetchAllUsers(token);
      setUsers(usersData);
    } catch (err) {
      console.error("refresh users error", err);
      setError(err instanceof Error ? err.message : "ユーザーデータの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="md">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: "20px", marginBottom: "4px" }}>
        <Title order={2}>ユーザー一覧</Title>
        <Button
          leftSection={<IconRefresh size={16} />}
          variant="light"
          onClick={handleRefresh}
          loading={loading}
        >
          更新
        </Button>
      </div>
      
      {/* 検索・フィルター */}
      <Group gap="md" style={{ paddingLeft: "20px", paddingRight: "20px", marginBottom: "8px" }}>
        <TextInput
          placeholder="Emailで検索"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          style={{ flex: 1, maxWidth: 300 }}
        />
        <Select
          placeholder="身分で絞り込み"
          value={filterRole}
          onChange={v => setFilterRole(v || "")}
          data={[
            { value: '', label: '全て' },
            { value: 'student', label: '学生' },
            { value: 'teacher', label: '講師' },
            { value: 'admin', label: '管理者' },
          ]}
          style={{ minWidth: 150 }}
        />
      </Group>

      {/* ユーザーテーブル */}
      <Paper withBorder style={{ margin: "0 20px" }}>
        <Table striped highlightOnHover>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "16px 12px 12px 20px" }}>
                <Group gap="xs">
                  <IconUser size={16} />
                  <Text size="sm">ユーザー名</Text>
                </Group>
              </th>
              <th style={{ textAlign: "left", padding: "16px 12px" }}>
                <Group gap="xs">
                  <IconMail size={16} />
                  <Text size="sm">Email</Text>
                </Group>
              </th>
              <th style={{ textAlign: "center", padding: "16px 12px" }}>
                <Group gap="xs" justify="center">
                  <IconShield size={16} />
                  <Text size="sm">身分</Text>
                </Group>
              </th>
              <th style={{ textAlign: "center", padding: "16px 12px" }}>
                <Text size="sm">操作</Text>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td style={{ textAlign: "left", padding: "12px 12px 12px 20px" }}>
                  <Text fw={500} size="sm">
                    {user.name}
                  </Text>
                </td>
                <td style={{ textAlign: "left", padding: "12px" }}>
                  <Text size="sm" color="dimmed">
                    {user.email}
                  </Text>
                </td>
                <td style={{ textAlign: "center", padding: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <Badge color={getRoleColor(user.role)} variant="light">
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>
                </td>
                <td style={{ textAlign: "center", padding: "12px" }}>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(user);
                      setModalOpen(true);
                    }}
                  >
                    詳細
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Paper>

      {/* 用户详细信息弹窗 */}
      <Modal 
        opened={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title="ユーザー詳細" 
        centered 
        size="md"
      >
        {selectedUser && (
          <Stack gap="md">
            <Group>
              <Text fw={500}>ユーザー名:</Text>
              <Text>{selectedUser.name}</Text>
            </Group>
            <Group>
              <Text fw={500}>Email:</Text>
              <Text>{selectedUser.email}</Text>
            </Group>
            <Group>
              <Text fw={500}>身分:</Text>
              <Badge color={getRoleColor(selectedUser.role)}>
                {getRoleLabel(selectedUser.role)}
              </Badge>
            </Group>
            {selectedUser.role === 'student' && (
              <Alert color="blue" title="学生情報">
                <Text size="sm">総予約時間: --</Text>
                <Text size="sm">最終アクティブ: --</Text>
              </Alert>
            )}
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
