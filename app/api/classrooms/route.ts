import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  const githubClassroomToken = process.env.GITHUB_CLASSROOM_TOKEN;
  
  if (!githubClassroomToken) {
    return NextResponse.json({ error: 'GitHub Classroom token not configured' }, { status: 500 });
  }

  const headers = {
    Authorization: `token ${githubClassroomToken}`,
    Accept: 'application/vnd.github.v3+json',
  };

  try {
    const response = await axios.get('https://api.github.com/classrooms', { headers });
    // Filter to only show active classrooms
    const activeClassrooms = response.data.filter((classroom: any) => classroom.archived === false);
    return NextResponse.json(activeClassrooms);
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    return NextResponse.json([], { status: 200 });
  }
}
