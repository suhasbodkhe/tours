import axios from 'axios';
import { displayAlert } from './alert';

const stripe = Stripe(
  'pk_test_51IhvR8SEoaA1yHKrlu3kKyBr4RBmjqrkpoOl398umH8CWTapLBjAKoeEnSHgGQ5q95Q8tq0RapCW6UKrInjtK56m00yRaIjj6R'
);

export const bookTour = async (tourId) => {
  try {
    // 1. Get checkout session from API
    const session = await axios(
      `/api/v1/booking/checkout-session/${tourId}`
    );

    // 2. Create checkout form + charge the credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    displayAlert('error', err);
  }
};
