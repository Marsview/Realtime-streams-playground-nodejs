# Realtime-streams-playground-nodejs
Marsview Realtime Speech Analytics API
Client end code for Marsview Speech Analytics APIs

## Step 1:
Installing the dependencies for the node.js application
  ```$ npm install ```

## Step 2:
Signup on [Marsview portal](app.marsview.ai) and fetch API Key and API Token
Update these values in app.js
![IM-1](https://gblobscdn.gitbook.com/assets%2F-MaxSab-_c4clZreM9ft%2F-McUJSnRlslrM7wCcAdb%2F-McUJx4lF7WPJBxCsk4o%2FScreenshot%202021-06-18%20at%207.02.35%20PM.png?alt=media&token=c466bae4-6b04-4b85-b1eb-4ed02a169538)

## Step 3:
Use the API key and secret to generate an AUTHTOKEN

### Request
```
curl --location --request POST 'https://api.marsview.ai/cb/v1/auth/create_access_token' \
--header 'Content-Type: application/json' \
--data-raw '{
    "apiKey":    "Insert API Key",
    "apiSecret": "Insert API Secret",
	  "userId":    "demo@marsview.ai"
}'
```

### Response
```
{
    "status": true,
    "data": {
        "accessToken": "DummyAccessToken",
        "expiresIn": 3600,
        "tokenType": "Bearer"
    }
}
```

## Step 4:
Use the AUTHTOKEN to Initiate a transaction
```
# config data for intents and statement tag models had to be created and the ids are given here, for which apis are available

Model Configs : 

let model_configs = {
    "intent_analysis":{
        "intents":[
                    //  "intent-1c6q62hzkxj2farq-1640270029382",
                    //  "intent-1c6q62hzkxj4gm3m-1640273449953"
                    ]},
    "custom_statement_tag_analysis":{
        "statement_tag_ids":[
            //  "statement-bxllq5imjkx68e6tb-1639493995007",
            //  "statement-bxllq1zsuzkvuj44go-1636609624728",
            ],
        "use_tag_level_threshold":True
        },
    }
```
### Request
```
curl -X POST https://streams.marsview.ai/rb/v1/streams/setup_realtime_stream \
-H 'authorization: Bearer <ATUHTOKEN>' \
-H 'cache-control: no-cache' \
-H 'content-type: application/json' \
-H 'postman-token: 7ba9b4b9-710a-2aca-a17e-684a0172e0e8' \
-d '{	"channels":"1","modelConfigs":model_configs}'
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
## Step 5:
Once we have the **AUTHTOKEN**, **CHANNEL_ID** and **TXN_ID**, we can now initiate a new stream.
  
  **Stage 1:** Copy the **AUTHTOKEN**, **CHANNEL_ID** and **TXN_ID** into the javascript file **app.js**
  
  **Stage 2:** Start the app
  ```$ npm start```
  
  **Stage 3:** Navigate to http://localhost:1337 on your web browser (Prefer Chrome)
  
  **Stage 4:** Click on **start recording** button
  
 Once you click record you can start speaking into the mic and Marsview will stream back the realtime analytics of your audio and display it in the appropriate boxes
 
 **note: Audio should be of format LINEAR16 at 16000hz for best performance
 
 ## Output
 Attached below a screenshot of the Realtime JSON output.

![Screenshot from 2021-10-12 12-34-43](https://user-images.githubusercontent.com/89686378/136908036-310271cb-52b9-41b2-a719-1feb0dcf1027.png)
