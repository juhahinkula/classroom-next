import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface StudentOption {
  roster_identifier: string;
  github_username: string;
  name: string;
}

// Students come from the classroom's roster.csv (not per-assignment; classroom50 has no grades API).
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
      `https://api.github.com/repos/${org}/classroom50/contents/${classroomSlug}/roster.csv`,
      { headers }
    );
    const csv = Buffer.from(file.content, 'base64').toString('utf-8');
    const [header, ...rows] = csv.trim().split('\n');
    const cols = header.split(',').map((c) => c.trim());
    const usernameIdx = cols.indexOf('username');
    const emailIdx = cols.indexOf('email');
    const firstNameIdx = cols.indexOf('first_name');
    const lastNameIdx = cols.indexOf('last_name');
    const roleIdx = cols.indexOf('role');

    const students: StudentOption[] = rows
      .map((row) => row.split(',').map((c) => c.trim()))
      .filter((cells) => cells[usernameIdx])
      .filter((cells) => roleIdx < 0 || cells[roleIdx] === 'student') // exclude teacher/TA rows
      .map((cells) => {
        const username = cells[usernameIdx];
        const email = emailIdx >= 0 ? cells[emailIdx] : '';
        const first = firstNameIdx >= 0 ? cells[firstNameIdx] : '';
        const last = lastNameIdx >= 0 ? cells[lastNameIdx] : '';
        const displayName = [first, last].filter(Boolean).join(' ') || email || username;
        return {
          roster_identifier: email || username,
          github_username: username,
          name: displayName,
        };
      });

    const studentOptions: StudentOption[] = [
      { roster_identifier: '', github_username: 'all', name: 'All Students' },
      ...students,
    ];

    return NextResponse.json(studentOptions);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json([], { status: 200 });
  }
}
