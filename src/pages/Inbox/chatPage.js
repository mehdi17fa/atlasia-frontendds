// ChatPage.jsx
import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../../api";
import { io } from "socket.io-client";
import { AuthContext } from "../../context/AuthContext";

// Use relative API and socket URL; socket server should proxy in dev
const API_BASE_URL = "";

let socket;

export default function ChatPage() {
  const { sender: ownerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { chatData, conversationId: initialConversationId, bookingId, propertyId, guestMessage, message: successMessage } = location.state || {};
  const { user, token } = useContext(AuthContext);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(guestMessage ? [{ _id: "temp", sender: user?._id, text: `Booking request for property ${propertyId || 'unknown'}: ${guestMessage}`, createdAt: new Date() }] : []);
  const [conversationId, setConversationId] = useState(initialConversationId || null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(successMessage || "");

  const messagesEndRef = useRef(null);
  const recipientId = chatData?.recipientId || ownerId;

  // Log navigation state for debugging
  useEffect(() => {
    console.log("Navigation state:", location.state);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize Socket.IO
  useEffect(() => {
    if (!user || !token) {
      setError("Please log in to access the chat.");
      navigate("/login");
      return;
    }

    socket = io(API_BASE_URL, {
      auth: { token: `Bearer ${token}` },
    });

    const handleIncomingMessage = (msg) => {
      console.log("Received new message via Socket.IO:", msg);
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        // Replace temp guestMessage if it matches
        if (guestMessage && msg.text.includes(guestMessage) && prev.some((m) => m._id === "temp")) {
          return [...prev.filter((m) => m._id !== "temp"), msg];
        }
        return [...prev, msg];
      });

      if (!conversationId && msg.conversationId) {
        console.log("Setting conversationId from Socket.IO message:", msg.conversationId);
        setConversationId(msg.conversationId);
      }
    };

    socket.on("newMessage", handleIncomingMessage);

    socket.on("error", (err) => console.error("Socket error:", err));

    return () => {
      socket.off("newMessage", handleIncomingMessage);
      socket.disconnect();
    };
  }, [user, token, conversationId, navigate, guestMessage]);

  // Initialize conversation & fetch messages
  useEffect(() => {
    if (!user || !recipientId || !token) {
      setError("Missing user or recipient information.");
      return;
    }

    const initChat = async () => {
      try {
        let convoId = conversationId;

        // Use existing conversationId if provided
        if (!convoId) {
          console.log("Creating new conversation with payload:", { senderId: user._id, receiverId: recipientId });
          try {
            const convoRes = await api.post(
              `/api/chat/conversation`,
              { senderId: user._id, receiverId: recipientId },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Conversation response:", convoRes.data);
            convoId = convoRes.data._id;
            setConversationId(convoId);
          } catch (err) {
            console.error("Failed to create conversation:", err);
            setError("Unable to create conversation, but you can still send messages.");
          }
        }

        if (convoId) {
          console.log("Fetching messages for conversation:", convoId);
          try {
            const msgsRes = await api.get(
              `/api/chat/messages/${convoId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Messages response:", msgsRes.data);
            // Ensure guestMessage is included if provided and not in response
            if (guestMessage && !msgsRes.data.some((msg) => msg.text.includes(guestMessage))) {
              setMessages([...msgsRes.data, { _id: "temp", sender: user?._id, text: `Booking request for property ${propertyId || 'unknown'}: ${guestMessage}`, createdAt: new Date() }]);
            } else {
              setMessages(msgsRes.data);
            }
          } catch (err) {
            console.error("Failed to fetch messages:", err);
            setError("Unable to load messages, but you can still send new messages.");
            // Keep guestMessage if fetch fails
            if (guestMessage) {
              setMessages([{ _id: "temp", sender: user?._id, text: `Booking request for property ${propertyId || 'unknown'}: ${guestMessage}`, createdAt: new Date() }]);
            } else {
              setMessages([]);
            }
          }
        }
      } catch (err) {
        console.error("Error initializing chat:", err);
        setError(err?.response?.data?.message || "Failed to initialize chat. You can still send messages.");
      }
    };

    initChat();

    // Retry fetching messages after a delay to account for backend sync
    if (guestMessage && conversationId) {
      const retryFetch = setTimeout(async () => {
        try {
          console.log("Retrying fetch for messages with conversationId:", conversationId);
          const msgsRes = await api.get(
            `/api/chat/messages/${conversationId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log("Retry messages response:", msgsRes.data);
          if (msgsRes.data.some((msg) => msg.text.includes(guestMessage))) {
            setMessages(msgsRes.data);
          }
        } catch (err) {
          console.error("Retry fetch failed:", err);
        }
      }, 2000);
      return () => clearTimeout(retryFetch);
    }
  }, [recipientId, user, token, conversationId, guestMessage, propertyId]);

  // Send message
  const handleSendMessage = async () => {
    if (!message.trim() || !recipientId) {
      setError("Message or recipient is missing.");
      return;
    }

    try {
      let convoId = conversationId;

      // Create conversation if none exists
      if (!convoId) {
        const convoRes = await api.post(
          `/api/chat/conversation`,
          { senderId: user._id, receiverId: recipientId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        convoId = convoRes.data._id;
        setConversationId(convoId);
      }

      const payload = {
        conversationId: convoId,
        senderId: user._id,
        text: message,
      };

      console.log("Sending message with payload:", payload);

      const response = await api.post(
        `/api/chat/message`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Message response:", response.data);

      socket.emit("newMessage", response.data);
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg._id !== "temp");
        return [...filtered, response.data];
      });
      setMessage("");
      setError(null);
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err?.response?.data?.message || "Failed to send message.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBack = () => navigate("/inbox");

  // Helper function to check if message is from current user
  const isCurrentUserMessage = (msg) => {
    const currentUserId = user?._id?.toString();
    const msgSenderId = msg.sender?._id?.toString() || msg.sender?.toString();
    return currentUserId === msgSenderId;
  };

  return (
    <div className="w-full max-w-full bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center px-4 py-3 border-b border-gray-200 bg-white shadow-sm">
        <button onClick={handleBack} className="mr-3 p-2 hover:bg-gray-100 rounded-full">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-gray-500 text-white flex items-center justify-center font-semibold text-lg">
            {chatData?.avatar || "A"}
          </div>
          <div>
            <h2 className="font-semibold text-black text-lg">{chatData?.sender || "Hôte"}</h2>
            <p className="text-sm text-green-600">Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 px-4 py-4 overflow-y-auto bg-gray-50" style={{ paddingBottom: "80px" }}>
        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>
        )}
        {success && (
          <div className="bg-green-100 text-green-700 p-2 rounded mb-4">{success}</div>
        )}
        {messages.map((msg) => (
          <div key={msg._id} className={`flex mb-2 ${isCurrentUserMessage(msg) ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-xs px-4 py-2 rounded-2xl ${isCurrentUserMessage(msg) ? "bg-green-600 text-white" : "bg-white text-black border"}`}>
              <p className="text-sm">{msg.text}</p>
              <p className="text-xs mt-1 text-gray-400">
                {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center space-x-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 border rounded-2xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={1}
            style={{ maxHeight: 120 }}
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-green-600 text-white rounded-2xl hover:bg-green-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}