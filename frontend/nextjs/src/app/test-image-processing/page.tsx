'use client';
import { useState } from 'react';
import { Box, Title, Text, Card, Stack, Button, FileInput } from '@mantine/core';
import { IconUpload, IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { validateImageFile, compressPromotionalImage, blobToBase64 } from '@/lib/imageUtils';
import { notifications } from '@mantine/notifications';

const TestImageProcessingPage = () => {
  const router = useRouter();
  const [originalImage, setOriginalImage] = useState<string>('');
  const [processedImage, setProcessedImage] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleImageUpload = async (file: File | null) => {
    if (!file) {
      setOriginalImage('');
      setProcessedImage('');
      return;
    }

    // 显示原始图片
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

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

    setProcessing(true);
    try {
      // 处理图片
      const processedBlob = await compressPromotionalImage(file);
      const base64Image = await blobToBase64(processedBlob);
      setProcessedImage(base64Image);
      
      notifications.show({
        title: '処理完了',
        message: '画像が縦向き3:2比率に処理されました',
        color: 'green'
      });
    } catch (error) {
      console.error('画像処理エラー:', error);
      notifications.show({
        title: 'エラー',
        message: '画像の処理に失敗しました',
        color: 'red'
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box p="xl">
      <Button
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        onClick={handleBack}
        mb="lg"
      >
        戻る
      </Button>

      <Stack gap="lg">
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Title order={2} mb="lg">画像処理テスト</Title>
          
          <Text c="dimmed" mb="lg">
            このページでは、画像の自動処理機能をテストできます。
            <br />
            縦向き3:2比率（800x1200px）に自動変換されます。
          </Text>

          <FileInput
            label="画像をアップロード"
            placeholder="テスト用の画像を選択"
            accept="image/*"
            onChange={handleImageUpload}
            leftSection={<IconUpload size={16} />}
            clearable
          />
        </Card>

        {/* 原始图片 */}
        {originalImage && (
          <Card shadow="sm" padding="xl" radius="md" withBorder>
            <Stack gap="md">
              <Title order={3}>元の画像</Title>
              <Box
                style={{
                  width: '100%',
                  height: '300px',
                  border: '2px dashed #e0e0e0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#f8f9fa'
                }}
              >
                <img
                  src={originalImage}
                  alt="元の画像"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    objectPosition: 'center'
                  }}
                />
              </Box>
            </Stack>
          </Card>
        )}

        {/* 处理后的图片 */}
        {processedImage && (
          <Card shadow="sm" padding="xl" radius="md" withBorder>
            <Stack gap="md">
              <Title order={3}>処理後の画像（縦向き3:2比率）</Title>
              <Box
                style={{
                  width: '100%',
                  height: '400px',
                  border: '2px dashed #e0e0e0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#f8f9fa'
                }}
              >
                <img
                  src={processedImage}
                  alt="処理後の画像"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    objectPosition: 'center'
                  }}
                />
              </Box>
              <Text size="sm" c="dimmed">
                サイズ: 800x1200px、品質: 85%、形式: JPG
              </Text>
            </Stack>
          </Card>
        )}

        {processing && (
          <Card shadow="sm" padding="xl" radius="md" withBorder>
            <Text ta="center" c="blue">画像を処理中...</Text>
          </Card>
        )}
      </Stack>
    </Box>
  );
};

export default TestImageProcessingPage;
