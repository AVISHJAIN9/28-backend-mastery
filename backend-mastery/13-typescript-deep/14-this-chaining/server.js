import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const HTTP_PORT = process.env.HTTP_PORT || 13014;

app.get('/api/chaining-info', (req, res) => {
  res.json({
    message: 'This Types & Method Chaining',
    patterns: [
      'Builder pattern',
      'Fluent interface',
      'Query builder',
      'Return this for chaining'
    ]
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.listen(HTTP_PORT, () => console.log(`Server on :${HTTP_PORT}`));
