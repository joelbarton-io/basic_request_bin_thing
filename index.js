const express = require('express')
const ngrok = require('ngrok')
const app = express()
const port = 3000
const crypto = require('crypto')

const viewEndpoints = {}
const targetEndpoints = {}
let ngrokURL
app.use(express.json())

app.get('/', (req, res) => {
  res.send(`
    <html>
      <body>
        <button onclick="getUniqueEndpoint()">Get Unique Endpoint</button>
        <div id="info"></div>
        <script>
          function getUniqueEndpoint() {
            fetch('/create-endpoint')
              .then(response => response.json())
              .then(data => {
                document.getElementById('info').innerHTML = 
                  'Send requests to: <a href="' + data.targetUrl + '" target="_blank">' + data.targetUrl + '</a><br>' +
                  'View those requests here: <a href="' + data.viewUrl + '" target="_blank">' + data.viewUrl + '</a>';
              });
          }
        </script>
      </body>
    </html>
  `)
})

app.get('/create-endpoint', (req, res) => {
  const uniqueId = crypto.randomBytes(16).toString('hex')
  const viewUrl = `${ngrokURL}/view/${uniqueId}`
  const targetUrl = `${ngrokURL}/target/${uniqueId}`

  viewEndpoints[uniqueId] = []
  targetEndpoints[uniqueId] = []
  res.json({ viewUrl, targetUrl })
})

app.all('/target/:id', (req, res) => {
  const id = req.params.id

  if (targetEndpoints[id]) {
    const requestData = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      query: req.query,
    }

    if (viewEndpoints[id]) {
      viewEndpoints[id].push(requestData)
    }

    targetEndpoints[id].push(requestData)
    res.send('Received')
  } else {
    res.status(404).send('Endpoint not found')
  }
})

app.get('/view/:id', (req, res) => {
  const id = req.params.id
  if (viewEndpoints[id]) {
    res.send(`<pre>${JSON.stringify(viewEndpoints[id], null, 2)}</pre>`)
  } else {
    res.status(404).send('Endpoint not found')
  }
})

app.listen(port, async () => {
  try {
    ngrokURL = await ngrok.connect(port)
    console.log(`Server is running at http://localhost:${port}`)
    console.log(`Ngrok URL: ${ngrokURL}`)
  } catch (error) {
    console.error('Error connecting to ngrok:', error)
  }
})
