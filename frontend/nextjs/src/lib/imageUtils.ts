// 图片处理工具函数

/**
 * 压缩图片到指定尺寸和质量
 * @param file 原始图片文件
 * @param maxWidth 最大宽度
 * @param maxHeight 最大高度
 * @param quality 图片质量 (0-1)
 * @returns Promise<Blob> 压缩后的图片
 */
export const compressImage = (
  file: File, 
  maxWidth: number = 1200, 
  maxHeight: number = 800, 
  quality: number = 0.85
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 强制输出为指定尺寸
      canvas.width = maxWidth;
      canvas.height = maxHeight;
      
      // 计算图片在canvas中的位置和尺寸，保持比例并居中
      const imgAspectRatio = img.width / img.height;
      const canvasAspectRatio = maxWidth / maxHeight;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imgAspectRatio > canvasAspectRatio) {
        // 图片比canvas更宽，以高度为准
        drawHeight = maxHeight;
        drawWidth = maxHeight * imgAspectRatio;
        drawX = (maxWidth - drawWidth) / 2;
        drawY = 0;
      } else {
        // 图片比canvas更高，以宽度为准
        drawWidth = maxWidth;
        drawHeight = maxWidth / imgAspectRatio;
        drawX = 0;
        drawY = (maxHeight - drawHeight) / 2;
      }
      
      // 绘制图片，居中显示
      ctx?.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      
      // 转换为blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('画像の圧縮に失敗しました'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => {
      reject(new Error('画像の読み込みに失敗しました'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * 将Blob转换为Base64字符串
 * @param blob 图片blob
 * @returns Promise<string> Base64字符串
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(new Error('画像の変換に失敗しました'));
    };
    reader.readAsDataURL(blob);
  });
};

/**
 * 验证图片文件
 * @param file 文件对象
 * @param maxSize 最大文件大小 (bytes)
 * @returns { isValid: boolean, error?: string }
 */
export const validateImageFile = (file: File, maxSize: number = 5 * 1024 * 1024) => {
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: '画像ファイルを選択してください'
    };
  }
  
  // 检查文件大小
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `画像サイズは${Math.round(maxSize / 1024 / 1024)}MB以下にしてください`
    };
  }
  
  return { isValid: true };
};

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 压缩宣传图片（纵向3:2比例，适合讲座海报）
 * @param file 原始图片文件
 * @returns Promise<Blob> 压缩后的图片
 */
export const compressPromotionalImage = (file: File): Promise<Blob> => {
  // 纵向3:2比例，800x1200px
  return compressImage(file, 800, 1200, 0.85);
};

/**
 * 压缩头像图片（适合个人头像）
 * @param file 原始图片文件
 * @returns Promise<Blob> 压缩后的图片
 */
export const compressAvatarImage = (file: File): Promise<Blob> => {
  return compressImage(file, 400, 400, 0.9);
};

/**
 * 裁剪图片到指定区域
 * @param imageSrc 图片源
 * @param cropX 裁剪X坐标
 * @param cropY 裁剪Y坐标
 * @param cropWidth 裁剪宽度
 * @param cropHeight 裁剪高度
 * @param targetWidth 目标宽度
 * @param targetHeight 目标高度
 * @param quality 图片质量
 * @returns Promise<Blob> 裁剪后的图片
 */
export const cropImage = (
  imageSrc: string,
  cropX: number,
  cropY: number,
  cropWidth: number,
  cropHeight: number,
  targetWidth: number = 1200,
  targetHeight: number = 800,
  quality: number = 0.85
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 设置canvas尺寸为目标尺寸
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      // 绘制裁剪后的图片
      ctx?.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight,  // 源图片裁剪区域
        0, 0, targetWidth, targetHeight        // 目标区域
      );
      
      // 转换为blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('画像のクロップに失敗しました'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => {
      reject(new Error('画像の読み込みに失敗しました'));
    };
    
    img.src = imageSrc;
  });
};

/**
 * 计算纵向3:2比例的尺寸
 * @param width 原始宽度
 * @param height 原始高度
 * @returns { width: number, height: number } 纵向3:2比例的尺寸
 */
export const calculateAspectRatio = (width: number, height: number) => {
  const targetRatio = 2 / 3; // 纵向3:2比例
  const currentRatio = width / height;
  
  if (currentRatio > targetRatio) {
    // 图片太宽，以高度为准
    return {
      width: Math.round(height * targetRatio),
      height: height
    };
  } else {
    // 图片太高，以宽度为准
    return {
      width: width,
      height: Math.round(width / targetRatio)
    };
  }
};
