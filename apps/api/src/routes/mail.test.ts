import { describe, it, expect } from 'vitest'
import nodemailer from 'nodemailer'
import path from 'path'
import 'dotenv/config'
import { buildEmailTemplate } from '../lib/email-template'
import { dayjs } from '../lib/dayjs'
import { getMailClient } from '../lib/mail'

describe('Email Delivery Test Suite', () => {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const secure = process.env.SMTP_SECURE === 'true'
  const from = process.env.MAIL_FROM || 'oi@plann.er'

  console.log("Configurações SMTP utilizadas para os testes:")
  console.log(`Host: ${host}`)
  console.log(`Port: ${port}`)
  console.log(`User: ${user}`)
  console.log(`From: ${from}`)

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  })

  it('should send a real create-trip confirmation email to thglinchin18@gmail.com', { timeout: 15000 }, async () => {
    const startsAt = new Date(Date.now() + 86400000)
    const endsAt = new Date(Date.now() + 86400000 * 5)
    const destination = 'Florianópolis, SC'

    const html = buildEmailTemplate({
      destination,
      startsAt,
      endsAt,
      title: 'Confirmar criação de viagem',
      bodyHtml: `
        Você solicitou a criação de uma viagem para <strong class="highlight">${destination}</strong> nas datas de <strong class="highlight">${dayjs(startsAt).format('LL')}</strong> até <strong class="highlight">${dayjs(endsAt).format('LL')}</strong>.
        <p style="margin-top: 16px;">Para confirmar sua viagem e disparar os convites para seus amigos, clique no botão abaixo:</p>
      `,
      buttonText: 'Confirmar viagem',
      buttonLink: 'https://www.planner.thiagolinch.com.br/trips/mock-trip-id/confirm'
    })

    const info = await transporter.sendMail({
      from: {
        name: 'Plann.er - Confirmação',
        address: from,
      },
      to: 'thglinchin18@gmail.com',
      subject: `Confirme sua viagem para ${destination} em ${dayjs(startsAt).format('LL')}`,
      html,
      attachments: [
        {
          filename: 'logo.svg',
          path: path.resolve(__dirname, '../assets/logo.svg'),
          cid: 'logo'
        }
      ]
    })

    console.log("E-mail 'create-trip' enviado com sucesso!")
    console.log(`Message ID: ${info.messageId}`)
    expect(info.messageId).toBeDefined()
  })

  it('should send a real confirm-trip batch invite email to thglinchin18@gmail.com', { timeout: 15000 }, async () => {
    const startsAt = new Date(Date.now() + 86400000)
    const endsAt = new Date(Date.now() + 86400000 * 5)
    const destination = 'Florianópolis, SC'

    const html = buildEmailTemplate({
      destination,
      startsAt,
      endsAt,
      title: 'Confirmar presença na viagem',
      bodyHtml: `
        Você foi convidado(a) para participar de uma viagem para <strong class="highlight">${destination}</strong> nas datas de <strong class="highlight">${dayjs(startsAt).format('LL')}</strong> até <strong class="highlight">${dayjs(endsAt).format('LL')}</strong>.
        <p style="margin-top: 16px;">Para confirmar sua presença e ver todos os detalhes da viagem, clique no botão abaixo:</p>
      `,
      buttonText: 'Confirmar presença',
      buttonLink: 'https://www.planner.thiagolinch.com.br/participants/mock-participant-id/confirm'
    })

    const info = await transporter.sendMail({
      from: {
        name: 'Plann.er - Convite',
        address: from,
      },
      to: 'thglinchin18@gmail.com',
      subject: `Confirme sua presença na viagem para ${destination} em ${dayjs(startsAt).format('LL')}`,
      html,
      attachments: [
        {
          filename: 'logo.svg',
          path: path.resolve(__dirname, '../assets/logo.svg'),
          cid: 'logo'
        }
      ]
    })

    console.log("E-mail 'confirm-trip' enviado com sucesso!")
    console.log(`Message ID: ${info.messageId}`)
    expect(info.messageId).toBeDefined()
  })

  it('should send a real create-invite single guest email to thglinchin18@gmail.com', { timeout: 15000 }, async () => {
    const startsAt = new Date(Date.now() + 86400000)
    const endsAt = new Date(Date.now() + 86400000 * 5)
    const destination = 'Florianópolis, SC'

    const html = buildEmailTemplate({
      destination,
      startsAt,
      endsAt,
      title: 'Confirmar presença na viagem',
      bodyHtml: `
        Você foi convidado(a) para participar de uma viagem para <strong class="highlight">${destination}</strong> nas datas de <strong class="highlight">${dayjs(startsAt).format('LL')}</strong> até <strong class="highlight">${dayjs(endsAt).format('LL')}</strong>.
        <p style="margin-top: 16px;">Para confirmar sua presença e ver todos os detalhes da viagem, clique no botão abaixo:</p>
      `,
      buttonText: 'Confirmar presença',
      buttonLink: 'https://www.planner.thiagolinch.com.br/participants/mock-participant-id/confirm'
    })

    const info = await transporter.sendMail({
      from: {
        name: 'Plann.er - Novo Convite',
        address: from,
      },
      to: 'thglinchin18@gmail.com',
      subject: `Confirme sua presença na viagem para ${destination} em ${dayjs(startsAt).format('LL')}`,
      html,
      attachments: [
        {
          filename: 'logo.svg',
          path: path.resolve(__dirname, '../assets/logo.svg'),
          cid: 'logo'
        }
      ]
    })

    console.log("E-mail 'create-invite' enviado com sucesso!")
    console.log(`Message ID: ${info.messageId}`)
    expect(info.messageId).toBeDefined()
  })

  it('should send an email using getMailClient (bypassing via HTTP if Resend)', { timeout: 15000 }, async () => {
    const client = await getMailClient()
    const info = await client.sendMail({
      from: {
        name: 'Plann.er - Test Client',
        address: from,
      },
      to: 'thglinchin18@gmail.com',
      subject: 'Test sending via getMailClient helper',
      html: '<p>Este é um teste usando getMailClient(). Se estiver usando Resend, deve ter ido via HTTP.</p>',
      attachments: [
        {
          filename: 'logo.svg',
          path: path.resolve(__dirname, '../assets/logo.svg'),
          cid: 'logo'
        }
      ]
    })

    console.log("E-mail enviado via getMailClient com sucesso!")
    console.log(`Message ID: ${info.messageId}`)
    expect(info.messageId).toBeDefined()
  })
})
