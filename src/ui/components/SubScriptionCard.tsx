import React from 'react';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  recommended?: boolean;
}

interface SubscriptionCardProps {
  plan: Plan;
  isCurrentPlan: boolean;
  onSelect: (plan: Plan) => void;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ plan, isCurrentPlan, onSelect }) => {
  // Determine card styling based on plan type
  const getCardStyle = () => {
    if (plan.recommended) {
      return 'transform hover:scale-105 transition-transform duration-300 ring-2 ring-green-500 shadow-xl';
    } else if (plan.id === 'enterprise') {
      return 'transform hover:scale-105 transition-transform duration-300 border border-purple-200 hover:border-purple-300 shadow-lg';
    } else {
      return 'transform hover:scale-105 transition-transform duration-300 border border-gray-200 hover:border-gray-300 shadow-lg';
    }
  };

  // Determine badge styling based on plan type
  const getBadgeStyle = () => {
    if (plan.recommended) {
      return 'bg-green-600 text-white';
    } else if (plan.id === 'enterprise') {
      return 'bg-purple-600 text-white';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  // Determine button styling based on plan type and current plan status
  const getButtonStyle = () => {
    if (isCurrentPlan) {
      return 'bg-green-100 text-green-800 cursor-default';
    } else if (plan.recommended) {
      return 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2';
    } else if (plan.id === 'enterprise') {
      return 'bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2';
    } else {
      return 'bg-gray-600 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2';
    }
  };

  // Get badge text based on plan
  const getBadgeText = () => {
    if (plan.recommended) {
      return 'MOST POPULAR';
    } else if (plan.id === 'enterprise') {
      return 'PREMIUM';
    } else {
      return 'BASIC';
    }
  };

  return (
    <div className={`rounded-lg overflow-hidden ${getCardStyle()}`}>
      <div className={`${getBadgeStyle()} text-center py-2 text-sm font-medium`}>
        {getBadgeText()}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>

        <div className="mt-4 flex items-baseline">
          <span className="text-4xl font-extrabold text-gray-900">KES {plan.price.toLocaleString()}</span>
          <span className="ml-1 text-xl text-gray-500">/{plan.duration === 1 ? 'month' : `${plan.duration} months`}</span>
        </div>

        <div className="mt-2 text-sm text-gray-500">
          {plan.id === 'starter' && 'Perfect for small dealers'}
          {plan.id === 'business' && 'Ideal for growing businesses'}
          {plan.id === 'enterprise' && 'For large-scale operations'}
        </div>

        <ul className="mt-6 space-y-4">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <svg className={`h-5 w-5 ${plan.recommended ? 'text-green-500' : plan.id === 'enterprise' ? 'text-purple-500' : 'text-gray-500'} mr-2`} 
                   fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-600">{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => onSelect(plan)}
          className={`mt-8 w-full py-3 px-4 rounded-md font-medium transition-colors duration-200 ${getButtonStyle()}`}
          disabled={isCurrentPlan}
        >
          {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
        </button>
      </div>
    </div>
  );
};

export default SubscriptionCard;
