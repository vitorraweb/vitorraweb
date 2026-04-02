const https = require('https');

https.get('https://fuelecotech.com/en/index.html', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const calcStart = data.indexOf('id="calculator"');
    if (calcStart !== -1) {
      console.log(data.substring(calcStart, calcStart + 4000));
    } else {
      console.log("Calculator not found");
    }
  });
}).on('error', (err) => {
  console.log("Error: " + err.message);
});
