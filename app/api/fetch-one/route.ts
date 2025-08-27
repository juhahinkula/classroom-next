import { NextRequest, NextResponse } from 'next/server';
import { cloneAndStart } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repo, index } = body;
    if (!repo || typeof index !== 'number') {
      return NextResponse.json({ error: 'Missing repo or index' }, { status: 400 });
    }
    await cloneAndStart(repo, index);
    const startingPort = parseInt(process.env.STARTING_PORT || '5173');
    const previewPort = startingPort + index;
    const row = {
      preview: {
        name: repo.name,
        url: `http://localhost:${previewPort}`
      },
      rosterIdentifier: repo.roster_identifier || '',
      githubUsername: repo.github_username || '',
      pointsAwarded: repo.points_awarded ?? '',
      repositoryUrl: repo.clone_url || ''
    };
    return NextResponse.json(row);
  } catch (error) {
    console.error('Error in fetch-one:', error);
    return NextResponse.json({ error: 'Failed to process repo' }, { status: 500 });
  }
}
