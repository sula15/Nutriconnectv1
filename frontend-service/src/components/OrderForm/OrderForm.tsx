import React, { useState } from 'react';
import { apiClient } from '../../utils/apiClient';

interface OrderFormProps {
  availableMeals: Array<{
    id: string;
    name: string;
    price: number;
    subsidyAmount: number;
    nutritionScore: number;
  }>;
  onOrderCreated: (order: any) => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({ availableMeals, onOrderCreated }) => {
  const [formData, setFormData] = useState({
    mealId: '',
    scheduledDate: '',
    quantity: 1,
    specialInstructions: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.mealId || !formData.scheduledDate) {
      setError('Please select a meal and date');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.post('/orders', formData);
      
      if (response.success) {
        onOrderCreated(response.order);
        // Reset form
        setFormData({
          mealId: '',
          scheduledDate: '',
          quantity: 1,
          specialInstructions: ''
        });
      } else {
        setError(response.message || 'Failed to create order');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedMeal = availableMeals.find(meal => meal.id === formData.mealId);
  const totalAmount = selectedMeal ? selectedMeal.price * formData.quantity : 0;
  const subsidyAmount = selectedMeal ? selectedMeal.subsidyAmount * formData.quantity : 0;
  const finalAmount = Math.max(0, totalAmount - subsidyAmount);

  return (
    <form onSubmit={handleSubmit} className="order-form">
      <h3>🍽️ Place New Order</h3>
      
      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="form-group">
        <label htmlFor="mealId">Select Meal:</label>
        <select
          id="mealId"
          value={formData.mealId}
          onChange={(e) => setFormData(prev => ({ ...prev, mealId: e.target.value }))}
          required
        >
          <option value="">Choose a meal...</option>
          {availableMeals.map(meal => (
            <option key={meal.id} value={meal.id}>
              {meal.name} - Rs. {meal.price} (Nutrition: {meal.nutritionScore}/100)
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="scheduledDate">Date:</label>
        <input
          type="date"
          id="scheduledDate"
          value={formData.scheduledDate}
          onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
          min={new Date().toISOString().split('T')[0]} // Cannot select past dates
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="quantity">Quantity:</label>
        <input
          type="number"
          id="quantity"
          value={formData.quantity}
          onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
          min="1"
          max="10"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="specialInstructions">Special Instructions (optional):</label>
        <textarea
          id="specialInstructions"
          value={formData.specialInstructions}
          onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
          placeholder="Any special dietary requirements or instructions..."
        />
      </div>

      {selectedMeal && (
        <div className="order-summary">
          <h4>Order Summary:</h4>
          <p>Meal: {selectedMeal.name}</p>
          <p>Total: Rs. {totalAmount}</p>
          <p>Government Subsidy: -Rs. {subsidyAmount}</p>
          <p className="final-amount">Amount to Pay: Rs. {finalAmount}</p>
          {finalAmount === 0 && (
            <p className="fully-subsidized">✅ Fully subsidized!</p>
          )}
        </div>
      )}

      <button type="submit" disabled={loading} className="submit-btn">
        {loading ? 'Placing Order...' : 'Place Order'}
      </button>
    </form>
  );
};