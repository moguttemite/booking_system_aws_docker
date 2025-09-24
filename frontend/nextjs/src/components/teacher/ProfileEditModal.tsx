import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Stack, 
  Title, 
  Box, 
  Group, 
  Button, 
  TextInput, 
  Textarea, 
  FileInput,
  Avatar,
  Text,
  Divider,
  Alert,
  Loader
} from "@mantine/core";
import { notifications } from '@mantine/notifications';
import { IconUpload, IconUser, IconPhone, IconEdit, IconLock } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/useUserStore';
import { validateImageFile, compressPromotionalImage, blobToBase64, formatFileSize } from '@/lib/imageUtils';
import { fetchTeacherProfile, updateTeacherProfile, type TeacherProfile, type TeacherProfileUpdateData } from '@/lib/api';
import { checkSessionAndShowModal } from '@/lib/sessionManager';

// 手机号验证和格式化函数
const validatePhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
  // 移除所有非数字字符
  const digitsOnly = phone.replace(/\D/g, '');
  
  // 检查长度（日本手机号通常是10位或11位）
  if (digitsOnly.length !== 10 && digitsOnly.length !== 11) {
    return {
      isValid: false,
      error: '電話番号は10桁または11桁で入力してください'
    };
  }
  
  return { isValid: true };
};

const formatPhoneNumber = (phone: string): string => {
  // 移除所有非数字字符
  const digitsOnly = phone.replace(/\D/g, '');
  
  // 根据长度格式化
  if (digitsOnly.length === 10) {
    // 10位：xx-xxxx-xxxx
    return `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2, 6)}-${digitsOnly.slice(6)}`;
  } else if (digitsOnly.length === 11) {
    // 11位：xxx-xxxx-xxxx
    return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 7)}-${digitsOnly.slice(7)}`;
  }
  
  // 如果长度不正确，返回原始输入
  return phone;
};

// 使用从 api.ts 导入的 TeacherProfile 类型

interface ProfileEditModalProps {
  opened: boolean;
  onClose: () => void;
  onProfileUpdate?: (profile: TeacherProfile) => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  opened,
  onClose,
  onProfileUpdate
}) => {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // 表单状态
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>('');
  
  // 手机号验证状态
  const [phoneError, setPhoneError] = useState<string>('');
  const [isPhoneValid, setIsPhoneValid] = useState(true);
  
  // 加载状态
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  


  // 加载当前用户资料
  useEffect(() => {
    if (opened && user) {
      loadCurrentProfile();
    }
  }, [opened, user]);

  const loadCurrentProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // 从后端API加载讲师资料
      const currentProfile = await fetchTeacherProfile(user.id);
      
      // 设置表单数据
      setName(currentProfile.name || '');
      setPhone(currentProfile.phone || '');
      setBio(currentProfile.bio || '');
      setPreviewImage(currentProfile.profile_image || '/default_avatar.png');
      
      // 验证已保存的手机号
      if (currentProfile.phone) {
        const validation = validatePhoneNumber(currentProfile.phone);
        if (!validation.isValid) {
          setPhoneError(validation.error!);
          setIsPhoneValid(false);
        } else {
          setPhoneError('');
          setIsPhoneValid(true);
        }
      } else {
        setPhoneError('');
        setIsPhoneValid(true);
      }
    } catch (error) {
      console.error('プロフィール読み込みエラー:', error);
      // 如果获取失败，使用默认值
      setName(user.name || '');
      setPhone('');
      setBio('');
      setPreviewImage('/default_avatar.png');
      setPhoneError('');
      setIsPhoneValid(true);
      
      notifications.show({
        title: 'エラー',
        message: 'プロフィールの読み込みに失敗しました',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

    // 处理手机号输入
  const handlePhoneChange = (value: string) => {
    setPhone(value);
    
    // 如果输入为空，清除错误
    if (!value.trim()) {
      setPhoneError('');
      setIsPhoneValid(true);
      return;
    }
    
    // 验证手机号
    const validation = validatePhoneNumber(value);
    if (!validation.isValid) {
      setPhoneError(validation.error!);
      setIsPhoneValid(false);
    } else {
      setPhoneError('');
      setIsPhoneValid(true);
    }
  };

  // 处理图片上传
  const handleImageUpload = async (file: File | null) => {
    setProfileImage(file);
    
    if (file) {
      // 验证文件
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        notifications.show({
          title: 'エラー',
          message: validation.error!,
          color: 'red'
        });
        return;
      }
      
      try {
        // 自动处理图片为纵向3:2比例
        const processedImage = await compressPromotionalImage(file);
        const base64Image = await blobToBase64(processedImage);
        setPreviewImage(base64Image);
        
        notifications.show({
          title: '画像処理完了',
          message: '画像が自動的に処理されました',
          color: 'green'
        });
      } catch (error) {
        console.error('画像処理エラー:', error);
        notifications.show({
          title: 'エラー',
          message: '画像の処理に失敗しました',
          color: 'red'
        });
      }
    } else {
      // 清除图片时，恢复默认图片
      setPreviewImage('/test.png');
    }
  };



  // 保存资料
  const handleSave = async () => {
    if (!user) {
      notifications.show({
        title: 'エラー',
        message: 'ユーザー情報が取得できません',
        color: 'red'
      });
      return;
    }

    setSaving(true);
    try {
      // 验证输入
      if (!name.trim()) {
        notifications.show({
          title: 'エラー',
          message: '氏名を入力してください',
          color: 'red'
        });
        return;
      }
      
      // 验证手机号
      if (phone.trim() && !isPhoneValid) {
        notifications.show({
          title: 'エラー',
          message: '正しい電話番号を入力してください',
          color: 'red'
        });
        return;
      }

      // 格式化手机号
      const formattedPhone = phone.trim() ? formatPhoneNumber(phone.trim()) : '';
      
      // 获取token
      const token = useAuthStore.getState().token;
      if (!token) {
        notifications.show({
          title: 'エラー',
          message: '認証トークンが見つかりません',
          color: 'red'
        });
        return;
      }

      // 检查登录状态
      const isValid = await checkSessionAndShowModal(token);
      if (!isValid) {
        notifications.show({
          title: 'エラー',
          message: 'セッションが期限切れです。再度ログインしてください。',
          color: 'red'
        });
        return;
      }
       
      // 准备更新数据
      const updateData: TeacherProfileUpdateData = {
        name: name.trim(),
        phone: formattedPhone || null,
        bio: bio.trim() || null,
        profile_image: previewImage || null
      };

      // 调用后端API保存数据
      await updateTeacherProfile(user.id, updateData, token);
      
      // 更新用户store中的name
      if (name !== user.name) {
        useAuthStore.getState().setUser({
          ...user,
          name: name
        }, token);
      }

      // 重新获取更新后的资料
      const updatedProfile = await fetchTeacherProfile(user.id);

      notifications.show({
        title: '保存成功',
        message: 'プロフィールを更新しました',
        color: 'green'
      });

      // 调用回调函数
      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      }

      onClose();
       
    } catch (error) {
      console.error('保存エラー:', error);
      notifications.show({
        title: 'エラー',
        message: error instanceof Error ? error.message : 'プロフィールの保存に失敗しました',
        color: 'red'
      });
    } finally {
      setSaving(false);
    }
  };

  // 跳转到密码修改页面
  const handleChangePassword = () => {
    onClose();
    router.push('/change-password');
  };

  if (loading) {
    return (
      <Modal
        opened={opened}
        onClose={onClose}
        title="プロフィール編集"
        centered
        size="md"
      >
        <Box className="flex items-center justify-center h-32">
          <Loader size="lg" />
          <Text ml="md">プロフィールを読み込み中...</Text>
        </Box>
      </Modal>
    );
  }

    return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title="プロフィール編集"
        centered
        size="lg"
      >
        <Stack gap="lg">
          {/* 宣传图片上传区域 */}
          <Box>
            <Title order={4} mb="md">
              <Group gap="xs">
                <IconUser size={20} />
                講師プロフィール画像
              </Group>
            </Title>
            
            <Stack gap="md">
              {/* 图片预览区域 */}
              <Box>
                <Text size="sm" fw={500} mb="xs">プレビュー</Text>
                                                    <Box
                     style={{
                       width: '100%',
                       height: '400px', // 增加高度以更好地显示纵向图片
                       border: '2px dashed #e0e0e0',
                       borderRadius: '8px',
                       overflow: 'hidden',
                       position: 'relative',
                       backgroundColor: '#f8f9fa'
                     }}
                   >
                  {previewImage ? (
                                         <img
                       src={previewImage}
                       alt="講師プロフィール画像"
                       style={{
                         width: '100%',
                         height: '100%',
                         objectFit: 'contain',
                         objectPosition: 'center'
                       }}
                     />
                  ) : (
                    <Box
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: '#6c757d'
                      }}
                    >
                      <IconUser size={48} />
                      <Text size="sm" mt="xs">画像をアップロードしてください</Text>
                    </Box>
                  )}
                </Box>
              </Box>
              
              {/* 文件上传区域 */}
              <FileInput
                label="画像をアップロード"
                placeholder="講師のプロフィール画像または講座の宣伝画像を選択"
                accept="image/*"
                value={profileImage}
                onChange={handleImageUpload}
                leftSection={<IconUpload size={16} />}
                clearable
              />
              
                             <Text size="xs" c="dimmed">
                 推奨サイズ: JPG/PNG形式、5MB以下
                 <br />
                 講座の宣伝画像や講師の全身写真に適しています
                 <br />
                 画像は自動的に縦向き3:2比率に処理されます
               </Text>
            </Stack>
          </Box>

          <Divider />

          {/* 基本信息编辑区域 */}
          <Box>
            <Title order={4} mb="md">
              <Group gap="xs">
                <IconEdit size={20} />
                基本情報
              </Group>
            </Title>
            
            <Stack gap="md">
              <TextInput
                label="氏名"
                placeholder="例：田中 太郎"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                leftSection={<IconUser size={16} />}
                required
              />
              
                             <TextInput
                 label="電話番号"
                 placeholder="例：090-1234-5678"
                 value={phone}
                 onChange={(e) => handlePhoneChange(e.currentTarget.value)}
                 leftSection={<IconPhone size={16} />}
                 error={phoneError}
                 styles={{
                   input: {
                     borderColor: phoneError ? '#fa5252' : undefined
                   }
                 }}
               />
              
              <Textarea
                label="自己紹介"
                placeholder="自己紹介を入力してください（最大500文字）"
                value={bio}
                onChange={(e) => setBio(e.currentTarget.value)}
                autosize
                minRows={4}
                maxRows={6}
                maxLength={500}
              />
              
              <Text size="xs" c="dimmed" ta="right">
                {bio.length}/500文字
              </Text>
            </Stack>
          </Box>

          <Divider />

          {/* 密码修改区域 */}
          <Box>
            <Title order={4} mb="md">
              <Group gap="xs">
                <IconLock size={20} />
                セキュリティ
              </Group>
            </Title>
            
            <Alert color="blue" variant="light">
              <Text size="sm">
                パスワードの変更は別ページで行います。
                <br />
                セキュリティのため、現在のパスワードの確認が必要です。
              </Text>
            </Alert>
            
            <Button
              variant="outline"
              leftSection={<IconLock size={16} />}
              onClick={handleChangePassword}
              mt="md"
              fullWidth
            >
              パスワードを変更
            </Button>
          </Box>

          <Divider />

          {/* 操作按钮 */}
          <Group justify="flex-end" gap="xs">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button 
              onClick={handleSave}
              loading={saving}
              leftSection={<IconEdit size={16} />}
            >
              保存
            </Button>
          </Group>
        </Stack>
             </Modal>
     </>
   );
};

export default ProfileEditModal;
