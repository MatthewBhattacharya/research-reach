import { shell } from 'electron'
import { execFile } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { logger } from './logger'

let isWSL: boolean | null = null

function detectWSL(): boolean {
  if (isWSL !== null) return isWSL
  try {
    if (existsSync('/proc/version')) {
      const version = readFileSync('/proc/version', 'utf-8').toLowerCase()
      isWSL = version.includes('microsoft') || version.includes('wsl')
    } else {
      isWSL = false
    }
  } catch {
    isWSL = false
  }
  return isWSL
}

export async function openExternal(url: string): Promise<void> {
  if (detectWSL()) {
    // On WSL, use cmd.exe to open URLs in the Windows default browser
    return new Promise((resolve, reject) => {
      execFile('cmd.exe', ['/c', 'start', '', url.replace(/&/g, '^&')], (error) => {
        if (error) {
          logger.warn('cmd.exe open failed, falling back to shell.openExternal', error)
          shell.openExternal(url).then(resolve).catch(reject)
        } else {
          resolve()
        }
      })
    })
  }
  return shell.openExternal(url)
}
