import { TableClient, odata } from '@azure/data-tables'
import { ManagedIdentityCredential } from '@azure/identity'

export function tableStore() {
  const account = process.env.SCORE_STORAGE_ACCOUNT
  const clientId = process.env.AZURE_CLIENT_ID
  if (!account || !clientId) throw new Error('Scoreboard storage configuration is missing.')
  const client = new TableClient(`https://${account}.table.core.windows.net`, 'JtcScoreboard',
    new ManagedIdentityCredential({ clientId }))
  let ready
  const ensure = () => {
    ready ??= client.createTable().catch((error) => {
      if (error.statusCode === 409) return
      ready = undefined
      throw error
    })
    return ready
  }
  return {
    async create(entity) { await ensure(); return client.createEntity(entity) },
    async replace(entity, etag) { await ensure(); return client.updateEntity(entity, 'Replace', { etag }) },
    async get(partitionKey, rowKey) {
      await ensure()
      try { return await client.getEntity(partitionKey, rowKey) }
      catch (error) { if (error.statusCode === 404) return null; throw error }
    },
    async *list(prefix) {
      await ensure()
      yield* client.listEntities({ queryOptions: { filter: odata`PartitionKey ge ${prefix} and PartitionKey lt ${prefix + '~'}` } })
    },
  }
}
