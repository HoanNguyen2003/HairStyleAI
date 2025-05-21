import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import '../styles/Chatbot.scss';

const Chatbox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Xin chào! Tôi có thể giúp bạn tư vấn kiểu tóc phù hợp không?", sender: "bot" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  const handleSendMessage = async () => {
    if (inputValue.trim() === "") return;

    // Thêm tin nhắn của người dùng vào state
    const newMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: "user"
    };
    
    setMessages([...messages, newMessage]);
    setInputValue("");

    try {
      // Gửi yêu cầu đến backend
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: inputValue }),
      });

      console.log("Request body:", JSON.stringify({ prompt: inputValue }));
      console.log("Response:", response);

      if (!response.ok) {
        throw new Error("Lỗi khi gọi API");
      }

      const data = await response.json();


      // Thêm phản hồi từ bot vào state
      const botResponse = {
        id: messages.length + 2,
        text: data.response || "Xin lỗi, tôi không thể trả lời câu hỏi của bạn.",
        sender: "bot"
      };
      setMessages((prevMessages) => [...prevMessages, botResponse]);
    } catch (error) {
      console.error("Lỗi:", error);
      const errorMessage = {
        id: messages.length + 2,
        text: "Đã xảy ra lỗi khi kết nối với server. Vui lòng thử lại sau.",
        sender: "bot"
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  useEffect(() => {
    // Cuộn xuống tin nhắn mới nhất
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  return (
    <div className="chatbox-container">
      {/* Nút hiển thị chatbot khi đóng */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="chatbox-toggle-btn"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chatbot container */}
      {isOpen && (
        <div className={`chatbox-widget ${isMinimized ? 'minimized' : ''}`}>
          {/* Header */}
          <div className="chatbox-header">
            <div className="chatbox-title">
              <MessageCircle size={20} />
              <span>Tư vấn kiểu tóc</span>
            </div>
            <div className="chatbox-controls">
              <button onClick={() => setIsMinimized(!isMinimized)}>
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button onClick={() => setIsOpen(false)}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages container */}
          {!isMinimized && (
            <div className="chatbox-messages">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`message ${msg.sender === "user" ? "user-message" : "bot-message"}`}
                >
                  <div
                  className="message-bubble"
                  dangerouslySetInnerHTML={{ __html: msg.text }}
                />
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input container */}
          {!isMinimized && (
            <div className="chatbox-input">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
              />
              <button onClick={handleSendMessage}>
                <Send size={18} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Chatbox;