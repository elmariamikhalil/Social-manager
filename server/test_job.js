const db = require('./db/database');
const { triggerJobNow } = require('./services/schedulerService');

async function test() {
  const jobs = db.prepare('SELECT id FROM scheduled_jobs WHERE job_type = \'generate_images\'').all();
  if (jobs.length > 0) {
    console.log('Triggering job:', jobs[0].id);
    const result = await triggerJobNow(jobs[0].id);
    console.log(result);
  } else {
    console.log('Job not found');
  }
}
test();
