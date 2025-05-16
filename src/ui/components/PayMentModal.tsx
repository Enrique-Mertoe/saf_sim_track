import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';

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
          <div className="fixed inset-0 bg-black bg-opacity-25" />
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
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Pay with M-Pesa
                </Dialog.Title>

                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    You are subscribing to the <span className="font-medium">{plan.name}</span> plan
                    for <span className="font-medium">KES {plan.price.toLocaleString()}</span>.
                  </p>

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
                          className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 border ${
                            phoneError ? 'border-red-300' : 'border-gray-300'
                          } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
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
                          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          onClick={onClose}
                          disabled={loading}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            loading
                              ? 'bg-blue-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
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