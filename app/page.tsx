"use client";

import { useState, useEffect } from 'react';

interface Org {
  login: string;
  avatar_url: string;
}

interface Classroom {
  slug: string;
  name: string;
  term?: string;
}

interface Assignment {
  slug: string;
  name?: string;
  title?: string;
}

interface Student {
  roster_identifier: string;
  github_username: string;
  name: string;
}

interface RepoData {
  preview: {
    name: string;
    url: string;
  };
  rosterIdentifier: string;
  githubUsername: string;
  pointsAwarded: string | number;
  repositoryUrl: string;
}

export default function Home() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('');
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [repoData, setRepoData] = useState<RepoData[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [nameFilter, setNameFilter] = useState('');

  // Filter repositories based on name filter
  const filteredRepoData = repoData.filter(repo =>
    repo.preview.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
    repo.githubUsername.toLowerCase().includes(nameFilter.toLowerCase()) ||
    repo.rosterIdentifier.toLowerCase().includes(nameFilter.toLowerCase())
  );

  useEffect(() => {
    fetchOrgs();
  }, []);

  const fetchOrgs = async () => {
    try {
      const response = await fetch('/api/orgs');
      const data = await response.json();
      setOrgs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const fetchClassrooms = async (org: string) => {
    try {
      const response = await fetch(`/api/classrooms?org=${org}`);
      const data = await response.json();
      setClassrooms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    }
  };

  const fetchAssignments = async (org: string, classroomSlug: string) => {
    try {
      const response = await fetch(`/api/assignments?org=${org}&classroomSlug=${classroomSlug}`);
      const data = await response.json();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchStudents = async (org: string, classroomSlug: string) => {
    try {
      const response = await fetch(`/api/students?org=${org}&classroomSlug=${classroomSlug}`);
      const data = await response.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchRepositories = async (
    org: string,
    classroomSlug: string,
    assignmentSlug: string,
    studentUsername?: string
  ) => {
    setLoading(true);
    try {
      const studentParam = studentUsername && studentUsername !== 'all' ? `&studentUsername=${studentUsername}` : '';
      const response = await fetch(
        `/api/fetch?org=${org}&classroomSlug=${classroomSlug}&assignmentSlug=${assignmentSlug}${studentParam}`
      );
      const repoList = await response.json();
      const results: RepoData[] = [];

      for (let i = 0; i < repoList.length; i++) {
        const repo = repoList[i];
        const res = await fetch('/api/fetch-one', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo, index: i })
        });
        const row = await res.json();
        results.push(row);
        setRepoData([...results]); // update grid after each repo
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrgChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const org = e.target.value;
    setSelectedOrg(org);
    setSelectedClassroom('');
    setSelectedAssignment('');
    setSelectedStudent('all');
    setClassrooms([]);
    setAssignments([]);
    setStudents([]);
    setRepoData([]);

    if (org) {
      fetchClassrooms(org);
    }
  };

  const handleClassroomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classroomSlug = e.target.value;
    setSelectedClassroom(classroomSlug);
    setSelectedAssignment('');
    setSelectedStudent('all');
    setAssignments([]);
    setStudents([]);
    setRepoData([]);

    if (classroomSlug) {
      fetchAssignments(selectedOrg, classroomSlug);
    }
  };

  const handleAssignmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const assignmentSlug = e.target.value;
    setSelectedAssignment(assignmentSlug);
    setSelectedStudent('all');
    setStudents([]);
    setRepoData([]);

    if (assignmentSlug) {
      fetchStudents(selectedOrg, selectedClassroom);
    }
  };

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStudent(e.target.value);
    setRepoData([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrg && selectedClassroom && selectedAssignment) {
      fetchRepositories(selectedOrg, selectedClassroom, selectedAssignment, selectedStudent);
    }
  };

  const deleteReposFolder = async () => {
    if (confirm('Are you sure you want to delete all cloned repositories? This action cannot be undone.')) {
      setDeleting(true);
      try {
        const response = await fetch('/api/delete-repos', { method: 'DELETE' });
        const data = await response.json();
        console.log(data.message);
        alert('Repos folder deleted successfully!');
        // Clear the grid data since repositories have been deleted
        setRepoData([]);
      } catch (error) {
        console.error('Error deleting repos folder:', error);
        alert('Failed to delete repos folder');
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-green-600">Classroom Manager</h1>
      
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Organization:
            <select
              value={selectedOrg}
              onChange={handleOrgChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select organization</option>
              {orgs.map((o) => (
                <option key={o.login} value={o.login}>
                  {o.login}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Classroom:
            <select
              value={selectedClassroom}
              onChange={handleClassroomChange}
              disabled={!selectedOrg}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select classroom</option>
              {classrooms.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}{c.term ? ` (${c.term})` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Assignment:
            <select
              value={selectedAssignment}
              onChange={handleAssignmentChange}
              disabled={!selectedClassroom}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select assignment</option>
              {assignments.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.title || a.name || a.slug}
                </option>
              ))}
            </select>
          </label>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Student:
            <select
              value={selectedStudent}
              onChange={handleStudentChange}
              disabled={!selectedAssignment}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              {students.map((s) => (
                <option key={s.github_username} value={s.github_username}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={!selectedAssignment || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Fetching...' : `Fetch ${selectedStudent === 'all' ? 'All' : 'Student'} Repositories`}
          </button>
          
          <button
            type="button"
            onClick={deleteReposFolder}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
          >
            {deleting ? 'Deleting...' : 'Delete Repos Folder'}
          </button>
        </div>
      </form>
      
      {loading && (
        <div className="text-center py-4">
          <p>Fetching and building repositories, please wait...</p>
        </div>
      )}
      
      {deleting && (
        <div className="text-center py-4">
          <p>Deleting repositories, please wait...</p>
        </div>
      )}
      
      {repoData.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Student Repositories</h2>
          
          {/* Name Filter Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Filter by Name, Username, or Real Name:
              <input
                type="text"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Type to filter repositories..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </label>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Preview
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Roster Identifier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    GitHub Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Points Awarded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Repository URL
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRepoData.length > 0 ? (
                  filteredRepoData.map((repo, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        <a 
                          href={repo.preview.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {repo.preview.name}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {repo.rosterIdentifier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {repo.githubUsername}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {repo.pointsAwarded}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        <a 
                          href={repo.repositoryUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {repo.repositoryUrl.replace('https://github.com/', '').replace('.git', '')}
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No repositories match the filter &quot;{nameFilter}&quot;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
