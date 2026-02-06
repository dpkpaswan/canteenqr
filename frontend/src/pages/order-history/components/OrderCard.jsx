import React from 'react';
import { format } from 'date-fns';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const OrderCard = ({ order, onReorder }) => {
  const formattedDate = format(new Date(order?.orderDate), 'dd MMM yyyy, hh:mm a');
  const itemCount = order?.items?.reduce((sum, item) => sum + item?.quantity, 0);

  return (
    <div className="bg-card rounded-lg p-4 md:p-5 lg:p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* Order Info Section */}
        <div className="flex-1">
          {/* Header with Token and Date */}
          <div className="flex items-start justify-between mb-3 md:mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Icon name="Ticket" size={18} className="text-primary" />
                <span className="font-heading font-bold text-foreground text-lg md:text-xl">
                  Token: {order?.tokenNumber}
                </span>
              </div>
              <p className="text-muted-foreground text-sm md:text-base flex items-center gap-1.5">
                <Icon name="Calendar" size={14} />
                {formattedDate}
              </p>
            </div>
          </div>

          {/* Items List */}
          <div className="mb-3 md:mb-4">
            <h3 className="font-caption font-semibold text-foreground text-sm md:text-base mb-2 flex items-center gap-1.5">
              <Icon name="ShoppingBag" size={16} />
              Items ({itemCount})
            </h3>
            <ul className="space-y-1.5">
              {order?.items?.map((item) => (
                <li
                  key={item?.id}
                  className="flex items-center justify-between text-sm md:text-base"
                >
                  <span className="text-foreground">
                    {item?.name} <span className="text-muted-foreground">× {item?.quantity}</span>
                  </span>
                  <span className="text-muted-foreground">
                    ₹{(item?.price * item?.quantity)?.toLocaleString('en-IN')}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Total Amount */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="font-caption font-semibold text-foreground text-base md:text-lg">
              Total Amount
            </span>
            <span className="font-heading font-bold text-primary text-lg md:text-xl">
              ₹{order?.totalAmount?.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Reorder Button */}
        <div className="flex md:flex-col gap-2 md:gap-3">
          <Button
            variant="default"
            size="lg"
            onClick={() => onReorder(order)}
            iconName="RefreshCw"
            iconPosition="left"
            className="flex-1 md:flex-none md:min-w-[140px]"
          >
            Reorder
          </Button>
          
          <div className="hidden md:block">
            <div className="bg-muted rounded-lg px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Status</p>
              <div className="flex items-center justify-center gap-1">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                <span className="text-xs font-medium text-success capitalize">
                  {order?.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Status Badge */}
      <div className="md:hidden mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-center gap-2 bg-muted rounded-lg py-2">
          <div className="w-2 h-2 rounded-full bg-success"></div>
          <span className="text-sm font-medium text-success capitalize">
            Order {order?.status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;