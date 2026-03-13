import * as XLSX from 'xlsx';

/**
 * Flattens a list of people records into a tabular format for Excel.
 * Each dynamic field of the same type (phone, email, etc.) gets numbered columns.
 * Linked people are included as additional rows with a 'Parent' reference if needed,
 * or flatted with a 'Relationship' prefix.
 */
export const flattenPeopleData = (people) => {
  return people.flatMap(person => {
    // 1. Process Main Person
    const flattened = {
      'Full Name': person.name,
      'NRIC/ID': person.nric || '',
      'Student ID': person.studentId || '',
      'Tax Number': person.taxNumber || '',
      'Address': person.address || '',
      'Bank Account': person.bankAccount || '',
    };

    // 2. Process Dynamic Fields
    const fieldCounts = {};
    person.dynamicFields?.forEach(field => {
      const type = field.type.toUpperCase();
      fieldCounts[type] = (fieldCounts[type] || 0) + 1;
      flattened[`${type} ${fieldCounts[type]}`] = field.value;
    });

    // 3. Process Linked People (Recursive or Flat)
    // For simplicity in Excel, we'll return the person and then their links as separate rows
    const linkedRows = (person.linkedPeople || []).map(link => {
      const linkFlattened = {
        'Full Name': link.name,
        'Relationship': link.relationship || 'Linked',
        'Linked To': person.name,
        'NRIC/ID': link.nric || '',
        'Student ID': link.studentId || '',
        'Tax Number': link.taxNumber || '',
        'Address': link.address || '',
        'Bank Account': link.bankAccount || '',
      };
      
      const linkFieldCounts = {};
      link.dynamicFields?.forEach(field => {
        const type = field.type.toUpperCase();
        linkFieldCounts[type] = (linkFieldCounts[type] || 0) + 1;
        linkFlattened[`${type} ${linkFieldCounts[type]}`] = field.value;
      });
      
      return linkFlattened;
    });

    return [flattened, ...linkedRows];
  });
};

/**
 * Maps flat Excel rows back to the hierarchical people structure.
 */
export const unflattenExcelData = (rows) => {
  if (!Array.isArray(rows)) return [];
  const people = [];
  const linkMap = new Map(); // To associate links with parents later if needed

  rows.forEach(row => {
    if (!row || typeof row !== 'object') return;

    const person = {
      name: row['Full Name'] || row['name'] || 'Unnamed',
      nric: row['NRIC/ID'] || row['nric'] || '',
      studentId: row['Student ID'] || row['studentId'] || '',
      taxNumber: row['Tax Number'] || row['taxNumber'] || '',
      address: row['Address'] || row['address'] || '',
      bankAccount: row['Bank Account'] || row['bankAccount'] || '',
      dynamicFields: [],
      linkedPeople: []
    };

    // Extract dynamic fields (Phone 1, Email 2, etc.)
    Object.keys(row).forEach(key => {
      const match = key.match(/^(PHONE|EMAIL|HINT|HASH|SOCIAL|OTHERS)\s+(\d+)$/i);
      if (match && row[key]) {
        person.dynamicFields.push({
          type: match[1].toLowerCase(),
          label: `Imported ${match[1]} ${match[2]}`,
          value: row[key]
        });
      }
    });

    if (row['Linked To']) {
      // It's a linked person, store it for later attachment
      person.relationship = row['Relationship'] || 'Linked';
      const parentName = row['Linked To'];
      if (!linkMap.has(parentName)) linkMap.set(parentName, []);
      linkMap.get(parentName).push(person);
    } else {
      people.push(person);
    }
  });

  // Attach links to parents
  people.forEach(person => {
    if (linkMap.has(person.name)) {
      person.linkedPeople = linkMap.get(person.name);
    }
  });

  return people;
};

export const exportToExcel = (data, fileName = 'IdentityVault_Export.xlsx') => {
  try {
    const flattened = flattenPeopleData(data);
    const worksheet = XLSX.utils.json_to_sheet(flattened);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Records");
    
    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Use octet-stream for better "Save As" behavior in some browsers
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Force the correct filename and extension
    const finalName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
    link.download = finalName;
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
  } catch (err) {
    console.error('Export to Excel failed:', err);
    alert('Failed to export Excel file. Please check console for details.');
  }
};

export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(unflattenExcelData(jsonData));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
