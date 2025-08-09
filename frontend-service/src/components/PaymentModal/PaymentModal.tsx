// PaymentModal.tsx - Modal/Popup version of PaymentComponent
import React, { useState, useEffect } from 'react';
import { apiClient } from '../../utils/apiClient';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    finalAmount: number;
    totalAmount: number;
    subsidyAmount: number;
    mealName?: string;
    studentId?: string;
  };
  onPaymentComplete: (paymentResult: any) => void;
  onPaymentError: (error: string) => void;
}

interface PaymentMethod {
  method: string;
  name: string;
  fee: string;
  processingTime: string;
  icon: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  order,
  onPaymentComplete,
  onPaymentError
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('CREDIT_CARD');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<'info' | 'method' | 'processing' | 'success' | 'error'>('info');

  const paymentMethods: PaymentMethod[] = [
    {
      method: 'CREDIT_CARD',
      name: 'Credit Card',
      fee: '2.5%',
      processingTime: 'Instant',
      icon: '💳'
    },
    {
      method: 'DEBIT_CARD',
      name: 'Debit Card',
      fee: '2.5%',
      processingTime: 'Instant',
      icon: '💳'
    },
    {
      method: 'DIGITAL_WALLET',
      name: 'Digital Wallet',
      fee: '1.5%',
      processingTime: 'Instant',
      icon: '📱'
    },
    {
      method: 'BANK_TRANSFER',
      name: 'Bank Transfer',
      fee: '1.0%',
      processingTime: '1-2 business days',
      icon: '🏦'
    },
    {
      method: 'QR_CODE',
      name: 'QR Code Payment',
      fee: '1.5%',
      processingTime: 'Instant',
      icon: '📲'
    }
  ];

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('info');
      setPaymentStatus('');
      setPaymentId('');
      setLoading(false);
    }
  }, [isOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, loading, onClose]);

  const calculateFees = (amount: number, method: string): number => {
    const feeRates: { [key: string]: number } = {
      'CREDIT_CARD': 0.025,
      'DEBIT_CARD': 0.025,
      'BANK_TRANSFER': 0.01,
      'DIGITAL_WALLET': 0.015,
      'QR_CODE': 0.015
    };
    
    const feeRate = feeRates[method] || 0.025;
    return Math.round(amount * feeRate * 100) / 100;
  };

  const processPayment = async () => {
    if (!customerInfo.name || !customerInfo.email) {
      onPaymentError('Please fill in your name and email');
      return;
    }

    if (order.finalAmount <= 0) {
      setCurrentStep('success');
      setTimeout(() => {
        onPaymentComplete({ 
          success: true, 
          message: 'No payment required - fully subsidized meal',
          paymentId: 'SUBSIDY_ONLY'
        });
        onClose();
      }, 2000);
      return;
    }

    try {
      setLoading(true);
      setCurrentStep('processing');
      setPaymentStatus('Initiating payment...');

      const fees = calculateFees(order.finalAmount, selectedMethod);
      
      // Prepare PayDPI-compliant payment data
      const paymentData = {
        orderId: order.id,
        amount: order.finalAmount,
        currency: 'LKR',
        description: `School meal payment - ${order.mealName || 'Meal order'}`,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        sludiId: order.studentId,
        paymentMethods: [selectedMethod],
        expiryMinutes: 60,
        returnUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`,
        metadata: {
          orderReference: order.id,
          totalAmount: order.totalAmount,
          subsidyAmount: order.subsidyAmount,
          finalAmount: order.finalAmount,
          mealName: order.mealName,
          studentId: order.studentId,
          fees: fees,
          source: 'nutriconnect_modal'
        }
      };

      console.log('💳 [Modal] Sending payment data to PayDPI:', paymentData);

      const response = await apiClient.post('/payments/process', paymentData);

      console.log('💳 [Modal] PayDPI response:', response);

      if (response && response.success) {
        setPaymentId(response.paymentId);
        setPaymentStatus('Payment gateway opened...');
        
        // Simulate payment gateway interaction
        setTimeout(() => {
          simulatePaymentCompletion(response.paymentId);
        }, 2000);
      } else {
        const errorMessage = response?.error?.message || response?.message || 'Payment initiation failed';
        setCurrentStep('error');
        onPaymentError(errorMessage);
      }

    } catch (error: any) {
      console.error('💳 [Modal] Payment error:', error);
      setCurrentStep('error');
      onPaymentError(`Payment failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const simulatePaymentCompletion = async (paymentId: string) => {
    try {
      setPaymentStatus('Processing payment...');
      
      const statusResponse = await apiClient.get(`/payments/${paymentId}/status`);
      
      if (statusResponse && statusResponse.success) {
        if (statusResponse.status === 'COMPLETED') {
          setCurrentStep('success');
          setPaymentStatus('Payment completed successfully!');
          
          setTimeout(() => {
            onPaymentComplete({
              success: true,
              paymentId: statusResponse.paymentId,
              transactionId: statusResponse.transactionId,
              paymentMethod: statusResponse.paymentMethod,
              completedAt: statusResponse.completedAt,
              message: 'Payment completed successfully!'
            });
            onClose();
          }, 2000);
        } else {
          // Payment still processing, check again
          setTimeout(() => simulatePaymentCompletion(paymentId), 3000);
        }
      }
    } catch (error: any) {
      console.error('[Modal] Status check error:', error);
      setCurrentStep('error');
      onPaymentError(`Status check failed: ${error.message}`);
    }
  };

  const nextStep = () => {
    if (currentStep === 'info') {
      setCurrentStep('method');
    } else if (currentStep === 'method') {
      processPayment();
    }
  };

  const prevStep = () => {
    if (currentStep === 'method') {
      setCurrentStep('info');
    }
  };

  if (!isOpen) return null;

  const fees = calculateFees(order.finalAmount, selectedMethod);
  const totalWithFees = order.finalAmount + fees;

  return (
    <>
      {/* Modal Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={!loading ? onClose : undefined}
      >
        {/* Modal Content */}
        <div 
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h3 style={{ margin: 0, color: '#333' }}>
              💳 Payment for Order #{order.id}
            </h3>
            {!loading && (
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Modal Body */}
          <div style={{ padding: '24px' }}>
            {/* Payment Summary - Always Visible */}
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '16px', 
              borderRadius: '8px', 
              marginBottom: '24px' 
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#495057' }}>Payment Summary</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Meal Cost:</span>
                <span>Rs. {order.totalAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#28a745' }}>
                <span>Government Subsidy:</span>
                <span>-Rs. {order.subsidyAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Amount to Pay:</span>
                <span>Rs. {order.finalAmount.toFixed(2)}</span>
              </div>
              {order.finalAmount > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#6c757d' }}>
                    <span>Processing Fee:</span>
                    <span>Rs. {fees.toFixed(2)}</span>
                  </div>
                  <hr style={{ margin: '12px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}>
                    <span>Total:</span>
                    <span>Rs. {totalWithFees.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Step Content */}
            {currentStep === 'info' && (
              <div>
                <h4>Customer Information</h4>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      border: '1px solid #ddd', 
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      border: '1px solid #ddd', 
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+94771234567"
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      border: '1px solid #ddd', 
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            )}

            {currentStep === 'method' && (
              <div>
                <h4>Select Payment Method</h4>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {paymentMethods.map(method => (
                    <label
                      key={method.method}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '16px',
                        border: selectedMethod === method.method ? '2px solid #007bff' : '1px solid #ddd',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: selectedMethod === method.method ? '#f8f9ff' : 'white'
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.method}
                        checked={selectedMethod === method.method}
                        onChange={(e) => setSelectedMethod(e.target.value)}
                        style={{ marginRight: '12px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '20px', marginRight: '8px' }}>{method.icon}</span>
                          <strong>{method.name}</strong>
                        </div>
                        <div style={{ fontSize: '14px', color: '#6c757d' }}>
                          Fee: {method.fee} • {method.processingTime}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 'processing' && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                <h4>Processing Payment...</h4>
                <p style={{ color: '#6c757d', marginBottom: '20px' }}>{paymentStatus}</p>
                <div style={{ 
                  width: '200px', 
                  height: '4px', 
                  backgroundColor: '#e0e0e0', 
                  borderRadius: '2px',
                  overflow: 'hidden',
                  margin: '0 auto'
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#007bff',
                    borderRadius: '2px',
                    animation: 'slide 1.5s infinite'
                  }} />
                </div>
              </div>
            )}

            {currentStep === 'success' && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
                <h4 style={{ color: '#28a745' }}>Payment Successful!</h4>
                <p style={{ color: '#6c757d' }}>{paymentStatus}</p>
                {order.finalAmount <= 0 && (
                  <p style={{ color: '#28a745', fontStyle: 'italic' }}>
                    This meal was fully covered by government subsidy.
                  </p>
                )}
              </div>
            )}

            {currentStep === 'error' && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
                <h4 style={{ color: '#dc3545' }}>Payment Failed</h4>
                <p style={{ color: '#6c757d', marginBottom: '20px' }}>
                  There was an issue processing your payment. Please try again.
                </p>
                <button
                  onClick={() => setCurrentStep('info')}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          {!['processing', 'success', 'error'].includes(currentStep) && (
            <div style={{
              padding: '20px 24px',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              {currentStep === 'method' && (
                <button
                  onClick={prevStep}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  ← Back
                </button>
              )}
              
              <div style={{ flex: 1 }} />
              
              <button
                onClick={nextStep}
                disabled={
                  (currentStep === 'info' && (!customerInfo.name || !customerInfo.email)) ||
                  loading
                }
                style={{
                  padding: '12px 24px',
                  backgroundColor: 
                    (currentStep === 'info' && (!customerInfo.name || !customerInfo.email)) || loading
                      ? '#ccc' 
                      : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 
                    (currentStep === 'info' && (!customerInfo.name || !customerInfo.email)) || loading
                      ? 'not-allowed' 
                      : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {currentStep === 'info' ? 'Continue' : 
                 currentStep === 'method' ? `Pay Rs. ${totalWithFees.toFixed(2)}` : 
                 'Processing...'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
    </>
  );
};