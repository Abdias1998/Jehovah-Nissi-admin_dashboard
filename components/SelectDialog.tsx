import { useState } from 'react';
import { Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  title: string;
  message?: string;
  options: SelectOption[];
  confirmText?: string;
  cancelText?: string;
}

export default function SelectDialog({
  isOpen,
  onClose,
  onSelect,
  title,
  message,
  options,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
}: SelectDialogProps) {
  const [selectedValue, setSelectedValue] = useState<string>('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedValue) {
      onSelect(selectedValue);
      onClose();
      setSelectedValue('');
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedValue('');
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
          className="relative bg-white rounded-xl shadow-xl max-w-lg w-full transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Header */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            {message && <p className="text-sm text-gray-600 mb-4">{message}</p>}

            {/* Options */}
            <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedValue(option.value)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${
                    selectedValue === option.value
                      ? 'border-primary bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{option.label}</p>
                      {option.description && (
                        <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                      )}
                    </div>
                    {selectedValue === option.value && (
                      <Check className="w-5 h-5 text-primary flex-shrink-0 ml-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedValue}
                className={`flex-1 px-4 py-2 rounded-lg text-white transition font-medium ${
                  selectedValue
                    ? 'bg-primary hover:bg-primary/90'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
