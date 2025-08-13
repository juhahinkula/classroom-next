import { NextRequest, NextResponse } from 'next/server';
import { fetchStudentRepos, cloneAndStart } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const assignmentId = searchParams.get('assignmentId');
  
  if (!assignmentId) {
    return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
  }

  const startingPort = parseInt(process.env.STARTING_PORT || '5173');

  try {
    const repos = await fetchStudentRepos(assignmentId);
    
    // Start cloning and building repositories in parallel
    await Promise.all(repos.map((repo: any, i: number) => cloneAndStart(repo, i)));
    
    const rowData = repos.map((repo: any, i: number) => {
      const previewPort = startingPort + i;
      return {
        preview: {
          name: repo.name,
          url: `http://localhost:${previewPort}`
        },
        rosterIdentifier: repo.roster_identifier || '',
        githubUsername: repo.github_username || '',
        pointsAwarded: repo.points_awarded ?? '',
        repositoryUrl: repo.clone_url || ''
      };
    });

    return NextResponse.json(rowData);
  } catch (error) {
    console.error('Error fetching student repositories:', error);
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 });
  }
}
