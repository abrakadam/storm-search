console.log('=== DEBUG SCRIPT ===');
console.log('Node.js version:', process.version);
console.log('Current directory:', process.cwd());

// Test file existence
const fs = require('fs');
console.log('Files in current directory:');
fs.readdirSync('.').forEach(file => {
    console.log('  ' + file);
});

// Test basic storms functionality
console.log('\n=== TESTING STORMS ===');
try {
    console.log('Loading storms.js...');
    const stormsClass = require('./storms.js');
    console.log('Storms class type:', typeof stormsClass);
    
    console.log('Creating storms instance...');
    const storms = new stormsClass();
    console.log('Storms instance created');
    
    console.log('Testing storms.run method...');
    storms.run(['abrakadam']).then(code => {
        console.log('SUCCESS: Storms completed with exit code:', code);
    }).catch(err => {
        console.log('ERROR: Storms failed:', err.message);
        console.log('Stack:', err.stack);
    });
    
} catch(e) {
    console.log('FATAL ERROR:', e.message);
    console.log('Stack:', e.stack);
}

console.log('=== DEBUG SCRIPT END ===');
