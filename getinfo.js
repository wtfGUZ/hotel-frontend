const { execSync } = require('child_process');
const fs = require('fs');
try {
    const log = execSync('git --no-pager log -n 5 --name-status').toString();
    fs.writeFileSync('git_latest_log.txt', log);
} catch (e) {
    fs.writeFileSync('git_latest_log.txt', e.toString());
}
