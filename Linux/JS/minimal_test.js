console.log('Test started');

try {
    const Storms = require('./storms.js');
    console.log('Storms loaded');
    
    const storms = new Storms();
    console.log('Instance created');
    
    storms.run(['abrakadam']).then(code => {
        console.log('Completed with code:', code);
    }).catch(err => {
        console.log('Error:', err.message);
    });
    
} catch(e) {
    console.log('Exception:', e.message);
}

console.log('Test ended');
