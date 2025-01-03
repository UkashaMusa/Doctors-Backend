import paypal from '@paypal/checkout-server-sdk';

const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID, // Replace with your Client ID
  process.env.PAYPAL_CLIENT_SECRET // Replace with your Secret
);

const paypalClient = new paypal.core.PayPalHttpClient(environment);

export default paypalClient;
