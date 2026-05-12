console.log('Testing storms command...');
try {
    const Storms = require('./storms.js');
    console.log('Storms class loaded');
    
    const storms = new Storms();
    console.log('Storms instance created');
    
    storms.run(['abrakadam']).then(code => {
        console.log('Storms completed with exit code:', code);
    }).catch(err => {
        console.log('Storms error:', err.message);
    });
    
} catch(e) {
    console.log('Exception:', e.message);
}
