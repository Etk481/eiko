
/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Messenger Platform Quick Start Tutorial
 *
 * This is the completed code for the Messenger Platform quick start tutorial
 *
 * https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
 *
 * To run this code, you must do the following:
 *
 * 1. Deploy this code to a server running Node.js
 * 2. Run `npm install`
 * 3. Update the VERIFY_TOKEN
 * 4. Add your PAGE_ACCESS_TOKEN to your environment vars
 *
 */

'use strict';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
// Imports dependencies and set up http server
const 
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  firebase = require('firebase-admin'),
  app = express().use(body_parser.json()); // creates express http server

  //initialize firebase
  firebase.initializeApp({
  credential: firebase.credential.cert({
    "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "project_id": process.env.FIREBASE_PROJECT_ID,
  }),
  databaseURL: "https://eithinzarbot.firebaseio.com"
  });

  let db = firebase.firestore();

  let botQuestions = {
    quantity:false,
    width:false,
    length:false,
  };

  let userAnswers = {};

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {  

  // Parse the request body from the POST
  let body = req.body;

  

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    body.entry.forEach(function(entry) {

      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);


      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender ID: ' + sender_psid);   

      

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);        
      } else if (webhook_event.postback) {
        
        handlePostback(sender_psid, webhook_event.postback);
      }
      
    });
    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});


app.get('/setgsbutton',function(req,res){
    setupGetStartedButton(res);    
});

app.get('/setpersistentmenu',function(req,res){
    setupPersistentMenu(res);    
});

app.get('/clear',function(req,res){    
    removePersistentMenu(res);
});


// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  
  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  
    
  // Check if a token and mode were sent
  if (mode && token) {
    
  
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

function handleMessage(sender_psid, received_message) {
  let response;
  
  // Checks if the message contains text
  if (received_message.text == "Hi" || received_message.text == "hi" || received_message.text == "Hello" || received_message.text == "hello") {    
    // Create the payload for a basic text message, which
    // will be added to the body of our request to the Send API
   greetUser (sender_psid);
  }

  else if (received_message.attachments) {
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Is this the right picture?",
            "subtitle": "Tap a button to answer.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "ဟုတ်ပါတယ်!",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "မဟုတ်ပါ!",
                "payload": "no",
              }
            ],
          }]
        }
      }
    }
  }else if (received_message.text && botQuestions.quantity) {
      userAnswers.quantity = parseInt(received_message.text);
      let total = 30000 * userAnswers.quantity;
      let orderNumber = Math.floor(Math.random() * 100) + 1;

      let data = {
        user:"ei thin zar ko",
        date: "28-02-2020",
        total: userAnswers.quantity,
        order_number : orderNumber
      }

      db.collection('order').doc().set(data);

      response = {
        "text":`15.2.2020 မှာရမယ်။ တန်ဖိုးကတော့ ${total} ကျပါမယ်။ မှာယူမှာသေချာပါသလား?`,
         "quick_replies":[
        {
          "content_type":"text",
          "title":"yes",
          "payload":"<POSTBACK_PAYLOAD>"
        },{
          "content_type":"text",
          "title":"no",
          "payload":"<POSTBACK_PAYLOAD>"
        }
      ]
      }
      botQuestions.quantity = false;
  }else if (received_message.text == "no") {
      response = {
        "text":'ကျေးဇူးတင်ပါတယ်' 
      }
  }else if (received_message.text == "yes") {
     response = {
        "text":'လာယူမှာလား?',
         "quick_replies":[
        {
          "content_type":"text",
          "title":"အိမ်ပို့ပေး",
          "payload":"<POSTBACK_PAYLOAD>"
        },{
          "content_type":"text",
          "title":"ယူမယ်",
          "payload":"<POSTBACK_PAYLOAD>"
        }
      ]
      }
  } else if (received_message.text == "အိမ်ပို့ပေး") {
      response = {
        "text":'ပို့ပေးရန်လိပ်စာပေးပါ'
      }
  }else if (received_message.text == "ယူမယ်") {
      response = {
        "text":'ဆိုင်မှာတွေ့မယ်နော်' 
      }
  }else if (received_message.text == "1234") {
      response = {
        "text":'ဟုတ်ကဲ့ 15.2.2020 ရက်နေ့ကျလာပို့ပါမယ်' 
      }
  }
  // Send the response message
  callSendAPI(sender_psid, response);    
}

function handlePostback(sender_psid, received_postback) {
  console.log('ok')
   let response;
  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = { "text": "ဟုတ်ကဲ့အတိုင်းပေးပါဦး" }
  } else if (payload === 'no') {
    response = { "text": "အားးးနောက်တစ်ပုံပြန်ပို့ပေးပါနော်" }
  }else if (payload === 'getstarted') {
  response = { "attachment": {
                      "type": "template",
                      "payload": {
                        "template_type": "generic",
                        "elements": [{
                          "title": "မင်္ဂလာပါ! NS Doors & Windows Shop မှကြိုဆိုပါတယ် ခင်ဗျာ",
                          "subtitle": "ဘာများအလိုရှိပါသလဲ?",
                          "buttons": [
                            {
                              "type": "postback",
                              "title": "တံခါးရွက်ဒီဇိုင်းများ",
                              "payload": "sstgym",
                            },
                            {
                              "type": "postback",
                              "title": "ဒီဇိုင်းပေးမည်",
                              "payload": "gd",
                            }
                          ],
                        }]
                      }
                    }
                  }

  }else if (payload === 'gd') {
    response = { "text": "Please sent image." }
   }else if (payload === 'sstgym') {
    response = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements":[
           {
            "title": "တံခါးမကြီး",
            "subtitle": "တံခါးမကြီးဒီဇိုင်းများစွာကိုဆက်လက်ကြည့်ရှုလိုပါသလား?",
            "image_url":"https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/s960x960/84265124_128731702002741_8643057543540637696_o.jpg?_nc_cat=102&_nc_ohc=fR4ICBk7b60AX-e0uwj&_nc_ht=scontent.fnyt1-1.fna&oh=2c0e0ab8d9c29c2558b44835c2605ebf&oe=5F01FE75",
            "default_action": {
              "type": "web_url",
              "url": "https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/s960x960/84265124_128731702002741_8643057543540637696_o.jpg?_nc_cat=102&_nc_ohc=fR4ICBk7b60AX-e0uwj&_nc_ht=scontent.fnyt1-1.fna&oh=2c0e0ab8d9c29c2558b44835c2605ebf&oe=5F01FE75",
              "webview_height_ratio": "tall",
            },
            "buttons":[
              {
                "type":"postback",
                "title":"Yes!",
                "payload":"door"
              }, 
              {
                "type":"postback",
                "title":"No!",
                "payload":"getstarted"
              }             
            ]      
          },
          {
            "title":"ပြတင်းပေါက်",
            "subtitle": "ပြတင်းပေါက်ဒီဇိုင်းများစွာကိုဆက်လက်ကြည့်ရှုလိုပါသလား?",
            "image_url":"https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/p720x720/85023815_128707408671837_1862269537185955840_o.jpg?_nc_cat=103&_nc_ohc=wTIcFAk9bWAAX8SUotO&_nc_ht=scontent.fnyt1-1.fna&_nc_tp=6&oh=af2ba927646c94118f5ca728312df4c8&oe=5EBCEFBD",
            "default_action": {
              "type": "web_url",
              "url": "https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/p720x720/85023815_128707408671837_1862269537185955840_o.jpg?_nc_cat=103&_nc_ohc=wTIcFAk9bWAAX8SUotO&_nc_ht=scontent.fnyt1-1.fna&_nc_tp=6&oh=af2ba927646c94118f5ca728312df4c8&oe=5EBCEFBD",
              "webview_height_ratio": "tall",
            },
            "buttons":[
              {
                "type":"postback",
                "title":"Yes!",
                "payload":"window"
              }, 
              {
                "type":"postback",
                "title":"No!",
                "payload":"getstarted"
              }             
            ]      
          },
          {
            "title":"ရောင်လင်း",
            "subtitle": "ရောင်လင်းဒီဇိုင်းများစွာကိုဆက်လက်ကြည့်ရှုလိုပါသလား?",
            "image_url":"https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/86346490_128732205336024_3191562516593377280_o.jpg?_nc_cat=108&_nc_ohc=SER5brGx8yIAX9cof8k&_nc_ht=scontent.fnyt1-1.fna&oh=330eaf7750c844e81f14042946c796ee&oe=5F0044D3",
            "default_action": {
              "type": "web_url",
              "url": "https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/86346490_128732205336024_3191562516593377280_o.jpg?_nc_cat=108&_nc_ohc=SER5brGx8yIAX9cof8k&_nc_ht=scontent.fnyt1-1.fna&oh=330eaf7750c844e81f14042946c796ee&oe=5F0044D3",
              "webview_height_ratio": "tall",
            },
            "buttons":[
              {
                "type":"postback",
                "title":"Yes!",
                "payload":"light"
              },  
              {
                "type":"postback",
                "title":"No!",
                "payload":"getstarted"
              }                          
            ]      
          }
        ]
      }
    }
   }









  }else if (payload === 'door') {
    response = { "attachment": {
                  "type": "template",
                  "payload": {
                    "template_type": "generic",
                    "elements": [{
                      "title": "တံခါးမကြီးများ",
                      "subtitle": "ပုံစံ",
                      "buttons": [
                        {
                          "type": "postback",
                          "title": "တံခါးကြီးခွေ",
                          "payload": "dk",
                        },
                        {
                          "type": "postback",
                          "title": "တစ်ဖက်ပိတ်တံခါးမ",
                          "payload": "d1",
                        },
                        {
                          "type": "postback",
                          "title": "နှစ်ဖက်ပိတ်တံခါးမ",
                          "payload": "d2",
                        } 
                      ],
                    }]
                  }
                }
              }
  }else if (payload === 'window') {
    response = { "attachment": {
                  "type": "template",
                  "payload": {
                    "template_type": "generic",
                    "elements": [{
                      "title": "ပြတင်းပေါက်များ",
                      "subtitle": "ပုံစံ",
                      "buttons": [
                        {
                          "type": "postback",
                          "title": "ပြတင်းကြီးခွေ",
                          "payload": "wk",
                        },
                        {
                          "type": "postback",
                          "title": "တစ်ဖက်ပိတ်ပြတင်း",
                          "payload": "w1",
                        },
                        {
                          "type": "postback",
                          "title": "နှစ်ဖက်ပိတ်ပြတင်း",
                          "payload": "w2",
                        } 
                      ],
                    }]
                  }
                }
              }
  }else if (payload === 'light') {
    response = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements":[
           {
            "title":"အလျား = 3'",
            "subtitle":"အနံ = 1.5'",
            "image_url":"https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/p720x720/84182457_128691888673389_710650163584040960_o.jpg?_nc_cat=103&_nc_ohc=GymUEW-3toAAX-KaT9R&_nc_ht=scontent.fnyt1-1.fna&_nc_tp=6&oh=a15b8d6a05e4ae0ba2885e52626b64c2&oe=5EBCFE18",
            "default_action": {
              "type": "web_url",
              "url": "https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/p720x720/84182457_128691888673389_710650163584040960_o.jpg?_nc_cat=103&_nc_ohc=GymUEW-3toAAX-KaT9R&_nc_ht=scontent.fnyt1-1.fna&_nc_tp=6&oh=a15b8d6a05e4ae0ba2885e52626b64c2&oe=5EBCFE18",
              "webview_height_ratio": "tall",
            },
            "buttons":[
              {
                "type":"postback",
                "title":"မှာမည်",
                "payload":"ol"
              }              
            ]      
          },
          {
            "title":"အလျား = 2'",
            "image_url":"https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/p720x720/84114239_128691935340051_6444479401219325952_o.jpg?_nc_cat=110&_nc_ohc=UeQOG9MaKT8AX-U9GjJ&_nc_ht=scontent.fnyt1-1.fna&_nc_tp=6&oh=08d806478f9c31aee658300c2089da63&oe=5ED177E0",
            "subtitle":"အနံ = 1.5'",
            "default_action": {
              "type": "web_url",
              "url": "https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/p720x720/84114239_128691935340051_6444479401219325952_o.jpg?_nc_cat=110&_nc_ohc=UeQOG9MaKT8AX-U9GjJ&_nc_ht=scontent.fnyt1-1.fna&_nc_tp=6&oh=08d806478f9c31aee658300c2089da63&oe=5ED177E0",
              "webview_height_ratio": "tall",
            },
            "buttons":[
              {
                "type":"postback",
                "title":"မှာမည်",
                "payload":"ol"
              }              
            ]      
          },
          {
            "title":"အလျား = 3'",
            "image_url":"https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/86346490_128732205336024_3191562516593377280_o.jpg?_nc_cat=108&_nc_ohc=SER5brGx8yIAX9cof8k&_nc_ht=scontent.fnyt1-1.fna&oh=330eaf7750c844e81f14042946c796ee&oe=5F0044D3",
            "subtitle":"အနံ = 1.5'",
            "default_action": {
              "type": "web_url",
              "url": "https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/86346490_128732205336024_3191562516593377280_o.jpg?_nc_cat=108&_nc_ohc=SER5brGx8yIAX9cof8k&_nc_ht=scontent.fnyt1-1.fna&oh=330eaf7750c844e81f14042946c796ee&oe=5F0044D3",
              "webview_height_ratio": "tall",
            },
            "buttons":[
              {
                "type":"postback",
                "title":"မှာမည်",
                "payload":"ol"
              }              
            ]      
          }
        ]
      }
    }
   }
  }else if (payload === 'wk') {
    response = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements":[
           {
            "title":"အလျား = ",
            "subtitle":"အနံ = ",
            "image_url":"",
            "subtitle":"We have the right hat for everyone.",
            "default_action": {
              "type": "web_url",
              "url": "",
              "webview_height_ratio": "tall",
            },
            "buttons":[
             {
                "type":"postback",
                "title":"မှာမည်",
                "payload":"ol"
              }              
            ]      
          },
          {
            "title":"အလျား =",
            "image_url":"",
            "subtitle":"အနံ = ",
            "default_action": {
              "type": "web_url",
              "url": "",
              "webview_height_ratio": "tall",
            },
            "buttons":[
              {
                "type":"postback",
                "title":"မှာမည်",
                "payload":"ol"
              }              
            ]      
          },
          {
            "title":"အလျား =",
            "image_url":"",
            "subtitle":"အနံ = ",
            "default_action": {
              "type": "web_url",
              "url": "",
              "webview_height_ratio": "tall",
            },
            "buttons":[
              {
                "type":"postback",
                "title":"မှာမည်",
                "payload":"ol"
              }              
            ]      
          }
        ]
      }
    }
   }
  }else if (payload === 'w1') {
    response = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements":[
           {
            "title":"အလျား = 1.5'",
            "image_url":"https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/s960x960/86261970_128707278671850_951335569596612608_o.jpg?_nc_cat=104&_nc_ohc=m_2wLarJytIAX_Z6vy_&_nc_ht=scontent.fnyt1-1.fna&oh=daa8cb40f609749cd9cd30d338d961ee&oe=5ED57961",
            "subtitle":"အနံ = 4'",
            "default_action": {
              "type": "web_url",
              "url": "https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/s960x960/86261970_128707278671850_951335569596612608_o.jpg?_nc_cat=104&_nc_ohc=m_2wLarJytIAX_Z6vy_&_nc_ht=scontent.fnyt1-1.fna&oh=daa8cb40f609749cd9cd30d338d961ee&oe=5ED57961",
              "webview_height_ratio": "tall",
            },
            "buttons":[
              {
                "type":"postback",
                "title":"မှာမည်",
                "payload":"ol"
              }              
            ]      
          },
          {
            "title":"အလျား =1.5'",
            "image_url":"https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/s960x960/84516484_128707305338514_4909051974701285376_o.jpg?_nc_cat=103&_nc_ohc=ZEf538L72_oAX8wsJqy&_nc_ht=scontent.fnyt1-1.fna&oh=2b9bcfc820440c59704ca4eb143da255&oe=5EBA7D91",
            "subtitle":"အနံ = 4'",
            "default_action": {
              "type": "web_url",
              "url": "https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/s960x960/84516484_128707305338514_4909051974701285376_o.jpg?_nc_cat=103&_nc_ohc=ZEf538L72_oAX8wsJqy&_nc_ht=scontent.fnyt1-1.fna&oh=2b9bcfc820440c59704ca4eb143da255&oe=5EBA7D91",
              "webview_height_ratio": "tall",
            },
            "buttons":[
              {
                "type":"postback",
                "title":"မှာမည်",
                "payload":"ol"
              }              
            ]      
          },
          {
            "title":"အလျား =1.5'",
            "image_url":"https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/p720x720/85059093_128707345338510_7829820041687203840_o.jpg?_nc_cat=105&_nc_ohc=kBtUdkbsRJMAX_QYOsS&_nc_ht=scontent.fnyt1-1.fna&_nc_tp=6&oh=e6001d29d75b70d61b6a853f1d9eab80&oe=5ECC791D",
            "subtitle":"အနံ = 4'",
            "default_action": {
              "type": "web_url",
              "url": "https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/p720x720/85059093_128707345338510_7829820041687203840_o.jpg?_nc_cat=105&_nc_ohc=kBtUdkbsRJMAX_QYOsS&_nc_ht=scontent.fnyt1-1.fna&_nc_tp=6&oh=e6001d29d75b70d61b6a853f1d9eab80&oe=5ECC791D",
              "webview_height_ratio": "tall",
            },
            "buttons":[
              {
                "type":"postback",
                "title":"မှာမည်",
                "payload":"ol"
              }              
            ]      
          },
          {
            "title":"အလျား =1.5'",
            "image_url":"https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/s960x960/85250402_128707368671841_204791702894936064_o.jpg?_nc_cat=107&_nc_ohc=J1pGoSS24DkAX8edl6Z&_nc_ht=scontent.fnyt1-1.fna&oh=991f7b8752edbce5db3d3316a83c2f46&oe=5ECA65DD",
            "subtitle":"အနံ = 4'",
            "default_action": {
              "type": "web_url",
              "url": "https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/s960x960/85250402_128707368671841_204791702894936064_o.jpg?_nc_cat=107&_nc_ohc=J1pGoSS24DkAX8edl6Z&_nc_ht=scontent.fnyt1-1.fna&oh=991f7b8752edbce5db3d3316a83c2f46&oe=5ECA65DD",
              "webview_height_ratio": "tall",
            },
            "buttons":[
              {
                "type":"postback",
                "title":"မှာမည်",
                "payload":"ol"
              }              
            ]      
          }
        ]
      }
    }
   }
  }else if (payload === 'w2') {
    response = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements":[
           {
            "title":"အလျား = 3'",
            "image_url":"https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/p720x720/85023815_128707408671837_1862269537185955840_o.jpg?_nc_cat=103&_nc_ohc=wTIcFAk9bWAAX8SUotO&_nc_ht=scontent.fnyt1-1.fna&_nc_tp=6&oh=af2ba927646c94118f5ca728312df4c8&oe=5EBCEFBD",
            "subtitle":"အနံ = 4'",
            "default_action": {
              "type": "web_url",
              "url": "https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/p720x720/85023815_128707408671837_1862269537185955840_o.jpg?_nc_cat=103&_nc_ohc=wTIcFAk9bWAAX8SUotO&_nc_ht=scontent.fnyt1-1.fna&_nc_tp=6&oh=af2ba927646c94118f5ca728312df4c8&oe=5EBCEFBD",
              "webview_height_ratio": "tall",
            },
            "buttons":[
              {
                "type":"postback",
                "title":"မှာမည်",
                "payload":"ol"
              }              
            ]      
          },
          {
            "title":"အလျား = 3'",
            "image_url":"https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/p720x720/84482301_128707435338501_3270701025643724800_o.jpg?_nc_cat=109&_nc_ohc=al6vnhdG-4kAX-pBUlq&_nc_ht=scontent.fnyt1-1.fna&_nc_tp=6&oh=29de43cc8573a2fb24ec6a59789b796b&oe=5EB4FAAF",
            "subtitle":"အနံ = 4'",
            "default_action": {
              "type": "web_url",
              "url": "https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/p720x720/84482301_128707435338501_3270701025643724800_o.jpg?_nc_cat=109&_nc_ohc=al6vnhdG-4kAX-pBUlq&_nc_ht=scontent.fnyt1-1.fna&_nc_tp=6&oh=29de43cc8573a2fb24ec6a59789b796b&oe=5EB4FAAF",
              "webview_height_ratio": "tall",
            },
            "buttons":[
             {
                "type":"postback",
                "title":"မှာမည်",
                "payload":"ol"
              }              
            ]      
          },
          {
            "title":"အလျား = 3'",
            "image_url":"https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/s960x960/84353475_128707478671830_2425593354625482752_o.jpg?_nc_cat=110&_nc_ohc=mlYuYO7C55cAX848IYT&_nc_ht=scontent.fnyt1-1.fna&oh=0207efe0b84d3f432b35c7f52346cdc6&oe=5EB8AC7A",
            "subtitle":"အနံ = 4'",
            "default_action": {
              "type": "web_url",
              "url": "https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/s960x960/84353475_128707478671830_2425593354625482752_o.jpg?_nc_cat=110&_nc_ohc=mlYuYO7C55cAX848IYT&_nc_ht=scontent.fnyt1-1.fna&oh=0207efe0b84d3f432b35c7f52346cdc6&oe=5EB8AC7A",
              "webview_height_ratio": "tall",
            },
            "buttons":[
              {
                "type":"postback",
                "title":"မှာမည်",
                "payload":"ol"
              }              
            ]      
          },
          {
            "title":"အလျား = 3'",
            "image_url":"https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/s960x960/85145127_128707675338477_5778662326769025024_o.jpg?_nc_cat=100&_nc_ohc=T2fDm1dMklMAX9zwjN5&_nc_ht=scontent.fnyt1-1.fna&oh=f46c2aec1ea73b75ae684736bb25a3d7&oe=5ECAA092",
            "subtitle":"အနံ = 4'",
            "default_action": {
              "type": "web_url",
              "url": "https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/s960x960/85145127_128707675338477_5778662326769025024_o.jpg?_nc_cat=100&_nc_ohc=T2fDm1dMklMAX9zwjN5&_nc_ht=scontent.fnyt1-1.fna&oh=f46c2aec1ea73b75ae684736bb25a3d7&oe=5ECAA092",
              "webview_height_ratio": "tall",
            },
            "buttons":[
              {
                "type":"postback",
                "title":"မှာမည်",
                "payload":"ol"
              }              
            ]      
          },
          {
            "title":"အလျား = 3'",
            "image_url":"https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/s960x960/85106340_128707742005137_7266967579728543744_o.jpg?_nc_cat=105&_nc_ohc=U-PKOqC73h0AX-0SIlS&_nc_ht=scontent.fnyt1-1.fna&oh=30e2deaf28b3f0533f5a81140ef8fcf7&oe=5EBC4CFA",
            "subtitle":"အနံ = 4'",
            "default_action": {
              "type": "web_url",
              "url": "https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/s960x960/85106340_128707742005137_7266967579728543744_o.jpg?_nc_cat=105&_nc_ohc=U-PKOqC73h0AX-0SIlS&_nc_ht=scontent.fnyt1-1.fna&oh=30e2deaf28b3f0533f5a81140ef8fcf7&oe=5EBC4CFA",
              "webview_height_ratio": "tall",
            },
            "buttons":[
              {
                "type":"postback",
                "title":"မှာမည်",
                "payload":"ol"
              }              
            ]      
          }
        ]
      }
    }
   }
  }else if (payload === 'dk') {
    response = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements":[
           {
            "title":"အလျား = ",
            "image_url":"https://scontent.fmdl2-2.fna.fbcdn.net/v/t1.0-9/p720x720/94175970_156934145849163_4235363062716039168_o.jpg?_nc_cat=108&_nc_sid=110474&_nc_eui2=AeGwZr1sxCssfFG142tSuaws-1dW0oNQHaj7V1bSg1AdqPF9cF1E6WAiBQ30Xg0pPYloMQmjuvBYbrGvgX5KJl20&_nc_ohc=sOzWS-JgkuYAX959Pla&_nc_ht=scontent.fmdl2-2.fna&_nc_tp=6&oh=5ead94ca219e641bb96fc89ca646f1df&oe=5EC69ACF",
            "subtitle":"အနံ = ",
            "default_action": {
              "type": "web_url",
              "url": "https://scontent.fmdl2-2.fna.fbcdn.net/v/t1.0-9/p720x720/94175970_156934145849163_4235363062716039168_o.jpg?_nc_cat=108&_nc_sid=110474&_nc_eui2=AeGwZr1sxCssfFG142tSuaws-1dW0oNQHaj7V1bSg1AdqPF9cF1E6WAiBQ30Xg0pPYloMQmjuvBYbrGvgX5KJl20&_nc_ohc=sOzWS-JgkuYAX959Pla&_nc_ht=scontent.fmdl2-2.fna&_nc_tp=6&oh=5ead94ca219e641bb96fc89ca646f1df&oe=5EC69ACF",
              "webview_height_ratio": "tall",
            },
            "buttons":[
              {
                "type":"postback",
                "title":"မှာမည်",
                "payload":"ol"
              }              
            ]      
          }
        ]
      }
    }
   }
  }else if (payload === 'd1') {
    response = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements":[
           {
            "title":"အလျား = 1.5'",
            "image_url":"https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/s960x960/84445199_128731638669414_8788996082672599040_o.jpg?_nc_cat=105&_nc_ohc=B_5XxoqU2V8AX8av3yE&_nc_ht=scontent.fnyt1-1.fna&oh=7c8e5a7d417f8c466f5361e55ef55a40&oe=5EC08340",
            "subtitle":"အနံ = 6.5'",
            "default_action": {
              "type": "web_url",
              "url": "https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/s960x960/84445199_128731638669414_8788996082672599040_o.jpg?_nc_cat=105&_nc_ohc=B_5XxoqU2V8AX8av3yE&_nc_ht=scontent.fnyt1-1.fna&oh=7c8e5a7d417f8c466f5361e55ef55a40&oe=5EC08340",
              "webview_height_ratio": "tall",
            },
            "buttons":[
              {
                "type":"postback",
                "title":"မှာမည်",
                "payload":"ol"
              }              
            ]      
          },
          {
            "title":"အလျား = 1.5'",
            "image_url":"https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/s960x960/85124252_128731588669419_8225910691752574976_o.jpg?_nc_cat=109&_nc_ohc=Z5dkuSQUQJwAX8kXFSa&_nc_ht=scontent.fnyt1-1.fna&oh=525217a6019e787cdb74108c40b0f42f&oe=5ED07986",
            "subtitle":"အနံ = 6.5'",
            "default_action": {
              "type": "web_url",
              "url": "https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/s960x960/85124252_128731588669419_8225910691752574976_o.jpg?_nc_cat=109&_nc_ohc=Z5dkuSQUQJwAX8kXFSa&_nc_ht=scontent.fnyt1-1.fna&oh=525217a6019e787cdb74108c40b0f42f&oe=5ED07986",
              "webview_height_ratio": "tall",
            },
            "buttons":[
              {
                "type":"postback",
                "title":"မှာမည်",
                "payload":"ol"
              }              
            ]      
          }
        ]
      }
    }
   }
  }else if (payload === 'd2') {
    response = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements":[
           {
            "title":"အလျား = 3'",
            "image_url":"https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/s960x960/84265124_128731702002741_8643057543540637696_o.jpg?_nc_cat=102&_nc_ohc=fR4ICBk7b60AX-e0uwj&_nc_ht=scontent.fnyt1-1.fna&oh=2c0e0ab8d9c29c2558b44835c2605ebf&oe=5F01FE75",
            "subtitle":"အနံ = 6.5'",
            "default_action": {
              "type": "web_url",
              "url": "https://scontent.fnyt1-1.fna.fbcdn.net/v/t1.0-9/s960x960/84265124_128731702002741_8643057543540637696_o.jpg?_nc_cat=102&_nc_ohc=fR4ICBk7b60AX-e0uwj&_nc_ht=scontent.fnyt1-1.fna&oh=2c0e0ab8d9c29c2558b44835c2605ebf&oe=5F01FE75",
              "webview_height_ratio": "tall",
            },
            "buttons":[
              {
                "type":"postback",
                "title":"မှာမည်",
                "payload":"ol"
              }              
            ]      
          }
        ]
      }
    }
   }
  } else if (payload === 'ol') {
    response = { "text": "ဘယ်နှစ်ခုမှာယူလိုပါသလဲ? မှာယူလိုသော Amount ကိုရိုက်ထည့်ပေးပါ" }
    botQuestions.quantity = true;
  }

  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

function greetUser(sender_psid){
  let response1 = {"text": "မင်္ဂလာပါ! NS Doors & Windows Shop မှကြိုဆိုပါတယ် ခင်ဗျာ"};
  let response2 = {"text": "တံခါးရွက်ဒီဇိုင်းများကြည့်လိုလျှင် (သို့) မှာယူလိုပါက "1"ကိုနှိပ်ပါ။ ဆိုင်လိပ်စာကိုသိလိုပါက "2" ကိုနှိပ်ပါ။ ဆိုင်ဖုန်းနံပါတ်ကိုသိလိုပါက "3" ကိုနှိပ်ပါ။"};
    callSend(sender_psid, response1).then(()=>{
      return callSend(sender_psid, response2);
  });  
}



function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}


function setupGetStartedButton(res){
        var messageData = {
                "get_started":{"payload":"getstarted"}                
        };
        // Start the request
        request({
            url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token='+ PAGE_ACCESS_TOKEN,
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            form: messageData
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // Print out the response body
                res.send(body);

            } else { 
                // TODO: Handle errors
                res.send(body);
            }
        });
    } 



function setupPersistentMenu(res){
        var messageData = { 
            "persistent_menu":[
                {
                  "locale":"default",
                  "composer_input_disabled":false,
                  "call_to_actions":[
                      {
                        "title":"Info",
                        "type":"nested",
                        "call_to_actions":[
                            {
                              "title":"Help",
                              "type":"postback",
                              "payload":"HELP_PAYLOAD"
                            },
                            {
                              "title":"Contact Me",
                              "type":"postback",
                              "payload":"CONTACT_INFO_PAYLOAD"
                            }
                        ]
                      },
                      {
                        "type":"web_url",
                        "title":"Visit website ",
                        "url":"http://www.google.com",
                        "webview_height_ratio":"full"
                    }
                ]
            },
            {
              "locale":"zh_CN",
              "composer_input_disabled":false
            }
          ]          
        };
        // Start the request
        request({
            url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token='+ PAGE_ACCESS_TOKEN,
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            form: messageData
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // Print out the response body
                res.send(body);

            } else { 
                // TODO: Handle errors
                res.send(body);
            }
        });
    } 



function removePersistentMenu(res){
        var messageData = {
                "fields": [
                   "persistent_menu" ,
                   "get_started"                 
                ]               
        };
        // Start the request
        request({
            url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token='+ PAGE_ACCESS_TOKEN,
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            form: messageData
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // Print out the response body
                res.send(body);

            } else { 
                // TODO: Handle errors
                res.send(body);
            }
        });
    } 
