import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PaymentOrder {
  id: string;
  totalAmount: number;
  subsidyAmount: number;
  finalAmount: number;
  mealName: string;
  scheduledDate?: string;
  quantity?: number;
  paymentStatus?: string;
}

interface PaymentModalState {
  isOpen: boolean;
  order: PaymentOrder | null;
}

interface PaymentContextType {
  paymentModal: PaymentModalState;
  openPaymentModal: (order: PaymentOrder) => void;
  closePaymentModal: () => void;
  handlePaymentComplete: (paymentResult: any) => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [paymentModal, setPaymentModal] = useState<PaymentModalState>({
    isOpen: false,
    order: null
  });

  const openPaymentModal = (order: PaymentOrder) => {
    console.log('🎯 Opening global payment modal for order:', order.id);
    setPaymentModal({
      isOpen: true,
      order
    });
  };

  const closePaymentModal = () => {
    console.log('🎯 Closing global payment modal');
    setPaymentModal({
      isOpen: false,
      order: null
    });
  };

  const handlePaymentComplete = (paymentResult: any) => {
    console.log('💳 Global payment completed:', paymentResult);
    closePaymentModal();
    
    // You can add global payment completion logic here
    // For example, refresh order data across components
    
    // Emit custom event to notify other components
    window.dispatchEvent(new CustomEvent('paymentCompleted', {
      detail: { paymentResult }
    }));
  };

  return (
    <PaymentContext.Provider value={{
      paymentModal,
      openPaymentModal,
      closePaymentModal,
      handlePaymentComplete
    }}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = (): PaymentContextType => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};