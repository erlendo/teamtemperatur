import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Get your team ID from somewhere - check the test data
const teamId = '12345678-1234-1234-1234-123456789abc' // Replace with actual team ID

const { data, error } = await supabase.rpc('get_team_year_stats', {
  p_team_id: teamId,
  p_current_week: 6,
})

if (error) {
  console.error('Error:', error)
} else {
  console.log('Stats data:')
  data.forEach((week) => {
    console.log(`Week ${week.week}: overall_avg=${week.overall_avg}, moving_avg=${week.moving_average}`)
  })
}
