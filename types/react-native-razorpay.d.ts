declare module "react-native-razorpay" {
  type RazorpayCheckoutOptions = {
    key: string;
    amount: string;
    currency: string;
    name: string;
    description?: string;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    method?: {
      card?: boolean;
      netbanking?: boolean;
      wallet?: boolean;
      upi?: boolean;
      emi?: boolean;
      paylater?: boolean;
    };
    theme?: {
      color?: string;
    };
  };

  type RazorpayPaymentSuccess = {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  };

  const RazorpayCheckout: {
    open(options: RazorpayCheckoutOptions): Promise<RazorpayPaymentSuccess>;
  };

  export default RazorpayCheckout;
}
