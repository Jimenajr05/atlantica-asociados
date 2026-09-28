import { NextResponse } from 'next/server';
import { getAllCases } from '@/lib/cases-store';

export async function GET() {
  try {
    const cases = await getAllCases();
    return NextResponse.json({ success: true, cases });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
