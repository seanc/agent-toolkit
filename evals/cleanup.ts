require("dotenv").config();

import Stripe from "stripe";

async function cleanup() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    console.error("Error: STRIPE_SECRET_KEY environment variable is not set.");
    process.exit(1);
  }

  // Safety check: ensure we're using a test key or have explicit confirmation
  const isTestKey = stripeKey.toLowerCase().includes("test");
  const hasConfirmation = process.env.CONFIRM_PRODUCTION_CLEANUP === "yes_i_know_what_im_doing";

  if (!isTestKey && !hasConfirmation) {
    console.error("\n❗  WARNING: You appear to be using a production Stripe API key! ❗");
    console.error(
      "This script will archive ALL products and deactivate ALL prices in your Stripe account.",
    );
    console.error("To proceed with a production key, add this to your .env file:");
    console.error("CONFIRM_PRODUCTION_CLEANUP=yes_i_know_what_im_doing\n");
    process.exit(1);
  }

  if (!isTestKey && hasConfirmation) {
    console.warn(
      "\n❗  CAUTION: Running cleanup on what appears to be a PRODUCTION environment ❗",
    );
    console.warn("Proceeding because CONFIRM_PRODUCTION_CLEANUP is set correctly.\n");
  }

  console.log("Starting cleanup of Stripe products and prices...");

  // Initialize Stripe client
  const stripe = new Stripe(stripeKey, {
    apiVersion: "2024-12-18.acacia", // Using the correct API version that TypeScript expects
  });

  // 1. List and archive all products
  try {
    console.log("Fetching products...");
    const products = await stripe.products.list({ limit: 100 });

    console.log(`Found ${products.data.length} products. Archiving...`);

    for (const product of products.data) {
      console.log(`Archiving product: ${product.id} (${product.name})`);
      await stripe.products.update(product.id, { active: false });
    }

    console.log("All products archived successfully.");
  } catch (error) {
    console.error("Error archiving products:", error);
  }

  // 2. List and deactivate all prices
  try {
    console.log("Fetching prices...");
    const prices = await stripe.prices.list({ limit: 100 });

    console.log(`Found ${prices.data.length} prices. Deactivating...`);

    for (const price of prices.data) {
      if (price.active) {
        console.log(`Deactivating price: ${price.id}`);
        await stripe.prices.update(price.id, { active: false });
      }
    }

    console.log("All prices deactivated successfully.");
  } catch (error) {
    console.error("Error deactivating prices:", error);
  }

  console.log("Cleanup complete!");
}

// Run the cleanup function
cleanup().catch(console.error);
