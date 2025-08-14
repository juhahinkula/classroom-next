import axios from 'axios';
import { exec, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Track background preview processes so we can stop them later (Windows deletion requires no locks)
const PREVIEW_PROCS = new Set<ChildProcess>();

export async function fetchStudentRepos(assignmentId: string) {
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_CLASSROOM_TOKEN;
  if (!token) {
    throw new Error('GitHub token not configured');
  }

  const url = `https://api.github.com/assignments/${assignmentId}/grades`;
  const headers = {
    Authorization: `Bearer ${token}`,
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
  const reposDir = getReposDir();
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
  const startingPort = parseInt(process.env.STARTING_PORT || '5173');
  const child = exec(`pnpm preview --port ${startingPort + index}`, { cwd: folder });
  PREVIEW_PROCS.add(child);
  child.on('exit', () => PREVIEW_PROCS.delete(child));
  } catch (err) {
    console.error(`Error in ${repo.name}:`, err);
  }
}

export function getReposDir() {
  const base = process.env.REPOS_BASE_DIR || path.join(os.tmpdir(), 'classroom-repos');
  if (!fs.existsSync(base)) {
    fs.mkdirSync(base, { recursive: true });
  }
  return base;
}

export async function stopAllPreviews() {
  const kills: Promise<void>[] = [];
  for (const child of PREVIEW_PROCS) {
    kills.push(new Promise<void>((resolve) => {
      if (process.platform === 'win32') {
        // Force kill the whole tree on Windows
        exec(`taskkill /PID ${child.pid} /T /F`, (/*err*/)=> resolve());
      } else {
        try {
          child.kill('SIGTERM');
        } catch {}
        resolve();
      }
    }));
  }
  await Promise.allSettled(kills);
  PREVIEW_PROCS.clear();
}
