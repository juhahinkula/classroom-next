import { NextRequest, NextResponse } from 'next/server';
import { fetchStudentRepos, StudentRepo } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const org = searchParams.get('org');
  const classroomSlug = searchParams.get('classroomSlug');
  const assignmentSlug = searchParams.get('assignmentSlug');
  const studentUsername = searchParams.get('studentUsername');

  if (!org || !classroomSlug || !assignmentSlug) {
    return NextResponse.json({ error: 'org, classroomSlug and assignmentSlug are required' }, { status: 400 });
  }

  try {
    const repos: StudentRepo[] = await fetchStudentRepos(org, classroomSlug, assignmentSlug);

    const filteredRepos = studentUsername && studentUsername !== 'all'
      ? repos.filter((repo) => repo.github_username === studentUsername)
      : repos;

    return NextResponse.json(filteredRepos);
  } catch (error) {
    console.error('Error fetching student repositories:', error);
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 });
  }
}
