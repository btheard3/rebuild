// @services/tavusService.ts
import axios from 'axios';

const TAVUS_API_URL = 'https://api.tavus.io/api/v1/videos';

export const tavusService = {
  async generateVideo({
    email,
    name,
    script,
  }: {
    email: string;
    name: string;
    script: string;
  }) {
    const res = await axios.post(
      TAVUS_API_URL,
      {
        template_id: process.env.TAVUS_TEMPLATE_ID,
        user_email: email,
        variables: { name, script },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TAVUS_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.data;
  },
};
