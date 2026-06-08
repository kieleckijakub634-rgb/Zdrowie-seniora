const fs = require('fs');
let content = fs.readFileSync('www/assets/js/modules.js', 'utf8');

// Replace standard single-line innerHTML assignments
content = content.replace(/(\w+)\.innerHTML\s*=\s*([^;]+);/g, (match, el, val) => {
    // skip if it's an empty string or simple static html without variables
    if (/^['"][\s\S]*?['"]$/.test(val.trim())) return match;
    // skip if it's already sanitized
    if (val.includes('DOMPurify')) return match;
    
    return el + '.innerHTML = window.DOMPurify ? window.DOMPurify.sanitize(' + val + ') : ' + val + ';';
});

fs.writeFileSync('www/assets/js/modules.js', content);
