const fs = require('fs');

function analyzeReport(file) {
    if (!fs.existsSync(file)) return null;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    const scores = {
        performance: Math.round(data.categories.performance?.score * 100) || 0,
        accessibility: Math.round(data.categories.accessibility?.score * 100) || 0,
        bestPractices: Math.round(data.categories['best-practices']?.score * 100) || 0,
        seo: Math.round(data.categories.seo?.score * 100) || 0
    };

    console.log(`\n=== REPORT: ${file} ===`);
    console.log(`Scores: P:${scores.performance} A:${scores.accessibility} B:${scores.bestPractices} S:${scores.seo}`);

    console.log("\nTop Issues:");
    const audits = data.audits;
    Object.keys(audits).forEach(key => {
        const audit = audits[key];
        if (audit.score !== null && audit.score < 1 && audit.scoreDisplayMode !== 'manual' && audit.scoreDisplayMode !== 'notApplicable' && audit.scoreDisplayMode !== 'informative') {
            console.log(`- [${audit.score}] ${audit.title}`);
            if (audit.details && audit.details.items && audit.details.items.length > 0) {
                audit.details.items.slice(0, 3).forEach(item => {
                    if (item.node && item.node.snippet) console.log(`  -> ${item.node.snippet}`);
                });
            }
        }
    });
}

analyzeReport('./lh-mobile.json');
analyzeReport('./lh-desktop.json');
