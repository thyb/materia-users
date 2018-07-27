const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'dist', 'client', 'package.json'), 'utf-8'));
const fields = [
    'main',
    'module',
    'es2015',
    'esm5',
    'esm2015',
    'fesm5',
    'fesm2015',
    'typings',
    'metadata'
]

fields.forEach(field => {
    pkg[field] = `client/${pkg[field]}`
})

fs.writeFileSync(path.join(__dirname, '..', 'dist', 'package.json'), JSON.stringify(pkg, null, 2), {
    encoding: 'utf-8'
});

fs.unlinkSync(path.join(__dirname, '..', 'dist', 'client', 'package.json'));