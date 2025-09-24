import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

type LectureScheduleRecord = {
  id: number;
  lecture_id: number;
  teacher_id: number;
  date: string;         // e.g. "2025-07-21"
  start: string;        // e.g. "10:00"
  end: string;          // e.g. "12:00"
  created_at: string;   // ISO datetime string, e.g. "2025-07-01T12:00:00Z"
};

const filePath = path.join(process.cwd(), 'public', 'lecture_schedules.json');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // body 应该包含 lecture_id, teacher_id, date, start, end
    let existing: LectureScheduleRecord[] = [];
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      existing = JSON.parse(data);
    } catch {
      existing = [];
    }

    // 生成唯一id
    let newId: number;
    do {
      newId = Math.floor(Math.random() * 1e9);
    } while (existing.some(r => r.id === newId));

    const now = new Date().toISOString();
    const newRecord: LectureScheduleRecord = {
      id: newId,
      lecture_id: body.lecture_id,
      teacher_id: body.teacher_id,
      date: body.date,
      start: body.start,
      end: body.end,
      created_at: now,
    };

    const updated = [...existing, newRecord];
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf-8');

    return NextResponse.json({ success: true, record: newRecord });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
} 