# Classroom Manager

GitHub Classroom manager built with Next.js, TypeScript, and ag-Grid for managing student repositories and projects. This is done for React Vite student projects but can be extended to handle other technologies.

## Features

- Fetch classrooms and assignments directly from GitHub Classroom API
- View student repositories with sorting and filtering.
- Clone, build, and preview student repositories automatically
- Direct links to running student project previews

## Prerequisites

- Node.js 18 or higher
- pnpm (for building student repositories)
- GitHub Personal Access Token with classroom permissions
- GitHub Classroom Token

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables by updating `.env.local`:
```env
GITHUB_TOKEN=your_github_personal_access_token
PORT=3000
STARTING_PORT=5173
REPOS_BASE_DIR=C:\classroom-repos
```

where
- `GITHUB_TOKEN`: GitHub Personal Access Token used for GitHub Classroom and repository access. scopes: repo and read:org.
- `PORT`: Port for the Next.js dev server (default 3000).
- `STARTING_PORT`: Base port for student preview servers (each repo uses STARTING_PORT + index).
- `REPOS_BASE_DIR`: Absolute path where student repositories are cloned (for example C:\classroom-repos). If not set, the system temp directory is used.


## Usage

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. Select a classroom from the dropdown
4. Choose an assignment
5. Click "Fetch" to clone and build student repositories
6. View and interact with the data in the ag-Grid table

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
