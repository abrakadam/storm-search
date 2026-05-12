console.log('Starting simple test...');

// Test basic Node.js functionality
console.log('Node.js is working');

// Test module loading
try {
    console.log('Testing module loading...');
    const fs = require('fs');
    console.log('fs module loaded');
    
    // Test if storms.js exists
    if (fs.existsSync('./storms.js')) {
        console.log('storms.js file exists');
    } else {
        console.log('storms.js file not found');
    }
    
    // Test if index.js exists
    if (fs.existsSync('./index.js')) {
        console.log('index.js file exists');
    } else {
        console.log('index.js file not found');
    }
    
} catch(e) {
    console.log('Error in basic test:', e.message);
}

console.log('Simple test completed');
