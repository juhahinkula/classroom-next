"use client";

import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

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

interface ClassroomGridProps {
  data: RepoData[];
}

const ClassroomGrid: React.FC<ClassroomGridProps> = ({ data }) => {
  const columnDefs: ColDef[] = [
    {
      headerName: 'Preview',
      field: 'preview',
      cellRenderer: (params: any) => {
        if (params.value) {
          return `<a href="${params.value.url}" target="_blank" style="color: #2563eb; text-decoration: underline;">${params.value.name}</a>`;
        }
        return '';
      },
      width: 200,
    },
    {
      headerName: 'Roster Identifier',
      field: 'rosterIdentifier',
      width: 200,
    },
    {
      headerName: 'GitHub Username',
      field: 'githubUsername',
      width: 200,
    },
    {
      headerName: 'Points Awarded',
      field: 'pointsAwarded',
      width: 150,
    },
    {
      headerName: 'Repository URL',
      field: 'repositoryUrl',
      cellRenderer: (params: any) => {
        if (params.value) {
          const displayUrl = params.value.replace('https://github.com/', '').replace('.git', '');
          return `<a href="${params.value}" target="_blank" style="color: #2563eb; text-decoration: underline;">${displayUrl}</a>`;
        }
        return '';
      },
      width: 250,
    },
  ];

  const defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  return (
    <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
      <AgGridReact
        rowData={data}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        animateRows={true}
        rowHeight={40}
      />
    </div>
  );
};

export default ClassroomGrid;
