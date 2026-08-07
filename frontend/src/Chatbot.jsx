import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Send, X, Sparkles, HelpCircle, FileText, Lightbulb, Smile, Plus, ArrowUpRight, ChevronsLeftRight } from "lucide-react"

const getApiUrl = (path) => {
  if (window.location.port === "5173") {
    return `http://localhost:8000${path}`
  }
  return path
}

export default function Chatbot({ file, isInline = false, chatWidth = 360, setChatWidth }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I'm your StudyGen AI Tutor. Ask me anything about your notes or get help with concepts, summaries, or practice questions!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isOpen])

  // Update initial message when file is uploaded/changed
  useEffect(() => {
    if (file) {
      setMessages([
        {
          sender: "bot",
          text: `I've successfully loaded "${file.name}"! Ask me anything about it.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } else {
      setMessages([
        {
          sender: "bot",
          text: "Hello! I'm your StudyGen AI Tutor. Please upload a study document (PDF) first, and I'll help you summarize it, answer questions, or generate practice quizzes!",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    }
  }, [file])

  async function sendQuery(text) {
    if (!text.trim() || isLoading) return

    const userText = text.trim()
    
    // Add user message
    const userMsg = {
      sender: "user",
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages(prev => [...prev, userMsg])

    if (!file) {
      // Prompt user to upload a PDF first
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            sender: "bot",
            text: "⚠️ Please upload or select a study document (PDF) first so I can analyze it and answer your questions!",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ])
      }, 600)
      return
    }

    setIsLoading(true)

    // Call backend API
    const formData = new FormData()
    
    // Resolve mock file or uploaded file
    if (file) {
      if (file.isMock) {
        try {
          const res = await fetch("/dummy.pdf")
          const blob = await res.blob()
          formData.append("file", new File([blob], file.name, { type: "application/pdf" }))
        } catch (e) {
          console.error("Error reading mockup PDF", e)
        }
      } else if (file.fileObject) {
        formData.append("file", file.fileObject)
      } else {
        formData.append("file", file)
      }
    }

    const escText = encodeURIComponent(userText)
    let response;
    
    try {
      response = await fetch(getApiUrl(`/chat?question=${escText}`), {
        method: "POST",
        body: formData,
      })
    } catch (err) {
      console.error("Chat API error:", err)
      const errorMsg = {
        sender: "bot",
        text: "Could not connect to the backend server. Please verify the backend is running.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, errorMsg])
      setIsLoading(false)
      return
    }

    if (response && response.ok) {
      const data = await response.json()
      const botMsg = {
        sender: "bot",
        text: data.answer || "Sorry, I couldn't generate a response.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, botMsg])
    } else {
      const errorMsg = {
        sender: "bot",
        text: `Server returned error status: ${response ? response.status : 'Unknown'}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, errorMsg])
    }
    setIsLoading(false)
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return
    const text = inputValue
    setInputValue("")
    await sendQuery(text)
  }

  const suggestions = [
    { text: "Summarize the active document", icon: <FileText size={14} style={{ color: "#a855f7" }} />, bg: "rgba(168, 85, 247, 0.12)" },
    { text: "Explain the main concepts of this file", icon: <Sparkles size={14} style={{ color: "#3b82f6" }} />, bg: "rgba(59, 130, 246, 0.12)" },
    { text: "What are the key takeaways from these notes?", icon: <Lightbulb size={14} style={{ color: "#f59e0b" }} />, bg: "rgba(245, 158, 11, 0.12)" },
    { text: "Generate a practice quiz for me", icon: <HelpCircle size={14} style={{ color: "#10b981" }} />, bg: "rgba(16, 185, 129, 0.12)" },
    { text: "Explain the most complex part of this document", icon: <Smile size={14} style={{ color: "#ec4899" }} />, bg: "rgba(236, 72, 153, 0.12)" }
  ]

  // Persistent inline dashboard widget view
  if (isInline) {
    return (
      <div style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: "20px",
        boxShadow: "0 8px 32px var(--shadow-color)",
        overflow: "hidden",
        transition: "all var(--transition-speed)"
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          background: "rgba(255,255,255,0.02)",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              background: "var(--primary)",
              border: "1.5px solid var(--border-color)",
              padding: "6px 14px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 800,
              color: "#ffffff",
              fontSize: "13px",
              boxShadow: "0 0 12px var(--primary-glow)"
            }}>
              <MessageSquare size={14} />
              <span style={{ fontWeight: 800 }}>AI Study Chat</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={15} style={{ color: "var(--primary)" }} />
          </div>
        </div>

        {/* Chat Messages */}
        <div style={{
          flexGrow: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}>
          {messages.map((msg, index) => {
            const isBot = msg.sender === "bot"
            return (
              <div
                key={index}
                style={{
                  alignSelf: isBot ? "flex-start" : "flex-end",
                  maxWidth: "85%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isBot ? "flex-start" : "flex-end",
                }}
              >
                <div style={{
                  padding: "10px 14px",
                  borderRadius: isBot ? "16px 16px 16px 4px" : "16px 16px 4px 16px",
                  background: isBot ? "var(--bg-input)" : "var(--primary)",
                  color: isBot ? "var(--text-color)" : "#ffffff",
                  border: isBot ? "1px solid var(--border-color)" : "none",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  wordBreak: "break-word",
                  boxShadow: isBot ? "0 2px 8px var(--shadow-color)" : "0 2px 8px var(--primary-glow)",
                }}>
                  {msg.text}
                </div>
                <span style={{ fontSize: "9px", opacity: 0.4, marginTop: "4px" }}>
                  {msg.time}
                </span>
              </div>
            )
          })}
          {isLoading && (
            <div style={{ alignSelf: "flex-start", display: "flex", gap: "5px", padding: "10px" }}>
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--text-muted)" }} />
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--text-muted)" }} />
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--text-muted)" }} />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions Section */}
        <div style={{ padding: "0 16px 16px 16px" }}>
          <h5 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: "8px" }}>
            Suggested Questions
          </h5>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendQuery(s.text)}
                disabled={!file || isLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-input)",
                  color: "var(--text-color)",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  cursor: (!file || isLoading) ? "not-allowed" : "pointer",
                  textAlign: "left",
                  justifyContent: "space-between",
                  transition: "all 0.2s",
                  opacity: (!file || isLoading) ? 0.6 : 1
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ 
                    width: "22px", 
                    height: "22px", 
                    borderRadius: "6px", 
                    background: s.bg, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center" 
                  }}>
                    {s.icon}
                  </div>
                  <span>{s.text}</span>
                </div>
                <ArrowUpRight size={13} style={{ opacity: 0.6 }} />
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSend}
          style={{
            padding: "14px 18px",
            borderTop: "1px solid var(--border-color)",
            background: "rgba(0,0,0,0.02)",
            display: "flex",
            gap: "10px",
            alignItems: "center"
          }}
        >

          <input
            type="text"
            disabled={!file || isLoading}
            placeholder={file ? "Ask anything..." : "Upload a PDF first!"}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            style={{
              flexGrow: 1,
              padding: "10px 14px",
              borderRadius: "24px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-input)",
              color: "var(--text-color)",
              outline: "none",
              fontSize: "13px",
              transition: "border-color 0.2s",
            }}
          />
          <button
            type="submit"
            disabled={!file || !inputValue.trim() || isLoading}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "var(--primary)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              cursor: "pointer",
              opacity: (!file || !inputValue.trim() || isLoading) ? 0.5 : 1,
              transition: "opacity 0.2s",
            }}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    )
  }

  // Floating Chat bubble view (for fallback/small screens if required)
  return (
    <div style={{ position: "fixed", bottom: "30px", right: "30px", zIndex: 999 }}>
      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
          border: "none",
          boxShadow: "0 8px 24px var(--primary-glow)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
        }}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </motion.button>

      {/* Expanded Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{
              position: "absolute",
              bottom: "75px",
              right: "0",
              width: "360px",
              height: "500px",
              borderRadius: "20px",
              background: "var(--panel-bg)",
              border: "1px solid var(--glass-border)",
              boxShadow: "0 12px 40px var(--glass-shadow)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "16px 20px",
              background: "rgba(255,255,255,0.03)",
              borderBottom: "1px solid var(--glass-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: file ? "#10b981" : "#ef4444",
                  boxShadow: file ? "0 0 10px #10b981" : "0 0 10px #ef4444"
                }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>Study Assistant</h4>
                  <span style={{ fontSize: "10px", opacity: 0.6, display: "block", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {file ? `Active: ${file.name}` : 'Upload a PDF to chat'}
                  </span>
                </div>
              </div>
              <Sparkles size={16} style={{ color: "var(--accent)" }} />
            </div>

            {/* Chat Messages */}
            <div style={{
              flexGrow: 1,
              overflowY: "auto",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}>
              {messages.map((msg, index) => {
                const isBot = msg.sender === "bot"
                return (
                  <div
                    key={index}
                    style={{
                      alignSelf: isBot ? "flex-start" : "flex-end",
                      maxWidth: "85%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isBot ? "flex-start" : "flex-end",
                    }}
                  >
                    <div style={{
                      padding: "10px 14px",
                      borderRadius: isBot ? "16px 16px 16px 4px" : "16px 16px 4px 16px",
                      background: isBot ? "var(--glass-bg)" : "var(--primary)",
                      color: isBot ? "var(--text-color)" : "#ffffff",
                      border: isBot ? "1px solid var(--glass-border)" : "none",
                      fontSize: "13.5px",
                      lineHeight: "1.5",
                      wordBreak: "break-word",
                      boxShadow: isBot ? "0 2px 8px var(--glass-shadow)" : "0 2px 8px var(--primary-glow)",
                    }}>
                      {msg.text}
                    </div>
                    <span style={{ fontSize: "9px", opacity: 0.4, marginTop: "4px" }}>
                      {msg.time}
                    </span>
                  </div>
                )
              })}
              {isLoading && (
                <div style={{ alignSelf: "flex-start", display: "flex", gap: "5px", padding: "10px" }}>
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--text-muted)" }} />
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--text-muted)" }} />
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--text-muted)" }} />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSend}
              style={{
                padding: "14px 18px",
                borderTop: "1px solid var(--glass-border)",
                background: "rgba(0,0,0,0.02)",
                display: "flex",
                gap: "10px",
                alignItems: "center"
              }}
            >
              <input
                type="text"
                disabled={!file || isLoading}
                placeholder={file ? "Ask about the document..." : "Upload a PDF first!"}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                style={{
                  flexGrow: 1,
                  padding: "10px 14px",
                  borderRadius: "24px",
                  border: "1px solid var(--glass-border)",
                  background: "var(--input-bg)",
                  color: "var(--text-color)",
                  outline: "none",
                  fontSize: "13px",
                  transition: "border-color 0.2s",
                }}
              />
              <button
                type="submit"
                disabled={!file || !inputValue.trim() || isLoading}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "var(--primary)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  cursor: "pointer",
                  opacity: (!file || !inputValue.trim() || isLoading) ? 0.5 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
