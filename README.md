# Realtime-streams-playground-nodejs
Marsview Realtime Speech Analytics API
Client end code for Marsview Speech Analytics APIs

## Step 1:
Signup on [Marsview portal](app.marsview.ai) and fetch API Key and API Token
Update these values in config.py
![IM-1](https://gblobscdn.gitbook.com/assets%2F-MaxSab-_c4clZreM9ft%2F-McUJSnRlslrM7wCcAdb%2F-McUJx4lF7WPJBxCsk4o%2FScreenshot%202021-06-18%20at%207.02.35%20PM.png?alt=media&token=c466bae4-6b04-4b85-b1eb-4ed02a169538)

## Step 2:
Use the API key and secret to generate an AUTHTOKEN


## Step 3:
Use the AUTHTOKEN to Initiate a transaction

### Request
```
curl -X POST \  https://streams.marsview.ai/rb/v1/streams/setup_realtime_stream \ 
-H 'authorization: Bearer <ATUHTOKEN>' \ 
-H 'cache-control: no-cache' \  
-H 'content-type: application/json' \  
-H 'postman-token: 7ba9b4b9-710a-2aca-a17e-684a0172e0e8' \  
-d '{	"channels":"1"}'
```
### Response

```
{
    "status": true,
    "data": {
        "userId": "demouser@marsview.ai",
        "txnId": "txn-6sm91fi3vku2m3fh8-1632744795931",
        "channels": [
            {
                "channelId": "channel-6sm91fi3vku2m3fh9-1632744795931"
            }
        ]
    }
}
```
## Step 4:
Once we have the AUTHTOKEN, CHANNEL_ID and TXN_ID, we can now initiate a new stream.
  Stage 1: Install the dependecies for the node application
  ```$ npm install ```
  
  Stage 2: Copyt the AUTHTOKEN, CHANNEL_ID and TXN_ID into the javascript file **app.js**
  
  Stage 3: Start the app
  ```$ npm start```
  
  Stage 4: Navigate to localhost:1337
  
  Stage 5: Click on **start recording** button
  
 Once you click record you can start speaking into the mic and Marsview will stream back the realtime analytics of your audio
 

