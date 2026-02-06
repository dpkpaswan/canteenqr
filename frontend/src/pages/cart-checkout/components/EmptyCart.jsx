import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const EmptyCart = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 md:px-6 lg:px-8">
      <div className="bg-card rounded-2xl p-6 md:p-8 lg:p-10 shadow-lg border border-border max-w-md w-full text-center">
        <div className="bg-muted rounded-full w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 flex items-center justify-center mx-auto mb-4 md:mb-5 lg:mb-6">
          <Icon name="ShoppingCart" size={40} className="text-muted-foreground" />
        </div>

        <h2 className="font-heading font-semibold text-foreground text-xl md:text-2xl lg:text-3xl mb-2 md:mb-3">
          Your Cart is Empty
        </h2>

        <p className="text-muted-foreground text-sm md:text-base lg:text-lg mb-6 md:mb-7 lg:mb-8">
          Add items from the menu to place your order
        </p>

        <Button
          variant="default"
          size="lg"
          fullWidth
          onClick={() => navigate('/menu-landing')}
          iconName="ArrowLeft"
          iconPosition="left"
        >
          Browse Menu
        </Button>
      </div>
    </div>
  );
};

export default EmptyCart;