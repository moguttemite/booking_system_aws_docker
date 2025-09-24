import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'public', 'bookable.json');

/**
 * 获取所有可预约的讲座
 * @param req 请求对象
 * @returns 讲座列表
 */
export async function GET(req: NextRequest) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    let lectures = JSON.parse(data);
    // 保持原有的lecture_id字段，同时添加id字段以兼容
    lectures = lectures.map((item: any) => ({
      ...item,
      id: item.lecture_id,
      lecture_id: item.lecture_id, // 确保lecture_id字段存在
    }));
    const total = lectures.length;
    const res = NextResponse.json(lectures);
    res.headers.set('Content-Range', `lectures 0-${total - 1}/${total}`);
    res.headers.set('Access-Control-Expose-Headers', 'Content-Range');
    return res;
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read lectures' }, { status: 500 });
  }
}
