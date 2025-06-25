// import React, { useState, useRef, useEffect } from 'react';
// import { Box, TextField, IconButton, Paper, Typography, CircularProgress } from '@mui/material';
// import SendIcon from '@mui/icons-material/Send';
// import { useAuth } from '../contexts/AuthContext';
// import axios from 'axios';

// const AIAssistant = () => {
//   const [message, setMessage] = useState('');
//   const [chatHistory, setChatHistory] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const chatEndRef = useRef(null);
//   const { token } = useAuth();

//   const scrollToBottom = () => {
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [chatHistory]);

//   const handleSend = async () => {
//     if (!message.trim()) return;

//     const userMessage = {
//       role: 'user',
//       content: message,
//       timestamp: new Date().toISOString()
//     };

//     setChatHistory(prev => [...prev, userMessage]);
//     setMessage('');
//     setIsLoading(true);

//     try {
//       const response = await axios.post(
//         `${process.env.REACT_APP_API_URL}/api/ai/chat`,
//         {
//           message: userMessage.content,
//           context: chatHistory.map(msg => ({
//             role: msg.role,
//             content: msg.content
//           }))
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`
//           }
//         }
//       );

//       const assistantMessage = {
//         role: 'assistant',
//         content: response.data.message,
//         timestamp: new Date().toISOString()
//       };

//       setChatHistory(prev => [...prev, assistantMessage]);
//     } catch (error) {
//       console.error('Error sending message:', error);
//       const errorMessage = {
//         role: 'assistant',
//         content: 'Sorry, I encountered an error. Please try again.',
//         timestamp: new Date().toISOString()
//       };
//       setChatHistory(prev => [...prev, errorMessage]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSend();
//     }
//   };

//   return (
//     <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
//       <Paper 
//         elevation={3} 
//         sx={{ 
//           flex: 1, 
//           mb: 2, 
//           p: 2, 
//           overflow: 'auto',
//           backgroundColor: '#f5f5f5'
//         }}
//       >
//         {chatHistory.map((msg, index) => (
//           <Box
//             key={index}
//             sx={{
//               display: 'flex',
//               justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
//               mb: 2
//             }}
//           >
//             <Paper
//               elevation={1}
//               sx={{
//                 p: 2,
//                 maxWidth: '70%',
//                 backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#ffffff',
//                 borderRadius: 2
//               }}
//             >
//               <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
//                 {msg.content}
//               </Typography>
//               <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
//                 {new Date(msg.timestamp).toLocaleTimeString()}
//               </Typography>
//             </Paper>
//           </Box>
//         ))}
//         {isLoading && (
//           <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
//             <CircularProgress size={24} />
//           </Box>
//         )}
//         <div ref={chatEndRef} />
//       </Paper>

//       <Box sx={{ display: 'flex', gap: 1 }}>
//         <TextField
//           fullWidth
//           multiline
//           maxRows={4}
//           value={message}
//           onChange={(e) => setMessage(e.target.value)}
//           onKeyPress={handleKeyPress}
//           placeholder="Type your message..."
//           variant="outlined"
//           disabled={isLoading}
//         />
//         <IconButton 
//           color="primary" 
//           onClick={handleSend}
//           disabled={isLoading || !message.trim()}
//           sx={{ alignSelf: 'flex-end' }}
//         >
//           <SendIcon />
//         </IconButton>
//       </Box>
//     </Box>
//   );
// };

// export default AIAssistant; 