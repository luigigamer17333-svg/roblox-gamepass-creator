/**
 * Advanced Gamepass Dashboard Module
 * Provides sorting, filtering, searching, and bulk actions for gamepasses
 * Integrates seamlessly with existing extension code
 */

const GamepassDashboard = (() => {
  let state = {
    allGamepasses: [],
    filteredGamepasses: [],
    selectedPassIds: new Set(),
    sortBy: 'name-asc',
    searchQuery: '',
    isLoading: false
  };

  const SORT_OPTIONS = {
    'name-asc': { label: 'Name (A-Z)', compareFn: (a, b) => (a.displayName || a.name || '').localeCompare(b.displayName || b.name || '') },
    'name-desc': { label: 'Name (Z-A)', compareFn: (a, b) => (b.displayName || b.name || '').localeCompare(a.displayName || a.name || '') },
    'price-asc': { label: 'Price (Low to High)', compareFn: (a, b) => (a.price || 0) - (b.price || 0) },
    'price-desc': { label: 'Price (High to Low)', compareFn: (a, b) => (b.price || 0) - (a.price || 0) },
    'id-asc': { label: 'ID (Ascending)', compareFn: (a, b) => a.id - b.id },
    'id-desc': { label: 'ID (Descending)', compareFn: (a, b) => b.id - a.id }
  };

  /**
   * Fetch all gamepasses from the Roblox API
   */
  async function fetchGamepasses(universeId, robloxFetch, addLog) {
    try {
      state.isLoading = true;
      addLog('Fetching gamepasses...', 'info');

      const resp = await robloxFetch(
        `https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes?passView=Full&pageSize=100`
      );

      if (!resp.ok) {
        const errorMsg = await extractErrorMessage(resp);
        throw new Error(errorMsg);
      }

      const data = await resp.json();
      state.allGamepasses = data.gamePasses || [];
      state.selectedPassIds.clear();
      applyFiltersAndSort();
      addLog(`Loaded ${state.allGamepasses.length} gamepasses`, 'success');
      state.isLoading = false;
      return state.allGamepasses;
    } catch (err) {
      state.isLoading = false;
      addLog(`Failed to fetch gamepasses: ${err.message}`, 'error');
      throw err;
    }
  }

  /**
   * Apply search, filtering, and sorting to gamepasses
   */
  function applyFiltersAndSort() {
    let filtered = state.allGamepasses;

    // Apply search filter
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(pass => {
        const name = (pass.displayName || pass.name || '').toLowerCase();
        const id = pass.id.toString();
        return name.includes(query) || id.includes(query);
      });
    }

    // Apply sorting
    const sortOption = SORT_OPTIONS[state.sortBy];
    if (sortOption) {
      filtered.sort(sortOption.compareFn);
    }

    state.filteredGamepasses = filtered;
  }

  /**
   * Update search query and re-filter
   */
  function setSearchQuery(query) {
    state.searchQuery = query;
    applyFiltersAndSort();
  }

  /**
   * Update sort option and re-sort
   */
  function setSortBy(sortKey) {
    if (SORT_OPTIONS[sortKey]) {
      state.sortBy = sortKey;
      applyFiltersAndSort();
    }
  }

  /**
   * Toggle selection of a gamepass
   */
  function toggleSelectPass(passId) {
    if (state.selectedPassIds.has(passId)) {
      state.selectedPassIds.delete(passId);
    } else {
      state.selectedPassIds.add(passId);
    }
  }

  /**
   * Select all gamepasses
   */
  function selectAll() {
    state.filteredGamepasses.forEach(pass => {
      state.selectedPassIds.add(pass.id);
    });
  }

  /**
   * Deselect all gamepasses
   */
  function deselectAll() {
    state.selectedPassIds.clear();
  }

  /**
   * Check if a gamepass is selected
   */
  function isSelected(passId) {
    return state.selectedPassIds.has(passId);
  }

  /**
   * Get number of selected gamepasses
   */
  function getSelectionCount() {
    return state.selectedPassIds.size;
  }

  /**
   * Bulk update price for selected gamepasses
   */
  async function bulkUpdatePrice(universeId, price, robloxFetch, addLog) {
    const selectedPasses = state.allGamepasses.filter(p => state.selectedPassIds.has(p.id));
    
    if (selectedPasses.length === 0) {
      addLog('No gamepasses selected', 'error');
      return { succeeded: 0, failed: 0 };
    }

    addLog(`Updating price for ${selectedPasses.length} gamepass(es)...`, 'info');
    
    let succeeded = 0;
    let failed = 0;

    for (const pass of selectedPasses) {
      try {
        await updateIndividualPrice(universeId, pass.id, price, pass.isForSale, robloxFetch, addLog);
        succeeded++;
      } catch (err) {
        addLog(`Failed to update ${pass.displayName || pass.name}: ${err.message}`, 'error');
        failed++;
      }
      await new Promise(r => setTimeout(r, 150)); // Rate limiting
    }

    addLog(`Bulk price update complete: ${succeeded} succeeded, ${failed} failed`, 'success');
    return { succeeded, failed };
  }

  /**
   * Bulk toggle on-sale status for selected gamepasses
   */
  async function bulkToggleSale(universeId, forSale, robloxFetch, addLog) {
    const selectedPasses = state.allGamepasses.filter(p => state.selectedPassIds.has(p.id));
    
    if (selectedPasses.length === 0) {
      addLog('No gamepasses selected', 'error');
      return { succeeded: 0, failed: 0 };
    }

    const action = forSale ? 'putting on sale' : 'taking off sale';
    addLog(`${action} ${selectedPasses.length} gamepass(es)...`, 'info');
    
    let succeeded = 0;
    let failed = 0;

    for (const pass of selectedPasses) {
      try {
        const form = new FormData();
        form.append('isForSale', forSale ? 'true' : 'false');
        
        const resp = await robloxFetch(
          `https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes/${pass.id}`,
          { method: 'PATCH', body: form }
        );

        if (!resp.ok) {
          const errorMsg = await extractErrorMessage(resp);
          throw new Error(errorMsg);
        }

        // Update cache
        pass.isForSale = forSale;
        succeeded++;
      } catch (err) {
        addLog(`Failed to update ${pass.displayName || pass.name}: ${err.message}`, 'error');
        failed++;
      }
      await new Promise(r => setTimeout(r, 150)); // Rate limiting
    }

    addLog(`Bulk sale toggle complete: ${succeeded} succeeded, ${failed} failed`, 'success');
    state.selectedPassIds.clear();
    return { succeeded, failed };
  }

  /**
   * Update individual gamepass price
   */
  async function updateIndividualPrice(universeId, passId, price, currentForSale, robloxFetch, addLog) {
    if (isNaN(price) || price < 0) {
      throw new Error('Invalid price: must be a non-negative number');
    }
    if (price > 1000000) {
      throw new Error('Price exceeds maximum limit of 1,000,000 Robux');
    }

    const form = new FormData();
    form.append('isForSale', 'true');
    form.append('price', Math.floor(price).toString());
    form.append('isRegionalPricingEnabled', 'false');

    const resp = await robloxFetch(
      `https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes/${passId}`,
      { method: 'PATCH', body: form }
    );

    if (!resp.ok) {
      const errorMsg = await extractErrorMessage(resp);
      throw new Error(errorMsg);
    }

    // Update cache
    const pass = state.allGamepasses.find(p => p.id === passId);
    if (pass) {
      pass.price = Math.floor(price);
      pass.isForSale = true;
    }

    return true;
  }

  /**
   * Toggle on-sale status for individual gamepass
   */
  async function toggleIndividualSale(universeId, passId, shouldBeForSale, robloxFetch, addLog) {
    const pass = state.allGamepasses.find(p => p.id === passId);
    if (!pass) throw new Error('Gamepass not found');

    const form = new FormData();
    form.append('isForSale', shouldBeForSale ? 'true' : 'false');
    
    if (shouldBeForSale && pass.price) {
      form.append('price', pass.price.toString());
      form.append('isRegionalPricingEnabled', 'false');
    }

    const resp = await robloxFetch(
      `https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes/${passId}`,
      { method: 'PATCH', body: form }
    );

    if (!resp.ok) {
      const errorMsg = await extractErrorMessage(resp);
      throw new Error(errorMsg);
    }

    pass.isForSale = shouldBeForSale;
    return true;
  }

  /**
   * Extract error message from Roblox API response
   */
  async function extractErrorMessage(response) {
    try {
      const data = await response.clone().json();
      if (data.errorMessage) return data.errorMessage;
      if (data.errors && data.errors.length > 0) return data.errors[0].message;
      if (data.message) return data.message;
    } catch (e) {}
    return `Status ${response.status}`;
  }

  /**
   * Get filtered gamepasses
   */
  function getFiltered() {
    return [...state.filteredGamepasses];
  }

  /**
   * Get all gamepasses
   */
  function getAll() {
    return [...state.allGamepasses];
  }

  /**
   * Clear all state
   */
  function clearCache() {
    state.allGamepasses = [];
    state.filteredGamepasses = [];
    state.selectedPassIds.clear();
    state.searchQuery = '';
    state.sortBy = 'name-asc';
  }

  /**
   * Format Robux amount with commas
   */
  function formatRobux(amount) {
    if (amount === null || amount === undefined) return 'N/A';
    return amount.toLocaleString('en-US');
  }

  return {
    fetchGamepasses,
    setSearchQuery,
    setSortBy,
    toggleSelectPass,
    selectAll,
    deselectAll,
    isSelected,
    getSelectionCount,
    bulkUpdatePrice,
    bulkToggleSale,
    updateIndividualPrice,
    toggleIndividualSale,
    getFiltered,
    getAll,
    SORT_OPTIONS,
    clearCache,
    formatRobux
  };
})();
