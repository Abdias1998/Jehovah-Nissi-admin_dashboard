import { useState } from 'react';

interface InputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
}

export default function InputDialog({
  isOpen,
  onClose,
  onSubmit,
  title,
  message,
  placeholder = '',
  defaultValue = '',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
}: InputDialogProps) {
  const [value, setValue] = useState(defaultValue);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
      onClose();
      setValue('');
    }
  };

  const handleClose = () => {
    onClose();
    setValue(defaultValue);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-xl shadow-xl max-w-md w-full transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit} className="p-6">
            {/* Header */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            {message && <p className="text-sm text-gray-600 mb-4">{message}</p>}

            {/* Input */}
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none mb-6"
              autoFocus
            />

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
              >
                {cancelText}
              </button>
              <button
                type="submit"
                disabled={!value.trim()}
                className={`flex-1 px-4 py-2 rounded-lg text-white transition font-medium ${
                  value.trim()
                    ? 'bg-primary hover:bg-primary/90'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
