import React from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '../AppIcon';

const ProgressIndicator = () => {
  const location = useLocation();
  const currentPath = location?.pathname;

  const steps = [
    { path: '/menu-landing', label: 'Menu', number: 1 },
    { path: '/cart-checkout', label: 'Cart', number: 2 },
    { path: '/order-success-token', label: 'Success', number: 3 }
  ];

  const currentStepIndex = steps?.findIndex(step => step?.path === currentPath);
  
  if (currentPath === '/find-my-token' || currentStepIndex === -1) {
    return null;
  }

  const getStepStatus = (index) => {
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) return 'active';
    return 'inactive';
  };

  return (
    <div className="progress-indicator">
      <div className="progress-indicator-container">
        {steps?.map((step, index) => (
          <React.Fragment key={step?.path}>
            <div className="progress-step">
              <div className={`progress-step-circle ${getStepStatus(index)}`}>
                {getStepStatus(index) === 'completed' ? (
                  <Icon name="Check" size={16} strokeWidth={3} />
                ) : (
                  <span>{step?.number}</span>
                )}
              </div>
              <span className={`progress-step-label ${getStepStatus(index)}`}>
                {step?.label}
              </span>
            </div>
            
            {index < steps?.length - 1 && (
              <div 
                className={`progress-connector ${
                  getStepStatus(index) === 'completed' ? 'completed' : ''
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProgressIndicator;