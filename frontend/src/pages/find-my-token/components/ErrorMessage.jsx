import React from 'react';
import Icon from '../../../components/AppIcon';

const ErrorMessage = ({ message }) => {
  return (
    <div className="bg-error/10 border border-error/20 rounded-lg p-4 md:p-6 lg:p-8">
      <div className="flex items-start gap-3 md:gap-4">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-error/20 flex items-center justify-center">
            <Icon 
              name="AlertCircle" 
              size={20} 
              color="var(--color-error)" 
              className="md:w-6 md:h-6 lg:w-7 lg:h-7"
            />
          </div>
        </div>
        <div className="flex-1 space-y-1 md:space-y-2">
          <h3 className="text-base md:text-lg lg:text-xl font-heading font-semibold text-error">
            No Active Order Found
          </h3>
          <p className="text-sm md:text-base text-foreground/80">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;