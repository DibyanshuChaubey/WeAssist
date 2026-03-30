// Issue Submission Form Component

import React, { useState } from 'react';
import { issuesService, uploadService } from '../services/api';

const ISSUE_CATEGORIES = [
  'Electrical',
  'Plumbing',
  'Cleaning',
  'Maintenance',
  'Internet/WiFi',
  'Security',
  'Furniture',
  'Food Quality',
  'Noise Complaint',
  'Other',
];

interface IssueFormData {
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  location: {
    hostel: string;
    floor: number | '';
    room: string;
  };
}

interface IssueSubmissionFormProps {
  userHostel?: string;
  onSuccess?: () => void;
}

export const IssueSubmissionForm: React.FC<IssueSubmissionFormProps> = ({
  userHostel,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<IssueFormData>({
    title: '',
    description: '',
    category: '',
    imageUrl: '',
    location: {
      hostel: userHostel || '',
      floor: '',
      room: '',
    },
  });

  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: locationField === 'floor' ? parseInt(value) || '' : value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate
      if (!formData.title || !formData.description || !formData.category) {
        throw new Error('Please fill in all required fields');
      }

      if (
        !formData.location.hostel ||
        !formData.location.floor ||
        !formData.location.room
      ) {
        throw new Error('Please provide complete location details');
      }

      await issuesService.createIssue({
        ...formData,
        location: {
          ...formData.location,
          floor: parseInt(String(formData.location.floor)),
        },
      });

      setSuccess('Issue reported successfully! AI is analyzing priority...');

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        imageUrl: '',
        location: {
          hostel: userHostel || '',
          floor: '',
          room: '',
        },
      });

      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || 'Failed to submit issue'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setImageUploading(true);
    try {
      const data = await uploadService.uploadImage(file, 'weassist/issues');
      setFormData((prev) => ({ ...prev, imageUrl: data.url || '' }));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Image upload failed');
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Report New Issue
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Issue Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Brief description of the issue"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select category</option>
            {ISSUE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide detailed information about the issue..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Image URL */}
        <div>
          <label
            htmlFor="imageUrl"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Issue Image URL (Optional)
          </label>
          <input
            type="url"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="mt-2">
            <label className="inline-flex w-full sm:w-auto justify-center items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-700 cursor-pointer transition-colors">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={handleImageUpload}
                disabled={imageUploading}
              />
              {imageUploading ? 'Uploading image...' : 'Upload Image'}
            </label>
          </div>
          {formData.imageUrl && (
            <div className="mt-3 rounded-md border border-gray-200 overflow-hidden">
              <img
                src={formData.imageUrl}
                alt="Issue preview"
                className="w-full h-32 sm:h-48 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="location.hostel"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Hostel <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="location.hostel"
              name="location.hostel"
              value={formData.location.hostel}
              onChange={handleChange}
              placeholder="e.g., Hostel A"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="location.floor"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Floor <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="location.floor"
              name="location.floor"
              value={formData.location.floor}
              onChange={handleChange}
              placeholder="e.g., 2"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="location.room"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Room <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="location.room"
              name="location.room"
              value={formData.location.room}
              onChange={handleChange}
              placeholder="e.g., 201"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Submitting...' : 'Submit Issue'}
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Once submitted, AI will automatically analyze
            and suggest priority for your issue. Admin will review and act
            accordingly.
          </p>
        </div>
      </form>
    </div>
  );
};

export default IssueSubmissionForm;
