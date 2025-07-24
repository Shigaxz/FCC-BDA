require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

let urls = []; // array temporal

app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  let hostname;
  try {
    const parsedUrl = new URL(originalUrl);
    hostname = parsedUrl.hostname;
  } catch (e) {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    const shortUrl = urls.length + 1;
    urls.push({ original_url: originalUrl, short_url: shortUrl });

    res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url);
  const found = urls.find(entry => entry.short_url === shortUrl);

  if (found) {
    res.redirect(found.original_url);
  } else {
    res.status(404).json({ error: 'No short URL found' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
