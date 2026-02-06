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

  return (
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
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Icon name="ShoppingCart" size={20} />
                </div>
                <span className="font-heading font-semibold text-lg">
                  Your Cart
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <span className="font-heading font-bold text-sm">
                  {itemCount}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-primary-foreground/20">
              <span className="font-caption text-sm opacity-90">Total Amount</span>
              <span className="font-heading font-bold text-2xl">
                ₹{totalAmount?.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm font-caption opacity-90">
              <span>Proceed to Checkout</span>
              <Icon name="ArrowRight" size={16} />
            </div>
          </div>
        </button>
      </div>
    </>
  );
};

export default StickyCartButton;