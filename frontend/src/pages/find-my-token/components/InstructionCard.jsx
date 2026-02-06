import React from 'react';
import Icon from '../../../components/AppIcon';

const InstructionCard = () => {
  const instructions = [
    {
      icon: 'Phone',
      title: 'Enter Phone Number',
      description: 'Use the same number you provided during order placement'
    },
    {
      icon: 'Search',
      title: 'Search Order',
      description: 'We will look up your active order in our system'
    },
    {
      icon: 'Hash',
      title: 'Get Token',
      description: 'Your token number will be displayed if an active order exists'
    }
  ];

  return (
    <div className="bg-muted/50 rounded-lg p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      <h3 className="text-base md:text-lg lg:text-xl font-heading font-semibold text-foreground text-center">
        How It Works
      </h3>
      <div className="space-y-3 md:space-y-4">
        {instructions?.map((instruction, index) => (
          <div key={index} className="flex items-start gap-3 md:gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon 
                  name={instruction?.icon} 
                  size={16} 
                  color="var(--color-primary)"
                  className="md:w-5 md:h-5 lg:w-6 lg:h-6"
                />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm md:text-base lg:text-lg font-medium text-foreground">
                {instruction?.title}
              </h4>
              <p className="text-xs md:text-sm text-muted-foreground">
                {instruction?.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InstructionCard;