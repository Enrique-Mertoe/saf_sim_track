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
  return (
    <div className={`rounded-lg shadow-lg overflow-hidden ${plan.recommended ? 'ring-2 ring-blue-500' : 'border border-gray-200'}`}>
      {plan.recommended && (
        <div className="bg-blue-500 text-white text-center py-1 text-sm font-medium">
          RECOMMENDED
        </div>
      )}

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>

        <div className="mt-4">
          <span className="text-3xl font-extrabold">KES {plan.price.toLocaleString()}</span>
          <span className="text-gray-500">/{plan.duration === 1 ? 'month' : `${plan.duration} months`}</span>
        </div>

        <ul className="mt-6 space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-600">{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => onSelect(plan)}
          className={`mt-8 w-full py-3 px-4 rounded-md font-medium ${
            isCurrentPlan
              ? 'bg-green-100 text-green-800 cursor-default'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
          disabled={isCurrentPlan}
        >
          {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
        </button>
      </div>
    </div>
  );
};

export default SubscriptionCard;