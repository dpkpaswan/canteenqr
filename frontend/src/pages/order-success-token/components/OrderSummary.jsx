import React from 'react';
import Icon from '../../../components/AppIcon';

const OrderSummary = ({ items, totalAmount }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(amount);
  };

  return (
    <div className="bg-card rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 shadow-md border border-border">
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
        <Icon 
          name="ShoppingBag" 
          size={24} 
          color="var(--color-primary)" 
          className="md:w-7 md:h-7"
        />
        <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-foreground">
          Order Summary
        </h3>
      </div>
      <div className="space-y-3 md:space-y-4">
        {items?.map((item, index) => (
          <div 
            key={index}
            className="flex items-center justify-between py-3 md:py-4 border-b border-border last:border-0"
          >
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm md:text-base lg:text-lg font-medium text-foreground truncate">
                {item?.name}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Qty: {item?.quantity} × {formatCurrency(item?.price)}
              </p>
            </div>
            <p className="text-sm md:text-base lg:text-lg font-semibold text-foreground whitespace-nowrap">
              {formatCurrency(item?.quantity * item?.price)}
            </p>
          </div>
        ))}

        <div className="pt-3 md:pt-4 border-t-2 border-primary/20">
          <div className="flex items-center justify-between">
            <p className="text-base md:text-lg lg:text-xl font-semibold text-foreground">
              Total Amount Paid
            </p>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold text-primary">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;