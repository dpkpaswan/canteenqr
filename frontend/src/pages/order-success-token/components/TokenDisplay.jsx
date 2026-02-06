import React from 'react';
import Icon from '../../../components/AppIcon';

const TokenDisplay = ({ tokenNumber, qrCodeUrl }) => {
  return (
    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl md:rounded-2xl p-6 md:p-8 lg:p-10 border-2 border-primary/20">
      <div className="text-center space-y-3 md:space-y-4">
        <div className="flex items-center justify-center gap-2 md:gap-3">
          <Icon 
            name="Ticket" 
            size={28} 
            color="var(--color-primary)" 
            className="md:w-8 md:h-8 lg:w-10 lg:h-10"
          />
          <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-foreground">
            Your Token Number
          </h2>
        </div>
        
        <div className="bg-card rounded-lg md:rounded-xl p-6 md:p-8 lg:p-10 shadow-lg">
          <p className="text-6xl md:text-7xl lg:text-8xl font-bold text-primary tracking-wider">
            {tokenNumber}
          </p>
        </div>

        {qrCodeUrl && (
          <div className="bg-card rounded-lg md:rounded-xl p-6 md:p-8 shadow-lg">
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-4">
              QR Code for Pickup
            </h3>
            <div className="flex justify-center">
              <img 
                src={qrCodeUrl} 
                alt="Order QR Code" 
                className="w-32 h-32 md:w-40 md:h-40 border border-gray-200 rounded-lg"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-3 text-center">
              Show this QR code at pickup counter
            </p>
          </div>
        )}
        
        <div className="flex items-start gap-2 md:gap-3 bg-warning/10 rounded-lg p-3 md:p-4 border border-warning/20">
          <Icon 
            name="Info" 
            size={20} 
            color="var(--color-warning)" 
            className="flex-shrink-0 mt-0.5"
          />
          <p className="text-sm md:text-base text-warning-foreground text-left">
            Please save your token number. Use 'Find My Token' if lost.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TokenDisplay;