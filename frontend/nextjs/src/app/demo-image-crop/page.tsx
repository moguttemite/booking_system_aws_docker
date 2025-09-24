'use client';
import { useState } from 'react';
import { Box, Title, Text, Card, Stack, Button, Alert } from '@mantine/core';
import { IconArrowLeft, IconPhoto, IconCrop } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import ImageCropper from '@/components/teacher/ImageCropper';

const DemoImageCropPage = () => {
  const router = useRouter();
  const [showCropper, setShowCropper] = useState(false);
  const [demoImage, setDemoImage] = useState('/test.png');
  const [croppedImage, setCroppedImage] = useState<string>('');

  const handleBack = () => {
    router.back();
  };

  const handleStartCrop = () => {
    setShowCropper(true);
  };

  const handleCropComplete = (image: string) => {
    setCroppedImage(image);
    setShowCropper(false);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
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
          <Stack gap="lg">
            <Title order={2}>
              <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconCrop size={24} />
                画像クロップ機能デモ
              </Box>
            </Title>
            
                         <Text c="dimmed">
               このページでは、講師プロフィール画像のクロップ機能をデモンストレーションします。
               <br />
               縦向き3:2の固定比率で、画像をドラッグ、ズーム、回転して調整できます。
             </Text>

            <Alert color="blue" variant="light">
              <Text size="sm">
                <strong>機能:</strong>
                <br />
                • 画像のドラッグ移動
                <br />
                                 • ズームイン/アウト（10% - 500%）
                <br />
                • 90度回転
                <br />
                                 • 縦向き3:2比率での自動クロップ
                <br />
                • リアルタイムプレビュー
              </Text>
            </Alert>

            <Button
              size="lg"
              leftSection={<IconPhoto size={20} />}
              onClick={handleStartCrop}
            >
              クロップ機能を試す
            </Button>
          </Stack>
        </Card>

        {/* 裁剪结果展示 */}
        {croppedImage && (
          <Card shadow="sm" padding="xl" radius="md" withBorder>
            <Stack gap="md">
              <Title order={3}>クロップ結果</Title>
                             <Box
                 style={{
                   width: '100%',
                   height: '450px', // 增加高度以适应纵向3:2比例
                   border: '2px dashed #e0e0e0',
                   borderRadius: '8px',
                   overflow: 'hidden',
                   position: 'relative',
                   backgroundColor: '#f8f9fa',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center'
                 }}
               >
                                 <img
                   src={croppedImage}
                   alt="クロップ結果"
                   style={{
                     maxWidth: '100%',
                     maxHeight: '100%',
                     width: 'auto',
                     height: 'auto',
                     objectFit: 'contain',
                     objectPosition: 'center'
                   }}
                 />
              </Box>
                             <Text size="sm" c="dimmed">
                 縦向き3:2比率（800x1200px）でクロップされました
               </Text>
            </Stack>
          </Card>
        )}
      </Stack>

      {/* 图片裁剪模态框 */}
             <ImageCropper
         imageSrc={demoImage}
         onCrop={handleCropComplete}
         onCancel={handleCropCancel}
         aspectRatio={0.667} // 纵向3:2比例
       />
    </Box>
  );
};

export default DemoImageCropPage;
