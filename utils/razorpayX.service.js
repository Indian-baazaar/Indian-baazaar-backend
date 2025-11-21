import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

export const createPayout = async (fundAccountId, amount, referenceId, narration) => {
  try {
    const payout = await razorpay.payouts.create({
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
      fund_account_id: fundAccountId,
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      mode: 'IMPS',
      purpose: 'payout',
      queue_if_low_balance: true,
      reference_id: referenceId,
      narration: narration
    });

    return payout;
  } catch (error) {
    console.error('Razorpay Payout Error:', error);
    throw error;
  }
};
