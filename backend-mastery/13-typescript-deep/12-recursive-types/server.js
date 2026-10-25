import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const HTTP_PORT = process.env.HTTP_PORT || 13012;

// Recursive tree example
const fileSystem = {
  name: 'root',
  children: [
    { name: 'file1.txt' },
    {
      name: 'folder',
      children: [
        { name: 'file2.txt' },
        { name: 'file3.txt' }
      ]
    }
  ]
};

app.get('/api/recursive-info', (req, res) => {
  res.json({
    message: 'Recursive Types in TypeScript',
    examples: ['File systems', 'DOM trees', 'JSON', 'Linked lists']
  });
});

app.get('/api/file-system', (req, res) => {
  res.json(fileSystem);
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.listen(HTTP_PORT, () => console.log(`Server on :${HTTP_PORT}`));
