/**
 * Project-specific utility types and functions
 */

export type DAWInfo = {
  name?: string
  version?: string
}

export type Plugin = {
  name: string
  version?: string
}

/**
 * Format DAW information into a single display string
 */
export function formatDAWInfo(dawInfo: unknown): string {
  const daw = (dawInfo as DAWInfo) || {}
  const name = daw.name ?? 'Unknown'
  const version = daw.version ? ` ${daw.version}` : ''
  return `${name}${version}`
}

/**
 * Check if DAW info has any meaningful content
 */
export function hasDAWInfo(dawInfo: unknown): boolean {
  const daw = (dawInfo as DAWInfo) || {}
  return Boolean(daw.name || daw.version)
}

/**
 * Format plugin name with version
 */
export function formatPlugin(plugin: Plugin): string {
  return `${plugin.name}${plugin.version ? ` @ ${plugin.version}` : ''}`
}

/**
 * Generate a unique key for a plugin
 */
export function getPluginKey(plugin: Plugin, index: number): string {
  return `${plugin.name}-${plugin.version ?? index}`
}
