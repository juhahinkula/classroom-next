import { NextRequest, NextResponse } from 'next/server';
import { fetchStudentRepos, StudentRepo } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const assignmentId = searchParams.get('assignmentId');
  const studentUsername = searchParams.get('studentUsername');
  
  if (!assignmentId) {
    return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
  }

  try {
    const repos: StudentRepo[] = await fetchStudentRepos(assignmentId);
    
    // Filter by student if specified
    const filteredRepos = studentUsername && studentUsername !== 'all' 
      ? repos.filter(repo => repo.github_username === studentUsername)
      : repos;
    
    return NextResponse.json(filteredRepos);
  } catch (error) {
    console.error('Error fetching student repositories:', error);
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 });
  }
}
