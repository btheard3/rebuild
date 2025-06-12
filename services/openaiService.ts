// @services/openaiService.ts
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // if client-side, otherwise use secure backend route
});

export const openaiService = {
  async generateScript(journalEntry: string) {
    const prompt = `Convert the following journal entry into a friendly 30-second video check-in script:\n\n"${journalEntry}"\n\nScript:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return response.choices[0]?.message.content?.trim() || '';
  },
};
