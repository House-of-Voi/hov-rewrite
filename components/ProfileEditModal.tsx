'use client';

import { useState } from 'react';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDisplayName: string | null;
  email: string;
  onSave: (displayName: string) => Promise<void>;
}

export default function ProfileEditModal({
  isOpen,
  onClose,
  currentDisplayName,
  email,
  onSave,
}: ProfileEditModalProps) {
  const [displayName, setDisplayName] = useState(currentDisplayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await onSave(displayName);
      onClose();
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setDisplayName(currentDisplayName || '');
      setError(null);
      onClose();
    }
  };

  const hasChanges = displayName !== (currentDisplayName || '');

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Profile">
      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-ruby-500/20 border border-ruby-500/30 rounded-lg">
            <p className="text-sm text-ruby-400">{error}</p>
          </div>
        )}

        <Input
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          disabled={isSaving}
        />

        <Input
          label="Email"
          type="email"
          value={email}
          disabled
          placeholder="your@email.com"
        />

        <div className="flex gap-3 pt-4">
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="flex-1"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={handleClose}
            disabled={isSaving}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

