// app/profile/[userId]/components/UserProfileDetails.tsx
'use client';

import { Briefcase, FileEdit, Phone, Smartphone, Shield, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import {User} from "@/models";

interface UserProfileDetailsProps {
  user: User;
}

export default function UserProfileDetails({ user }: UserProfileDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-300">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 transition-colors">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white transition-colors">
          Personal Information
        </h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-sm flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
        >
          <FileEdit className="h-4 w-4 mr-1" />
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className="px-6 py-4 space-y-6">
        {isEditing ? (
          <EditableDetailsForm user={user} onSave={() => setIsEditing(false)} />
        ) : (
          <StaticDetailsView user={user} />
        )}
      </div>

      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 transition-colors">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 transition-colors">
          Verification Documents
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-start transition-colors">
            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center transition-colors">
              <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white transition-colors">
                ID Document
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 transition-colors">
                ID Number: {user.id_number}
              </p>
              <div className="mt-2 flex gap-2">
                <button className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-2 py-1 rounded transition-colors">
                  View Front
                </button>
                <button className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-2 py-1 rounded transition-colors">
                  View Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Static view component for non-edit mode
function StaticDetailsView({ user }: { user: User }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start">
        <UserIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 mr-3 transition-colors" />
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white transition-colors">
            Full Name
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 transition-colors">
            {user.full_name}
          </p>
        </div>
      </div>

      <div className="flex items-start">
        <Briefcase className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 mr-3 transition-colors" />
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white transition-colors">
            Role & Status
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 transition-colors">
            {user.role.replace(/_/g, ' ')} • {user.is_active ? 'Active' : 'Inactive'}
          </p>
          {user.staff_type && (
            <p className="mt-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5 inline-block text-gray-800 dark:text-gray-200 transition-colors">
              {user.staff_type.replace(/_/g, ' ')}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-start">
        <Phone className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 mr-3 transition-colors" />
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white transition-colors">
            Contact Information
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 transition-colors">
            Phone: {user.phone_number}
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 transition-colors">
            Email: {user.email}
          </p>
        </div>
      </div>

      <div className="flex items-start">
        <Smartphone className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 mr-3 transition-colors" />
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white transition-colors">
            MobiGo Number
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 transition-colors">
            {user.mobigo_number || 'Not assigned'}
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 transition-colors">
        <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
          Last Login: {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
          User ID: {user.id}
        </p>
      </div>
    </div>
  );
}

// Editable form component for edit mode
function EditableDetailsForm({ user, onSave }: { user: User; onSave: () => void }) {
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    email: user.email,
    phone_number: user.phone_number,
    mobigo_number: user.mobigo_number || '',
    is_active: user.is_active,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would send the update to your API
    console.log('Saving user data:', formData);
    // For demo purposes, we just close the edit form
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
          Full Name
        </label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm transition-colors"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm transition-colors"
          required
        />
      </div>

      <div>
        <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
          Phone Number
        </label>
        <input
          type="tel"
          id="phone_number"
          name="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm transition-colors"
          required
        />
      </div>

      <div>
        <label htmlFor="mobigo_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
          MobiGo Number
        </label>
        <input
          type="text"
          id="mobigo_number"
          name="mobigo_number"
          value={formData.mobigo_number}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm transition-colors"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_active"
          name="is_active"
          checked={formData.is_active}
          onChange={handleChange}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-700 rounded transition-colors"
        />
        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 transition-colors">
          Active Account
        </label>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3 transition-colors">
        <button
          type="button"
          onClick={onSave}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}