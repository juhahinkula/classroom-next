import { NextRequest, NextResponse } from 'next/server';
import { fetchStudentRepos } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const assignmentId = searchParams.get('assignmentId');
  
  if (!assignmentId) {
    return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
  }

  try {
    const repos = await fetchStudentRepos(assignmentId);
    
    return NextResponse.json(repos);
  } catch (error) {
    console.error('Error fetching student repositories:', error);
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 });
  }
}
