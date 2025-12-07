import formData from 'form-data'
import Mailgun from 'mailgun.js'
import { getVaultSecrets } from './vault.js'

let _mgClient = null

/**
 * Obtiene cliente de Mailgun usando secrets de Vault
 */
async function getMailgunClient() {
  if (_mgClient) return _mgClient

  const secrets = await getVaultSecrets([
    'MAILGUN_API_KEY',
    'MAILGUN_DOMAIN'
  ])

  const mailgun = new Mailgun(formData)
  _mgClient = {
    client: mailgun.client({
      username: 'api',
      key: secrets.MAILGUN_API_KEY
    }),
    domain: secrets.MAILGUN_DOMAIN
  }

  return _mgClient
}

/**
 * Envía email de alerta del Runtime Validator
 * @param {Object} alert - Objeto con datos de la alerta
 */
export async function sendRuntimeAlert(alert) {
  const secrets = await getVaultSecrets(['MAILGUN_TO', 'MAILGUN_FROM'])
  const { client, domain } = await getMailgunClient()

  const tags = [
    'runtime-validator',
    `severity:${alert.severity || 'unknown'}`,
    `type:${alert.type || 'unknown'}`
  ]

  const result = await client.messages.create(domain, {
    from: secrets.MAILGUN_FROM || 'SmarterBOT Runtime <alertas@mg.smarterbot.store>',
    to: secrets.MAILGUN_TO,
    subject: `🚨 Runtime Validator: ${alert.type}`,
    text: `
Alerta del Runtime Validator
=============================

Tipo: ${alert.type}
Severidad: ${alert.severity}
Scout ID: ${alert.scout_id}
Execution ID: ${alert.execution_id}

Detalles:
${JSON.stringify(alert.payload, null, 2)}

---
Timestamp: ${new Date().toISOString()}
    `.trim(),
    'o:tag': tags
  })

  return result
}

/**
 * Envía email de prueba
 */
export async function sendTestEmail() {
  const secrets = await getVaultSecrets(['MAILGUN_TO', 'MAILGUN_FROM'])
  const { client, domain } = await getMailgunClient()

  const result = await client.messages.create(domain, {
    from: secrets.MAILGUN_FROM || 'SmarterBOT Runtime <alertas@mg.smarterbot.store>',
    to: secrets.MAILGUN_TO,
    subject: '✅ Runtime Validator – Mailgun + Vault OK',
    text: 'Este es un test usando Mailgun con secretos desde Supabase Vault.',
    'o:tag': ['test', 'runtime-validator']
  })

  return result
}

export default {
  sendRuntimeAlert,
  sendTestEmail
}
