import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const StudentDetailsForm = ({ formData, errors, onChange }) => {
  const { isAuthenticated, user } = useAuth();

  const handlePhoneChange = (e) => {
    const value = e?.target?.value?.replace(/\D/g, '');
    if (value?.length <= 10) {
      onChange('phone', value);
    }
  };

  return (
    <div className="bg-card rounded-lg p-4 md:p-5 lg:p-6 shadow-md border border-border">
      <h2 className="font-heading font-semibold text-foreground text-xl md:text-2xl lg:text-3xl mb-4 md:mb-5 lg:mb-6">
        Student Details
      </h2>
      <div className="space-y-4 md:space-y-5 lg:space-y-6">
        {isAuthenticated ? (
          <>
            <div className="bg-success/10 border border-success/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon name="CheckCircle2" size={20} color="var(--color-success)" className="flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-success mb-2">Logged in with Google</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="text-sm font-medium text-foreground">{user?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium text-foreground">{user?.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Input
              label="Phone Number"
              type="tel"
              placeholder="Enter 10-digit mobile number"
              value={formData?.phone}
              onChange={handlePhoneChange}
              error={errors?.phone}
              required
              maxLength={10}
              description="Required for token retrieval"
              className="w-full"
            />
          </>
        ) : (
          <>
            <Input
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              value={formData?.name}
              onChange={(e) => onChange('name', e?.target?.value)}
              error={errors?.name}
              required
              className="w-full"
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="Enter 10-digit mobile number"
              value={formData?.phone}
              onChange={handlePhoneChange}
              error={errors?.phone}
              required
              maxLength={10}
              description="Required for token retrieval"
              className="w-full"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default StudentDetailsForm;