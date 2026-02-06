import React from 'react';
import Icon from '../../../components/AppIcon';

const EmptyMenuState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-16 lg:py-20 px-4">
      <div className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full bg-muted flex items-center justify-center mb-4 md:mb-6">
        <Icon name="UtensilsCrossed" size={40} color="var(--color-muted-foreground)" />
      </div>
      <h3 className="font-heading font-semibold text-foreground text-lg md:text-xl lg:text-2xl mb-2 text-center">
        No Items Available
      </h3>
      <p className="text-muted-foreground text-sm md:text-base text-center max-w-md">
        The menu is currently empty. Please check back later or contact the canteen staff.
      </p>
    </div>
  );
};

export default EmptyMenuState;