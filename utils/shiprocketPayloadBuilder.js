export const buildShiprocketOrderPayload = ({ order, user, seller, products, deliveryAddress }) => {
  const [firstName, ...lastParts] = (user.name || '').split(' ');
  const lastName = lastParts.join(' ') || '';

  const address = deliveryAddress || (user.address_details && user.address_details[0]);

  const order_items = order.products.map((p) => {
    const prod = products.find(x => String(x._id) === String(p.productId));
    return {
      name: p.productTitle || (prod && prod.name),
      sku: p.productId,
      units: p.quantity || 1,
      selling_price: p.price || (prod && prod.price) || 0,
    };
  });

  const sub_total = order.products.reduce((acc, cur) => acc + (cur.sub_total || (cur.price * (cur.quantity || 1)) || 0), 0);

  const sampleProd = products[0] || {};
  const weightVal = sampleProd.productWeight && sampleProd.productWeight.length ? parseFloat(sampleProd.productWeight[0]) || 0.5 : 0.5;

  // pickup location - try seller address
  // try to get exact address from seller who is fulfilling the order
  const sellerAddressId = seller.address_details && seller.address_details[0];
  let pickup_location = '';
  if (sellerAddressId) pickup_location = String(sellerAddressId);

  return {
    order_id: String(order._id),
    order_date: order.createdAt ? order.createdAt.toISOString() : new Date().toISOString(),
    pickup_location : pickup_location || sellerAddressId,
    channel_id: '',
    comment: '',
    billing_customer_name: firstName || '',
    billing_last_name: lastName,
    billing_address: address ? (address.address_line1 || '') : '',
    billing_address_2: address && address.landmark ? address.landmark : '',
    billing_city: address ? (address.city || '') : '',
    billing_pincode: address ? (address.pincode || '') : '',
    billing_state: address ? (address.state || '') : '',
    billing_country: address ? (address.country || '') : '',
    billing_email: user.email || '',
    billing_phone: user.mobile || '',
    shipping_is_billing: true,
    order_items,
    payment_method: order.payment_status || 'Prepaid',
    shipping_charges: 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total,
    length: 10,
    breadth: 10,
    height: 10,
    weight: weightVal,
  };
};