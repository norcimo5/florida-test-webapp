/**
 * setup.ts — runs before every test file: DOM matchers + a clean localStorage per test.
 */
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Node 25+ defines its own (disabled) global `localStorage`, which hides jsdom's. Install a small
// in-memory Storage so tests behave like a browser.
class MemoryStorage implements Storage {
  private map = new Map<string, string>()
  get length() {
    return this.map.size
  }
  clear() {
    this.map.clear()
  }
  getItem(key: string) {
    return this.map.has(key) ? this.map.get(key)! : null
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null
  }
  removeItem(key: string) {
    this.map.delete(key)
  }
  setItem(key: string, value: string) {
    this.map.set(key, String(value))
  }
}
Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true })
// jsdom doesn't implement scrolling; screens call it on navigation.
window.scrollTo = () => undefined

afterEach(() => {
  cleanup()
  localStorage.clear()
  window.location.hash = ''
})
