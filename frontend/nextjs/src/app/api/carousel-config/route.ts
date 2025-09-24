import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 获取轮播图配置
export async function GET() {
  try {
    const configPath = path.join(process.cwd(), 'public', 'mock', 'carousel-config.json');
    const data = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(data);
    
    // 如果数据是数组格式，包装成对象格式返回
    if (Array.isArray(config)) {
      return NextResponse.json({ carousel_items: config });
    }
    
    // 如果数据是对象格式，直接返回
    return NextResponse.json(config);
  } catch (error) {
    console.error('輪播図設定読み込みエラー:', error);
    return NextResponse.json(
      { error: '設定の読み込みに失敗しました' },
      { status: 500 }
    );
  }
}

// 保存轮播图配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { carousel_items } = body;

    // 验证数据
    if (!carousel_items || !Array.isArray(carousel_items)) {
      return NextResponse.json(
        { error: '無効なデータ形式です' },
        { status: 400 }
      );
    }

    // 准备保存的数据 - 直接保存为数组格式
    const saveData = carousel_items.map((item: any, index: number) => ({
      lecture_id: item.lecture_id,
      display_order: item.display_order || index + 1,
      is_active: item.is_active !== false // 默认为true
    }));

    // 保存到文件
    const configPath = path.join(process.cwd(), 'public', 'mock', 'carousel-config.json');
    fs.writeFileSync(configPath, JSON.stringify(saveData, null, 2), 'utf8');

    console.log('輪播図設定を保存しました:', saveData);

    return NextResponse.json({
      success: true,
      message: '輪播図設定を保存しました',
      data: { carousel_items: saveData }
    });

  } catch (error) {
    console.error('輪播図設定保存エラー:', error);
    return NextResponse.json(
      { error: '設定の保存に失敗しました' },
      { status: 500 }
    );
  }
}
