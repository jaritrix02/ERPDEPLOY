/**
 * Export a list of objects to a CSV file
 * @param {Array} data - Array of objects to export
 * @param {String} filename - Name of the file (without extension)
 * @param {Array} headers - Optional array of header objects { label, key }
 */
export const exportToCSV = (data, filename = 'export', headers = null) => {
  if (!data || data.length === 0) {
    console.error('No data provided for export');
    return;
  }

  // Use provided headers or extract from the first object
  const head = headers || Object.keys(data[0]).map(key => ({ label: key.toUpperCase(), key }));
  
  // Create CSV header row
  const headerRow = head.map(h => `"${h.label}"`).join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return head.map(h => {
      let val = item[h.key];
      
      // Handle nested objects (e.g., item.vendor.companyName)
      if (h.key.includes('.')) {
        val = h.key.split('.').reduce((obj, key) => obj?.[key], item);
      }
      
      // Clean value
      if (val === null || val === undefined) val = '';
      if (typeof val === 'string') val = val.replace(/"/g, '""'); // Escape double quotes
      
      return `"${val}"`;
    }).join(',');
  });

  const csvContent = [headerRow, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Basic CSV Parser for Import
 * @param {File} file - The file to parse
 * @returns {Promise<Array>} - Resolves with an array of objects
 */
export const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim());
          const obj = {};
          headers.forEach((header, i) => {
            obj[header] = values[i];
          });
          return obj;
        });
        
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};
