
import React, { useState } from 'react';
import { Check, X, Zap, Star, ShieldCheck } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { PlanTier, BillingCycle } from '../types';

const SubscriptionModal: React.FC = () => {
  const { isModalOpen, closePaywall, upgradePlan, isExpired, daysLeftInTrial, subscription } = useSubscription();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');

  if (!isModalOpen) return null;

  const plans = [
    {
      id: 'starter' as PlanTier,
      name: 'Starter',
      monthlyPrice: 29,
      yearlyPrice: 24, // per month billed yearly
      features: [
        'Unlimited Clients',
        'Unlimited Bookings',
        'Up to 15 Cars',
        'No Watermark',
        'Custom Shop Info',
        'Standard Support'
      ],
      notIncluded: [
        'Custom Templates',
        'Logo Upload'
      ],
      color: 'blue'
    },
    {
      id: 'pro' as PlanTier,
      name: 'Pro',
      monthlyPrice: 79,
      yearlyPrice: 65, // per month billed yearly
      features: [
        'Everything in Starter',
        'Unlimited Cars',
        'Custom Contract Templates',
        'Upload Logo & Signature',
        'Advanced Documents',
        'Priority Support'
      ],
      notIncluded: [],
      color: 'emerald',
      popular: true
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={closePaywall}></div>
      
      <div className="relative bg-[#0B0F19] border border-gray-800 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="text-center pt-10 pb-6 px-6 relative">
          <button 
             onClick={closePaywall}
             className="absolute right-6 top-6 p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
          >
             <X className="w-5 h-5" />
          </button>

          {isExpired ? (
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-500 font-bold text-sm mb-4 border border-red-500/20">
                <ShieldCheck className="w-4 h-4" /> Trial Expired - Read Only Mode
             </div>
          ) : (
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-sm mb-4 border border-emerald-500/20">
                <Zap className="w-4 h-4" /> {daysLeftInTrial} Days Left in Free Trial
             </div>
          )}
          
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
            Unlock the full power of <span className="text-emerald-400">FleetCmd</span>
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            Choose a plan that scales with your rental business. Cancel anytime.
          </p>

          {/* Toggle */}
          <div className="flex justify-center mt-8">
            <div className="bg-gray-900 p-1 rounded-full border border-gray-800 flex relative">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-black shadow' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Yearly <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded text-current uppercase">-20%</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 pt-2">
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
             {plans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`relative bg-gray-900 border-2 rounded-3xl p-6 md:p-8 flex flex-col transition-all duration-300 ${
                     plan.popular ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.1)] scale-105 z-10' : 'border-gray-800 hover:border-gray-700'
                  }`}
                >
                   {plan.popular && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-black text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                         Most Popular
                      </div>
                   )}
                   
                   <div className="mb-6">
                      <h3 className={`text-xl font-black mb-1 ${plan.popular ? 'text-white' : 'text-gray-300'}`}>{plan.name}</h3>
                      <div className="flex items-end gap-1">
                         <span className="text-4xl font-black text-white">
                            ${billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice}
                         </span>
                         <span className="text-gray-500 font-bold mb-1">/mo</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                         Billed {billingCycle === 'yearly' ? `$${plan.yearlyPrice * 12} yearly` : 'monthly'}
                      </p>
                   </div>

                   <button 
                     onClick={() => upgradePlan(plan.id, billingCycle)}
                     className={`w-full py-3.5 rounded-xl font-bold text-sm mb-6 transition-all ${
                        plan.popular 
                        ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-black hover:scale-105 shadow-glow'
                        : 'bg-white text-black hover:bg-gray-200'
                     }`}
                   >
                      Upgrade to {plan.name}
                   </button>

                   <div className="space-y-3 flex-1">
                      {plan.features.map((feat, i) => (
                         <div key={i} className="flex items-start gap-3 text-sm font-medium text-gray-300">
                            <div className={`mt-0.5 p-0.5 rounded-full ${plan.popular ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                               <Check className="w-3 h-3" />
                            </div>
                            {feat}
                         </div>
                      ))}
                      {plan.notIncluded.map((feat, i) => (
                         <div key={i} className="flex items-start gap-3 text-sm font-medium text-gray-600">
                            <X className="w-4 h-4 mt-0.5 opacity-50" />
                            {feat}
                         </div>
                      ))}
                   </div>
                </div>
             ))}
          </div>
        </div>

        <div className="p-4 text-center border-t border-gray-800 bg-black/20">
           <p className="text-xs text-gray-500">
              Secure payment via Stripe. You can cancel at any time.
           </p>
        </div>

      </div>
    </div>
  );
};

export default SubscriptionModal;
