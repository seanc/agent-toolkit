import { Assertion } from "./scorer";

export const TEST_CASES: {
  input: string;
  expected: Assertion[];
}[] = [
  {
    input:
      "Create a product called 'Test Product' with a description 'A test product for evaluation'",
    expected: [
      {
        path: "messages[1].tool_calls[0].function.name",
        assertion_type: "equals",
        value: "create_product",
      },
      {
        path: "responseChatCompletions[0].content",
        assertion_type: "llm_criteria_met",
        value: "The message should include a successful product creation response",
      },
    ],
  },
  {
    input: "List all available products",
    expected: [
      {
        path: "messages[1].tool_calls[0].function.name",
        assertion_type: "equals",
        value: "list_products",
      },
      {
        path: "messages",
        assertion_type: "llm_criteria_met",
        value: "The messages should include a list of products returned from the Stripe API",
      },
    ],
  },
  {
    input: "Create a customer named 'Test Customer' with email 'test@example.com'",
    expected: [
      {
        path: "messages[1].tool_calls[0].function.name",
        assertion_type: "equals",
        value: "create_customer",
      },
      {
        path: "messages",
        assertion_type: "llm_criteria_met",
        value: "The messages should include a successful customer creation response",
      },
    ],
  },
  {
    input: "Create a recurring monthly subscription price of $29.99 for the product 'Premium Plan'",
    expected: [
      {
        path: "messages",
        assertion_type: "llm_criteria_met",
        value:
          "The messages should include a sequence of: product creation and recurring price creation with monthly interval",
      },
      {
        path: "messages",
        assertion_type: "llm_criteria_met",
        value: "The price creation should include recurring components with interval set to month",
      },
    ],
  },
  {
    input:
      "Create a payment link for a new product called 'test' with a price of $100. Come up with a funny description about buy bots, maybe a haiku.",
    expected: [
      {
        path: "messages",
        assertion_type: "llm_criteria_met",
        value:
          "The messages should include a sequence of: product creation, price creation, and payment link creation",
      },
      {
        path: "responseChatCompletions[0].content",
        assertion_type: "semantic_contains",
        value: "payment link",
      },
      {
        path: "responseChatCompletions[0].content",
        assertion_type: "semantic_contains",
        value: "haiku",
      },
    ],
  },
];
