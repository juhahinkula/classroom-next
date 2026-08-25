import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const org = searchParams.get('org');
  const classroomSlug = searchParams.get('classroomSlug');

  if (!org || !classroomSlug) {
    return NextResponse.json({ error: 'org and classroomSlug are required' }, { status: 400 });
  }

  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_CLASSROOM_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
  }

  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github+json',
  };

  try {
    const { data: file } = await axios.get(
      `https://api.github.com/repos/${org}/classroom50/contents/${classroomSlug}/assignments.json`,
      { headers }
    );
    // assignments.json is { schema, assignments: [...] }, not a bare array
    const parsed = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
    return NextResponse.json(parsed.assignments ?? []);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json([], { status: 200 });
  }
}
