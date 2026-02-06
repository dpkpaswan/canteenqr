import React from 'react';

const TokenDisplay = ({ token, orderDetails }) => {
  return (
    <div className="bg-card rounded-lg p-6 md:p-8 lg:p-10 shadow-lg border border-border">
      <div className="text-center space-y-4 md:space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg md:text-xl lg:text-2xl font-heading font-semibold text-muted-foreground">
            Your Token Number
          </h2>
          <div className="bg-primary/10 rounded-lg p-6 md:p-8 lg:p-10">
            <p className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-primary">
              {token}
            </p>
          </div>
        </div>

        {orderDetails && (
          <div className="pt-4 md:pt-6 border-t border-border space-y-3 md:space-y-4">
            <div className="flex justify-between items-center text-sm md:text-base">
              <span className="text-muted-foreground">Order Time:</span>
              <span className="font-medium text-foreground">{orderDetails?.time}</span>
            </div>
            <div className="flex justify-between items-center text-sm md:text-base">
              <span className="text-muted-foreground">Total Items:</span>
              <span className="font-medium text-foreground">{orderDetails?.itemCount}</span>
            </div>
            <div className="flex justify-between items-center text-sm md:text-base">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-medium text-primary">₹{orderDetails?.amount}</span>
            </div>
          </div>
        )}

        <div className="pt-4 md:pt-6">
          <p className="text-xs md:text-sm text-muted-foreground">
            Please save this token number for collecting your order
          </p>
        </div>
      </div>
    </div>
  );
};

export default TokenDisplay;