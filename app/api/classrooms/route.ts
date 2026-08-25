import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Classrooms are subdirectories in <org>/classroom50 repo, each with classroom.json
export async function GET(request: NextRequest) {
  const org = request.nextUrl.searchParams.get('org');
  if (!org) {
    return NextResponse.json({ error: 'org is required' }, { status: 400 });
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
    const { data: entries } = await axios.get(
      `https://api.github.com/repos/${org}/classroom50/contents/`,
      { headers }
    );

    const dirs = (entries as any[]).filter((e) => e.type === 'dir');

    const classrooms = await Promise.all(
      dirs.map(async (dir) => {
        try {
          const { data: file } = await axios.get(
            `https://api.github.com/repos/${org}/classroom50/contents/${dir.name}/classroom.json`,
            { headers }
          );
          const meta = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
          return { slug: dir.name, name: meta.name ?? dir.name, term: meta.term ?? '' };
        } catch {
          // No classroom.json means this isn't a classroom directory (e.g. .github)
          return null;
        }
      })
    );

    return NextResponse.json(classrooms.filter(Boolean));
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    return NextResponse.json([], { status: 200 });
  }
}
