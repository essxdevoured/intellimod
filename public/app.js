const itemsContainer = document.getElementById('items');
const sortedItemsContainer = document.getElementById('sorted-items');
const dataSourceLabel = document.getElementById('data-source');
const instructionField = document.getElementById('instruction');
const sortButton = document.getElementById('sort-button');
const sortStatus = document.getElementById('sort-status');
const template = document.getElementById('row-template');

const COLUMN_COUNT = 5;

let currentItems = [];

function setStatusRow(container, message, className = 'status-row') {
  container.innerHTML = '';
  const row = document.createElement('tr');
  row.className = className;
  const cell = document.createElement('td');
  cell.colSpan = COLUMN_COUNT;
  cell.textContent = message;
  row.appendChild(cell);
  container.appendChild(row);
}

function renderItems(container, items) {
  container.innerHTML = '';

  if (!items.length) {
    setStatusRow(container, 'No items available.', 'empty-row');
    return;
  }

  items.forEach(item => {
    const clone = template.content.cloneNode(true);
    clone.querySelector('.cell-name').textContent = item.name;
    clone.querySelector('.cell-description').textContent = item.description || 'No description provided.';
    clone.querySelector('.cell-category').textContent = item.category || 'N/A';
    clone.querySelector('.cell-price').textContent =
      item.price != null && item.price !== '' ? `$${Number(item.price).toFixed(2)}` : 'N/A';
    clone.querySelector('.cell-popularity').textContent =
      item.popularity != null && item.popularity !== '' ? `${item.popularity}` : 'N/A';
    container.appendChild(clone);
  });
}

async function loadItems() {
  setStatusRow(itemsContainer, 'Loading inventory…');

  try {
    const response = await fetch('/api/items');
    if (!response.ok) {
      throw new Error(`Failed to load items (${response.status}).`);
    }

    const data = await response.json();
    currentItems = data.items || [];
    renderItems(itemsContainer, currentItems);
    dataSourceLabel.textContent = data.source === 'r2'
      ? `Data source: Cloudflare R2 (object: ${data.objectKey})`
      : 'Data source: local sample file (bind an R2 bucket as INVENTORY_BUCKET to use Cloudflare storage).';
  } catch (error) {
    setStatusRow(itemsContainer, `Unable to load items: ${error.message}`, 'error-row');
  }
}

async function sortItems() {
  if (!currentItems.length) {
    sortStatus.textContent = 'Load items before sorting.';
    return;
  }

  sortButton.disabled = true;
  sortStatus.textContent = 'Contacting ChatGPT…';
  setStatusRow(sortedItemsContainer, 'Sorting in progress…');

  try {
    const response = await fetch('/api/sort', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: currentItems,
        instruction: instructionField.value.trim() || 'Sort by highest relevance'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to sort items (${response.status}).`);
    }

    const data = await response.json();
    const sorted = Array.isArray(data.items) ? data.items : [];
    renderItems(sortedItemsContainer, sorted);
    sortStatus.textContent = data.notes ? `Sorted. Notes: ${data.notes}` : 'Sorted successfully.';
  } catch (error) {
    sortStatus.textContent = `Unable to sort: ${error.message}`;
    setStatusRow(sortedItemsContainer, 'Sort failed. Please adjust the prompt and try again.', 'error-row');
  } finally {
    sortButton.disabled = false;
  }
}

sortButton.addEventListener('click', sortItems);
setStatusRow(sortedItemsContainer, 'No sorted results yet.');
loadItems();
