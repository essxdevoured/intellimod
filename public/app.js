const itemsHeader = document.getElementById('items-head');
const itemsContainer = document.getElementById('items');
const sortedHeader = document.getElementById('sorted-head');
const sortedItemsContainer = document.getElementById('sorted-items');
const dataSourceLabel = document.getElementById('data-source');
const instructionField = document.getElementById('instruction');
const sortButton = document.getElementById('sort-button');
const sortStatus = document.getElementById('sort-status');

let currentItems = [];
let currentColumns = [];

const HIDDEN_COLUMNS = new Set(['updatedAt']);

const columnCount = () => Math.max(currentColumns.length, 1);

function formatHeaderLabel(key) {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, char => char.toUpperCase());
}

function formatCellValue(value) {
  if (value == null || value === '') {
    return '—';
  }

  if (typeof value === 'number') {
    return value.toLocaleString();
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function determineColumns(records) {
  const columns = [];
  records.forEach(record => {
    if (record && typeof record === 'object' && !Array.isArray(record)) {
      Object.keys(record).forEach(key => {
        if (!HIDDEN_COLUMNS.has(key) && !columns.includes(key)) {
          columns.push(key);
        }
      });
    }
  });
  return columns;
}

function columnsMatch(a, b) {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

function renderHeaders() {
  const render = (element) => {
    element.innerHTML = '';
    const row = document.createElement('tr');

    if (!currentColumns.length) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = 'Value';
      row.appendChild(th);
    } else {
      currentColumns.forEach(column => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.textContent = formatHeaderLabel(column);
        row.appendChild(th);
      });
    }

    element.appendChild(row);
  };

  render(itemsHeader);
  render(sortedHeader);
}

function setStatusRow(container, message, className = 'status-row', span = columnCount()) {
  container.innerHTML = '';
  const row = document.createElement('tr');
  row.className = className;
  const cell = document.createElement('td');
  cell.colSpan = span;
  cell.textContent = message;
  row.appendChild(cell);
  container.appendChild(row);
}

function renderItems(container, items) {
  container.innerHTML = '';

  if (!items.length) {
    setStatusRow(container, 'No records available.', 'empty-row');
    return;
  }

  items.forEach(item => {
    const row = document.createElement('tr');

    currentColumns.forEach(column => {
      const cell = document.createElement('td');
      const value = item && typeof item === 'object' ? item[column] : undefined;
      if (typeof value === 'number') {
        cell.classList.add('cell-number');
      }
      cell.textContent = formatCellValue(value);
      row.appendChild(cell);
    });

    container.appendChild(row);
  });
}

async function loadItems() {
  setStatusRow(itemsContainer, 'Loading records…');

  try {
    const response = await fetch('/api/items');
    if (!response.ok) {
      const errorPayload = await response.clone().json().catch(() => null);
      let message = `Failed to load records (${response.status}).`;
      if (errorPayload && typeof errorPayload === 'object') {
        if (errorPayload.error) {
          message += ` ${errorPayload.error}`;
        }
        const cause = errorPayload?.details?.cause;
        if (cause) {
          message += ` ${cause}`;
        }
      }
      throw new Error(message);
    }

    const data = await response.json();
    currentItems = Array.isArray(data.items) ? data.items : [];
    const nextColumns = determineColumns(currentItems);
    if (!columnsMatch(currentColumns, nextColumns)) {
      currentColumns = nextColumns;
      renderHeaders();
    }
    renderItems(itemsContainer, currentItems);
    if (!sortedItemsContainer.childElementCount || sortedItemsContainer.firstElementChild?.classList.contains('status-row')) {
      setStatusRow(sortedItemsContainer, 'No sorted results yet.');
    }
    dataSourceLabel.textContent = data.objectKey
      ? `Data source: Cloudflare R2 (object: ${data.objectKey})`
      : 'Data source: Cloudflare R2';
  } catch (error) {
    setStatusRow(itemsContainer, `Unable to load records: ${error.message}`, 'error-row');
    dataSourceLabel.textContent = 'Data source: unavailable.';
  }
}

async function sortItems() {
  if (!currentItems.length) {
    sortStatus.textContent = 'Load records before sorting.';
    return;
  }

  sortButton.disabled = true;
  sortStatus.textContent = 'Contacting ChatGPT…';
  setStatusRow(sortedItemsContainer, 'Sorting in progress…', 'status-row', columnCount());

  try {
    const response = await fetch('/api/sort', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: currentItems,
        instruction: instructionField.value.trim() || 'Sort by highest count'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to sort records (${response.status}).`);
    }

    const data = await response.json();
    const sorted = Array.isArray(data.items) ? data.items : [];
    const nextColumns = determineColumns([...currentItems, ...sorted]);
    if (!columnsMatch(currentColumns, nextColumns)) {
      currentColumns = nextColumns;
      renderHeaders();
      renderItems(itemsContainer, currentItems);
    }
    renderItems(sortedItemsContainer, sorted);
    sortStatus.textContent = data.notes ? `Sorted. Notes: ${data.notes}` : 'Sorted successfully.';
  } catch (error) {
    sortStatus.textContent = `Unable to sort: ${error.message}`;
    setStatusRow(sortedItemsContainer, 'Sort failed. Please adjust the prompt and try again.', 'error-row', columnCount());
  } finally {
    sortButton.disabled = false;
  }
}

renderHeaders();
sortButton.addEventListener('click', sortItems);
setStatusRow(sortedItemsContainer, 'No sorted results yet.');
loadItems();
