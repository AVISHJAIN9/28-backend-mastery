import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const HTTP_PORT = process.env.HTTP_PORT || 13011;

// String enum example
const Status = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Pending: 'PENDING'
};

app.get('/api/enum-info', (req, res) => {
  res.json({
    message: 'Enums in TypeScript',
    stringEnum: Status,
    types: ['String enums', 'Numeric enums', 'Heterogeneous enums', 'Const enums']
  });
});

app.get('/api/status/:status', (req, res) => {
  const status = req.params.status.toUpperCase();
  const isValid = Object.values(Status).includes(status);
  res.json({
    status,
    isValid,
    validValues: Object.values(Status)
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.listen(HTTP_PORT, () => console.log(`Server on :${HTTP_PORT}`));
