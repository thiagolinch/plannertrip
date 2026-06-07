import 'dotenv/config';
import { buildApp } from './app'

const app = buildApp()
const port = Number(process.env.PORT) || 3000

app.listen({ port, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Servidor rodando em ${address}`)
})