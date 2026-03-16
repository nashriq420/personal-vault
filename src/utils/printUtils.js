export const printPerson = (person) => {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert('Please allow popups to print records.');
    return;
  }

  const renderField = (label, value) => {
    if (!value) return '';
    return `
      <div class="field">
        <span class="label">${label}:</span>
        <span class="value">${value}</span>
      </div>
    `;
  };

  const renderDynamicFields = (fields) => {
    if (!fields || fields.length === 0) return '';
    return fields.map(f => renderField((f.label || f.type).toUpperCase(), f.value)).join('');
  };

  const renderLinkedPeople = (links) => {
    if (!links || links.length === 0) return '';
    return `
      <div class="section">
        <h3>Linked People / Dependents</h3>
        <table class="links-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Relationship</th>
              <th>NRIC</th>
              <th>Phone / Other Data</th>
            </tr>
          </thead>
          <tbody>
            ${links.map(l => {
              const extraData = l.dynamicFields ? l.dynamicFields.map(f => f.value).join(', ') : '';
              return `
                <tr>
                  <td>${l.name || '-'}</td>
                  <td>${l.relationship || '-'}</td>
                  <td>${l.nric || '-'}</td>
                  <td>${extraData || '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const html = `
    <html>
      <head>
        <title>Vault Record: ${person.name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 40px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #ccc;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          h1 { margin: 0; color: #1e293b; font-size: 28px; }
          h2 { margin: 5px 0 0; color: #64748b; font-size: 16px; font-weight: normal; }
          .section {
            margin-bottom: 30px;
          }
          .section h3 {
            border-bottom: 1px solid #eee;
            padding-bottom: 8px;
            color: #475569;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .field {
            margin-bottom: 5px;
          }
          .label {
            font-weight: bold;
            color: #64748b;
            display: inline-block;
            width: 120px;
          }
          .value {
            color: #0f172a;
          }
          .links-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          .links-table th, .links-table td {
            border: 1px solid #e2e8f0;
            padding: 8px 12px;
            text-align: left;
          }
          .links-table th {
            background-color: #f8fafc;
            color: #475569;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${person.name}</h1>
          <h2>Confidential Profile Export</h2>
        </div>

        <div class="section">
          <h3>Primary Information</h3>
          <div class="grid">
            ${renderField('NRIC', person.nric)}
            ${renderField('Student ID', person.studentId)}
            ${renderField('Tax Number', person.taxNumber)}
            ${renderField('Address', person.address)}
            ${renderField('Bank Account', person.bankAccount)}
          </div>
        </div>

        <div class="section">
          <h3>Additional Information</h3>
          <div class="grid">
            ${renderDynamicFields(person.dynamicFields)}
          </div>
        </div>

        ${renderLinkedPeople(person.linkedPeople)}

        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
