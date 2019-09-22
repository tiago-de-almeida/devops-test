const express = require('express')
const app = express()
const port = 80;

app.listen(port);
console.log(`Aplicação teste executando em http://localhost: ${port}`);
app.get('/', (req, res) => {
  const name = process.env.NAME || 'Luma  Rodrigues';
  res.send(`Olá ${name}!`);
});
