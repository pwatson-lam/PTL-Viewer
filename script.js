document.getElementById('xmlFileInput').addEventListener('change', handleFile);

function handleFile(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const xmlString = e.target.result;
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
      displayTables(xmlDoc);
    };
    reader.readAsText(file);
  }
}

function displayTables(xmlDoc) {
  const tablesContainer = document.getElementById('tables-container');
  tablesContainer.innerHTML = '';

  const nodeTypes = ['CHANNEL', 'DISPLAY', 'CONTAINER'];
  const pages = [];
  let currentPageIndex = 0;

  const menu = document.createElement('div');
  menu.className = 'menu';
  tablesContainer.appendChild(menu);

  nodeTypes.forEach((nodeType, index) => {
    const nodes = Array.from(xmlDoc.getElementsByTagName(nodeType));
    if (nodes.length > 0) {
      const tableContainer = document.createElement('div');
      tableContainer.className = 'table-page';

      const searchBox = document.createElement('input');
      searchBox.type = 'text';
      searchBox.placeholder = `Search ${nodeType}...`;
      searchBox.className = 'search-box';
      tableContainer.appendChild(searchBox);

      const table = document.createElement('table');
      table.className = 'table is-striped is-hoverable'; // Use Bulma's table classes
      const thead = document.createElement('thead');
      const tbody = document.createElement('tbody');
      const headers = Array.from(nodes[0].attributes).map(attr => attr.name);

      thead.innerHTML = `<tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr>`;
      nodes.forEach(node => {
        const row = document.createElement('tr');
        headers.forEach(header => {
          const cell = document.createElement('td');
          cell.textContent = node.getAttribute(header) || '';
          row.appendChild(cell);
        });
        tbody.appendChild(row);
      });

      table.appendChild(thead);
      table.appendChild(tbody);
      tableContainer.appendChild(table);

      const pagination = document.createElement('div');
      pagination.className = 'pagination';
      tableContainer.appendChild(pagination);

      setupPagination(table, tbody, pagination, searchBox);

      pages.push(tableContainer);

      // Add menu button for this table
      const menuButton = document.createElement('button');
      const menuLabels = {
        CHANNEL: 'Controllers',
        DISPLAY: 'Displays',
        CONTAINER: 'Unassigned displays'
      };
      menuButton.textContent = menuLabels[nodeType] || nodeType;
      menuButton.className = index === currentPageIndex ? 'active' : ''; // Apply 'active' class for the current page
      menuButton.classList.add('menu-link'); // Add a class for consistent styling
      menuButton.addEventListener('click', () => {
        currentPageIndex = index;
        renderPage();
      });
      menu.appendChild(menuButton);
    }
  });

  // Add "View Tree" button to the menu
  const viewTreeButton = document.createElement('button');
  viewTreeButton.textContent = 'View Tree';
  viewTreeButton.className = 'menu-link';
  viewTreeButton.addEventListener('click', () => {
    displayTree(xmlDoc);
  });
  menu.appendChild(viewTreeButton);

  function renderPage() {
    tablesContainer.querySelectorAll('.table-page').forEach(page => page.remove());
    menu.querySelectorAll('button').forEach((button, index) => {
      button.className = index === currentPageIndex ? 'active' : '';
    });

    if (pages.length > 0) {
      tablesContainer.appendChild(pages[currentPageIndex]);
    }
  }

  renderPage();
}

function setupPagination(table, tbody, pagination, searchBox) {
  const rows = Array.from(tbody.rows);
  const rowsPerPage = 15;
  let currentPage = 1;

  function renderTable() {
    const searchTerm = searchBox.value.toLowerCase();
    const filteredRows = rows.filter(row =>
      Array.from(row.cells).some(cell => cell.textContent.toLowerCase().includes(searchTerm))
    );

    const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    tbody.innerHTML = '';
    filteredRows.slice(start, end).forEach(row => tbody.appendChild(row));

    pagination.innerHTML = '';

    // Add "First" button
    const firstButton = document.createElement('button');
    firstButton.textContent = 'First';
    firstButton.className = 'button is-small'; // Use Bulma's button class
    firstButton.disabled = currentPage === 1;
    firstButton.addEventListener('click', () => {
      currentPage = 1;
      renderTable();
    });
    pagination.appendChild(firstButton);

    // Add "Previous" button
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.className = 'button is-small'; // Use Bulma's button class
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
      currentPage = Math.max(1, currentPage - 1);
      renderTable();
    });
    pagination.appendChild(prevButton);

    // Add page number buttons (limited to a range for better usability)
    const maxPageButtons = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    for (let i = startPage; i <= endPage; i++) {
      const button = document.createElement('button');
      button.textContent = i;
      button.className = `button is-small ${i === currentPage ? 'is-primary' : ''}`; // Use Bulma's button class
      button.disabled = i === currentPage;
      button.addEventListener('click', () => {
        currentPage = i;
        renderTable();
      });
      pagination.appendChild(button);
    }

    // Add "Next" button
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.className = 'button is-small'; // Use Bulma's button class
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
      currentPage = Math.min(totalPages, currentPage + 1);
      renderTable();
    });
    pagination.appendChild(nextButton);

    // Add "Last" button
    const lastButton = document.createElement('button');
    lastButton.textContent = 'Last';
    lastButton.className = 'button is-small'; // Use Bulma's button class
    lastButton.disabled = currentPage === totalPages;
    lastButton.addEventListener('click', () => {
      currentPage = totalPages;
      renderTable();
    });
    pagination.appendChild(lastButton);
  }

  searchBox.addEventListener('input', () => {
    currentPage = 1;
    renderTable();
  });

  renderTable();
}

function displayTree(xmlDoc) {
  const tablesContainer = document.getElementById('tables-container');
  tablesContainer.innerHTML = ''; // Clear the entire container

  const treeTable = document.createElement('table');
  treeTable.id = 'tree-table';
  treeTable.className = 'treetable table is-striped is-hoverable'; // Use Bulma and TreeTable classes

  const thead = document.createElement('thead');
  thead.innerHTML = `<tr><th>Node</th><th>Details</th></tr>`;
  treeTable.appendChild(thead);

  const tbody = document.createElement('tbody');
  treeTable.appendChild(tbody);

  const busUnits = Array.from(xmlDoc.getElementsByTagName('BUSUNIT'));
  const displays = Array.from(xmlDoc.getElementsByTagName('DISPLAY'));

  busUnits.forEach(busUnit => {
    const busRow = document.createElement('tr');
    busRow.setAttribute('data-tt-id', `bus-${busUnit.getAttribute('SERNUM')}`);
    busRow.innerHTML = `
      <td>${busUnit.getAttribute('SERNUM')}</td>
      <td>Type: ${busUnit.getAttribute('TYP')}</td>
    `;
    tbody.appendChild(busRow);

    const subNodes = Array.from(busUnit.children).filter(child =>
      ['SUB3RS485', 'SUB3MODULE'].includes(child.tagName)
    );

    subNodes.forEach(subNode => {
      const subRow = document.createElement('tr');
      subRow.setAttribute('data-tt-id', `sub-${subNode.getAttribute('ADRESSE')}`);
      subRow.setAttribute('data-tt-parent-id', `bus-${busUnit.getAttribute('SERNUM')}`);
      subRow.innerHTML = `
        <td>${subNode.getAttribute('ADRESSE')}</td>
        <td></td>
      `;
      tbody.appendChild(subRow);

      const relatedDisplays = displays.filter(
        display => display.getAttribute('SUBC') === subNode.getAttribute('ADRESSE')
      );

      relatedDisplays.forEach(display => {
        const displayRow = document.createElement('tr');
        displayRow.setAttribute('data-tt-id', `display-${display.getAttribute('SERNUM')}`);
        displayRow.setAttribute('data-tt-parent-id', `sub-${subNode.getAttribute('ADRESSE')}`);
        displayRow.innerHTML = `
          <td>${display.getAttribute('SERNUM')}</td>
          <td>Address: ${display.getAttribute('ADRESSE')}</td>
        `;
        tbody.appendChild(displayRow);
      });
    });
  });

  tablesContainer.appendChild(treeTable);

  // Initialize jQuery TreeTable
  $('#tree-table').treetable({ expandable: true });
}
