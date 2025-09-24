import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 读取lecture_teachers.json文件
function readLectureTeachers() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'lecture_teachers.json');
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading lecture_teachers.json:', error);
    return [];
  }
}

// 写入lecture_teachers.json文件
function writeLectureTeachers(data: any[]) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'lecture_teachers.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing lecture_teachers.json:', error);
    return false;
  }
}

// GET - 获取讲座-讲师对应关系
export async function GET() {
  try {
    const data = readLectureTeachers();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch lecture teachers' }, { status: 500 });
  }
}

// PUT - 更新讲座-讲师对应关系
export async function PUT(req: NextRequest) {
  try {
    const { lectureId, teacherIds } = await req.json();
    
    console.log('Updating lecture teachers:', { lectureId, teacherIds });
    
    // 读取当前数据
    const currentData = readLectureTeachers();
    
    // 删除该讲座的所有现有记录
    const filteredData = currentData.filter((item: any) => item.lecture_id !== lectureId);
    
    // 为每个选中的讲师创建新记录
    const newRecords = teacherIds.map((teacherId: number) => ({
      lecture_id: lectureId,
      teacher_ids: teacherId
    }));
    
    // 合并数据
    const updatedData = [...filteredData, ...newRecords];
    
    console.log('Updated data:', updatedData);
    
    // 写入文件
    const success = writeLectureTeachers(updatedData);
    
    if (success) {
      return NextResponse.json({ 
        message: 'Lecture teachers updated successfully',
        data: updatedData 
      });
    } else {
      return NextResponse.json({ error: 'Failed to write to file' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating lecture teachers:', error);
    return NextResponse.json({ error: 'Failed to update lecture teachers' }, { status: 500 });
  }
}