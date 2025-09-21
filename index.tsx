/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI} from '@google/genai';
import {marked} from 'marked';

// Per instructions, API key is in process.env.API_KEY
const API_KEY = process.env.API_KEY;

async function debug(...args: string[]) {
  const turn = document.createElement('div');
  const promises = args.map(async (arg) => await marked.parse(arg ?? ''));
  const strings = await Promise.all(promises);
  turn.innerHTML = strings.join('');
  document.body.append(turn);
}

async function generateContentFrom() {
  if (!API_KEY) {
    await debug('## Error\n`API_KEY` environment variable not set.');
    return;
  }
  const ai = new GoogleGenAI({apiKey: API_KEY});

  debug('Generating content with code execution...');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents:
        'What is the sum of the first 50 prime numbers? Generate and run code for the calculation, and make sure you get all 50.',
      config: {
        tools: [{codeExecution: {}}],
      },
    });

    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.executableCode) {
            await debug('**Executable Code:**\n```python\n' + part.executableCode.code + '\n```');
          } else if (part.codeExecutionResult) {
            await debug('**Execution Result:**\n```\n' + part.codeExecutionResult.output + '\n```');
          } else if (part.text) {
            await debug(part.text);
          }
        }
      }
    } else if (response.text) {
        await debug(response.text);
    } else {
      await debug('No response from Gemini.');
    }
  } catch(e) {
    await debug(`## Error\nAn error occurred: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function main() {
  await generateContentFrom();
}

main();
