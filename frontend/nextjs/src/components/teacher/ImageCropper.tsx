import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Group, Button, Slider, Text, Stack } from '@mantine/core';
import { IconZoomIn, IconZoomOut, IconRotate, IconCrop } from '@tabler/icons-react';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  imageSrc: string;
  onCrop: (croppedImage: string) => void;
  onCancel: () => void;
  aspectRatio?: number; // 纵向3:2 = 0.667
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  imageSrc,
  onCrop,
  onCancel,
  aspectRatio = 0.667 // 纵向3:2比例
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // 计算裁剪区域
  const getCropArea = useCallback((): CropArea => {
    if (!containerRef.current || !imageRef.current) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const container = containerRef.current.getBoundingClientRect();
    const image = imageRef.current.getBoundingClientRect();
    
    // 计算裁剪框的位置和大小
    const cropWidth = container.width;
    const cropHeight = container.height;
    
    // 计算图片在裁剪框中的相对位置
    const cropX = (container.left - image.left + position.x) / scale;
    const cropY = (container.top - image.top + position.y) / scale;
    
    return {
      x: Math.max(0, cropX),
      y: Math.max(0, cropY),
      width: Math.min(cropWidth / scale, imageSize.width - cropX),
      height: Math.min(cropHeight / scale, imageSize.height - cropY)
    };
  }, [position, scale, imageSize]);

  // 图片加载完成
  const handleImageLoad = () => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      setImageSize({ width: naturalWidth, height: naturalHeight });
      setImageLoaded(true);
      
      // 初始化位置，使图片居中
      if (containerRef.current) {
        const container = containerRef.current.getBoundingClientRect();
        const image = imageRef.current.getBoundingClientRect();
        setPosition({
          x: (container.width - image.width) / 2,
          y: (container.height - image.height) / 2
        });
      }
    }
  };

  // 鼠标事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 缩放处理
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5)); // 增加最大缩放比例到5倍
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.1)); // 减小最小缩放比例到0.1倍
  };

  // 旋转处理
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // 确认裁剪
  const handleConfirmCrop = async () => {
    if (!imageRef.current) return;

    const cropArea = getCropArea();
    
    // 创建canvas进行裁剪
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // 设置canvas尺寸为纵向3:2比例
    canvas.width = 800;
    canvas.height = 1200;

    // 绘制裁剪后的图片
    ctx.drawImage(
      imageRef.current,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, canvas.width, canvas.height
    );

    // 转换为base64
    const croppedImage = canvas.toDataURL('image/jpeg', 0.85);
    onCrop(croppedImage);
  };

  // 重置
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    if (containerRef.current && imageRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      const image = imageRef.current.getBoundingClientRect();
      setPosition({
        x: (container.width - image.width) / 2,
        y: (container.height - image.height) / 2
      });
    }
  };

  return (
    <Box>
      <Stack gap="md">
        {/* 裁剪区域 */}
                 <Box
           ref={containerRef}
           style={{
             width: '100%',
             height: '600px', // 增加高度以适应纵向3:2比例
             border: '2px dashed #e0e0e0',
             borderRadius: '8px',
             overflow: 'hidden',
             position: 'relative',
             backgroundColor: '#f8f9fa',
             cursor: isDragging ? 'grabbing' : 'grab'
           }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {imageSrc && (
            <img
              ref={imageRef}
              src={imageSrc}
              alt="裁剪対象画像"
              style={{
                position: 'absolute',
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center',
                maxWidth: 'none',
                maxHeight: 'none',
                userSelect: 'none',
                pointerEvents: 'none'
              }}
              onLoad={handleImageLoad}
            />
          )}
          
                     {/* 裁剪框指示器 */}
           <Box
             style={{
               position: 'absolute',
               top: '50%',
               left: '50%',
               transform: 'translate(-50%, -50%)',
               width: '60%', // 调整宽度以适应纵向比例
               height: '90%', // 调整高度以适应纵向比例
               border: '2px solid #007bff',
               borderRadius: '4px',
               pointerEvents: 'none',
               boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)'
             }}
           />
        </Box>

        {/* 控制面板 */}
        <Stack gap="sm">
          {/* 缩放控制 */}
          <Group gap="xs">
            <Text size="sm" fw={500}>ズーム:</Text>
            <Button
              variant="outline"
              size="xs"
              leftSection={<IconZoomOut size={14} />}
              onClick={handleZoomOut}
            >
              縮小
            </Button>
            <Text size="sm">{Math.round(scale * 100)}%</Text>
            <Button
              variant="outline"
              size="xs"
              leftSection={<IconZoomIn size={14} />}
              onClick={handleZoomIn}
            >
              拡大
            </Button>
          </Group>

                     {/* 缩放滑块 */}
           <Slider
             value={scale}
             onChange={setScale}
             min={0.1}
             max={5}
             step={0.1}
             label={(value) => `${Math.round(value * 100)}%`}
             size="sm"
           />

          {/* 操作按钮 */}
          <Group gap="xs">
            <Button
              variant="outline"
              size="sm"
              leftSection={<IconRotate size={16} />}
              onClick={handleRotate}
            >
              回転
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
            >
              リセット
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
            >
              キャンセル
            </Button>
            <Button
              size="sm"
              leftSection={<IconCrop size={16} />}
              onClick={handleConfirmCrop}
              disabled={!imageLoaded}
            >
              クロップ確定
            </Button>
          </Group>

                     {/* 提示信息 */}
           <Text size="xs" c="dimmed">
             画像をドラッグして位置を調整し、ズームでサイズを変更できます。
             <br />
             縦向き3:2の比率で自動的にクロップされます。
           </Text>
        </Stack>
      </Stack>
    </Box>
  );
};

export default ImageCropper;
