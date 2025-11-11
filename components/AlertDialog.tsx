import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'success' | 'info';
  buttonText?: string;
}

export default function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  buttonText = 'OK',
}: AlertDialogProps) {
  if (!isOpen) return null;

  const config = {
    danger: {
      icon: XCircle,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
      buttonColor: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      buttonColor: 'bg-green-600 hover:bg-green-700',
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
    },
  };

  const Icon = config[type].icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-xl shadow-xl max-w-md w-full transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Icon */}
            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${config[type].bgColor} mb-4`}>
              <Icon className={`h-6 w-6 ${config[type].iconColor}`} />
            </div>

            {/* Content */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 mb-6">{message}</p>
            </div>

            {/* Action */}
            <button
              onClick={onClose}
              className={`w-full px-4 py-2 rounded-lg text-white transition font-medium ${config[type].buttonColor}`}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
