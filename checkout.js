const { execSync } = require('child_process');
try {
  const result = execSync('git checkout -- backend/src/controllers/institutional-responsibles.controller.ts');
  console.log(result.toString());
} catch (e) {
  console.log(e.toString());
}
