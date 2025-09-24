import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface LectureScheduleRecord {
  id: number;
  lecture_id: number;
  teacher_id: number;
  date: string;
  start: string;
  end: string;
  created_at: string;
}

// 获取lecture_schedules.json文件路径
const getFilePath = () => {
  return path.join(process.cwd(), 'public', 'lecture_schedules.json');
};

// 读取所有时间安排
export async function GET() {
  try {
    const filePath = getFilePath();
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const schedules = JSON.parse(fileContent);
    return NextResponse.json(schedules);
  } catch (error) {
    console.error('读取lecture_schedules.json失败:', error);
    return NextResponse.json({ error: '读取失败' }, { status: 500 });
  }
}

// 添加新的时间安排
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schedules } = body; // 期望接收一个schedules数组

    if (!Array.isArray(schedules)) {
      return NextResponse.json({ error: '无效的数据格式' }, { status: 400 });
    }

    const filePath = getFilePath();
    
    // 读取现有数据
    let existingSchedules: LectureScheduleRecord[] = [];
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      existingSchedules = JSON.parse(fileContent);
    } catch (error) {
      // 如果文件不存在或为空，使用空数组
      existingSchedules = [];
    }

    // 添加新的时间安排
    const updatedSchedules = [...existingSchedules, ...schedules];

    // 写入文件
    await fs.writeFile(filePath, JSON.stringify(updatedSchedules, null, 2), 'utf-8');

    return NextResponse.json({ 
      success: true, 
      message: `${schedules.length}件の時間枠を保存しました`,
      totalCount: updatedSchedules.length 
    });
  } catch (error) {
    console.error('保存lecture_schedules.json失败:', error);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}

// 删除时间安排
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('id');

    if (!scheduleId) {
      return NextResponse.json({ error: '缺少schedule ID' }, { status: 400 });
    }

    const filePath = getFilePath();
    
    // 读取现有数据
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const existingSchedules: LectureScheduleRecord[] = JSON.parse(fileContent);

    // 过滤掉要删除的时间安排
    const updatedSchedules = existingSchedules.filter(schedule => schedule.id !== parseInt(scheduleId));

    // 写入文件
    await fs.writeFile(filePath, JSON.stringify(updatedSchedules, null, 2), 'utf-8');

    return NextResponse.json({ 
      success: true, 
      message: '時間枠を削除しました',
      totalCount: updatedSchedules.length 
    });
  } catch (error) {
    console.error('删除lecture_schedules.json记录失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
