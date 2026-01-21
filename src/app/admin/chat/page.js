"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Send, Search, Phone, Video, MoreVertical, Paperclip, Smile, Circle, Menu, X } from "lucide-react";
import { getUsers } from "@/lib/api/user";

export default function ChatPage() {
  const { user } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchStaffList();
  }, []);

  const fetchStaffList = async () => {
    try {
      setIsLoading(true);
      const response = await getUsers();
      
      if (response?.data?.data) {
        // Filter out current user and sort by online status
        const staff = response.data.data
          .filter(staff => staff._id !== user?._id)
          .map(staff => ({
            ...staff,
            isOnline: Math.random() > 0.5, // Simulated online status
            lastSeen: new Date(Date.now() - Math.random() * 86400000).toISOString(),
            unreadCount: Math.floor(Math.random() * 5)
          }))
          .sort((a, b) => b.isOnline - a.isOnline);
        
        setStaffList(staff);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !selectedStaff) return;

    const newMessage = {
      id: Date.now(),
      text: messageInput,
      sender: "me",
      timestamp: new Date().toISOString(),
      status: "sent"
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageInput("");

    // Simulate response after 2 seconds
    setTimeout(() => {
      const responseMessage = {
        id: Date.now() + 1,
        text: "Thank you for your message. I'll get back to you shortly.",
        sender: "them",
        timestamp: new Date().toISOString(),
        status: "delivered"
      };
      setMessages(prev => [...prev, responseMessage]);
    }, 2000);
  };

  const handleStaffSelect = (staff) => {
    setSelectedStaff(staff);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
    
    // Load chat history for this staff (simulated)
    const mockMessages = [
      {
        id: 1,
        text: "Hello! How can I help you today?",
        sender: "them",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: "read"
      },
      {
        id: 2,
        text: "Hi! I need some assistance with the farmers module.",
        sender: "me",
        timestamp: new Date(Date.now() - 3500000).toISOString(),
        status: "read"
      }
    ];
    setMessages(mockMessages);
    
    // Clear unread count
    setStaffList(prev => 
      prev.map(s => s._id === staff._id ? { ...s, unreadCount: 0 } : s)
    );
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 86400000) { // Less than 24 hours
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 604800000) { // Less than 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (email) => {
    return email?.slice(0, 2).toUpperCase() || "??";
  };

  const filteredStaff = staffList.filter(staff =>
    staff.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.state?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex bg-gray-50 relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Staff List Sidebar */}
      <div className={`w-80 bg-white border-r border-gray-200 flex flex-col fixed md:relative inset-y-0 left-0 z-50 transform transition-transform duration-300 md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Search Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3 md:hidden">
            <h2 className="text-lg font-semibold text-gray-900">Staff Members</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
            />
          </div>
        </div>

        {/* Staff List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No staff members found
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredStaff.map((staff) => (
                <button
                  key={staff._id}
                  onClick={() => handleStaffSelect(staff)}
                  className={`w-full p-4 hover:bg-gray-50 transition-colors text-left ${
                    selectedStaff?._id === staff._id ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
                        {getInitials(staff.email)}
                      </div>
                      {staff.isOnline && (
                        <Circle className="absolute bottom-0 right-0 w-3 h-3 text-green-500 fill-green-500 bg-white rounded-full" />
                      )}
                    </div>

                    {/* Staff Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {staff.email?.split('@')[0] || 'Unknown'}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatTime(staff.lastSeen)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {staff.state || staff.country || 'No location'}
                        </p>
                        {staff.unreadCount > 0 && (
                          <span className="flex-shrink-0 ml-2 px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded-full">
                            {staff.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {staff.isOnline ? 'Online' : `Last seen ${formatTime(staff.lastSeen)}`}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedStaff ? (
          <>
            {/* Chat Header */}
            <div className="h-16 bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
                >
                  <Menu className="h-6 w-6 text-gray-600" />
                </button>
                
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
                    {getInitials(selectedStaff.email)}
                  </div>
                  {selectedStaff.isOnline && (
                    <Circle className="absolute bottom-0 right-0 w-2.5 h-2.5 text-green-500 fill-green-500 bg-white rounded-full" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {selectedStaff.email?.split('@')[0] || 'Unknown'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {selectedStaff.isOnline ? 'Online' : `Last seen ${formatTime(selectedStaff.lastSeen)}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Phone className="h-5 w-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Video className="h-5 w-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md px-4 py-2 rounded-2xl ${
                      message.sender === 'me'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === 'me' ? 'text-green-100' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Paperclip className="h-5 w-5 text-gray-600" />
                </button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 pr-12"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Smile className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col bg-gray-50">
            {/* Mobile Header with Menu Button */}
            <div className="h-16 bg-white border-b border-gray-200 px-4 flex items-center md:hidden">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="h-6 w-6 text-gray-600" />
              </button>
              <h2 className="ml-3 text-lg font-semibold text-gray-900">Chat</h2>
            </div>
            
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-600">
                Choose a staff member from the list to start chatting
              </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
