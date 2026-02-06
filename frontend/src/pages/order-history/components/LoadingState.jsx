import React from 'react';
import Icon from '../../../components/AppIcon';

const LoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
      <div className="bg-card rounded-2xl p-6 md:p-8 lg:p-10 shadow-lg border border-border max-w-md w-full text-center">
        <div className="bg-muted rounded-full w-20 h-20 md:w-24 md:h-24 flex items-center justify-center mx-auto mb-4 md:mb-5 animate-pulse">
          <Icon name="History" size={40} className="text-muted-foreground" />
        </div>

        <h2 className="font-heading font-semibold text-foreground text-xl md:text-2xl mb-2">
          Loading Order History
        </h2>

        <p className="text-muted-foreground text-sm md:text-base">
          Please wait while we fetch your orders...
        </p>

        <div className="mt-6 flex justify-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;