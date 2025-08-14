import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getReposDir, stopAllPreviews } from '@/lib/utils';

export async function DELETE() {
  try {
    // Ensure preview processes are stopped so Windows can delete folders
    await stopAllPreviews();

    const reposDir = getReposDir();

    if (fs.existsSync(reposDir)) {
      fs.rmSync(reposDir, { recursive: true, force: true });
      console.log('Repos folder deleted successfully');
    }

    // Also delete legacy in-project repos folder if present
    const legacyReposDir = path.join(process.cwd(), 'repos');
    if (fs.existsSync(legacyReposDir)) {
      fs.rmSync(legacyReposDir, { recursive: true, force: true });
      console.log('Legacy repos folder deleted successfully');
    }

    const message = (!fs.existsSync(reposDir) && !fs.existsSync(legacyReposDir))
      ? 'Repos folder(s) deleted successfully'
      : 'Some repos folders could not be deleted (possibly in use).';
    return NextResponse.json({ message, paths: { reposDir, legacyReposDir } });
  } catch (error) {
    console.error('Error deleting repos folder:', error);
    return NextResponse.json({ error: 'Failed to delete repos folder' }, { status: 500 });
  }
}
