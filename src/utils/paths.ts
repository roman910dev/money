import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(path.dirname(import.meta.url))

const root = (...p: string[]) => path.join(__dirname, '..', '..', ...p)

const paths = { root }
export default paths
