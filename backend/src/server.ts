import { app, port } from './app';

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
