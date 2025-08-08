class MealService {
  constructor() {
    // Mock meal data - in production this would integrate with NDX
    this.meals = {
      'meal_001': {
        id: 'meal_001',
        name: 'Rice and Curry',
        description: 'Traditional Sri Lankan rice with mixed vegetables and dhal curry',
        price: 50.00,
        subsidyAmount: 30.00,
        nutritionScore: 85,
        available: true,
        maxQuantityPerDay: 100,
        currentQuantity: 95
      },
      'meal_002': {
        id: 'meal_002', 
        name: 'Chicken Sandwich',
        description: 'Grilled chicken sandwich with fresh vegetables',
        price: 80.00,
        subsidyAmount: 20.00,
        nutritionScore: 75,
        available: true,
        maxQuantityPerDay: 50,
        currentQuantity: 48
      }
    };
  }

  /**
   * Get meal by ID
   * @param {string} mealId - Meal ID
   * @returns {Promise<Object|null>} Meal data
   */
  async getMealById(mealId) {
    // [NDX INTEGRATION POINT]
    // In production: const meal = await ndxClient.getMeal(mealId);
    return this.meals[mealId] || null;
  }

  /**
   * Update meal availability
   * @param {string} mealId - Meal ID
   * @param {string} date - Date
   * @param {number} quantity - Quantity ordered
   * @returns {Promise<void>}
   */
  async updateAvailability(mealId, date, quantity) {
    // [NDX INTEGRATION POINT]
    // In production: await ndxClient.updateMealAvailability(mealId, date, quantity);
    if (this.meals[mealId]) {
      this.meals[mealId].currentQuantity -= quantity;
      console.log(`[MEAL_SERVICE] Updated availability for ${mealId}: -${quantity}`);
    }
  }

  /**
   * Restore meal availability (when order cancelled)
   * @param {string} mealId - Meal ID
   * @param {string} date - Date
   * @param {number} quantity - Quantity to restore
   * @returns {Promise<void>}
   */
  async restoreAvailability(mealId, date, quantity) {
    // [NDX INTEGRATION POINT]
    if (this.meals[mealId]) {
      this.meals[mealId].currentQuantity += quantity;
      console.log(`[MEAL_SERVICE] Restored availability for ${mealId}: +${quantity}`);
    }
  }
}

module.exports = new MealService();