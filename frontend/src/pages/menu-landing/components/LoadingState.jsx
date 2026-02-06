import React from 'react';
import Icon from '../../../components/AppIcon';

const LoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-16 lg:py-20 px-4">
      <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 md:mb-6 animate-pulse">
        <Icon name="Loader2" size={32} color="var(--color-primary)" className="animate-spin" />
      </div>
      <h3 className="font-heading font-semibold text-foreground text-lg md:text-xl lg:text-2xl mb-2 text-center">
        Loading Menu
      </h3>
      <p className="text-muted-foreground text-sm md:text-base text-center">
        Please wait while we fetch the latest items...
      </p>
    </div>
  );
};

export default LoadingState;