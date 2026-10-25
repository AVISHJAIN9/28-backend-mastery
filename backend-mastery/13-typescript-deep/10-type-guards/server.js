import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const HTTP_PORT = process.env.HTTP_PORT || 13010;

// Type guard examples
function isString(value) {
  return typeof value === 'string';
}

function isNumber(value) {
  return typeof value === 'number';
}

function isArray(value) {
  return Array.isArray(value);
}

app.get('/api/guard-info', (req, res) => {
  res.json({
    message: 'Type Guards in TypeScript',
    examples: ['typeof guard', 'instanceof guard', 'custom type guard', 'discriminated unions']
  });
});

app.post('/api/check-type', (req, res) => {
  const { value } = req.body;
  res.json({
    value,
    isString: isString(value),
    isNumber: isNumber(value),
    isArray: isArray(value),
    typeof: typeof value
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.listen(HTTP_PORT, () => console.log(`Server on :${HTTP_PORT}`));
