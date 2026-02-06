import React from 'react';

const OrderSummary = ({ items }) => {
  const subtotal = items?.reduce((sum, item) => sum + (item?.price * item?.quantity), 0);
  const gst = subtotal * 0.05;
  const total = subtotal + gst;

  return (
    <div className="bg-card rounded-lg p-4 md:p-5 lg:p-6 shadow-md border border-border">
      <h2 className="font-heading font-semibold text-foreground text-xl md:text-2xl lg:text-3xl mb-4 md:mb-5 lg:mb-6">
        Order Summary
      </h2>
      <div className="space-y-3 md:space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm md:text-base lg:text-lg">
            Subtotal ({items?.reduce((sum, item) => sum + item?.quantity, 0)} items)
          </span>
          <span className="font-caption font-semibold text-foreground text-sm md:text-base lg:text-lg">
            ₹{subtotal?.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm md:text-base lg:text-lg">
            GST (5%)
          </span>
          <span className="font-caption font-semibold text-foreground text-sm md:text-base lg:text-lg">
            ₹{gst?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="border-t border-border pt-3 md:pt-4">
          <div className="flex justify-between items-center">
            <span className="font-heading font-semibold text-foreground text-lg md:text-xl lg:text-2xl">
              Total Amount
            </span>
            <span className="font-heading font-bold text-primary text-xl md:text-2xl lg:text-3xl">
              ₹{total?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;