import { NextResponse } from 'next/server';
import axios from 'axios';

// List GitHub orgs the token belongs to that have a classroom50 repo.
// ponytail: probe each org in parallel; filter to those that have it.
export async function GET() {
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_CLASSROOM_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
  }

  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github+json',
  };

  try {
    const { data: orgs } = await axios.get('https://api.github.com/user/orgs?per_page=100', { headers });

    const results = await Promise.all(
      (orgs as any[]).map(async (org) => {
        try {
          await axios.get(`https://api.github.com/repos/${org.login}/classroom50`, { headers });
          return { login: org.login, avatar_url: org.avatar_url };
        } catch {
          return null;
        }
      })
    );

    return NextResponse.json(results.filter(Boolean));
  } catch (error) {
    console.error('Error fetching orgs:', error);
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
}
