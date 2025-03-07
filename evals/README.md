## Evals

Set up `.env` file with the following:

```
BRAINTRUST_API_KEY=...
STRIPE_SECRET_KEY=sk_test_....
OPENAI_BASE_URL=http://0.0.0.0:8000/v1
OPENAI_API_KEY=EMPTY
```

To run:

```
tsx eval.ts
```

We are using [Braintrust](https://www.braintrust.dev/) to run the evals.

## Cleanup Script

This project includes a cleanup script to safely archive all products and deactivate all prices in your Stripe account.

### Usage

```bash
# Run the cleanup script
npm run cleanup
# or
pnpm run cleanup
```

### Safety Features

The script includes safety checks to prevent accidental deletion of production data:

1. It automatically detects if you're using a test key (contains "test" in the key)
2. If using a production key, you must explicitly confirm by setting an environment variable:

```
CONFIRM_PRODUCTION_CLEANUP=yes_i_know_what_im_doing
```

### What it does

The cleanup script:
1. Archives all products (sets `active: false`)
2. Deactivates all prices (sets `active: false`)

This keeps the data in your Stripe dashboard for historical reference but makes them inactive so they won't be used for new purchases.
