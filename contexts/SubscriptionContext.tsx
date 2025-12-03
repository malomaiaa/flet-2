
import React, { createContext, useContext, useState, useEffect } from 'react';
import { PlanTier, BillingCycle, Subscription, UserProfile } from '../types';

interface SubscriptionContextType {
  subscription: Subscription;
  daysLeftInTrial: number;
  isTrialing: boolean;
  isExpired: boolean;
  featureLimits: {
    maxCars: number;
    watermark: boolean;
    customBranding: boolean;
  };
  checkAccess: (action: 'add_car' | 'create_booking' | 'generate_contract' | 'export_pdf') => boolean;
  upgradePlan: (plan: PlanTier, cycle: BillingCycle) => void;
  isModalOpen: boolean;
  openPaywall: () => void;
  closePaywall: () => void;
  currentUsage: {
    cars: number;
  };
  updateUsage: (type: 'cars', count: number) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to a trial that started "today" for new users
  const [subscription, setSubscription] = useState<Subscription>({
    plan: 'free',
    status: 'trialing',
    billingCycle: 'yearly',
    trialStartDate: new Date().toISOString(),
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUsage, setCurrentUsage] = useState({ cars: 0 });

  // Calculate Trial Status
  const trialDuration = 14; // days
  const startDate = new Date(subscription.trialStartDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  // If diffDays is 1, it means we are on day 1. 
  // daysLeft = 14 - (1) = 13. Actually if just started, diff is near 0.
  const daysLeftInTrial = Math.max(0, trialDuration - Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  const isTrialing = subscription.plan === 'free' && daysLeftInTrial > 0;
  const isExpired = subscription.plan === 'free' && daysLeftInTrial <= 0;

  // Feature Limits Definition
  const featureLimits = {
    maxCars: subscription.plan === 'free' ? 5 : subscription.plan === 'starter' ? 15 : 9999,
    watermark: subscription.plan === 'free',
    customBranding: subscription.plan !== 'free',
  };

  const checkAccess = (action: 'add_car' | 'create_booking' | 'generate_contract' | 'export_pdf'): boolean => {
    // 1. Check Expiration (Read Only Mode)
    if (isExpired) {
      setIsModalOpen(true);
      return false;
    }

    // 2. Check Specific Limits
    if (action === 'add_car') {
       if (currentUsage.cars >= featureLimits.maxCars) {
         setIsModalOpen(true);
         return false;
       }
    }

    // 3. Paid Features Check
    if (action === 'export_pdf' && isExpired) {
       setIsModalOpen(true);
       return false;
    }

    return true;
  };

  const upgradePlan = (plan: PlanTier, cycle: BillingCycle) => {
    setSubscription(prev => ({
      ...prev,
      plan: plan,
      billingCycle: cycle,
      status: 'active',
      nextBillingDate: new Date(Date.now() + (cycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString()
    }));
    setIsModalOpen(false);
  };

  const updateUsage = (type: 'cars', count: number) => {
    setCurrentUsage(prev => ({ ...prev, [type]: count }));
  };

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      daysLeftInTrial,
      isTrialing,
      isExpired,
      featureLimits,
      checkAccess,
      upgradePlan,
      isModalOpen,
      openPaywall: () => setIsModalOpen(true),
      closePaywall: () => setIsModalOpen(false),
      currentUsage,
      updateUsage
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
