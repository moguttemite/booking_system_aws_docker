import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'public', 'bookable.json');

// 更新讲座信息（包括承认状况）
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lectureId = parseInt(params.id);
    
    if (isNaN(lectureId)) {
      return NextResponse.json(
        { error: '無効な講座IDです' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { approval_status } = body;

    if (!approval_status || !['approved', 'pending', 'rejected'].includes(approval_status)) {
      return NextResponse.json(
        { error: '無効な承認状況です' },
        { status: 400 }
      );
    }

    // 读取现有数据
    const fileData = await fs.readFile(filePath, 'utf-8');
    const lectures = JSON.parse(fileData);

    // 查找要更新的讲座
    const lectureIndex = lectures.findIndex((lecture: any) => lecture.lecture_id === lectureId);
    
    if (lectureIndex === -1) {
      return NextResponse.json(
        { error: '講座が見つかりません' },
        { status: 404 }
      );
    }

    // 更新承认状况
    lectures[lectureIndex].approval_status = approval_status;

    // 写回文件
    await fs.writeFile(filePath, JSON.stringify(lectures, null, 2), 'utf-8');

    return NextResponse.json({ 
      success: true, 
      message: '承認状況を更新しました',
      data: lectures[lectureIndex]
    });
  } catch (err: any) {
    console.error('承認状況更新エラー:', err);
    return NextResponse.json(
      { error: '承認状況の更新中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lectureId = parseInt(params.id);
    
    if (isNaN(lectureId)) {
      return NextResponse.json(
        { error: '無効な講座IDです' },
        { status: 400 }
      );
    }

    // 读取现有数据
    const fileData = await fs.readFile(filePath, 'utf-8');
    const lectures = JSON.parse(fileData);

    // 查找要删除的讲座
    const lectureIndex = lectures.findIndex((lecture: any) => lecture.lecture_id === lectureId);
    
    if (lectureIndex === -1) {
      return NextResponse.json(
        { error: '講座が見つかりません' },
        { status: 404 }
      );
    }

    // 检查是否为複数講師讲座
    const lecture = lectures[lectureIndex];
    if (lecture.teacher_name !== "複数講師") {
      return NextResponse.json(
        { error: '複数講師講座のみ削除可能です' },
        { status: 403 }
      );
    }

    // 删除讲座
    lectures.splice(lectureIndex, 1);

    // 写回文件
    await fs.writeFile(filePath, JSON.stringify(lectures, null, 2), 'utf-8');

    return NextResponse.json({ 
      success: true, 
      message: '講座を削除しました' 
    });
  } catch (err: any) {
    console.error('講座削除エラー:', err);
    return NextResponse.json(
      { error: '講座の削除中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 