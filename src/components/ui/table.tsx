import React from 'react';

interface TableProps {
  columns: string[];
  data: { [key: string]: any }[];
}

export const Table: React.FC<TableProps> = ({ columns, data }) => (
  <div className="overflow-x-auto shadow-md rounded-xl border border-gray-100 bg-white">
    <table className="min-w-full text-sm text-gray-700">
      <thead className="bg-blue-100 text-blue-700">
        <tr>
          {columns.map((col, i) => (
            <th key={i} className="px-4 py-3 text-left font-semibold">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="text-center py-6 text-gray-400">
              No hay registros disponibles
            </td>
          </tr>
        ) : (
          data.map((row, i) => (
            <tr
              key={i}
              className={`border-t hover:bg-blue-50 transition ${
                i % 2 === 0 ? 'bg-white' : 'bg-blue-50/20'
              }`}
            >
              {columns.map((col, j) => (
                <td key={j} className="px-4 py-3">
                  {row[col]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);
