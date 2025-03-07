require("dotenv").config();

import { StripeAgentToolkit } from "../typescript/src/openai";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources";
import { Eval, wrapOpenAI } from "braintrust";
import { AssertionScorer } from "./scorer";
import { TEST_CASES } from "./cases";

// Get model from environment variable or default to gpt-4o
const MODEL = process.env.OPENAI_MODEL || "gpt-4o";

// This wrap function adds useful tracing in Braintrust
export const openai = wrapOpenAI(
  new OpenAI({
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
  }),
);

const stripeAgentToolkit = new StripeAgentToolkit({
  secretKey: process.env.STRIPE_SECRET_KEY!,
  configuration: {
    actions: {
      paymentLinks: {
        create: true,
        read: true,
      },
      products: {
        create: true,
        read: true,
      },
      prices: {
        create: true,
        read: true,
      },
      customers: {
        create: true,
        read: true,
      },
    },
  },
});

// This is the core "workhorse" function that accepts an input and returns a response
// which calls stripe agent tookit
async function task(input: string) {
  let messages: ChatCompletionMessageParam[] = [
    {
      role: "user",
      content: input,
    },
  ];

  let completion: OpenAI.Chat.Completions.ChatCompletion;

  while (true) {
    // eslint-disable-next-line no-await-in-loop
    completion = await openai.chat.completions.create({
      model: MODEL,
      messages,
      tools: stripeAgentToolkit.getTools(),
    });

    const message = completion.choices[0].message;

    messages.push(message);

    if (message.tool_calls?.length! > 0) {
      // eslint-disable-next-line no-await-in-loop
      const toolMessages = await Promise.all(
        message.tool_calls!.map((tc) => stripeAgentToolkit.handleToolCall(tc)),
      );

      messages = [...messages, ...toolMessages];
    } else {
      break;
    }
  }

  return {
    responseChatCompletions: [completion.choices[0].message],
    messages,
  };
}

const BRAINTRUST_PROJECT = "agent-toolkit";

// Log which model is being used
console.log(`Running evaluations with model: ${MODEL}`);

async function main() {
  await Eval(BRAINTRUST_PROJECT, {
    data: TEST_CASES,
    task: async (input) => {
      const result = await task(input);
      return result;
    },
    scores: [AssertionScorer],
  });
}

main();
