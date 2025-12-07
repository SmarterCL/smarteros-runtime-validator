#!/usr/bin/env node
import { sendTestEmail } from './lib/mailgun.js'

console.log('🧪 Testeando Mailgun con Vault...')

try {
  const result = await sendTestEmail()
  console.log('✅ Mail enviado correctamente:', result.id)
  console.log('📧 Revisa el correo en smarterbotcl@gmail.com')
} catch (error) {
  console.error('❌ Error enviando mail:', error.message)
  process.exit(1)
}
