import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const handleIncrement = () => {
    onUpdateQuantity(item?.id, item?.quantity + 1);
  };

  const handleDecrement = () => {
    if (item?.quantity > 1) {
      onUpdateQuantity(item?.id, item?.quantity - 1);
    }
  };

  const itemTotal = item?.price * item?.quantity;

  return (
    <div className="bg-card rounded-lg p-4 md:p-5 lg:p-6 shadow-sm border border-border">
      <div className="flex items-start justify-between gap-3 md:gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold text-foreground text-base md:text-lg lg:text-xl mb-1 md:mb-2">
            {item?.name}
          </h3>
          <p className="text-muted-foreground text-sm md:text-base mb-2 md:mb-3">
            ₹{item?.price?.toLocaleString('en-IN')} per item
          </p>
          
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2 md:gap-3 bg-muted rounded-lg p-1 md:p-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDecrement}
                disabled={item?.quantity <= 1}
                className="h-8 w-8 md:h-10 md:w-10"
                aria-label="Decrease quantity"
              >
                <Icon name="Minus" size={16} />
              </Button>
              
              <span className="font-caption font-semibold text-foreground min-w-[24px] md:min-w-[32px] text-center text-sm md:text-base">
                {item?.quantity}
              </span>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleIncrement}
                className="h-8 w-8 md:h-10 md:w-10"
                aria-label="Increase quantity"
              >
                <Icon name="Plus" size={16} />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(item?.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              iconName="Trash2"
              iconSize={16}
            >
              Remove
            </Button>
          </div>
        </div>

        <div className="text-right">
          <p className="font-heading font-bold text-foreground text-lg md:text-xl lg:text-2xl whitespace-nowrap">
            ₹{itemTotal?.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CartItem;