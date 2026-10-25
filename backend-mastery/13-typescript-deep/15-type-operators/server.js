import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const HTTP_PORT = process.env.HTTP_PORT || 13015;

app.get('/api/operators-info', (req, res) => {
  res.json({
    message: 'Type Operators in TypeScript',
    operators: [
      'keyof - Get keys of type',
      'typeof - Get type from value',
      'indexed access - T[K]',
      'mapped types - [K in keyof T]',
      'conditional types - T extends U ? X : Y'
    ]
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.listen(HTTP_PORT, () => console.log(`Server on :${HTTP_PORT}`));
