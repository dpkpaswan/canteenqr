import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PaymentSection = ({ onProceedToPayment, isProcessing, isFormValid, isAuthenticated }) => {
  return (
    <div className="bg-card rounded-lg p-4 md:p-5 lg:p-6 shadow-sm border border-border">
      <h2 className="font-heading font-semibold text-foreground text-lg md:text-xl mb-4 md:mb-5">
        Payment Method
      </h2>

      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg border-2 border-primary">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Icon name="Smartphone" size={20} color="var(--color-primary)" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground text-sm md:text-base">UPI Payment</p>
            <p className="text-xs md:text-sm text-muted-foreground">Pay using any UPI app</p>
          </div>
          <Icon name="CheckCircle2" size={20} color="var(--color-primary)" />
        </div>

        {!isAuthenticated && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <Icon name="Lock" size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs md:text-sm text-amber-800 dark:text-amber-200">
              Please sign in with Google to place your order
            </p>
          </div>
        )}

        <Button
          variant="default"
          size="lg"
          onClick={onProceedToPayment}
          disabled={isProcessing || (!isAuthenticated ? false : !isFormValid)}
          iconName={!isAuthenticated ? "Lock" : isProcessing ? "Loader2" : "CreditCard"}
          iconPosition="right"
          className="w-full"
        >
          {isProcessing ? 'Initializing Payment...' : !isAuthenticated ? 'Sign In to Place Order' : 'Pay Now'}
        </Button>

        <div className="flex items-start gap-2 text-xs md:text-sm text-muted-foreground">
          <Icon name="Shield" size={14} className="flex-shrink-0 mt-0.5" />
          <p>Your payment information is secure and encrypted</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSection;