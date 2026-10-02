import process from 'node:process';
import express from 'npm:express@4.21.2';

// Public consultation routes are anonymous. Administrative routes validate the
// user's token AND admin profile inside the API; cron validates CRON_SECRET.
process.env.NODE_ENV = 'production';
process.env.SUPABASE_EDGE = '1';
const { default: api } = await import('../_shared/backend/server.js');
const app = express();
app.use('/functions/v1/atlantica-api', api);
app.use('/atlantica-api', api);
app.use(api);
app.listen(8000);
