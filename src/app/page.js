import dotenv from 'dotenv';
dotenv.config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
export default function Home() {
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());

// Verify webhook
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Handle incoming messages
app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(async (entry) => {
      const webhook_event = entry.messaging[0];
      const sender_psid = webhook_event.sender.id;

      if (webhook_event.message) {
        const userMessage = webhook_event.message.text;
        
        // Call OpenAI API here to get the response
        const response = await getOpenAIResponse(userMessage);

        // Send response back to user
        await sendMessage(sender_psid, response);
      }
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Function to send message back to user
async function sendMessage(sender_psid, response) {
  const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
  const url = `https://graph.facebook.com/v12.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;

  const message = {
    recipient: { id: sender_psid },
    message: { text: response },
  };

  await axios.post(url, message);
}

// Function to call OpenAI API
async function getOpenAIResponse(message) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const openAIUrl = 'https://api.openai.com/v1/chat/completions';

  const response = await axios.post(
    openAIUrl,
    {
      model: 'gpt-4',
      messages: [{ role: 'user', content: message }],
    },
    { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` } }
  );

  return response.data.choices[0].message.content;
}

// Start server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  // const [inputValue, setInputValue] = useState('');
  // const [chatLog, setChatLog] = useState([]);
  // const [isLoading, setIsLoading] = useState(false);

  // const handleSubmit = (event) => {
  //   event.preventDefault();

  //   setChatLog((prevChatLog) => [...prevChatLog, { type: 'user', message: inputValue }])

  //   sendMessage(inputValue);
    
  //   setInputValue('');
  // }

  // const sendMessage = (message) => {
  //   const url = '/api/chat';

  //   const data = {
  //     model: "gpt-3.5-turbo-0301",
  //     messages: [{ "role": "user", "content": message }]
  //   };

  //   setIsLoading(true);

  //   axios.post(url, data).then((response) => {
  //     console.log(response);
  //     setChatLog((prevChatLog) => [...prevChatLog, { type: 'bot', message: response.data.choices[0].message.content }])
  //     setIsLoading(false);
  //   }).catch((error) => {
  //     setIsLoading(false);
  //     console.log(error);
  //   })
  // }

  // return (
  //   <div className="container mx-auto max-w-[700px]">
  //     <div className="flex flex-col h-screen bg-gray-900">
  //       <h1 className="bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text text-center py-3 font-bold text-6xl">ChatGPT</h1>
  //       <div className="flex-grow p-6">
  //         <div className="flex flex-col space-y-4">
  //         {
  //       chatLog.map((message, index) => (
  //         <div key={index} className={`flex ${
  //           message.type === 'user' ? 'justify-end' : 'justify-start'
  //           }`}>
  //           <div className={`${
  //             message.type === 'user' ? 'bg-purple-500' : 'bg-gray-800'
  //           } rounded-lg p-4 text-white max-w-sm`}>
  //           {message.message}
  //           </div>
  //           </div>
  //       ))
  //           }
  //           {
  //             isLoading &&
  //             <div key={chatLog.length} className="flex justify-start">
  //                 <div className="bg-gray-800 rounded-lg p-4 text-white max-w-sm">
  //                   <TypingAnimation />
  //                 </div>
  //             </div>
  //           }
  //     </div>
  //       </div>
  //       <form onSubmit={handleSubmit} className="flex-none p-6">
  //         <div className="flex rounded-lg border border-gray-700 bg-gray-800">  
  //       <input type="text" className="flex-grow px-4 py-2 bg-transparent text-white focus:outline-none" placeholder="Type your message..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
  //           <button type="submit" className="bg-purple-500 rounded-lg px-4 py-2 text-white font-semibold focus:outline-none hover:bg-purple-600 transition-colors duration-300">Send</button>
  //           </div>
  //       </form>
  //       </div>
  //   </div>
  // );
}
