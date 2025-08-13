"use client";

import { useState, useEffect } from 'react';

interface Classroom {
  id: number;
  name: string;
}

interface Assignment {
  id: number;
  title?: string;
  name?: string;
  slug?: string;
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
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>('');
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [repoData, setRepoData] = useState<RepoData[]>([]);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const response = await fetch('/api/classrooms');
      const data = await response.json();
      setClassrooms(data);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    }
  };

  const fetchAssignments = async (classroomId: string) => {
    try {
      const response = await fetch(`/api/assignments?classroomId=${classroomId}`);
      const data = await response.json();
      setAssignments(data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchRepositories = async (assignmentId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/fetch?assignmentId=${assignmentId}`);
      const data = await response.json();
      setRepoData(data);
    } catch (error) {
      console.error('Error fetching repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassroomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classroomId = e.target.value;
    setSelectedClassroom(classroomId);
    setSelectedAssignment('');
    setAssignments([]);
    setRepoData([]);
    
    if (classroomId) {
      fetchAssignments(classroomId);
    }
  };

  const handleAssignmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAssignment(e.target.value);
    setRepoData([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAssignment) {
      fetchRepositories(selectedAssignment);
    }
  };

  const deleteReposFolder = async () => {
    if (confirm('Are you sure you want to delete all cloned repositories? This action cannot be undone.')) {
      try {
        const response = await fetch('/api/delete-repos', { method: 'DELETE' });
        const data = await response.json();
        console.log(data.message);
        alert('Repos folder deleted successfully!');
      } catch (error) {
        console.error('Error deleting repos folder:', error);
        alert('Failed to delete repos folder');
      }
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-green-600">Classroom Manager</h1>
      
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Classroom:
            <select
              value={selectedClassroom}
              onChange={handleClassroomChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select classroom</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
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
                <option key={a.id} value={a.id}>
                  {a.title || a.name || a.slug || a.id}
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
            {loading ? 'Fetching...' : 'Fetch'}
          </button>
          
          <button
            type="button"
            onClick={deleteReposFolder}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete Repos Folder
          </button>
        </div>
      </form>
      
      {loading && (
        <div className="text-center py-4">
          <p>Fetching and building repositories, please wait...</p>
        </div>
      )}
      
      {repoData.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Student Repositories</h2>
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
                {repoData.map((repo, index) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
