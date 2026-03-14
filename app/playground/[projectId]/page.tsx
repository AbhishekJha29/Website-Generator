'use client'

import React, { useEffect, useState } from 'react'
import PlaygroundHeader from '../_components/PlaygroundHeader'
import WebsiteDesign from '../_components/WebsiteDesign'
import ElementSettingsSection from '../_components/ElementSettingsSection'
import { useParams, useSearchParams } from 'next/navigation'
import axios from 'axios'
import ChatSecion from '../_components/ChatSection'
import { toast } from 'sonner'

export type Frame = {
  projectId: string,
  frameId: string,
  designCode: string,
  chatMessages: Messages[]
}

export type Messages = {
  role: string,
  content: string
}

const Prompt = `userInput: {userInput}
Instructions:
1. If the user input is explicitly asking to generate
   code, design, or HTML/CSS/JS output (e.g., "Create a 
   landing page", "Build a dashboard", "Generate HTML 
   Tailwind CSS code"):
   
   - Generate a complete HTML Tailwind CSS code using 
     Flowbite UI components.
   - Use a modern design with #white as the primary 
     color theme.
   - Only include the <body> content (do not add 
     <head> or <title>).
   - Make it fully responsive for all screen sizes.
   - All primary components must match the theme color.
   - Do not add proper padding and margin for each element.
   - Components should be independent; do not connect them.

   - Use placeholders for all images:
     ![Light mode]: 
     https://community.softr.io/uploads/bb/013/original/27/
     774600e36bf7fac3f7e9b57c7a6dfb1b2630.jpg
     ![Dark mode]:
     https://community.softr.io/uploads/bb/013/original/27/
     774600e36bf7fac3f7e9b57c7a6dfb1b2630.jpg

   - Include / install libraries:
     - Add alt tag describing the image properly
     - Use the following libraries/components where 
       appropriate:
       - FontAwesome icons (fa fa-*)
       - Flowbite UI components: buttons, modals, 
         forms, tables, tabs, alerts, cards, dialogs, 
         dropdowns, accordions, etc.
       - Chart.js for charts & graphs
       - Swiper.js for sliders/carousels
       - Tippy.js for tooltips & popovers
     - Include interactive components like modals, 
       dropdowns, and accordions.
     - Ensure proper spacing, alignment, hierarchy, and 
       consistency.
     - Ensure charts are visually appealing and match 
       the theme color.
     - Header menu options should be spread out and not 
       connected.
     - Do not include broken links.
     - Do not add any extra text before or after the 
       HTML code.

2. If the user input is general text requesting
   (e.g., "Hi", "Hello", "How are you?") then does not 
   explicitly ask to generate code, then:
   
   - Respond with a single, friendly response instead 
     of generating any code.

Example:
User: "Hi" → Response: "Hello! How can I help you 
today?"
User: "Build a responsive landing page with Tailwind 
CSS" → Response: Generate full HTML code as per 
instructions above
`

function PlayGround() {
  const {projectId} = useParams();
  const params = useSearchParams();
  const frameId = params.get('frameId');
  const [frameDetails, setFrameDetails] = useState<Frame>();
  const[loading, setLoading] = useState(false);
  const[messages, setMessages] = useState<Messages[]>([]);
  const [generatedCode, setGeneratedCode] = useState<any>();

  useEffect(() => {
    frameId && GetFrameDetails();
  }, [frameId])
  
  const GetFrameDetails = async () => {
    const result = await axios.get('/api/frames?frameId='+frameId+"&projectId="+projectId);
    console.log(result.data);
    setFrameDetails(result.data);

    const designCode = result.data?.designCode;
    const index = designCode?.indexOf("```html") + 7;
    const formattedCode = designCode?.slice(index);
    setGeneratedCode(formattedCode);

    if(result.data?.chatMessages?.length == 1){
      const userMsg = result.data?.chatMessages[0].content;
      SendMessage(userMsg);
    }else{
      setMessages(result.data?.chatMessages)
    }
  }

  const SendMessage = async (userInput:string) => {
    setLoading(true);
    setMessages((prev: any) => [
      ...prev,
      {role:'user', content:userInput}
    ])
  
  const result = await fetch('/api/ai-model', {
    method:'POST',
    body: JSON.stringify({
      messages:[{role:"user", content: Prompt?.replace('{userInput}', userInput)}]
    })
  });

  const reader = result.body?.getReader();
  const decorder = new TextDecoder();

  let aiResponse = '';
  let isCode = false;

  while(true){
    // @ts-ignore
    const {done, value} = await reader?.read();
    if(done) break;

    const chunk = decorder.decode(value,{stream:true});
    aiResponse += chunk

    if(!isCode && aiResponse.includes('```html')){
      isCode=true;
      const index = aiResponse.indexOf("```html")+7;
      const initialCodeChunk = aiResponse.slice(index);
      setGeneratedCode((prev:any)=>prev+initialCodeChunk);
    }else if(isCode){
      setGeneratedCode((prev:any) => prev+chunk);
    }
  }
  await SaveGenratedCode(aiResponse);

  if(!isCode){
      setMessages((prev:any) =>[
        ...prev,
        {role: 'assistant', content: aiResponse}
      ])
    }else{
      setMessages((prev:any) =>[
        ...prev,
        {role: 'assistant', content: "Your code is Ready!"}
      ])
    }
  setLoading(false)
  }

  useEffect(() => {
    if(messages.length > 0){
      SaveMessages();
    }
  }, [messages])

  const SaveMessages = async () => {
    const result = await axios.put('/api/chats', {
      messages: messages,
      frameId: frameId
    });
    console.log(result)
  }

  const SaveGenratedCode = async (code: string) => {
    const result = await axios.put('/api/frames', {
      designCode: code,
      frameId: frameId,
      projectId: projectId
    });
    console.log(result.data)
    toast.success('Website is Ready!')
  }

  return (
    <div>
      <PlaygroundHeader/>

      <div className='flex'>
      {/* ChatSection */}
      <ChatSecion messages={messages ?? []}
      onSend={(input:string) => SendMessage(input)} loading = {loading}/>

      {/* WebsiteDesign */}
      <WebsiteDesign generatedCode={generatedCode?.replace('```', '')}/>

      {/* Setting Section */}
      {/* <ElementSettingsSection/> */}
      </div>
    </div>
  )
}

export default PlayGround
