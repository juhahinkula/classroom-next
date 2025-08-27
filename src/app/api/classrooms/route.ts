import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_CLASSROOM_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };

  try {
    const response = await axios.get('https://api.github.com/classrooms', { headers });
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    return NextResponse.json([], { status: 200 });
  }
}
