import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function DELETE() {
  try {
    const reposDir = path.join(process.cwd(), 'repos');
    
    if (fs.existsSync(reposDir)) {
      // Remove the entire repos directory
      fs.rmSync(reposDir, { recursive: true, force: true });
      console.log('Repos folder deleted successfully');
      return NextResponse.json({ message: 'Repos folder deleted successfully' });
    } else {
      return NextResponse.json({ message: 'Repos folder does not exist' });
    }
  } catch (error) {
    console.error('Error deleting repos folder:', error);
    return NextResponse.json({ error: 'Failed to delete repos folder' }, { status: 500 });
  }
}
