import { customAlphabet } from 'nanoid/non-secure'

const nanoid = customAlphabet('1234567890', 7)

export const randomId = () => {
  return nanoid()
}
