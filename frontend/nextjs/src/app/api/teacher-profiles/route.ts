import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'public', 'mock', 'teacher_profiles.json');

export async function GET() {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const profiles = JSON.parse(data);
    return NextResponse.json(profiles);
  } catch (err) {
    return NextResponse.json(
      { error: '講師プロフィールデータの読み込みに失敗しました' },
      { status: 500 }
    );
  }
}

