import axios from 'axios';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function fetchStudentRepos(assignmentId: string) {
  const githubClassroomToken = process.env.GITHUB_CLASSROOM_TOKEN;
  
  if (!githubClassroomToken) {
    throw new Error('GitHub Classroom token not configured');
  }

  const url = `https://api.github.com/assignments/${assignmentId}/grades`;
  const headers = {
    Authorization: `Bearer ${githubClassroomToken}`,
    Accept: 'application/vnd.github+json',
  };

  const response = await axios.get(url, { headers });
  
  // Each item: { student_repository_url, roster_identifier, github_username, points_awarded }
  return response.data.map((item: any) => ({
    name: item.github_username,
    clone_url: item.student_repository_url,
    roster_identifier: item.roster_identifier,
    github_username: item.github_username,
    points_awarded: item.points_awarded,
  }));
}

export async function cloneAndStart(repo: any, index: number) {
  const reposDir = path.join(process.cwd(), 'repos');
  const folder = path.join(reposDir, repo.name);
  
  // Create repos directory if it doesn't exist
  if (!fs.existsSync(reposDir)) {
    fs.mkdirSync(reposDir, { recursive: true });
  }

  if (!fs.existsSync(folder)) {
    console.log(`Cloning ${repo.name}...`);
    try {
      await execAsync(`git clone ${repo.clone_url} ${folder}`);
    } catch (err) {
      console.error(`Error cloning ${repo.name}:`, err);
      return;
    }
  } else {
    console.log(`${repo.name} already cloned.`);
  }

  try {
    console.log(`Installing dependencies for ${repo.name}...`);
    await execAsync('pnpm install', { cwd: folder });
    
    console.log(`Building ${repo.name}...`);
    await execAsync('pnpm run build', { cwd: folder });
    
    console.log(`Starting preview for ${repo.name}...`);
    // Start preview server in background
    exec(`pnpm preview --port ${5173 + index}`, { cwd: folder });
  } catch (err) {
    console.error(`Error in ${repo.name}:`, err);
  }
}
