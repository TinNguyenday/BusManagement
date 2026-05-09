import * as XLSX from 'xlsx';

export function exportToExcel(data, columns, filename) {
  const rows = data.map((item) => {
    const row = {};
    columns.forEach(({ header, key, format }) => {
      row[header] = format ? format(item) : (item[key] ?? '');
    });
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  // Tự động căn độ rộng cột
  const colWidths = columns.map(({ header }) => ({
    wch: Math.max(header.length + 2, 16),
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${filename}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`);
}
