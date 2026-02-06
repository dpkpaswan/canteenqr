import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const MenuItemCard = ({ item, onQuantityChange, quantity = 0, isAuthenticated }) => {
  const handleIncrement = () => {
    onQuantityChange(item?.id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      onQuantityChange(item?.id, quantity - 1);
    }
  };

  return (
    <div className="w-full bg-card rounded-xl shadow-sm border border-border p-4 transition-colors hover:bg-accent/5">
      {/* Mobile-optimized layout */}
      <div className="flex flex-col gap-3">
        {/* Header: Name and Price */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-foreground mb-1 line-clamp-1">
              {item?.name}
            </h3>
            {item?.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {item?.description}
              </p>
            )}
          </div>
          <span className="flex-shrink-0 text-lg font-bold text-primary">
            ₹{item?.price}
          </span>
        </div>

        {/* Bottom Row: Category and Add Button */}
        <div className="flex items-center justify-between">
          {/* Category Tag */}
          {item?.category && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-xs text-muted-foreground">
              <Icon name="Tag" size={10} />
              {item?.category}
            </span>
          )}

          {/* Add to Cart Controls */}
          <div className="flex-shrink-0">
            {quantity === 0 ? (
              <div className="flex flex-col items-end">
                <Button
                  size="sm"
                  onClick={handleIncrement}
                  disabled={!isAuthenticated}
                  className="h-8 px-3 text-xs font-medium"
                >
                  {isAuthenticated ? (
                    <>Add</>
                  ) : (
                    <>
                      <Icon name="Lock" size={12} className="mr-1" />
                      Login
                    </>
                  )}
                </Button>
                {!isAuthenticated && (
                  <span className="text-xs text-muted-foreground mt-1">
                    Required
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-accent rounded-md p-1">
                <button
                  onClick={handleDecrement}
                  className="w-6 h-6 flex items-center justify-center rounded bg-card hover:bg-background transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Icon name="Minus" size={12} color="var(--color-primary)" />
                </button>
                <span className="font-semibold text-sm min-w-[24px] text-center px-1">
                  {quantity}
                </span>
                <button
                  onClick={handleIncrement}
                  className="w-6 h-6 flex items-center justify-center rounded bg-card hover:bg-background transition-colors"
                  aria-label="Increase quantity"
                >
                  <Icon name="Plus" size={12} color="var(--color-primary)" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;