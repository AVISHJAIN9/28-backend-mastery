import React, { useState, useCallback, useEffect } from 'react';

const CursorPaginationApp = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('price');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [paginationStack, setPaginationStack] = useState([]); // Stack of cursors for back button
  const [currentCursor, setCurrentCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Load initial page
  useEffect(() => {
    if (activeTab === 'products') loadProducts();
    else if (activeTab === 'users') loadUsers();
  }, [activeTab]);

  /**
   * Load products with cursor pagination
   */
  const loadProducts = useCallback(async (cursor = null) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        limit: 20,
        sortBy,
        order: sortOrder,
        ...(cursor && { cursor }),
      });

      const response = await fetch(`/api/products?${query}`);
      const data = await response.json();

      setItems(data.data);
      setHasNextPage(data.pagination.hasNextPage);
      setCurrentCursor(data.pagination.nextCursor);
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder]);

  /**
   * Load users with cursor pagination
   */
  const loadUsers = useCallback(async (cursor = null) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        limit: 20,
        searchTerm,
        ...(cursor && { cursor }),
      });

      const response = await fetch(`/api/users?${query}`);
      const data = await response.json();

      setItems(data.data);
      setHasNextPage(data.pagination.hasNextPage);
      setCurrentCursor(data.pagination.nextCursor);
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  /**
   * Handle next page
   */
  const handleNextPage = useCallback(() => {
    if (!currentCursor) return;
    setPaginationStack(prev => [...prev, currentCursor]);
    if (activeTab === 'products') loadProducts(currentCursor);
    else loadUsers(currentCursor);
  }, [currentCursor, activeTab, loadProducts, loadUsers]);

  /**
   * Handle previous page
   */
  const handlePreviousPage = useCallback(() => {
    if (paginationStack.length === 0) return;
    const newStack = [...paginationStack];
    const previousCursor = newStack.pop();
    setPaginationStack(newStack);
    const prevCursor = newStack.length > 0 ? newStack[newStack.length - 1] : null;
    if (activeTab === 'products') loadProducts(prevCursor);
    else loadUsers(prevCursor);
  }, [paginationStack, activeTab, loadProducts, loadUsers]);

  const handleSortChange = (field) => {
    setSortBy(field);
    setPaginationStack([]);
    setCurrentCursor(null);
  };

  const handleSortOrderChange = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    setPaginationStack([]);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>↵️ Cursor-Based Pagination</h1>
      <p>Efficient pagination for large datasets</p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee' }}>
        {['products', 'users'].map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setPaginationStack([]);
              setCurrentCursor(null);
            }}
            style={{
              padding: '10px 16px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === tab ? '#007bff' : '#f0f0f0',
              color: activeTab === tab ? 'white' : '#000',
              borderRadius: '4px 4px 0 0',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'products' && (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <select
              value={sortBy}
              onChange={e => handleSortChange(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="price">Price</option>
              <option value="rating">Rating</option>
              <option value="createdAt">Newest</option>
              <option value="name">Name</option>
            </select>
            <button
              onClick={handleSortOrderChange}
              style={{
                padding: '8px 12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setPaginationStack([]);
              setCurrentCursor(null);
            }}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              width: '60%',
            }}
          />
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: '16px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9',
            }}
          >
            <h3>{item.name}</h3>
            {activeTab === 'products' && (
              <>
                <p>Price: ${item.price.toFixed(2)}</p>
                <p>Rating: {item.rating}/5 ⭐</p>
              </>
            )}
            {activeTab === 'users' && (
              <>
                <p>Email: {item.email}</p>
                <p>Followers: {item.followerCount}</p>
              </>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
        <button
          onClick={handlePreviousPage}
          disabled={paginationStack.length === 0 || loading}
          style={{
            padding: '10px 16px',
            backgroundColor: paginationStack.length === 0 ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: paginationStack.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          ← Previous
        </button>

        <span style={{ color: '#666' }}>
          {items.length} items | Page {paginationStack.length + 1}
        </span>

        <button
          onClick={handleNextPage}
          disabled={!hasNextPage || loading}
          style={{
            padding: '10px 16px',
            backgroundColor: !hasNextPage ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !hasNextPage ? 'not-allowed' : 'pointer',
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default CursorPaginationApp;

