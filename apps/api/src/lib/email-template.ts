import { dayjs } from './dayjs'

interface EmailTemplateProps {
  destination: string
  startsAt: Date | string
  endsAt: Date | string
  title: string
  bodyHtml: string
  buttonText: string
  buttonLink: string
}

export function buildEmailTemplate({
  destination,
  startsAt,
  endsAt,
  title,
  bodyHtml,
  buttonText,
  buttonLink
}: EmailTemplateProps) {
  const formattedStartDate = dayjs(startsAt).format('LL')
  const formattedEndDate = dayjs(endsAt).format('LL')

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #09090b;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #f4f4f5;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo {
      height: 32px;
      outline: none;
      border: none;
    }
    .card {
      background-color: #18181b;
      border: 1px solid #27272a;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .title {
      font-size: 20px;
      font-weight: 600;
      color: #f4f4f5;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .text {
      font-size: 16px;
      line-height: 1.6;
      color: #a1a1aa;
      margin-bottom: 24px;
    }
    .highlight {
      color: #f4f4f5;
      font-weight: 500;
    }
    .button-container {
      text-align: center;
      margin-top: 32px;
      margin-bottom: 24px;
    }
    .button {
      display: inline-block;
      background-color: #bef264;
      color: #0c0a09 !important;
      font-weight: 600;
      font-size: 16px;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #a3e635;
    }
    .footer {
      margin-top: 32px;
      text-align: center;
      font-size: 12px;
      color: #71717a;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="cid:logo" alt="plann.er" class="logo" />
    </div>
    
    <div class="card">
      <h1 class="title">${title}</h1>
      <div class="text">
        ${bodyHtml}
      </div>
      
      <div class="button-container">
        <a href="${buttonLink}" class="button">${buttonText}</a>
      </div>
      
      <div class="text" style="font-size: 14px; margin-bottom: 0;">
        Se você não realizou ou desconhece esta solicitação, por favor desconsidere este e-mail.
      </div>
    </div>
    
    <div class="footer">
      Esta é uma mensagem automática enviada pela plataforma plann.er.<br />
      &copy; ${new Date().getFullYear()} plann.er. Todos os direitos reservados.
    </div>
  </div>
</body>
</html>
  `.trim()
}
