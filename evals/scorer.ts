require("dotenv").config();

import { ClosedQA } from "autoevals";
import get from "lodash/get";
import every from "lodash/every";
import { openai } from "./eval";

/**
 * Uses an LLM call to classify if a substring is semantically contained in a text.
 * @param text1 The full text you want to check against
 * @param text2 The string you want to check if it is contained in the text
 */
async function semanticContains({
  text1,
  text2,
}: {
  text1: string;
  text2: string;
}): Promise<boolean> {
  const system = `
    You are a highly intelligent AI that can determine if a piece of text semantically contains another piece of text.
    You will be given two pieces of text and you need to determine if the first piece of text semantically contains the second piece of text.
    Answer with just "yes" or "no".
    `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: `Text 1: ${text1}\n\nText 2: ${text2}\n\nDoes Text 1 semantically contain Text 2? Answer with just "yes" or "no".`,
      },
    ],
  });

  const response = completion.choices[0].message.content?.toLowerCase();
  return response === "yes";
}

type AssertionTypes = "equals" | "exists" | "not_exists" | "llm_criteria_met" | "semantic_contains";

export type Assertion = {
  path: string;
  assertion_type: AssertionTypes;
  value: string;
};

export const AssertionScorer = async ({
  input,
  output,
  expected: assertions,
}: {
  input: string;
  output: any;
  expected: Assertion[];
}) => {
  // for each assertion, perform the comparison
  const assertionResults: {
    status: string;
    path: string;
    assertion_type: string;
    value: string;
    actualValue: string;
  }[] = [];

  for (const assertion of assertions) {
    const { assertion_type, path, value } = assertion;
    const actualValue = get(output, path);

    let passedTest = false;

    try {
      switch (assertion_type) {
        case "equals":
          passedTest = actualValue === value;
          break;
        case "exists":
          passedTest = actualValue !== undefined;
          break;
        case "not_exists":
          passedTest = actualValue === undefined;
          break;
        case "llm_criteria_met":
          const closedQA = await ClosedQA({
            input: "According to the provided criterion is the submission correct?",
            criteria: value,
            output: actualValue,
            openAiApiKey: process.env.OPENAI_API_KEY as string,
            openAiBaseUrl: process.env.OPENAI_BASE_URL,
          });
          passedTest = !!closedQA.score && closedQA.score > 0.5;
          break;
        case "semantic_contains":
          passedTest = await semanticContains({
            text1: actualValue,
            text2: value,
          });
          break;
        default:
          assertion_type satisfies never;
          throw new Error(`unknown assertion type ${assertion_type}`);
      }
    } catch (e) {
      console.error(e);
      passedTest = false;
    }
    assertionResults.push({
      status: passedTest ? "passed" : "failed",
      path,
      assertion_type,
      value,
      actualValue,
    });
  }

  const allPassed = every(assertionResults, (r) => r.status === "passed");

  return {
    name: "Assertions Score",
    score: allPassed ? 1 : 0,
    metadata: {
      assertionResults,
    },
  };
};
