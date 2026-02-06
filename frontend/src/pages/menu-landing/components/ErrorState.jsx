import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ErrorState = ({ onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-16 lg:py-20 px-4">
      <div className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full bg-error/10 flex items-center justify-center mb-4 md:mb-6">
        <Icon name="AlertCircle" size={40} color="var(--color-error)" />
      </div>
      <h3 className="font-heading font-semibold text-foreground text-lg md:text-xl lg:text-2xl mb-2 text-center">
        Unable to Load Menu
      </h3>
      <p className="text-muted-foreground text-sm md:text-base text-center max-w-md mb-6 md:mb-8">
        We encountered an error while fetching the menu. Please check your internet connection and try again.
      </p>
      <Button
        variant="default"
        size="lg"
        onClick={onRetry}
        iconName="RefreshCw"
        iconPosition="left"
      >
        Retry
      </Button>
    </div>
  );
};

export default ErrorState;