import React from 'react';

export default function DataTable({ columns, data, emptyMessage = 'No data found.' }) {
  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} style={col.style}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
              {emptyMessage}
            </td>
          </tr>
        ) : (
          data.map((row, rowIndex) => (
            <tr key={row.id ?? rowIndex}>
              {columns.map((col) => (
                <td key={col.key} style={col.cellStyle}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
