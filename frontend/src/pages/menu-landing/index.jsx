import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/navigation/Header';
import ProgressIndicator from '../../components/navigation/ProgressIndicator';
import MenuItemCard from './components/MenuItemCard';
import CategoryFilter from './components/CategoryFilter';
import StickyCartButton from './components/StickyCartButton';
import EmptyMenuState from './components/EmptyMenuState';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import LoginModal from '../../components/modals/LoginModal';
import Icon from '../../components/AppIcon';


const MenuLanding = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('canteen_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse saved cart:', error);
        localStorage.removeItem('canteen_cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('canteen_cart', JSON.stringify(cart));
  }, [cart]);

  const handleLoginSuccess = (credentialResponse) => {
    login(credentialResponse);
    setShowLoginModal(false);
  };

  const handleLoginError = () => {
    console.error('Google Login Failed');
  };

  const mockMenuData = [
    {
      id: 1,
      name: "Masala Dosa",
      description: "Crispy rice crepe filled with spiced potato filling, served with sambar and chutney",
      price: 45,
      category: "South Indian"
    },
    {
      id: 2,
      name: "Paneer Butter Masala",
      description: "Cottage cheese cubes cooked in rich tomato-based gravy with butter and cream",
      price: 85,
      category: "Main Course"
    },
    {
      id: 3,
      name: "Veg Biryani",
      description: "Fragrant basmati rice cooked with mixed vegetables and aromatic spices",
      price: 70,
      category: "Rice & Biryani"
    },
    {
      id: 4,
      name: "Samosa (2 pcs)",
      description: "Crispy fried pastry filled with spiced potatoes and peas",
      price: 20,
      category: "Snacks"
    },
    {
      id: 5,
      name: "Chole Bhature",
      description: "Spicy chickpea curry served with fluffy deep-fried bread",
      price: 60,
      category: "North Indian"
    },
    {
      id: 6,
      name: "Idli Sambar (3 pcs)",
      description: "Steamed rice cakes served with lentil-based vegetable stew and coconut chutney",
      price: 35,
      category: "South Indian"
    },
    {
      id: 7,
      name: "Veg Fried Rice",
      description: "Stir-fried rice with mixed vegetables and Indo-Chinese spices",
      price: 65,
      category: "Rice & Biryani"
    },
    {
      id: 8,
      name: "Aloo Paratha",
      description: "Whole wheat flatbread stuffed with spiced potato filling, served with curd and pickle",
      price: 40,
      category: "North Indian"
    },
    {
      id: 9,
      name: "Pav Bhaji",
      description: "Spicy mixed vegetable curry served with buttered bread rolls",
      price: 55,
      category: "Snacks"
    },
    {
      id: 10,
      name: "Dal Tadka",
      description: "Yellow lentils tempered with ghee, cumin, and aromatic spices",
      price: 50,
      category: "Main Course"
    },
    {
      id: 11,
      name: "Vada Pav",
      description: "Spiced potato fritter sandwiched in bread roll with chutneys",
      price: 25,
      category: "Snacks"
    },
    {
      id: 12,
      name: "Rajma Chawal",
      description: "Red kidney beans curry served with steamed basmati rice",
      price: 60,
      category: "Rice & Biryani"
    },
    {
      id: 13,
      name: "Medu Vada (3 pcs)",
      description: "Crispy fried lentil donuts served with sambar and coconut chutney",
      price: 40,
      category: "South Indian"
    },
    {
      id: 14,
      name: "Paneer Tikka",
      description: "Marinated cottage cheese cubes grilled with bell peppers and onions",
      price: 95,
      category: "Snacks"
    },
    {
      id: 15,
      name: "Veg Pulao",
      description: "Mildly spiced rice cooked with mixed vegetables and whole spices",
      price: 55,
      category: "Rice & Biryani"
    }
  ];

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setLoading(true);
        setError(false);
        
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        setMenuItems(mockMenuData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError(true);
        setLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(menuItems.map(item => item.category))];
    return uniqueCategories?.sort();
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    if (selectedCategory === 'all') {
      return menuItems;
    }
    return menuItems?.filter(item => item?.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  const handleQuantityChange = (itemId, newQuantity) => {
    // Show login modal if user is not authenticated and trying to add items
    if (!isAuthenticated && newQuantity > 0) {
      setShowLoginModal(true);
      return;
    }

    setCart(prevCart => {
      if (newQuantity === 0) {
        const { [itemId]: removed, ...rest } = prevCart;
        return rest;
      }
      return {
        ...prevCart,
        [itemId]: newQuantity
      };
    });
  };

  const cartSummary = useMemo(() => {
    const itemCount = Object.values(cart)?.reduce((sum, qty) => sum + qty, 0);
    const totalAmount = Object.entries(cart)?.reduce((sum, [itemId, qty]) => {
      const item = menuItems?.find(i => i?.id === parseInt(itemId));
      return sum + (item ? item?.price * qty : 0);
    }, 0);
    return { itemCount, totalAmount };
  }, [cart, menuItems]);

  const handleRetry = () => {
    setError(false);
    setLoading(true);
    setTimeout(() => {
      setMenuItems(mockMenuData);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ProgressIndicator />
      
      {/* Main Content with mobile-first layout */}
      <main className="flex-1 overflow-y-auto pb-20">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState onRetry={handleRetry} />
        ) : (
          <>
            {/* Category Filter */}
            {menuItems?.length > 0 && (
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            )}

            {/* Content Container */}
            <div className="px-4 py-4 space-y-4">
              {filteredMenuItems?.length === 0 ? (
                <EmptyMenuState />
              ) : (
                <>
                  {/* Page Title - Mobile optimized */}
                  <div className="space-y-1">
                    <h1 className="text-lg font-bold text-foreground">
                      Our Menu
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Browse our delicious offerings
                      {!isAuthenticated && (
                        <span className="block mt-1 text-primary font-medium text-xs">
                          <Icon name="Info" size={12} className="inline mr-1" />
                          Sign in to place orders
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Menu Items - Single column for mobile */}
                  <div className="space-y-3">
                    {filteredMenuItems?.map(item => (
                      <MenuItemCard
                        key={item?.id}
                        item={item}
                        onQuantityChange={handleQuantityChange}
                        quantity={cart?.[item?.id] || 0}
                        isAuthenticated={isAuthenticated}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </main>

      {/* Sticky Bottom Cart */}
      {cartSummary?.itemCount > 0 && (
        <StickyCartButton
          itemCount={cartSummary?.itemCount}
          totalAmount={cartSummary?.totalAmount}
          onClick={() => navigate('/cart-checkout')}
        />
      )}

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default MenuLanding;