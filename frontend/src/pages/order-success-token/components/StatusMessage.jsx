import React from 'react';
import Icon from '../../../components/AppIcon';

const StatusMessage = ({ estimatedTime, email }) => {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-success/10 rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 border-2 border-success/20">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-success rounded-full flex items-center justify-center">
            <Icon 
              name="CheckCircle2" 
              size={28} 
              color="white" 
              className="md:w-8 md:h-8"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-success mb-1 md:mb-2">
              Order Confirmed!
            </h2>
            <p className="text-sm md:text-base lg:text-lg text-success-foreground">
              Your order has been successfully placed
            </p>
          </div>
        </div>
      </div>

      {email && (
        <div className="bg-primary/10 border-2 border-primary/20 rounded-lg md:rounded-xl p-4 md:p-5 lg:p-6">
          <div className="flex items-start gap-3">
            <Icon 
              name="Mail" 
              size={24} 
              color="var(--color-primary)" 
              className="flex-shrink-0 mt-0.5"
            />
            <div className="flex-1">
              <p className="text-base md:text-lg font-semibold text-foreground mb-1">
                Token Sent to Your Email
              </p>
              <p className="text-sm md:text-base text-muted-foreground mb-2">
                Your token has been sent to your registered email:
              </p>
              <p className="text-sm md:text-base font-medium text-primary break-all">
                {email}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-2">
                You can find this token anytime in your email or using 'Find My Token'.
              </p>
            </div>
          </div>
        </div>
      )}

      {estimatedTime && (
        <div className="bg-card rounded-lg md:rounded-xl p-4 md:p-5 lg:p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <Icon 
              name="Clock" 
              size={24} 
              color="var(--color-primary)" 
              className="flex-shrink-0"
            />
            <div>
              <p className="text-sm md:text-base text-muted-foreground">
                Estimated Preparation Time
              </p>
              <p className="text-lg md:text-xl lg:text-2xl font-semibold text-foreground mt-1">
                {estimatedTime} minutes
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-muted/50 rounded-lg md:rounded-xl p-4 md:p-5 lg:p-6 border border-border">
        <div className="flex items-start gap-3">
          <Icon 
            name="Lightbulb" 
            size={24} 
            color="var(--color-accent)" 
            className="flex-shrink-0 mt-0.5"
          />
          <div className="space-y-2">
            <p className="text-sm md:text-base lg:text-lg font-medium text-foreground">
              Quick Tips:
            </p>
            <ul className="space-y-1.5 md:space-y-2 text-sm md:text-base text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Take a screenshot of your token number</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Show this token at the collection counter</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Use 'Find My Token' feature if you lose this page</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusMessage;