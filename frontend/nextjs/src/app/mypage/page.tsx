// app/mypage/page.tsx
"use client";

import { Container, Title, Text, Button, Paper, Group, Divider, Modal, TextInput, PasswordInput, Alert } from "@mantine/core";
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import useAuthStore from "@/store/useUserStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchUserById, updateCurrentUser, changePassword, fetchUserBookings, cancelBooking, loginApi, updateUserProfile } from "@/lib/api";
import type { UserUpdateData, UserBooking } from "@/types";
import { checkSessionAndShowModal } from "@/lib/sessionManager";
import useSessionExpiredModal from "@/hooks/useSessionExpiredModal";
import { useErrorHandler } from "@/lib/errorHandler";

// 预约记录类型 - 使用后端API返回的数据结构
type ReservationRecord = UserBooking;

const MyPage = () => {
  const { user, logout, token } = useAuthStore();
  const router = useRouter();
  const { open: openSessionModal } = useSessionExpiredModal();
  const { handleError, showSuccessNotification } = useErrorHandler();
  
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelTargetRecord, setCancelTargetRecord] = useState<ReservationRecord | null>(null);
  const [cancelledExpanded, setCancelledExpanded] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordChanging, setPasswordChanging] = useState(false); // 独立的密码修改加载状态
  const [userEditModalOpen, setUserEditModalOpen] = useState(false); // 用户信息编辑弹窗状态
  const [userEditLoading, setUserEditLoading] = useState(false); // 用户信息编辑加载状态
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [dataFetched, setDataFetched] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // 检查预约是否已过期
  const isReservationExpired = (reservation: ReservationRecord) => {
    const now = new Date();
    const reservationDate = new Date(reservation.booking_date + ' ' + reservation.start_time);
    return now > reservationDate;
  };

  // 检查登录状态
  const checkLoginStatus = async () => {
    if (!token || !user) {
      router.push("/");
      return false;
    }

    try {
      // 检查会话状态
      const isValid = await checkSessionAndShowModal(token);
      if (!isValid) {
        // 如果会话无效，弹窗会自动显示
        return false;
      }
      
      setSessionChecked(true);
      return true;
    } catch (error) {
      console.error("ログイン状態チェックエラー:", error);
      // 检查失败时也显示弹窗
      openSessionModal();
      return false;
    }
  };

  // 简化的数据获取逻辑 - 不更新 store，避免无限循环
  const fetchData = async () => {
    if (!token || !user || dataFetched || !sessionChecked) return;
    
    try {
      setLoading(true);
      
      // 获取用户信息并更新 store 和编辑表单
      try {
        const userInfo = await fetchUserById(user.id, token);
        setEditName(userInfo.name);
        
        // 更新 store 中的用户信息，确保页面显示最新数据
        const updatedUser = {
          ...user,
          name: userInfo.name,
          email: userInfo.email,
          role: userInfo.role
        };
        useAuthStore.getState().setUser(updatedUser, token);
      } catch (error) {
        console.error("ユーザー情報取得エラー:", error);
        setMessage({ type: 'error', text: 'ユーザー情報の取得に失敗しました' });
      }
      
             // 获取预约数据 - 使用后端API
       try {
         const bookingsResponse = await fetchUserBookings(token);
         setReservations(bookingsResponse.bookings);
       } catch (error) {
         console.error("予約データ取得エラー:", error);
         setMessage({ type: 'error', text: '予約情報の取得に失敗しました' });
       }
      
      setDataFetched(true);
      
    } catch (error) {
      console.error("データ取得エラー:", error);
      setMessage({ type: 'error', text: 'データの取得に失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  // 登录状态检查 useEffect
  useEffect(() => {
    if (!hydrated) return;
    
    if (!user || !token) {
      router.push("/");
      return;
    }
    
    // 检查登录状态
    checkLoginStatus();
  }, [hydrated, user, token]);

  // 数据获取 useEffect - 只有在会话检查通过后才执行
  useEffect(() => {
    if (sessionChecked && !dataFetched) {
      fetchData();
    }
  }, [sessionChecked, dataFetched]);

  // 处理未登录状态的重定向
  useEffect(() => {
    if (hydrated && (!user || !token)) {
      router.push("/");
    }
  }, [hydrated, user, token, router]);

  // 如果还在加载中，显示加载状态
  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Paper shadow="sm" p="xl" radius="md" withBorder>
          <div className="text-center">
            <Text size="lg" c="dimmed">データを読み込み中...</Text>
          </div>
        </Paper>
      </Container>
    );
  }

  // 如果用户未登录，显示加载状态（等待重定向）
  if (!user || !token) {
    return (
      <Container size="lg" py="xl">
        <Paper shadow="sm" p="xl" radius="md" withBorder>
          <div className="text-center">
            <Text size="lg" c="dimmed">リダイレクト中...</Text>
          </div>
        </Paper>
      </Container>
    );
  }

  // 如果会话状态还未检查完成，显示检查中状态
  if (!sessionChecked) {
    return (
      <Container size="lg" py="xl">
        <Paper shadow="sm" p="xl" radius="md" withBorder>
          <div className="text-center">
            <Text size="lg" c="dimmed">セッション状態を確認中...</Text>
            <Text size="sm" c="dimmed" mt="xs">しばらくお待ちください</Text>
          </div>
        </Paper>
      </Container>
    );
  }

  // 打开取消预约确认对话框
  const openCancelConfirm = (record: ReservationRecord) => {
    // 检查预约状态，防止对已取消的预约进行取消操作
    if (record.status === 'cancelled') {
      setMessage({ type: 'error', text: 'この予約は既にキャンセル済みです' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    
    
    
    setCancelTargetRecord(record);
    setCancelConfirmOpen(true);
  };

  // 确认取消预约
  const confirmCancel = async () => {
    if (!cancelTargetRecord || !token) {
      setCancelConfirmOpen(false);
      return;
    }

    // 再次检查预约状态，防止对已取消的预约进行取消操作
    if (cancelTargetRecord.status === 'cancelled') {
      setMessage({ type: 'error', text: 'この予約は既にキャンセル済みです' });
      setCancelConfirmOpen(false);
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      setLoading(true);
      setCancelConfirmOpen(false);

      // 首先检查登录状态
      const isValid = await checkSessionAndShowModal(token);
      if (!isValid) {
        // 如果会话无效，弹窗会自动显示
        setMessage({ type: 'error', text: 'セッションが期限切れです。再度ログインしてください。' });
        return;
      }

      // 调用后端API取消预约 - 使用预约记录ID
      const result = await cancelBooking(cancelTargetRecord.id, token);
      
      // 预约取消成功
      setMessage({ type: 'success', text: result.message || '予約をキャンセルしました' });
      
      // 更新本地状态：将预约状态改为 'cancelled'
      setReservations(prev => prev.map(r => {
        if (r.id === cancelTargetRecord.id) {
          return { ...r, status: 'cancelled' };
        }
        return r;
      }));

      // 3秒后清除成功消息
      setTimeout(() => setMessage(null), 3000);

    } catch (error) {
      console.error("予約キャンセルエラー:", error);
      const errorMessage = error instanceof Error ? error.message : "予約のキャンセルに失敗しました";
      setMessage({ type: 'error', text: errorMessage });
      
      // 3秒后清除错误消息
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
      setCancelTargetRecord(null);
    }
  };


  // 修改密码
  const handlePasswordChange = async () => {
    if (!token) return;
    
    // 验证新密码
    if (newPassword !== confirmPassword) {
      notifications.show({
        title: 'エラー',
        message: '新しいパスワードが一致しません',
        color: 'red',
        autoClose: 3000,
      });
      return;
    }
    
    if (newPassword.length < 6) {
      notifications.show({
        title: 'エラー',
        message: '新しいパスワードは6文字以上である必要があります',
        color: 'red',
        autoClose: 3000,
      });
      return;
    }
    
         try {
       setPasswordChanging(true);
       
              // 首先检查登录状态
        const isValid = await checkSessionAndShowModal(token);
       if (!isValid) {
         notifications.show({
           title: 'エラー',
           message: 'セッションが期限切れです。再度ログインしてください。',
           color: 'red',
           autoClose: 5000,
         });
         return;
       }
      
      const passwordData = {
        current_password: currentPassword,
        new_password: newPassword
      };
      
             // 调用密码修改API
       const result = await changePassword(passwordData, token);
       
       // 检查密码修改是否成功
       if (!result.success) {
         // 密码修改失败（如当前密码错误）
         notifications.show({
           title: 'エラー',
           message: result.message,
           color: 'red',
           autoClose: 5000,
         });
         return;
       }
       
       // 密码修改成功，使用新密码重新登录获取新token
       try {
        const loginResult = await loginApi({
          email: user?.email || '',
          password: newPassword
        });
        
                 // 更新store中的token
         // 注意：这里需要调用store的更新方法，但useAuthStore可能没有setToken方法
         // 暂时使用logout然后提示用户重新登录
         notifications.show({
           title: '成功',
           message: 'パスワードを変更しました。新しいパスワードでログインしてください。',
           color: 'green',
           autoClose: 3000,
         });
        
        // 关闭模态框并清空表单
        setPasswordModalOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        // 3秒后登出并跳转到登录页
        setTimeout(() => {
          logout();
          router.push("/");
        }, 3000);
        
             } catch (loginError) {
         // 不输出错误到控制台，只显示用户友好的提示
         // console.error("新パスワードでのログインエラー:", loginError);
         notifications.show({
           title: '警告',
           message: 'パスワード変更は成功しましたが、新しいパスワードでのログインに失敗しました。手動でログインしてください。',
           color: 'orange',
           autoClose: 5000,
         });
        
        // 关闭模态框并清空表单
        setPasswordModalOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        // 3秒后登出并跳转到登录页
        setTimeout(() => {
          logout();
          router.push("/");
        }, 3000);
      }
      
    } catch (err) {
       handleError(err, 'Password Change', 'パスワードの変更に失敗しました');
     } finally {
       setPasswordChanging(false);
     }
  };

  // 用户信息更新
  const handleUserInfoUpdate = async () => {
    if (!token || !user) return;
    
    // 验证用户名
    if (!editName.trim()) {
      notifications.show({
        title: 'エラー',
        message: '名前を入力してください',
        color: 'red',
        autoClose: 3000,
      });
      return;
    }
    
    if (editName.trim().length < 2) {
      notifications.show({
        title: 'エラー',
        message: '名前は2文字以上である必要があります',
        color: 'red',
        autoClose: 3000,
      });
      return;
    }
    
    try {
      setUserEditLoading(true);
      
      // 首先检查登录状态
      const isValid = await checkSessionAndShowModal(token);
      if (!isValid) {
        notifications.show({
          title: 'エラー',
          message: 'セッションが期限切れです。再度ログインしてください。',
          color: 'red',
          autoClose: 5000,
        });
        return;
      }
      
      // 调用后端API更新用户信息
      const updateData = { name: editName.trim() };
      const result = await updateUserProfile(updateData, token);
      
      // 更新本地状态
      const updatedUser = { ...user, name: editName.trim() };
      useAuthStore.getState().setUser(updatedUser, token);
      
      // 显示成功通知
      showSuccessNotification(result.message || 'ユーザー情報を更新しました');
      
      // 关闭模态框并清空表单
      setUserEditModalOpen(false);
      setEditName("");
      
    } catch (err) {
      handleError(err, 'User Info Update', 'ユーザー情報の更新に失敗しました');
    } finally {
      setUserEditLoading(false);
    }
  };

  return (
    <Container size="lg" py="xl">
      {/* 消息提示 */}
      {message && (
        <Alert
          icon={message.type === 'success' ? <IconCheck size={16} /> : <IconAlertCircle size={16} />}
          title={message.type === 'success' ? '成功' : 'エラー'}
          color={message.type === 'success' ? 'green' : 'red'}
          variant="light"
          className="mb-4"
          withCloseButton
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      <Paper shadow="sm" p="md" radius="md" withBorder>
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={2} mb="md">マイページ</Title>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Text size="sm" c="dimmed" style={{ minWidth: '60px' }}>名前:</Text>
                <Text size="md" fw={500}>{user?.name}</Text>
              </div>
              <div className="flex items-center gap-2">
                <Text size="sm" c="dimmed" style={{ minWidth: '60px' }}>メール:</Text>
                <Text size="md">{user?.email}</Text>
              </div>
              <div className="flex items-center gap-2">
                <Text size="sm" c="dimmed" style={{ minWidth: '60px' }}>ロール:</Text>
                <Text size="md" c="blue" fw={500}>{user?.role}</Text>
              </div>
            </div>
          </div>
          
          <Group>
            <Button variant="outline" onClick={async () => {
              // 打开用户信息编辑弹窗前先验证登录状态
              if (token) {
                const isValid = await checkSessionAndShowModal(token);
                if (isValid) {
                  // 设置当前用户名为编辑初始值
                  setEditName(user?.name || "");
                  setUserEditModalOpen(true);
                }
              }
            }}>
            ユーザー情報を編集
            </Button>
            <Button variant="outline" onClick={async () => {
              // 打开密码修改弹窗前先验证登录状态
              if (token) {
                const isValid = await checkSessionAndShowModal(token);
                if (isValid) {
                  setPasswordModalOpen(true);
                }
              }
            }}>
              パスワード変更
          </Button>
          </Group>
        </Group>
        
        <Divider my="lg" />
        
        <Group>
          <Button color="red" onClick={() => {
            logout();
            router.push("/");
          }}>
            ログアウト
          </Button>
          <Button color="blue" variant="outline" onClick={() => router.push("/bookings")}>
            予約ページへ
          </Button>
        </Group>
      </Paper>

             {/* 预约管理容器 */}
       <Paper shadow="sm" p="xl" radius="md" withBorder style={{ backgroundColor: '#fafbfc' }}>
      <Divider
           mb="xl"
        size="md"
        color="gray"
        label={<span style={{ fontSize: "20px", fontWeight: 600, color: "#333" }}>📋 予約一覧</span>}
        labelPosition="center"
      />

                   {/* 有效预约列表 */}
          {(() => {
            const activeReservations = reservations.filter(r => r.status !== 'cancelled');
            return activeReservations.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">現在、有効な予約はありません。</Text>
            ) : (
              <div className="space-y-4">
                {activeReservations.map((r, idx) => {
          const isExpired = isReservationExpired(r);
          return (
                    <Paper key={idx} shadow="xs" p="md" radius="md" withBorder style={{ backgroundColor: 'white' }}>
              <Group justify="space-between">
                <div>
                  <Text size="md" fw={500}>
                            {r.booking_date}　{r.start_time}～{r.end_time}
                  </Text>
                  <Text size="sm" c="dimmed">
                            講師: {r.teacher_name}
                  </Text>
                  <Text size="sm" c="dimmed">
                            講座タイトル: {r.lecture_title}
                  </Text>
                  <Text size="sm" c="dimmed">
                    講座ID: {r.lecture_id}
                  </Text>
                          <Text size="sm" c={
                            isExpired ? "red" : "dimmed"
                          }>
                            ステータス: {
                              isExpired ? "予約時間已過" : r.status
                            }
                  </Text>
                </div>
                {isExpired ? (
                  <Button color="red" variant="outline" disabled>
                    予約時間已過
                  </Button>
                        ) : r.status === 'cancelled' ? (
                          <Button color="gray" variant="outline" disabled>
                            既にキャンセル済み
                  </Button>
                ) : (
                          <Button 
                            color="red" 
                            variant="outline" 
                            onClick={() => openCancelConfirm(r)}
                            loading={loading}
                            disabled={loading}
                          >
                            {loading ? 'キャンセル中...' : '予約取消'}
                  </Button>
                )}
              </Group>
            </Paper>
          );
                })}
              </div>
            );
          })()}

         {/* 已取消预约的折叠区域 */}
         {(() => {
           const cancelledReservations = reservations.filter(r => r.status === 'cancelled');
           if (cancelledReservations.length === 0) return null;
           
           return (
             <div className="mt-8">
               <Divider
                 my="xl"
                 size="md"
                 color="gray"
                 label={<span style={{ fontSize: "18px", fontWeight: 600, color: "#666" }}>📋 キャンセル済み予約</span>}
                 labelPosition="center"
               />
               
               <Paper shadow="xs" p="md" radius="md" withBorder style={{ backgroundColor: 'white' }}>
                 <Group justify="space-between" align="center" mb="md">
                   <Text size="sm" c="dimmed">
                     キャンセル済みの予約: {cancelledReservations.length}件
                   </Text>
                   <Button 
                     variant="subtle" 
                     size="sm" 
                     onClick={() => setCancelledExpanded(!cancelledExpanded)}
                     rightSection={cancelledExpanded ? <span>▼</span> : <span>▶</span>}
                   >
                     {cancelledExpanded ? '隠す' : '表示'}
                   </Button>
                 </Group>
                 
                 {cancelledExpanded && (
                   <div className="space-y-3">
                     {cancelledReservations.map((r, idx) => (
                       <Paper 
                         key={`cancelled-${idx}`} 
                         shadow="xs" 
                         p="sm" 
                         radius="sm" 
                         withBorder 
                         style={{ 
                           backgroundColor: '#f8f9fa',
                           borderColor: '#dee2e6'
                         }}
                       >
                         <div className="space-y-1">
                           <Text size="sm" fw={500} c="gray">
                             {r.booking_date}　{r.start_time}～{r.end_time}
                           </Text>
                           <div className="flex flex-col gap-1">
                             <Text size="xs" c="dimmed">
                               講師: {r.teacher_name}
                             </Text>
                             <Text size="xs" c="dimmed">
                               講座: {r.lecture_title}
                             </Text>
                             <Text size="xs" c="gray" fw={500} style={{ marginTop: '4px' }}>
                               🚫 キャンセル済み
                             </Text>
                           </div>
                         </div>
                       </Paper>
                     ))}
                   </div>
                 )}
               </Paper>
             </div>
           );
         })()}
       </Paper>


             {/* 密码修改模态框 */}
       <Modal opened={passwordModalOpen} onClose={() => !passwordChanging && setPasswordModalOpen(false)} title="パスワード変更" centered>
         <PasswordInput 
           label="現在のパスワード" 
           value={currentPassword} 
           onChange={e => setCurrentPassword(e.currentTarget.value)} 
           mb="md" 
           required
           disabled={passwordChanging}
         />
         <PasswordInput 
           label="新しいパスワード" 
           value={newPassword} 
           onChange={e => setNewPassword(e.currentTarget.value)} 
           mb="md" 
           required
           disabled={passwordChanging}
         />
         <PasswordInput 
           label="新しいパスワード（確認）" 
           value={confirmPassword} 
           onChange={e => setConfirmPassword(e.currentTarget.value)} 
           mb="md" 
           required
           disabled={passwordChanging}
         />
         
         {/* 加载状态显示 */}
         {passwordChanging && (
           <div className="text-center py-4">
             <Text size="sm" c="dimmed">パスワードを変更中...</Text>
           </div>
         )}
         
         <Group justify="flex-end">
           <Button 
             variant="outline" 
             onClick={() => setPasswordModalOpen(false)}
             disabled={passwordChanging}
           >
             キャンセル
           </Button>
           <Button 
             color="blue" 
             onClick={handlePasswordChange}
             loading={passwordChanging}
             disabled={passwordChanging}
           >
             {passwordChanging ? '変更中...' : '変更'}
           </Button>
         </Group>
              </Modal>

       {/* 用户信息编辑模态框 */}
       <Modal opened={userEditModalOpen} onClose={() => !userEditLoading && setUserEditModalOpen(false)} title="ユーザー情報を編集" centered>
         <TextInput 
           label="名前" 
           value={editName} 
           onChange={e => setEditName(e.currentTarget.value)} 
           mb="md" 
           required
           disabled={userEditLoading}
           placeholder="新しい名前を入力してください"
         />
         
         {/* 加载状态显示 */}
         {userEditLoading && (
           <div className="text-center py-4">
             <Text size="sm" c="dimmed">ユーザー情報を更新中...</Text>
           </div>
         )}
         
         <Group justify="flex-end">
           <Button 
             variant="outline" 
             onClick={() => setUserEditModalOpen(false)}
             disabled={userEditLoading}
           >
             キャンセル
           </Button>
           <Button 
             color="blue" 
             onClick={handleUserInfoUpdate}
             loading={userEditLoading}
             disabled={userEditLoading}
           >
             {userEditLoading ? '保存中...' : '保存'}
           </Button>
         </Group>
       </Modal>

       {/* 预约取消确认对话框 */}
      <Modal opened={cancelConfirmOpen} onClose={() => setCancelConfirmOpen(false)} title="予約取消の確認" centered>
        {cancelTargetRecord && (
          <div>
            <Text mb="md">
              以下の予約をキャンセルしますか？この操作は取り消せません。
            </Text>
            <Paper p="md" withBorder mb="lg">
              <Text size="sm" fw={500}>講座: {cancelTargetRecord.lecture_title}</Text>
              <Text size="sm" c="dimmed">講師: {cancelTargetRecord.teacher_name}</Text>
              <Text size="sm" c="dimmed">日時: {cancelTargetRecord.booking_date} {cancelTargetRecord.start_time}～{cancelTargetRecord.end_time}</Text>
            </Paper>
            <Group justify="flex-end">
              <Button variant="outline" onClick={() => setCancelConfirmOpen(false)}>
                キャンセル
              </Button>
              <Button 
                color="red" 
                onClick={confirmCancel}
                loading={loading}
              >
                予約を取消
              </Button>
            </Group>
          </div>
        )}
      </Modal>
    </Container>
  );
};

export default MyPage;