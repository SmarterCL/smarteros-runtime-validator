import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Lee secrets desde Supabase Vault usando RPC
 * @param {string[]} secretNames - Array de nombres de secrets a leer
 * @returns {Promise<Record<string, string>>} Objeto con secrets
 */
export async function getVaultSecrets(secretNames) {
  const results = {}
  
  for (const name of secretNames) {
    const { data, error } = await supabase.rpc('get_vault_secret', {
      secret_name: name
    })
    
    if (error) {
      throw new Error(`Error reading Vault secret "${name}": ${error.message}`)
    }
    
    results[name] = data
  }
  
  return results
}

/**
 * Lee un solo secret desde Vault
 * @param {string} secretName - Nombre del secret
 * @returns {Promise<string>} Valor del secret
 */
export async function getVaultSecret(secretName) {
  const secrets = await getVaultSecrets([secretName])
  return secrets[secretName]
}

export default {
  getVaultSecrets,
  getVaultSecret
}
