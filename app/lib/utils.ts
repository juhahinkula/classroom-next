import axios from 'axios';
import { exec, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Track background preview processes so we can stop them later (Windows deletion requires no locks)
const PREVIEW_PROCS = new Set<ChildProcess>();

export interface StudentRepo {
  name: string;
  clone_url: string;
  roster_identifier: string;
  github_username: string;
  points_awarded: number | string;
}

// ponytail: classroom50 has no grades API. Student repos follow the naming convention
// <classroom>-<assignment>-<username>. Scores come from <org>/classroom50/<classroom>/scores.json;
// roster from <org>/classroom50/<classroom>/roster.csv.
export async function fetchStudentRepos(
  org: string,
  classroomSlug: string,
  assignmentSlug: string
): Promise<StudentRepo[]> {
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_CLASSROOM_TOKEN;
  if (!token) {
    throw new Error('GitHub token not configured');
  }

  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github+json',
  };

  const base = `https://api.github.com/repos/${org}/classroom50/contents/${classroomSlug}`;

  const [rosterRes, scoresRes] = await Promise.all([
    axios.get(`${base}/roster.csv`, { headers }),
    axios.get(`${base}/scores.json`, { headers }).catch(() => null),
  ]);

  // roster.csv header: username,first_name,last_name,email,section,github_id,role
  const rosterCsv = Buffer.from(rosterRes.data.content, 'base64').toString('utf-8');
  const [header, ...rows] = rosterCsv.trim().split('\n');
  const cols = header.split(',').map((c) => c.trim());
  const usernameIdx = cols.indexOf('username');
  const emailIdx = cols.indexOf('email');
  const roleIdx = cols.indexOf('role');

  const students = rows
    .map((row) => row.split(',').map((c) => c.trim()))
    .filter((cells) => cells[usernameIdx]) // skip pending rows (no username yet)
    .filter((cells) => roleIdx < 0 || cells[roleIdx] === 'student'); // exclude teacher/TA rows

  // scores.json: { assignments: { [slug]: { entries: [ { owner, submissions: [ { score, ... } ] } ] } } }
  const scoreMap: Record<string, number> = {};
  if (scoresRes) {
    try {
      const scoresJson = JSON.parse(Buffer.from(scoresRes.data.content, 'base64').toString('utf-8'));
      const entries = scoresJson.assignments?.[assignmentSlug]?.entries ?? [];
      for (const entry of entries) {
        const latest = entry.submissions?.[0];
        if (entry.owner && latest) scoreMap[entry.owner] = latest.score ?? 0;
      }
    } catch {}
  }

  return students.map((cells) => {
    const username = cells[usernameIdx];
    const email = emailIdx >= 0 ? cells[emailIdx] : '';
    const repoName = `${classroomSlug}-${assignmentSlug}-${username}`;
    return {
      name: username,
      clone_url: `https://github.com/${org}/${repoName}`,
      roster_identifier: email || username,
      github_username: username,
      points_awarded: scoreMap[username] ?? '',
    };
  });
}

export async function cloneAndStart(repo: StudentRepo, index: number) {
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
    await execAsync('npm install', { cwd: folder });
    
    console.log(`Building ${repo.name}...`);
    await execAsync('npm run build', { cwd: folder });
    
    console.log(`Starting preview for ${repo.name}...`);
    // Start preview server in background
  const startingPort = parseInt(process.env.STARTING_PORT || '5173');
  const child = exec(`npm run preview -- --port ${startingPort + index}`, { cwd: folder });
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
