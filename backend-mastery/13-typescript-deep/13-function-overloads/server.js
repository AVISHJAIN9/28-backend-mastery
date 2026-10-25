import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const HTTP_PORT = process.env.HTTP_PORT || 13013;

app.get('/api/overload-info', (req, res) => {
  res.json({
    message: 'Function Overloads in TypeScript',
    patterns: [
      'Type-based overloads',
      'Optional parameter overloads',
      'Generic overloads',
      'Rest parameter overloads'
    ]
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.listen(HTTP_PORT, () => console.log(`Server on :${HTTP_PORT}`));
