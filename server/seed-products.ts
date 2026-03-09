import { getUncachableStripeClient } from './stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  const existing = await stripe.products.search({ query: "name:'MindShot Pro'" });
  if (existing.data.length > 0) {
    console.log('MindShot Pro product already exists:', existing.data[0].id);
    const prices = await stripe.prices.list({ product: existing.data[0].id, active: true });
    prices.data.forEach(p => {
      const interval = (p.recurring as any)?.interval || 'one-time';
      console.log(`  Price: ${p.id} - $${(p.unit_amount || 0) / 100}/${interval}`);
    });
    return;
  }

  console.log('Creating MindShot Pro product...');
  const product = await stripe.products.create({
    name: 'MindShot Pro',
    description: 'Unlimited journal entries for your mental golf game',
    metadata: {
      app: 'mindshot',
    },
  });
  console.log('Product created:', product.id);

  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 999,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { plan: 'monthly' },
  });
  console.log('Monthly price created:', monthlyPrice.id, '- $9.99/month');

  const yearlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 8999,
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { plan: 'yearly' },
  });
  console.log('Yearly price created:', yearlyPrice.id, '- $89.99/year');

  console.log('Done! Products and prices created.');
}

createProducts().catch(console.error);
