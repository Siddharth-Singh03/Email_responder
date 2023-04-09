const {google} = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  'your_client_id',
  'your_client_secret',
  'your_redirect_url'
);

oauth2Client.setCredentials({
  access_token: 'YOUR_ACCESS_TOKEN',
  refresh_token: 'YOUR_REFRESH_TOKEN',
  scope: 'https://www.googleapis.com/auth/gmail.modify'
});

const gmail = google.gmail({
  version: 'v1',
  auth: oauth2Client
});

function getUnreadEmails(){
  gmail.users.messages.list({
    userID: 'me',
    q: 'is:unread'
  },(err,res)=>{
    if(err) return console.log("the api returned error: "+err);
    const messages = res.data.messages;
    if(messages.length){
      messages.foreach((message) => {
        gmail.users.messages.get({
          userId: 'me',
          id: message.id
        }, (err, res) => {
          if(err) return console.log("the api returned an error " + err);
          const subject = res.data.payload.headers.find(header => header.name === 'Subject').value;
          const body = res.data.snippet;
          console.log(`Subject: ${subject}`);
          console.log(`Body: ${body}`);

          sendResponseEmail(res.data);

          markAsRead(message.id);
        });
      });
    } else{
      console.log('no unread messages found.');
    }
  });
}

function sendResponseEmail(message){
  const headers = message.payload.headers;
  const to = headers.find(header => header.name === 'from').value;
  const subject = headers.find(header => header.name === 'Subject').value;
  const body = `thank you for your message. We have received it and will respond as soon as possible.`;
  const utf8Body = Buffer.from(body, 'utf-8').toString('base64');
  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: Re: ${subject}`,
    '',
    `${body}`
  ];
  const encodedMessage = messageParts.join('\n').trim();
  const request = gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage
    }
  }, (err,res) => {
    if(err) return console.log('the api returned an error: '+ err);
    console.log(`response email sent to ${to}.`);
  });
}

function markAsRead(id){
  gmail.users.messages.modify({
    userId: 'me',
    id: id,
    requestBody: {
      removeLabelIds: ['unread']
    }
  }, (err, res) => {
    if(err) return console.log("the api returned an error: " +err);
    console.log(`email marked as read: ${id}`);
  });
}

setInterval(getUnreadEmails, 60000);