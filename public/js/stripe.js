import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe('pk_test_3PPHqxhF3vvLPo3gSSX9DnHU00MsL3NM6m');

export const bookTour = async (tourId) => {
  try {
    // Get checkout session from API
    const session = await axios(`/api/v1/booking/checkout-session/${tourId}`);

    // 2) Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
