import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// 预约记录类型
interface SimplifiedReservationRecord {
  user_id: number;
  lecture_id: number;
  teacher_id: number;     // 讲师ID - 预约的讲师唯一标识
  status: string;
  reserved_date: string;
  start_time: string;
  end_time: string;
}

const filePath = path.join(process.cwd(), 'public', 'lecture_reservations.json');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newReservation: SimplifiedReservationRecord = body;

    // 读取已有数据
    let existing: SimplifiedReservationRecord[] = [];
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      existing = JSON.parse(data);
    } catch {
      existing = [];
    }

    // 追加新预约
    const updated = [...existing, newReservation];
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, lecture_id, reserved_date, start_time } = body;
    let existing: SimplifiedReservationRecord[] = [];
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      existing = JSON.parse(data);
    } catch {
      existing = [];
    }
    // 删除匹配的预约
    const updated = existing.filter(r =>
      !(r.user_id === user_id &&
        r.lecture_id === lecture_id &&
        r.reserved_date === reserved_date &&
        r.start_time === start_time)
    );
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
} 