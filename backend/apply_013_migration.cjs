const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const sql = fs.readFileSync('./src/migrations/013_add_period_validation_config.sql', 'utf8');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // ALTER TABLE  
  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE t_config ADD COLUMN IF NOT EXISTS "PERIOD_VALIDATION_RULES" JSONB;'
  });
  
  if (alterError) {
    console.log('ALTER (rpc) error:', alterError.message);
    // Try direct update to check if column already exists
    const { error: dError } = await supabase
      .from('t_config')
      .update({ PERIOD_VALIDATION_RULES: {} })
      .eq('CONFIG_ID', 1);
    if (dError) {
      console.log('Direct update error:', dError.message);
    } else {
      console.log('Column exists');
    }
  } else {
    console.log('ALTER TABLE OK');
  }

  // Seed values
  const rules = {
    "pre-enrollment": {
      "create": { "skipPeriodStatusCheck": false },
      "update": { "skipPeriodStatusCheck": true }
    },
    "enrollment": {
      "create": { "skipPeriodStatusCheck": false, "usePeriodGraceDays": true },
      "update": { "skipPeriodStatusCheck": false, "usePeriodGraceDays": true }
    },
    "evaluation": {
      "create": { "skipPeriodStatusCheck": false, "usePeriodGraceDays": true, "requirePracticesStatusInscribed": true, "extendEndDateDays": 10 },
      "update": { "skipPeriodStatusCheck": false, "usePeriodGraceDays": true, "requirePracticesStatusInscribed": true, "extendEndDateDays": 10 }
    },
    "visit": {
      "create": { "skipPeriodStatusCheck": false },
      "update": { "skipPeriodStatusCheck": false }
    }
  };

  const { error: seedError } = await supabase
    .from('t_config')
    .update({ PERIOD_VALIDATION_RULES: rules })
    .eq('CONFIG_ID', 1);

  if (seedError) {
    console.error('Seed error:', seedError.message);
  } else {
    console.log('Seed OK');
  }

  // Verify
  const { data, error: verifyError } = await supabase
    .from('t_config')
    .select('CONFIG_ID, PERIOD_VALIDATION_RULES')
    .eq('CONFIG_ID', 1)
    .maybeSingle();

  if (verifyError) {
    console.error('Verify error:', verifyError.message);
  } else {
    console.log('Verify OK:', JSON.stringify(data?.PERIOD_VALIDATION_RULES, null, 2));
  }
}

run().catch(console.error);
