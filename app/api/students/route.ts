import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface StudentGrade {
  roster_identifier: string;
  github_username: string;
  student_repository_url: string;
  points_awarded: number;
}

interface StudentOption {
  roster_identifier: string;
  github_username: string;
  name: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const assignmentId = searchParams.get('assignmentId');
  
  if (!assignmentId) {
    return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
  }

  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_CLASSROOM_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
  }

  const url = `https://api.github.com/assignments/${assignmentId}/grades`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
  };

  try {
    const response = await axios.get<StudentGrade[]>(url, { headers });
    
    // Extract unique students from the grades
    const students: StudentOption[] = response.data.map((item) => ({
      roster_identifier: item.roster_identifier,
      github_username: item.github_username,
      name: item.roster_identifier || item.github_username, // Use roster_identifier if available, otherwise github_username
    }));

    // Add "All Students" option at the beginning
    const studentOptions: StudentOption[] = [
      { roster_identifier: '', github_username: 'all', name: 'All Students' },
      ...students
    ];

    return NextResponse.json(studentOptions);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json([], { status: 200 });
  }
}