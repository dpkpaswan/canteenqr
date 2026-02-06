import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';

const ActionButtons = ({ tokenNumber }) => {
  const navigate = useNavigate();

  const handleScreenshot = () => {
    alert('Please use your device screenshot feature to save your token number');
  };

  const handleNewOrder = () => {
    navigate('/menu-landing');
  };

  const handleFindToken = () => {
    navigate('/find-my-token');
  };

  return (
    <div className="space-y-3 md:space-y-4">
      <Button
        variant="default"
        size="lg"
        fullWidth
        iconName="Camera"
        iconPosition="left"
        onClick={handleScreenshot}
        className="text-base md:text-lg"
      >
        Save Screenshot
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <Button
          variant="outline"
          size="lg"
          fullWidth
          iconName="Search"
          iconPosition="left"
          onClick={handleFindToken}
          className="text-sm md:text-base"
        >
          Find My Token
        </Button>

        <Button
          variant="secondary"
          size="lg"
          fullWidth
          iconName="Plus"
          iconPosition="left"
          onClick={handleNewOrder}
          className="text-sm md:text-base"
        >
          New Order
        </Button>
      </div>
    </div>
  );
};

export default ActionButtons;