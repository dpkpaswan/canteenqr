import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const StickyCartButton = ({ itemCount, totalAmount }) => {
  const navigate = useNavigate();

  if (itemCount === 0) return null;

  const handleCartClick = () => {
    navigate('/cart-checkout');
  };

  // Mobile bottom action bar for cart
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="p-4">
        <Button
          onClick={handleCartClick}
          className="w-full h-12 text-base font-semibold shadow-md"
          size="lg"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <span className="font-bold text-xs text-primary-foreground">
                  {itemCount}
                </span>
              </div>
              <span className="font-semibold">
                View Cart
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold">₹{totalAmount?.toFixed(2)}</span>
              <Icon name="ShoppingCart" size={18} />
            </div>
          </div>
        </Button>
      </div>
    </div>
  );
};

export default StickyCartButton;