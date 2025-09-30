import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';

const CartTestComponent = () => {
  const { cart, addToCart, clearCart, clearCartOnLogout, getCartItemCount, getCartTotal } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [testItem, setTestItem] = useState({
    itemType: 'property',
    itemId: 'test-property-123',
    checkIn: '2024-02-01',
    checkOut: '2024-02-03',
    guests: 2,
    guestMessage: 'Test message',
    subtotal: 200,
    itemSnapshot: {
      name: 'Test Property',
      description: 'A test property for cart testing',
      thumbnail: 'test-thumbnail.jpg',
      location: 'Test City, Test Address'
    }
  });

  const handleAddTestItem = async () => {
    try {
      await addToCart(testItem);
      alert('Test item added to cart!');
    } catch (error) {
      alert('Error adding test item: ' + error.message);
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      alert('Cart cleared!');
    } catch (error) {
      alert('Error clearing cart: ' + error.message);
    }
  };

  const handleClearOnLogout = () => {
    clearCartOnLogout();
    alert('Cart cleared on logout!');
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ccc', 
      margin: '20px', 
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>Cart Test Component</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Current User:</strong> {isAuthenticated ? (user?.fullName || user?.email || 'Authenticated User') : 'Guest User'}
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Cart Status:</strong>
        <ul>
          <li>Items: {getCartItemCount()}</li>
          <li>Total: ${getCartTotal()}</li>
          <li>Is Empty: {cart.items.length === 0 ? 'Yes' : 'No'}</li>
        </ul>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>Cart Items:</strong>
        {cart.items.length === 0 ? (
          <p>No items in cart</p>
        ) : (
          <ul>
            {cart.items.map((item, index) => (
              <li key={index}>
                {item.itemSnapshot?.name || 'Unknown Item'} - ${item.subtotal}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={handleAddTestItem} style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
          Add Test Item
        </button>
        
        <button onClick={handleClearCart} style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
          Clear Cart
        </button>
        
        <button onClick={handleClearOnLogout} style={{ padding: '8px 16px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px' }}>
          Clear on Logout
        </button>
      </div>

      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        <strong>Instructions:</strong>
        <ol>
          <li>Add items to cart as one user</li>
          <li>Log out and log in as a different user</li>
          <li>Verify that the cart is empty for the new user</li>
          <li>Add items as the new user and verify they don't appear for the first user</li>
        </ol>
      </div>
    </div>
  );
};

export default CartTestComponent;
