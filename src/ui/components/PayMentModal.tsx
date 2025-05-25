import React, {useState} from 'react';
import {Dialog, Transition} from '@headlessui/react';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
}

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  plan: Plan;
  onSubmit: (phoneNumber: string) => void;
  loading: boolean;
  error: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onClose,
  plan,
  onSubmit,
  loading,
  error
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone number
    if (!phoneNumber.trim()) {
      setPhoneError('Phone number is required');
      return;
    }

    // Kenyan phone number validation - should start with 254 or 0
    const kenyaPhoneRegex = /^(254|\+254|0)7[0-9]{8}$/;
    if (!kenyaPhoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      setPhoneError('Enter a valid Kenyan phone number (e.g. 0712345678 or +254712345678)');
      return;
    }

    // Format phone number to ensure it starts with 254
    let formattedPhone = phoneNumber.replace(/\s/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.substring(1);
    }

    onSubmit(formattedPhone);
  };

  // Get color theme based on plan
  const getThemeColor = () => {
    if (plan.id === 'business') {
      return 'green';
    } else if (plan.id === 'enterprise') {
      return 'purple';
    } else {
      return 'gray';
    }
  };

  const themeColor = getThemeColor();
  const buttonColorClass = loading
    ? `bg-${themeColor}-400 cursor-not-allowed`
    : `bg-${themeColor}-600 hover:bg-${themeColor}-700 focus:ring-${themeColor}-500`;

  return (
    <Transition appear show={open} as={React.Fragment}>
      <Dialog as="div" className="relative z-10" onClose={loading ? () => {} : onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-bold text-gray-900"
                  >
                    Complete Your Subscription
                  </Dialog.Title>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium bg-${themeColor}-100 text-${themeColor}-800`}>
                    {plan.name}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Subscription fee</span>
                      <span className="font-medium">KES {plan.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-700">Billing cycle</span>
                      <span className="font-medium">{plan.duration === 1 ? 'Monthly' : `Every ${plan.duration} months`}</span>
                    </div>
                    <div className="border-t border-gray-200 my-3"></div>
                    <div className="flex justify-between items-center font-bold">
                      <span>Total due today</span>
                      <span className="text-lg">KES {plan.price.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="text-sm text-gray-600">Secure payment via M-Pesa</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <form onSubmit={handleSubmit}>
                      <div className="mb-4">
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                          M-Pesa Phone Number
                        </label>
                        <input
                          type="text"
                          id="phoneNumber"
                          value={phoneNumber}
                          onChange={(e) => {
                            setPhoneNumber(e.target.value);
                            setPhoneError('');
                          }}
                          className={`mt-1 block w-full rounded-md shadow-sm py-3 px-4 border ${
                            phoneError ? 'border-red-300' : 'border-gray-300'
                          } focus:outline-none focus:ring-green-500 focus:border-green-500`}
                          placeholder="e.g. 0712345678"
                          disabled={loading}
                        />
                        {phoneError && (
                          <p className="mt-1 text-sm text-red-600">{phoneError}</p>
                        )}
                      </div>

                      {error && (
                        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
                          <p className="text-sm text-red-600">{error}</p>
                        </div>
                      )}

                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                          onClick={onClose}
                          disabled={loading}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className={`inline-flex intaSendPayButton justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            loading
                              ? 'bg-green-400 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                          }`}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </>
                          ) : (
                            'Pay Now'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default PaymentModal;
