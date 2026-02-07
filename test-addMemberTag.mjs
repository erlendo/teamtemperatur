import { addMemberTag } from './server/actions/dashboard.js'

// Get test IDs from environment or hard-code them
const itemId = '70a55b68-23f6-4716-8cf0-e0922c7aff74' // From previous test
const userId = '7cace60d-1d0e-4032-90ca-ff13e5206f2a' // From previous test

console.log('Testing addMemberTag directly...')
console.log('itemId:', itemId)
console.log('userId:', userId)

try {
  const result = await addMemberTag(itemId, userId)
  console.log('Result:', result)
} catch (err) {
  console.error('Error:', err)
}
