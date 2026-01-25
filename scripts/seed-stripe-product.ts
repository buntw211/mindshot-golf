import Stripe from 'stripe';

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  const connectorName = 'stripe';
  const targetEnvironment = 'development';

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', connectorName);
  url.searchParams.set('environment', targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'X_REPLIT_TOKEN': xReplitToken
    }
  });

  const data = await response.json();
  const connectionSettings = data.items?.[0];

  if (!connectionSettings?.settings?.secret) {
    throw new Error('Stripe connection not found');
  }

  return connectionSettings.settings.secret;
}

async function createProducts() {
  const secretKey = await getCredentials();
  const stripe = new Stripe(secretKey);

  const existingProducts = await stripe.products.search({ 
    query: "name:'MindShot Premium'" 
  });

  if (existingProducts.data.length > 0) {
    console.log('MindShot Premium product already exists');
    console.log('Product ID:', existingProducts.data[0].id);
    
    const prices = await stripe.prices.list({ product: existingProducts.data[0].id });
    console.log('Prices:', prices.data.map(p => ({ id: p.id, amount: p.unit_amount, interval: p.recurring?.interval })));
    return;
  }

  console.log('Creating MindShot Premium subscription product...');
  
  const product = await stripe.products.create({
    name: 'MindShot Premium',
    description: 'Unlock unlimited journal entries, advanced pattern analysis, and personalized mental game insights.',
    metadata: {
      app: 'mindshot',
      type: 'subscription'
    }
  });

  console.log('Created product:', product.id);

  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 999,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: {
      plan: 'monthly'
    }
  });

  console.log('Created monthly price:', monthlyPrice.id, '- $9.99/month');

  const yearlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 7999,
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: {
      plan: 'yearly'
    }
  });

  console.log('Created yearly price:', yearlyPrice.id, '- $79.99/year');

  console.log('Done! Stripe products created successfully.');
}

createProducts().catch(console.error);
