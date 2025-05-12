import * as React from "react";
import { cn } from "@/lib/utils";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
};

type _ToastActionElement = React.ReactElement<unknown, string>;

const Toast: React.FC<{
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "success";
}> = ({ visible, onClose, children, className, variant = "default" }) => {
  React.useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 max-w-md rounded-lg shadow-lg transition-all",
        variant === "destructive" && "bg-destructive text-white",
        variant === "success" && "bg-green-600 text-white",
        variant === "default" && "bg-white border border-gray-200",
        className
      )}
    >
      <div className="flex items-start p-4">
        <div className="flex-1">{children}</div>
        <button
          onClick={onClose}
          className="ml-4 inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = React.useState<
    Array<{ id: string; props: ToastProps }>
  >([]);

  const toast = React.useCallback(
    (props: ToastProps) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, props }]);

      if (props.duration !== 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, props.duration || 5000);
      }

      return id;
    },
    []
  );

  const closeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-0 right-0 z-50 flex flex-col space-y-2 p-4">
        {toasts.map(({ id, props }) => (
          <Toast
            key={id}
            visible={true}
            onClose={() => closeToast(id)}
            variant={props.variant}
          >
            {props.title && (
              <div className="font-semibold text-sm">{props.title}</div>
            )}
            {props.description && (
              <div className="text-sm mt-1">{props.description}</div>
            )}
          </Toast>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

type ToastContextValue = {
  toast: (props: ToastProps) => string;
};

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined
);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// For direct usage without the hook
export const toast = (props: ToastProps) => {
  // Create a temporary element to render the toast
  const div = document.createElement('div');
  document.body.appendChild(div);

  const removeToast = () => {
    // Remove the toast after animation
    document.body.removeChild(div);
  };

  const _toastElement = (
    <Toast
      visible={true}
      onClose={removeToast}
      variant={props.variant}
    >
      {props.title && <div className="font-semibold text-sm">{props.title}</div>}
      {props.description && <div className="text-sm mt-1">{props.description}</div>}
    </Toast>
  );

  // In a real implementation, you'd use React.render or similar
  // Here we're simplifying for demonstration
  setTimeout(removeToast, props.duration || 5000);

  return "toast-id";
};

export { Toast, ToastProvider };