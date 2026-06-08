import nodemailer from 'nodemailer'
import { env } from '../env'
import fs from 'node:fs/promises'

export async function getMailClient() {
  // If custom SMTP config is provided, check if it's Resend to bypass SMTP ports block on Render
  if (env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS) {
    if (env.SMTP_HOST === 'smtp.resend.com') {
      console.log(`[Resend API] Usando API HTTP do Resend para envio de e-mails em vez de SMTP para evitar bloqueios de porta no Render.`)
      return {
        sendMail: async (options: {
          from: { name: string; address: string } | string
          to: { name: string; address: string } | string | (string | { name: string; address: string })[]
          subject: string
          html: string
          attachments?: { filename: string; path?: string; content?: string | Buffer; cid?: string }[]
        }) => {
          let fromStr = ''
          if (typeof options.from === 'object' && options.from !== null) {
            fromStr = options.from.name ? `${options.from.name} <${options.from.address}>` : options.from.address
          } else {
            fromStr = options.from || ''
          }

          const toList: string[] = []
          if (options.to) {
            const toArr = Array.isArray(options.to) ? options.to : [options.to]
            for (const t of toArr) {
              if (typeof t === 'string') {
                toList.push(t)
              } else if (t && typeof t === 'object') {
                toList.push(t.name ? `${t.name} <${t.address}>` : t.address)
              }
            }
          }

          const attachmentsPayload: any[] = []
          if (options.attachments) {
            for (const att of options.attachments) {
              let base64Content = ''
              if (att.content) {
                base64Content = Buffer.isBuffer(att.content)
                  ? att.content.toString('base64')
                  : Buffer.from(att.content).toString('base64')
              } else if (att.path) {
                const fileBuffer = await fs.readFile(att.path)
                base64Content = fileBuffer.toString('base64')
              }

              attachmentsPayload.push({
                content: base64Content,
                filename: att.filename,
                contentId: att.cid,
              })
            }
          }

          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${env.SMTP_PASS}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: fromStr,
              to: toList,
              subject: options.subject,
              html: options.html,
              attachments: attachmentsPayload.length > 0 ? attachmentsPayload : undefined,
            }),
          })

          if (!response.ok) {
            const errText = await response.text()
            throw new Error(`Erro ao enviar e-mail via Resend API: ${response.statusText} (${response.status}) - ${errText}`)
          }

          const resData = await response.json() as { id: string }
          return {
            messageId: resData.id,
          }
        }
      } as any
    }

    console.log(`[SMTP] Usando transportador personalizado: ${env.SMTP_HOST}:${env.SMTP_PORT} (secure: ${env.SMTP_SECURE || env.SMTP_PORT === 465})`)
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE || env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })
  }

  console.log('[SMTP] Transportador personalizado incompleto. Usando Ethereal Email (fallback).')

  // Fallback to Ethereal Email for development
  const account = await nodemailer.createTestAccount()

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: account.user,
      pass: account.pass,
    },
  })

  return transporter
}
