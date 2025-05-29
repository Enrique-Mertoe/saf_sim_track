// app/profile/[userId]/components/UserProfileDetails.tsx
'use client';

import {Award, Briefcase, FileEdit, Key, Phone, Shield, Smartphone, User as UserIcon, Users} from 'lucide-react';
import {useState} from 'react';
import {User, UserStatus} from "@/models";

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
          data-testid="edit-profile-button"
          onClick={() => setIsEditing(!isEditing)}
          className="text-sm flex items-center text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"
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

      {user.id_number && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 transition-colors">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 transition-colors">
            Verification Documents
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-start transition-colors">
              <div className="flex-shrink-0 h-10 w-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center transition-colors">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white transition-colors">
                  ID Document
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 transition-colors">
                  ID Number: {user.id_number}
                </p>
                <div className="mt-2 flex gap-2">
                  {user.id_front_url ? (
                    <a 
                      href={user.id_front_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-2 py-1 rounded transition-colors"
                    >
                      View Front
                    </a>
                  ) : (
                    <span className="text-xs text-gray-500">No front ID image</span>
                  )}

                  {user.id_back_url ? (
                    <a 
                      href={user.id_back_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-2 py-1 rounded transition-colors"
                    >
                      View Back
                    </a>
                  ) : (
                    <span className="text-xs text-gray-500">No back ID image</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Static view component for non-edit mode
function StaticDetailsView({ user }: { user: User }) {
  // Role-specific information
  const renderRoleSpecificInfo = () => {
    switch (user.role) {
      case 'admin':
        return (
          <div className="flex items-start">
            <Key className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 mr-3 transition-colors" />
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white transition-colors">
                Admin Privileges
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 transition-colors">
                Full system access with user management capabilities
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-xs bg-green-100 dark:bg-green-900 rounded-full px-2 py-0.5 text-green-800 dark:text-green-200">
                  User Management
                </span>
                <span className="text-xs bg-green-100 dark:bg-green-900 rounded-full px-2 py-0.5 text-green-800 dark:text-green-200">
                  System Settings
                </span>
                <span className="text-xs bg-green-100 dark:bg-green-900 rounded-full px-2 py-0.5 text-green-800 dark:text-green-200">
                  Reports Access
                </span>
              </div>
            </div>
          </div>
        );
      case 'TEAM_LEADER':
        return (
          <div className="flex items-start">
            <Users className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 mr-3 transition-colors" />
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white transition-colors">
                Team Management
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 transition-colors">
                {user.team_id ? `Team ID: ${user.team_id}` : 'No team assigned'}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-xs bg-blue-100 dark:bg-blue-900 rounded-full px-2 py-0.5 text-blue-800 dark:text-blue-200">
                  Staff Management
                </span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900 rounded-full px-2 py-0.5 text-blue-800 dark:text-blue-200">
                  Performance Tracking
                </span>
              </div>
            </div>
          </div>
        );
      case 'staff':
        return (
          <div className="flex items-start">
            <Award className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 mr-3 transition-colors" />
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white transition-colors">
                Staff Information
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 transition-colors">
                {user.team_id ? `Team ID: ${user.team_id}` : 'No team assigned'}
              </p>
              {user.staff_type && (
                <div className="mt-2">
                  <span className="text-xs bg-purple-100 dark:bg-purple-900 rounded-full px-2 py-0.5 text-purple-800 dark:text-purple-200">
                    {user.staff_type.replace(/_/g, ' ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

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
          <div className="mt-1">
            <span className={`text-xs rounded-full px-2 py-0.5 inline-block ${
              user.is_active 
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}>
              {user.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {renderRoleSpecificInfo()}

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

      {user.mobigo_number && (
        <div className="flex items-start">
          <Smartphone className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 mr-3 transition-colors" />
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white transition-colors">
              MobiGo Number
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 transition-colors">
              {user.mobigo_number}
            </p>
          </div>
        </div>
      )}

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Import userService dynamically to avoid circular dependencies
      const { userService } = await import('@/services');

      const { data, error } = await userService.updateUser(user.id, {
        full_name: formData.full_name,
        email: formData.email,
        phone_number: formData.phone_number,
        mobigo_number: formData.mobigo_number || undefined,
        is_active: formData.is_active,
        status: UserStatus.ACTIVE
      },user);

      if (error) {
        console.error('Error updating user:', error);
        setError('Failed to update profile. Please try again.');
        // Import toast dynamically
        const { toast } = await import('react-hot-toast');
        toast.error('Failed to update profile');
      } else {
        // Import toast dynamically
        const { toast } = await import('react-hot-toast');
        toast.success('Profile updated successfully');
        onSave();
      }
    } catch (err) {
      console.error('Exception updating user:', err);
      setError('An unexpected error occurred');
      // Import toast dynamically
      const { toast } = await import('react-hot-toast');
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Role-specific form fields
  const renderRoleSpecificFields = () => {
    switch (user.role) {
      case 'admin':
        return (
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Admin Privileges
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Admin privileges cannot be modified from this form.
            </p>
          </div>
        );
      case 'TEAM_LEADER':
        return (
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Team Management
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Team assignments must be managed by an administrator.
            </p>
          </div>
        );
      case 'staff':
        return (
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Staff Information
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Staff type and team assignments must be managed by an administrator or team leader.
            </p>
          </div>
        );
      default:
        return null;
    }
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
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm transition-colors"
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
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm transition-colors"
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
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm transition-colors"
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
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm transition-colors"
        />
      </div>

      {renderRoleSpecificFields()}

      <div className="flex items-center mt-4">
        <input
          type="checkbox"
          id="is_active"
          name="is_active"
          checked={formData.is_active}
          onChange={handleChange}
          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-700 rounded transition-colors"
        />
        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 transition-colors">
          Active Account
        </label>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-300">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3 transition-colors">
        <button
          type="button"
          onClick={onSave}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
}
