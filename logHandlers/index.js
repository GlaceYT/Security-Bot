const fs = require('fs');
const path = require('path');

module.exports = function loadLogHandlers(client) {
    const logHandlersPath = path.join(__dirname);

    fs.readdirSync(logHandlersPath).forEach((file) => {
        if (file === 'index.js') return; // Skip this file

        const handlerPath = path.join(logHandlersPath, file);
        //console.log(`Loading log handler: ${file}`); // Debugging

        const handler = require(handlerPath);

        if (typeof handler === 'function') {
            handler(client); // Initialize the handler
            //console.log(`${file} loaded successfully.`); // Debugging
        } else {
            console.warn(`${file} does not export a function.`);
        }
    });
};
