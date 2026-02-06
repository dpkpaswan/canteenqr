/**
 * Menu routes
 * Handles menu items for the canteen
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Static menu data - in production this could come from database
const menuItems = [
  {
    id: 1,
    name: "Masala Dosa",
    description: "Crispy rice pancake filled with spiced potato curry, served with coconut chutney and sambar",
    price: 45,
    category: "South Indian",
    image: null,
    isAvailable: true
  },
  {
    id: 2,
    name: "Aloo Paratha",
    description: "Stuffed flatbread with spiced potato filling, served with curd and pickle",
    price: 85,
    category: "Main Course",
    image: null,
    isAvailable: true
  },
  {
    id: 3,
    name: "Veg Biryani",
    description: "Fragrant basmati rice cooked with mixed vegetables and aromatic spices",
    price: 70,
    category: "Rice & Biryani",
    image: null,
    isAvailable: true
  },
  {
    id: 4,
    name: "Samosa (2 pcs)",
    description: "Crispy fried pastry filled with spiced potatoes and peas",
    price: 20,
    category: "Snacks",
    image: null,
    isAvailable: true
  },
  {
    id: 5,
    name: "Chole Bhature",
    description: "Spicy chickpea curry served with fluffy deep-fried bread",
    price: 60,
    category: "North Indian",
    image: null,
    isAvailable: true
  },
  {
    id: 6,
    name: "Idli Sambar (3 pcs)",
    description: "Steamed rice cakes served with lentil-based vegetable stew and coconut chutney",
    price: 35,
    category: "South Indian",
    image: null,
    isAvailable: true
  },
  {
    id: 7,
    name: "Pav Bhaji",
    description: "Thick vegetable curry served with buttered and toasted bread rolls",
    price: 55,
    category: "Street Food",
    image: null,
    isAvailable: true
  },
  {
    id: 8,
    name: "Rajma Rice",
    description: "Kidney bean curry served with steamed basmati rice",
    price: 65,
    category: "Main Course",
    image: null,
    isAvailable: true
  },
  {
    id: 9,
    name: "Poha",
    description: "Flattened rice cooked with onions, tomatoes, and spices, garnished with fresh coriander",
    price: 30,
    category: "Breakfast",
    image: null,
    isAvailable: true
  },
  {
    id: 10,
    name: "Vada Pav",
    description: "Deep-fried potato dumpling placed inside a bread bun with chutneys",
    price: 25,
    category: "Street Food",
    image: null,
    isAvailable: true
  },
  {
    id: 11,
    name: "Chicken Biryani",
    description: "Aromatic basmati rice cooked with tender chicken pieces and traditional spices",
    price: 120,
    category: "Rice & Biryani",
    image: null,
    isAvailable: true
  },
  {
    id: 12,
    name: "Paneer Butter Masala",
    description: "Cottage cheese cubes cooked in creamy tomato-based curry, served with naan",
    price: 95,
    category: "Main Course",
    image: null,
    isAvailable: true
  }
];

/**
 * @route GET /api/menu
 * @desc Get all menu items
 * @access Public
 */
router.get('/', asyncHandler(async (req, res) => {
  const { category } = req.query;
  
  let filteredItems = menuItems.filter(item => item.isAvailable);
  
  if (category && category !== 'all') {
    filteredItems = filteredItems.filter(item => 
      item.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  res.json({
    success: true,
    message: 'Menu items retrieved successfully',
    data: filteredItems,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/menu/categories
 * @desc Get all available categories
 * @access Public
 */
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = [...new Set(menuItems.map(item => item.category))];
  
  res.json({
    success: true,
    message: 'Categories retrieved successfully',
    data: categories,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/menu/:id
 * @desc Get specific menu item by ID
 * @access Public
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = menuItems.find(item => item.id === parseInt(id));
  
  if (!item) {
    return res.status(404).json({
      success: false,
      message: 'Menu item not found',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
  
  res.json({
    success: true,
    message: 'Menu item retrieved successfully',
    data: item,
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;