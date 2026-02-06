import React, { useState, useEffect } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const PhoneInputForm = ({ onSubmit, loading, searchMethod = 'phone', defaultEmail = '' }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState('');

  useEffect(() => {
    if (defaultEmail) {
      setEmail(defaultEmail);
    }
  }, [defaultEmail]);

  const validatePhoneNumber = (value) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex?.test(value);
  };

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex?.test(value);
  };

  const handlePhoneChange = (e) => {
    const value = e?.target?.value?.replace(/\D/g, '');
    if (value?.length <= 10) {
      setPhoneNumber(value);
      if (error) setError('');
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e?.target?.value);
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    
    if (searchMethod === 'phone') {
      if (!phoneNumber) {
        setError('Phone number is required');
        return;
      }

      if (!validatePhoneNumber(phoneNumber)) {
        setError('Please enter a valid 10-digit Indian mobile number');
        return;
      }

      onSubmit(phoneNumber);
    } else {
      if (!email) {
        setError('Email address is required');
        return;
      }

      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        return;
      }

      onSubmit(email);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      {searchMethod === 'phone' ? (
        <Input
          type="tel"
          label="Phone Number"
          placeholder="Enter your 10-digit mobile number"
          value={phoneNumber}
          onChange={handlePhoneChange}
          error={error}
          required
          description="Enter the phone number used during order placement"
          disabled={loading}
          className="w-full"
        />
      ) : (
        <Input
          type="email"
          label="Email Address"
          placeholder="Enter your email address"
          value={email}
          onChange={handleEmailChange}
          error={error}
          required
          description="Enter the email address used for Google login"
          disabled={loading}
          className="w-full"
        />
      )}

      <Button
        type="submit"
        variant="default"
        size="lg"
        fullWidth
        loading={loading}
        iconName="Search"
        iconPosition="left"
      >
        Get My Token
      </Button>
    </form>
  );
};

export default PhoneInputForm;