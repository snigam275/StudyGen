import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Sun, Moon, Upload, BrainCircuit, FileCheck, FileText, Layers, CheckSquare, Sparkles, 
  LayoutDashboard, Clock, Bookmark, Trash2, GitFork, MessageSquare, Settings, 
  Search, ChevronDown, MoreHorizontal, ArrowRight, HelpCircle,
  Star, Trash, RotateCcw, User, Check, X, ChevronsLeftRight
} from "lucide-react"
import Orb from "./Orb"
import SummaryView from "./SummaryView"
import FlashcardsView from "./FlashcardsView"
import QuizView from "./QuizView"
import Chatbot from "./Chatbot"

function App() {
  // Navigation active tab: "dashboard", "summary", "flashcards", "quiz", "recent-files", "bookmarks", "trash", "study-preferences"
  const [activeTab, setActiveTab] = useState("dashboard")

  // Search query state for filtering file hub items dynamically
  const [searchQuery, setSearchQuery] = useState("")

  // State Management for Multi-result storage
  const [summaryResult, setSummaryResult] = useState(null)
  const [flashcardResult, setFlashcardResult] = useState(null)
  const [quizResult, setQuizResult] = useState(null)

  const [loading, setLoading] = useState(false)
  const [loadingMode, setLoadingMode] = useState(null) // "summary", "flashcards", "quiz"

  // Parameter Settings States
  const [numQuestions, setNumQuestions] = useState(5)
  const [numCards, setNumCards] = useState(10)
  const [difficulty, setDifficulty] = useState("medium")

  // Toast state
  const [toast, setToast] = useState(null)

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Resizable chatbot panel width state
  const [chatWidth, setChatWidth] = useState(360)

  // Drag resizing handler for right chatbot panel
  const startResizeChat = (mouseDownEvent) => {
    mouseDownEvent.preventDefault()
    const startX = mouseDownEvent.clientX
    const startWidth = chatWidth

    const doResize = (mouseMoveEvent) => {
      // Dragging left (negative deltaX) increases right panel's width
      const deltaX = startX - mouseMoveEvent.clientX
      const newWidth = Math.max(280, Math.min(600, startWidth + deltaX))
      setChatWidth(newWidth)
    }

    const stopResize = () => {
      document.removeEventListener("mousemove", doResize)
      document.removeEventListener("mouseup", stopResize)
    }

    document.addEventListener("mousemove", doResize)
    document.addEventListener("mouseup", stopResize)
  }

  // --- LOCAL PERSISTENT DATABASE SYNC (using localStorage) ---
  const [uploadedFiles, setUploadedFiles] = useState(() => {
    const saved = localStorage.getItem("studygen-files")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Clean out leftover mock files from previous session history
        return parsed.filter(f => !f.isMock)
      } catch (e) {
        console.error("Failed to parse saved files", e)
      }
    }
    return []
  })



  const [quizScores, setQuizScores] = useState(() => {
    const saved = localStorage.getItem("studygen-quiz-scores")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return {}
        return parsed
      } catch (e) {
        console.error(e)
      }
    }
    return {}
  })

  // Caches for per-file results
  const [summaryCache, setSummaryCache] = useState(() => {
    const saved = localStorage.getItem("studygen-summary-cache")
    return saved ? JSON.parse(saved) : {}
  })

  const [flashcardCache, setFlashcardCache] = useState(() => {
    const saved = localStorage.getItem("studygen-flashcard-cache")
    return saved ? JSON.parse(saved) : {}
  })

  // Questions history for repetition limits
  const [quizQuestionsHistory, setQuizQuestionsHistory] = useState(() => {
    const saved = localStorage.getItem("studygen-quiz-questions-history")
    return saved ? JSON.parse(saved) : {}
  })

  // Sync state changes back to localStorage
  useEffect(() => {
    // Strip actual FileObject binaries before saving JSON structure to storage
    const filesToSave = uploadedFiles.map(f => {
      const { fileObject, ...rest } = f
      return rest
    })
    localStorage.setItem("studygen-files", JSON.stringify(filesToSave))
  }, [uploadedFiles])



  useEffect(() => {
    localStorage.setItem("studygen-quiz-scores", JSON.stringify(quizScores))
  }, [quizScores])

  useEffect(() => {
    localStorage.setItem("studygen-summary-cache", JSON.stringify(summaryCache))
  }, [summaryCache])

  useEffect(() => {
    localStorage.setItem("studygen-flashcard-cache", JSON.stringify(flashcardCache))
  }, [flashcardCache])

  useEffect(() => {
    localStorage.setItem("studygen-quiz-questions-history", JSON.stringify(quizQuestionsHistory))
  }, [quizQuestionsHistory])
  // -------------------------------------------------------------

  // Resolve active non-deleted file
  const activeFilesList = uploadedFiles.filter(f => !f.isDeleted)
  const [activeFile, setActiveFile] = useState(activeFilesList[0] || null)

  // View mode for Flashcards (grid deck vs tree diagram)
  const [flashcardViewMode, setFlashcardViewMode] = useState("grid")

  // Core Theme State (Defaults to dark mode)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("studygen-theme") || "dark"
  })

  // Sync theme with HTML data attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("studygen-theme", theme)
  }, [theme])

  // Sync active file when the file list changes (e.g. if current active gets deleted)
  useEffect(() => {
    const list = uploadedFiles.filter(f => !f.isDeleted)
    if (activeFile && activeFile.isDeleted) {
      setActiveFile(list.length > 0 ? list[0] : null)
      setSummaryResult(null)
      setFlashcardResult(null)
      setQuizResult(null)
    } else if (!activeFile && list.length > 0) {
      setActiveFile(list[0])
    }
  }, [uploadedFiles])

  // Load cached summaries and flashcards when activeFile changes
  useEffect(() => {
    if (activeFile) {
      setSummaryResult(summaryCache[activeFile.name] || null)
      setFlashcardResult(flashcardCache[activeFile.name] || null)
      setQuizResult(null)
    } else {
      setSummaryResult(null)
      setFlashcardResult(null)
      setQuizResult(null)
    }
  }, [activeFile])

  // Toggle handler for light/dark
  function toggleTheme() {
    setTheme(prev => (prev === "dark" ? "light" : "dark"))
  }

  // Handle local PDF upload
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0]
    if (!uploadedFile) return
    
    try {
      const newFileRecord = {
        name: uploadedFile.name,
        pages: Math.floor(Math.random() * 20) + 8, // Simulate page count
        size: (uploadedFile.size / 1024 / 1024).toFixed(1) + " MB",
        uploadedAt: "Just now",
        isMock: false,
        isBookmarked: false,
        isDeleted: false,
        fileObject: uploadedFile
      }
      
      setUploadedFiles(prev => [newFileRecord, ...prev])
      setActiveFile(newFileRecord)
      
      // Clear previous results for clean state
      setSummaryResult(null)
      setFlashcardResult(null)
      setQuizResult(null)

      setToast({ message: `"${uploadedFile.name}" uploaded successfully!`, type: "success" })
    } catch (err) {
      setToast({ message: `Upload failed: ${err.message}`, type: "error" })
    }
  }

  // File selection
  const selectActiveFile = (fileRecord) => {
    setActiveFile(fileRecord)
    setSummaryResult(null)
    setFlashcardResult(null)
    setQuizResult(null)
  }

  // State-driven Document Hub Actions
  const toggleBookmark = (fileRecord) => {
    setUploadedFiles(prev => prev.map(f => f.name === fileRecord.name ? { ...f, isBookmarked: !f.isBookmarked } : f))
  }

  const moveToTrash = (fileRecord) => {
    if (window.confirm(`Are you sure you want to move "${fileRecord.name}" to the Trash Bin?`)) {
      setUploadedFiles(prev => prev.map(f => f.name === fileRecord.name ? { ...f, isDeleted: true } : f))
      setToast({ message: `"${fileRecord.name}" moved to Trash.`, type: "success" })
    }
  }

  const restoreFromTrash = (fileRecord) => {
    setUploadedFiles(prev => prev.map(f => f.name === fileRecord.name ? { ...f, isDeleted: false } : f))
  }

  const deletePermanently = (fileRecord) => {
    if (window.confirm(`Are you sure you want to permanently delete "${fileRecord.name}"? This action cannot be undone and will remove it from everywhere.`)) {
      setUploadedFiles(prev => prev.filter(f => f.name !== fileRecord.name))
      setToast({ message: `"${fileRecord.name}" permanently deleted.`, type: "success" })
    }
  }

  // Handle callback when a quiz is completed in the QuizView
  const handleQuizComplete = (scorePercentage) => {
    if (!activeFile) return
    setQuizScores(prev => {
      const currentScores = prev[activeFile.name] || []
      return {
        ...prev,
        [activeFile.name]: [...currentScores, scorePercentage]
      }
    })
  }

  // Core Generator handler
  async function generate(endpoint, overrideParams = {}) {
    if (!activeFile) return
    
    setLoading(true)
    setLoadingMode(endpoint)

    // Clear previous result for this endpoint specifically
    if (endpoint === "summary") setSummaryResult(null)
    else if (endpoint === "flashcards") setFlashcardResult(null)
    else if (endpoint === "quiz") setQuizResult(null)

    // Prepare PDF File object to send
    let fileToSend = null
    if (activeFile.isMock) {
      // Fetch pre-loaded dummy.pdf from public folder
      try {
        const response = await fetch("/dummy.pdf")
        const blob = await response.blob()
        fileToSend = new File([blob], activeFile.name, { type: "application/pdf" })
      } catch (err) {
        console.error("Failed to load mockup PDF file", err)
      }
    } else {
      fileToSend = activeFile.fileObject
    }

    if (!fileToSend) {
      const errMsg = "PDF File object could not be resolved. Please re-upload your PDF file."
      if (endpoint === "summary") setSummaryResult({ error: errMsg })
      else if (endpoint === "flashcards") setFlashcardResult({ error: errMsg })
      else if (endpoint === "quiz") setQuizResult({ error: errMsg })
      setLoading(false)
      return
    }

    const formData = new FormData()
    formData.append("file", fileToSend)

    // Build URL search parameters
    const params = new URLSearchParams()
    if (endpoint === "quiz") {
      const qCount = overrideParams.numQuestions || numQuestions
      const diff = overrideParams.difficulty || difficulty
      params.append("num_questions", qCount)
      params.append("difficulty", diff)

      // Pass previous question history to exclude duplicates
      const history = quizQuestionsHistory[activeFile.name] || []
      formData.append("exclude_questions", JSON.stringify(history))
    } else if (endpoint === "flashcards") {
      const cCount = overrideParams.numCards || numCards
      params.append("num_cards", cCount)
    }
    const queryString = params.toString()
    const queryPath = queryString ? `?${queryString}` : ""

    let response;
    try {
      response = await fetch(`http://localhost:8000/${endpoint}${queryPath}`, {
        method: "POST",
        body: formData,
      })
    } catch (err) {
      console.warn("Localhost fetch failed, trying loopback 127.0.0.1 fallback...", err)
      try {
        response = await fetch(`http://127.0.0.1:8000/${endpoint}${queryPath}`, {
          method: "POST",
          body: formData,
        })
      } catch (fallbackErr) {
        const errMsg = "Could not connect to the backend server. Please verify the Python backend is running on port 8000."
        if (endpoint === "summary") setSummaryResult({ error: errMsg })
        else if (endpoint === "flashcards") setFlashcardResult({ error: errMsg })
        else if (endpoint === "quiz") setQuizResult({ error: errMsg })
        setLoading(false)
        return
      }
    }

    if (response && response.ok) {
      const data = await response.json()
      if (endpoint === "summary") {
        setSummaryResult(data)
        setSummaryCache(prev => ({ ...prev, [activeFile.name]: data }))
      } else if (endpoint === "flashcards") {
        setFlashcardResult(data)
        setFlashcardCache(prev => ({ ...prev, [activeFile.name]: data }))
      } else if (endpoint === "quiz") {
        setQuizResult(data)
        // Store question texts in history to avoid repetition
        const newQuestions = data.map(q => q.question)
        setQuizQuestionsHistory(prev => {
          const currentHistory = prev[activeFile.name] || []
          const updatedHistory = [...currentHistory, ...newQuestions]
          // Limit to 30 items to cycle questions after 6-7 generations (each generation has 5 questions)
          return {
            ...prev,
            [activeFile.name]: updatedHistory.slice(-30)
          }
        })
      }


    } else {
      let errMsg = `Server returned error status: ${response ? response.status : 'Unknown'}`
      try {
        const errJson = await response.json()
        if (errJson && errJson.detail) {
          errMsg = errJson.detail
        }
      } catch (e) {}
      
      const errorObj = { error: errMsg }
      if (endpoint === "summary") setSummaryResult(errorObj)
      else if (endpoint === "flashcards") setFlashcardResult(errorObj)
      else if (endpoint === "quiz") setQuizResult(errorObj)
    }
    setLoading(false)
  }

  // Sidebar item renderer matching reference design
  const renderSidebarItem = (id, label, icon) => {
    const isActive = activeTab === id;
    
    // Theme-specific colors
    let activeBg = "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)"
    let activeTextColor = "#ffffff"
    
    if (isActive) {
      if (id === "summary") {
        activeBg = theme === "dark" 
          ? "linear-gradient(135deg, #00a4e4 0%, #33ffd0 100%)" 
          : "linear-gradient(135deg, #8b5a2b 0%, #cd853f 100%)"
      } else if (id === "flashcards") {
        activeBg = theme === "dark" 
          ? "linear-gradient(135deg, #00a4e4 0%, #008cc4 100%)" 
          : "linear-gradient(135deg, #cd853f 0%, #8b5a2b 100%)"
      } else if (id === "quiz") {
        activeBg = theme === "dark" 
          ? "linear-gradient(135deg, #33ffd0 0%, #00a4e4 100%)" 
          : "linear-gradient(135deg, #65a30d 0%, #4d7c0f 100%)"
      }
    }

    return (
      <button
        key={id}
        onClick={() => {
          if (id === "appearance") {
            toggleTheme()
          } else if (id === "mind-map") {
            setActiveTab("flashcards")
            setFlashcardViewMode("tree")
          } else {
            setActiveTab(id)
            if (id === "flashcards") setFlashcardViewMode("grid")
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          width: "100%",
          padding: "11px 16px",
          borderRadius: "12px",
          border: "none",
          background: isActive ? activeBg : "transparent",
          color: isActive ? activeTextColor : "var(--text-color)",
          fontWeight: isActive ? 700 : 500,
          fontSize: "13.5px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          textAlign: "left",
          opacity: isActive ? 1 : 0.85
        }}
      >
        <span style={{ display: "flex", alignItems: "center", opacity: isActive ? 1 : 0.75 }}>
          {icon}
        </span>
        <span style={{ flexGrow: 1 }}>{label}</span>
      </button>
    )
  }

  // --- Dynamic Stats calculation (Active PDF Context-Specific) ---
  const totalUploaded = uploadedFiles.filter(f => !f.isDeleted && !f.isMock).length

  // Pages processed: check if either summary or flashcards exist in the cache for the active file
  const isProcessed = activeFile && (summaryCache[activeFile.name] || flashcardCache[activeFile.name])
  const processedPages = isProcessed ? activeFile.pages : 0

  // Flashcards created: count for the active file from the cache
  const totalFlashcards = activeFile && flashcardCache[activeFile.name] && !flashcardCache[activeFile.name].error
    ? flashcardCache[activeFile.name].length 
    : 0

  // Average quiz score for the active file
  const activeQuizScores = activeFile && quizScores[activeFile.name] ? quizScores[activeFile.name] : []
  const avgQuizScore = activeQuizScores.length > 0 
    ? Math.round(activeQuizScores.reduce((a, b) => a + b, 0) / activeQuizScores.length) + "%" 
    : "0%"

  // Resolve search query filtered lists
  const filterByQuery = (list) => {
    return list.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
      
      {/* Background WebGL Orb */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, opacity: theme === "dark" ? 0.32 : 0.2, pointerEvents: "none" }}>
        <Orb 
          hue={theme === "dark" ? 200 : 45} 
          hoverIntensity={0.6} 
          rotateOnHover 
          backgroundColor={theme === "dark" ? "#030811" : "#f9f6e9"} 
        />
      </div>

      {/* Background Floating Sea Bubbles (Only visible in dark sea mode) */}
      {theme === "dark" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
          {/* Bubble 1 */}
          <div className="sea-bubble" style={{ width: "100px", height: "100px", left: "38%", background: "radial-gradient(circle, rgba(0, 164, 228, 0.75) 0%, rgba(0, 164, 228, 0) 70%)", animationDelay: "0s", animationDuration: "16s" }} />
          {/* Bubble 2 */}
          <div className="sea-bubble" style={{ width: "70px", height: "70px", left: "44%", background: "radial-gradient(circle, rgba(51, 255, 208, 0.8) 0%, rgba(51, 255, 208, 0) 70%)", animationDelay: "-3s", animationDuration: "12s" }} />
          {/* Bubble 3 */}
          <div className="sea-bubble" style={{ width: "130px", height: "130px", left: "48%", background: "radial-gradient(circle, rgba(0, 164, 228, 0.7) 0%, rgba(0, 164, 228, 0) 70%)", animationDelay: "-7s", animationDuration: "20s" }} />
          {/* Bubble 4 */}
          <div className="sea-bubble" style={{ width: "60px", height: "60px", left: "54%", background: "radial-gradient(circle, rgba(51, 255, 208, 0.85) 0%, rgba(51, 255, 208, 0) 70%)", animationDelay: "-2s", animationDuration: "10s" }} />
          {/* Bubble 5 */}
          <div className="sea-bubble" style={{ width: "90px", height: "90px", left: "58%", background: "radial-gradient(circle, rgba(0, 164, 228, 0.75) 0%, rgba(0, 164, 228, 0) 70%)", animationDelay: "-11s", animationDuration: "15s" }} />
        </div>
      )}

      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{
              position: "fixed",
              top: "24px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 9999,
              background: toast.type === "success" ? "#00a4e4" : "#ef4444",
              color: "#ffffff",
              padding: "12px 24px",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontWeight: 600,
              fontSize: "13.5px",
              border: "1px solid rgba(255,255,255,0.1)"
            }}
          >
            {toast.type === "success" ? <Check size={16} /> : <X size={16} />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THREE COLUMN GRID - Reference Layout */}
      <div style={{ display: "flex", width: "100%", height: "100%", zIndex: 2, position: "relative" }}>

        {/* COLUMN 1: LEFT SIDEBAR (Width: 280px) */}
        <div style={{
          width: "280px",
          minWidth: "280px",
          background: theme === "dark" ? "rgba(6, 14, 26, 0.8)" : "rgba(242, 235, 213, 0.85)",
          borderRight: "1px solid var(--border-color)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          padding: "24px 18px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          height: "100vh",
          overflowY: "auto"
        }}>
          {/* Highlighted Bold Logo Card */}
          <div style={{
            background: theme === "dark" 
              ? "linear-gradient(135deg, rgba(0, 164, 228, 0.15) 0%, rgba(0, 140, 196, 0.15) 100%)" 
              : "linear-gradient(135deg, rgba(139, 90, 43, 0.12) 0%, rgba(205, 133, 63, 0.12) 100%)",
            border: "1.5px solid var(--primary)",
            borderRadius: "16px",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 4px 15px var(--primary-glow)",
            marginBottom: "4px"
          }}>
            <div style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 0 10px var(--primary-glow)",
              flexShrink: 0
            }}>
              <BrainCircuit size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: "18.5px", fontWeight: 900, letterSpacing: "-0.5px", margin: 0, color: "var(--text-color)" }}>StudyGen</h1>
              <span style={{ fontSize: "8.5px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 900, color: "var(--primary)", display: "block", marginTop: "1px" }}>AI Study Suite</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {renderSidebarItem("dashboard", "Dashboard", <LayoutDashboard size={17} />)}
            {renderSidebarItem("recent-files", "Recent Files", <Clock size={17} />)}
            {renderSidebarItem("bookmarks", "Bookmarks", <Bookmark size={17} />)}
            {renderSidebarItem("trash", "Trash", <Trash2 size={17} />)}
          </div>

          {/* Settings Section */}
          <div>
            <h3 style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", paddingLeft: "16px", marginBottom: "8px", fontWeight: 700 }}>Settings</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {renderSidebarItem("study-preferences", "Study Preferences", <Settings size={17} />)}
              {renderSidebarItem("appearance", theme === "dark" ? "Light Mode" : "Dark Mode", theme === "dark" ? <Sun size={17} /> : <Moon size={17} />)}
            </div>
          </div>

          {/* PDF Uploader Card at bottom-left */}
          <div style={{
            background: theme === "dark" ? "rgba(15, 35, 61, 0.6)" : "rgba(233, 225, 196, 0.45)",
            border: "1px solid var(--border-color)",
            borderRadius: "16px",
            padding: "24px 20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px",
            marginTop: "auto"
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "var(--primary-glow)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--border-color)"
            }}>
              <Upload size={20} style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <h4 style={{ fontSize: "13.5px", fontWeight: 700, margin: "0 0 3px 0" }}>Upload a PDF</h4>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, lineHeight: 1.45 }}>
                Upload your study material and get started
              </p>
            </div>
            <button 
              onClick={() => document.getElementById("sidebar-file-input-element").click()}
              style={{
                background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "10px 18px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                width: "100%",
                boxShadow: "0 4px 12px var(--primary-glow)",
                transition: "all 0.2s"
              }}
            >
              Upload PDF
            </button>
            <input 
              type="file"
              id="sidebar-file-input-element"
              accept="application/pdf"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </div>
        </div>

        {/* COLUMN 2: CENTER MAIN WORKSPACE */}
        <div style={{
          flexGrow: 1,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          {/* TOP BAR Search and Navigation Title */}
          <div style={{
            height: "72px",
            minHeight: "72px",
            padding: "0 40px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "transparent"
          }}>
            {/* Search Bar */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "8px 16px",
              width: "360px"
            }}>
              <Search size={15} style={{ color: "var(--text-muted)" }} />
              <input 
                type="text" 
                placeholder="Search notes, files, tools..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: "12.5px",
                  color: "var(--text-color)",
                  width: "100%"
                }}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* MAIN SCROLLABLE PANEL */}
          <div style={{
            flexGrow: 1,
            overflowY: "auto",
            padding: "36px 40px",
            position: "relative"
          }}>
            
            {/* Loading Indicator Overlay */}
            {loading && (
              <div style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.2)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 99
              }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    background: "var(--bg-card)",
                    padding: "32px",
                    borderRadius: "20px",
                    border: "1px solid var(--border-color)",
                    textAlign: "center",
                    boxShadow: "0 16px 48px var(--shadow-color)",
                    maxWidth: "360px"
                  }}
                >
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    border: "3px solid var(--primary)",
                    borderTopColor: "transparent",
                    animation: "spin 0.8s linear infinite",
                    margin: "0 auto 16px auto"
                  }} />
                  <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 8px 0" }}>
                    Generating {loadingMode === "summary" ? "Summary" : loadingMode === "flashcards" ? "Flashcards" : "Quiz"}
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    Please wait while Gemini analyzes "{activeFile ? activeFile.name : 'PDF'}" and compiles your materials.
                  </p>
                </motion.div>
              </div>
            )}

            {/* TAB CONTENT SWITCH */}
            <AnimatePresence mode="wait">
              
              {/* VIEW 1: HOME DASHBOARD OVERVIEW */}
              {activeTab === "dashboard" && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: "flex", flexDirection: "column", gap: "28px" }}
                >
                  {/* Greeting header */}
                  <div>
                    <h2 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.5px", margin: "0 0 4px 0" }}>
                      Welcome to StudyGen
                    </h2>
                    <p style={{ fontSize: "13.5px", color: "var(--text-muted)", margin: 0 }}>
                      Here's your study overview
                    </p>
                  </div>

                  {/* 4 STATS CARDS GRID */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                    
                    {/* Stat Card 1: PDFs */}
                    <div style={{
                      background: theme === "dark" ? "rgba(0, 164, 228, 0.1)" : "rgba(139, 90, 43, 0.08)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "16px",
                      padding: "20px",
                      cursor: "default",
                      userSelect: "none"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>PDFs Uploaded</span>
                          <h3 style={{ fontSize: "28px", fontWeight: 700, margin: "6px 0 0 0" }}>{totalUploaded}</h3>
                        </div>
                        <FileText size={20} style={{ color: "var(--primary)" }} />
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>Actual documents</span>
                    </div>

                    {/* Stat Card 2: Pages */}
                    <div style={{
                      background: theme === "dark" ? "rgba(51, 255, 208, 0.1)" : "rgba(205, 133, 63, 0.08)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "16px",
                      padding: "20px",
                      cursor: "default",
                      userSelect: "none"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Pages Processed</span>
                          <h3 style={{ fontSize: "28px", fontWeight: 700, margin: "6px 0 0 0" }}>{processedPages}</h3>
                        </div>
                        <FileCheck size={20} style={{ color: "var(--primary)" }} />
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>Dynamic total</span>
                    </div>

                    {/* Stat Card 3: Flashcards */}
                    <div style={{
                      background: theme === "dark" ? "rgba(0, 164, 228, 0.1)" : "rgba(139, 90, 43, 0.08)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "16px",
                      padding: "20px",
                      cursor: "default",
                      userSelect: "none"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Flashcards Created</span>
                          <h3 style={{ fontSize: "28px", fontWeight: 700, margin: "6px 0 0 0" }}>{totalFlashcards}</h3>
                        </div>
                        <Layers size={20} style={{ color: "var(--primary)" }} />
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>Active workspace deck</span>
                    </div>

                    {/* Stat Card 4: Quiz Score */}
                    <div style={{
                      background: theme === "dark" ? "rgba(51, 255, 208, 0.1)" : "rgba(101, 163, 13, 0.08)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "16px",
                      padding: "20px",
                      cursor: "default",
                      userSelect: "none"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Quiz Score</span>
                          <h3 style={{ fontSize: "28px", fontWeight: 700, margin: "6px 0 0 0" }}>{avgQuizScore}</h3>
                        </div>
                        <CheckSquare size={20} style={{ color: "var(--primary)" }} />
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>Avg. Score</span>
                    </div>
                  </div>

                  {/* RECENT STUDY MATERIAL SECTION */}
                  <div style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "20px",
                    padding: "24px",
                    boxShadow: "0 4px 20px var(--shadow-color)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Recent Study Material</h3>
                      <span style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 700, cursor: "pointer" }} onClick={() => setActiveTab("recent-files")}>View all</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {filterByQuery(uploadedFiles.filter(f => !f.isDeleted)).slice(0, 3).map((f, i) => {
                        const isActive = activeFile === f
                        return (
                          <div 
                            key={i} 
                            onClick={() => selectActiveFile(f)}
                            style={{
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "space-between",
                              padding: "12px 16px",
                              borderRadius: "12px",
                              background: isActive ? "var(--btn-inactive)" : "transparent",
                              border: isActive ? "1.5px solid var(--primary)" : "1px solid var(--border-color)",
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "8px",
                                background: "rgba(0, 164, 228, 0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--primary)"
                              }}>
                                <FileText size={18} />
                              </div>
                              <div>
                                <h4 style={{ fontSize: "13.5px", fontWeight: 600, margin: 0 }}>{f.name}</h4>
                                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                  {f.pages} Pages • Uploaded {f.uploadedAt} • {f.size}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }} onClick={e => e.stopPropagation()}>
                              {/* Bookmark Toggle button */}
                              <button
                                onClick={() => toggleBookmark(f)}
                                style={{ background: "transparent", border: "none", color: f.isBookmarked ? "var(--accent)" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}
                              >
                                <Star size={16} fill={f.isBookmarked ? "var(--accent)" : "none"} />
                              </button>
                              
                              {/* Open PDF in workspace */}
                              <button 
                                onClick={() => {
                                  selectActiveFile(f)
                                  setActiveTab("summary")
                                }}
                                style={{
                                  background: "transparent",
                                  border: "1px solid var(--border-color)",
                                  borderRadius: "8px",
                                  padding: "6px 12px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  color: "var(--text-color)",
                                  cursor: "pointer",
                                  transition: "all 0.2s"
                                }}
                              >
                                Open PDF
                              </button>

                              {/* Trash button */}
                              <button
                                onClick={() => moveToTrash(f)}
                                style={{ background: "transparent", border: "none", color: "var(--error-text)", cursor: "pointer", display: "flex", alignItems: "center" }}
                              >
                                <Trash size={16} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                      {filterByQuery(uploadedFiles.filter(f => !f.isDeleted)).length === 0 && (
                        <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "13px" }}>
                          {searchQuery ? "No files match your search query." : "No active files found. Upload a PDF using the bottom sidebar card to get started!"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI TOOLS CARD GRID SECTION */}
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>AI Tools</h3>
                    <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginBottom: "16px" }}>
                      Transform your study material into powerful learning resources
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                      
                      {/* Tool 1: Summary */}
                      <div 
                        className="ai-tool-card"
                        onClick={() => {
                          setActiveTab("summary")
                          if (!summaryResult) generate("summary")
                        }}
                        style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "16px",
                          padding: "20px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "14px",
                          boxShadow: "0 4px 12px var(--shadow-color)",
                          cursor: "pointer"
                        }}
                      >
                        <div style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          background: "rgba(0, 164, 228, 0.12)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--primary)"
                        }}>
                          <FileText size={18} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: "13.5px", fontWeight: 700, margin: "0 0 4px 0" }}>Summary</h4>
                          <p style={{ fontSize: "10.5px", color: "var(--text-muted)", margin: 0, lineHeight: 1.4, minHeight: "42px" }}>
                            Get concise summaries of your documents
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            setActiveTab("summary")
                            if (!summaryResult) generate("summary")
                          }}
                          style={{
                            background: "rgba(0, 164, 228, 0.15)",
                            color: theme === "light" ? "#7f4f24" : "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            padding: "8px 12px",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                            marginTop: "auto"
                          }}
                        >
                          <span>Generate</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>

                      {/* Tool 2: Flashcards */}
                      <div 
                        className="ai-tool-card"
                        onClick={() => {
                          setActiveTab("flashcards")
                          setFlashcardViewMode("grid")
                        }}
                        style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "16px",
                          padding: "20px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "14px",
                          boxShadow: "0 4px 12px var(--shadow-color)",
                          cursor: "pointer"
                        }}
                      >
                        <div style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          background: "rgba(51, 255, 208, 0.12)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--accent)"
                        }}>
                          <Layers size={18} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: "13.5px", fontWeight: 700, margin: "0 0 4px 0" }}>Flashcards</h4>
                          <p style={{ fontSize: "10.5px", color: "var(--text-muted)", margin: 0, lineHeight: 1.4, minHeight: "42px" }}>
                            Create smart flashcards to remember better
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            setActiveTab("flashcards")
                            setFlashcardViewMode("grid")
                          }}
                          style={{
                            background: "rgba(51, 255, 208, 0.15)",
                            color: theme === "light" ? "#7f4f24" : "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            padding: "8px 12px",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                            marginTop: "auto"
                          }}
                        >
                          <span>Generate</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>

                      {/* Tool 3: Quiz */}
                      <div 
                        className="ai-tool-card"
                        onClick={() => {
                          setActiveTab("quiz")
                        }}
                        style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "16px",
                          padding: "20px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "14px",
                          boxShadow: "0 4px 12px var(--shadow-color)",
                          cursor: "pointer"
                        }}
                      >
                        <div style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          background: "rgba(0, 164, 228, 0.12)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--primary)"
                        }}>
                          <CheckSquare size={18} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: "13.5px", fontWeight: 700, margin: "0 0 4px 0" }}>Quiz</h4>
                          <p style={{ fontSize: "10.5px", color: "var(--text-muted)", margin: 0, lineHeight: 1.4, minHeight: "42px" }}>
                            Test your knowledge with AI quizzes
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            setActiveTab("quiz")
                          }}
                          style={{
                            background: "rgba(0, 164, 228, 0.15)",
                            color: theme === "light" ? "#7f4f24" : "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            padding: "8px 12px",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                            marginTop: "auto"
                          }}
                        >
                          <span>Start Quiz</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>

                      {/* Tool 4: Mind Map */}
                      <div 
                        className="ai-tool-card"
                        onClick={() => {
                          setActiveTab("flashcards")
                          setFlashcardViewMode("tree")
                        }}
                        style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "16px",
                          padding: "20px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "14px",
                          boxShadow: "0 4px 12px var(--shadow-color)",
                          cursor: "pointer"
                        }}
                      >
                        <div style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          background: "rgba(51, 255, 208, 0.12)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--accent)"
                        }}>
                          <GitFork size={18} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: "13.5px", fontWeight: 700, margin: "0 0 4px 0" }}>Mind Map</h4>
                          <p style={{ fontSize: "10.5px", color: "var(--text-muted)", margin: 0, lineHeight: 1.4, minHeight: "42px" }}>
                            Visualize concepts and connections
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            setActiveTab("flashcards")
                            setFlashcardViewMode("tree")
                          }}
                          style={{
                            background: "rgba(51, 255, 208, 0.15)",
                            color: theme === "light" ? "#7f4f24" : "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            padding: "8px 12px",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                            marginTop: "auto"
                          }}
                        >
                          <span>Generate</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* VIEW 2: SUMMARY VIEW */}
              {activeTab === "summary" && (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div>
                      <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>Document Summary Workspace</h2>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Active: {activeFile ? activeFile.name : "None"}</span>
                        {activeFile && (
                          <button
                            onClick={() => toggleBookmark(activeFile)}
                            style={{ background: "transparent", border: "none", color: activeFile.isBookmarked ? "var(--accent)" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}
                            title={activeFile.isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
                          >
                            <Star size={14} fill={activeFile.isBookmarked ? "var(--accent)" : "none"} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {summaryResult && !summaryResult.error && (
                        <button 
                          onClick={() => generate("summary")}
                          style={{
                            background: "var(--btn-inactive)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-color)",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Re-generate
                        </button>
                      )}
                      
                      {/* Close button */}
                      <button 
                        onClick={() => setActiveTab("dashboard")} 
                        style={{ background: "var(--btn-inactive)", border: "1px solid var(--border-color)", color: "var(--text-color)", padding: "8px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {summaryResult ? (
                    summaryResult.error ? (
                      <div style={{ padding: "20px", background: "var(--error-bg)", border: "1px solid var(--error-border)", borderRadius: "12px", color: "var(--error-text)", marginTop: "20px" }}>
                        {summaryResult.error}
                      </div>
                    ) : (
                      <SummaryView data={summaryResult} />
                    )
                  ) : (
                    activeFile ? (
                      <div style={{
                        padding: "40px",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "16px",
                        textAlign: "center",
                        marginTop: "20px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "12px"
                      }}>
                        <FileText size={40} style={{ color: "var(--primary)", opacity: 0.8 }} />
                        <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>No Summary Generated</h3>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 10px 0", maxWidth: "320px", lineHeight: 1.5 }}>
                          Extract a high-level overview and key takeaways from "{activeFile.name}".
                        </p>
                        <button
                          onClick={() => generate("summary")}
                          style={{
                            background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            padding: "10px 20px",
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Generate Summary
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        Please upload a PDF first to use the Summary Workspace.
                      </div>
                    )
                  )}
                </motion.div>
              )}

              {/* VIEW 3: FLASHCARDS VIEW */}
              {activeTab === "flashcards" && (
                <motion.div
                  key="flashcards"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div>
                      <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>AI Flashcards Workspace</h2>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Active: {activeFile ? activeFile.name : "None"}</span>
                        {activeFile && (
                          <button
                            onClick={() => toggleBookmark(activeFile)}
                            style={{ background: "transparent", border: "none", color: activeFile.isBookmarked ? "var(--accent)" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}
                            title={activeFile.isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
                          >
                            <Star size={14} fill={activeFile.isBookmarked ? "var(--accent)" : "none"} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {/* Integrated Flashcards Setting and Action Bar */}
                      {flashcardResult && !flashcardResult.error && (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 600 }}>Cards:</span>
                          <select 
                            value={numCards} 
                            onChange={(e) => setNumCards(Number(e.target.value))}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              background: "var(--bg-input)",
                              color: "var(--text-color)",
                              border: "1px solid var(--border-color)",
                              fontSize: "12px"
                            }}
                          >
                            <option value={5}>5 Cards</option>
                            <option value={10}>10 Cards</option>
                            <option value={15}>15 Cards</option>
                            <option value={20}>20 Cards</option>
                          </select>
                          <button 
                            onClick={() => generate("flashcards")}
                            style={{
                              background: "var(--primary)",
                              color: "#ffffff",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "8px",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            Update Deck
                          </button>
                        </div>
                      )}
                      
                      {/* Close button */}
                      <button 
                        onClick={() => setActiveTab("dashboard")} 
                        style={{ background: "var(--btn-inactive)", border: "1px solid var(--border-color)", color: "var(--text-color)", padding: "8px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {flashcardResult ? (
                    flashcardResult.error ? (
                      <div style={{ padding: "20px", background: "var(--error-bg)", border: "1px solid var(--error-border)", borderRadius: "12px", color: "var(--error-text)", marginTop: "20px" }}>
                        {flashcardResult.error}
                      </div>
                    ) : (
                      <FlashcardsView data={flashcardResult} file={activeFile} defaultViewMode={flashcardViewMode} />
                    )
                  ) : (
                    activeFile ? (
                      /* Settings panel integrated directly within the workspace */
                      <div style={{
                        padding: "40px 30px",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "16px",
                        marginTop: "20px",
                        maxWidth: "460px",
                        marginLeft: "auto",
                        marginRight: "auto",
                        boxShadow: "0 8px 32px var(--shadow-color)"
                      }}>
                        <div style={{ textAlign: "center", marginBottom: "20px" }}>
                          <Layers size={36} style={{ color: "var(--primary)", marginBottom: "8px" }} />
                          <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>AI Flashcards Generator</h3>
                          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                            Configure and extract study card blocks from "{activeFile.name}".
                          </p>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, marginBottom: "6px" }}>
                              Number of Flashcards:
                            </label>
                            <select 
                              value={numCards} 
                              onChange={(e) => setNumCards(Number(e.target.value))}
                              style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                background: "var(--bg-input)",
                                color: "var(--text-color)",
                                border: "1px solid var(--border-color)",
                                fontSize: "13px",
                                outline: "none"
                              }}
                            >
                              <option value={5}>5 Cards (Quick review)</option>
                              <option value={10}>10 Cards (Standard deck)</option>
                              <option value={15}>15 Cards (Thorough review)</option>
                              <option value={20}>20 Cards (Deep study)</option>
                            </select>
                          </div>
                        </div>

                        <button
                          onClick={() => generate("flashcards")}
                          style={{
                            background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "10px",
                            padding: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            width: "100%",
                            fontSize: "13.5px",
                            boxShadow: "0 4px 12px var(--primary-glow)"
                          }}
                        >
                          Generate Flashcards
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        Please upload a PDF first to use the Flashcards Workspace.
                      </div>
                    )
                  )}
                </motion.div>
              )}

              {/* VIEW 4: QUIZ VIEW */}
              {activeTab === "quiz" && (
                <motion.div
                  key="quiz"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div>
                      <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>AI Quiz Session Workspace</h2>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Active: {activeFile ? activeFile.name : "None"}</span>
                        {activeFile && (
                          <button
                            onClick={() => toggleBookmark(activeFile)}
                            style={{ background: "transparent", border: "none", color: activeFile.isBookmarked ? "var(--accent)" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}
                            title={activeFile.isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
                          >
                            <Star size={14} fill={activeFile.isBookmarked ? "var(--accent)" : "none"} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {/* Integrated Quiz Settings and Action Bar */}
                      {quizResult && !quizResult.error && (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 600 }}>Questions:</span>
                          <select 
                            value={numQuestions} 
                            onChange={(e) => setNumQuestions(Number(e.target.value))}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              background: "var(--bg-input)",
                              color: "var(--text-color)",
                              border: "1px solid var(--border-color)",
                              fontSize: "12px"
                            }}
                          >
                            <option value={5}>5 Qs</option>
                            <option value={10}>10 Qs</option>
                            <option value={15}>15 Qs</option>
                            <option value={20}>20 Qs</option>
                            <option value={25}>25 Qs</option>
                          </select>

                          <span style={{ fontSize: "12px", fontWeight: 600 }}>Diff:</span>
                          <select 
                            value={difficulty} 
                            onChange={(e) => setDifficulty(e.target.value)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              background: "var(--bg-input)",
                              color: "var(--text-color)",
                              border: "1px solid var(--border-color)",
                              fontSize: "12px"
                            }}
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>

                          <button 
                            onClick={() => generate("quiz")}
                            style={{
                              background: "var(--primary)",
                              color: "#ffffff",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "8px",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            Start New Quiz
                          </button>
                        </div>
                      )}
                      
                      {/* Close button */}
                      <button 
                        onClick={() => setActiveTab("dashboard")} 
                        style={{ background: "var(--btn-inactive)", border: "1px solid var(--border-color)", color: "var(--text-color)", padding: "8px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyItems: "center" }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {quizResult ? (
                    quizResult.error ? (
                      <div style={{ padding: "20px", background: "var(--error-bg)", border: "1px solid var(--error-border)", borderRadius: "12px", color: "var(--error-text)", marginTop: "20px" }}>
                        {quizResult.error}
                      </div>
                    ) : (
                      <QuizView data={quizResult} onQuizComplete={handleQuizComplete} />
                    )
                  ) : (
                    activeFile ? (
                      /* Settings panel integrated directly within the workspace */
                      <div style={{
                        padding: "40px 30px",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "16px",
                        marginTop: "20px",
                        maxWidth: "460px",
                        marginLeft: "auto",
                        marginRight: "auto",
                        boxShadow: "0 8px 32px var(--shadow-color)"
                      }}>
                        <div style={{ textAlign: "center", marginBottom: "24px" }}>
                          <CheckSquare size={36} style={{ color: "var(--primary)", marginBottom: "8px" }} />
                          <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>AI Quiz Generator</h3>
                          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                            Generate custom test questions based on "{activeFile.name}".
                          </p>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginBottom: "28px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, marginBottom: "6px" }}>
                              Questions Count:
                            </label>
                            <select 
                              value={numQuestions} 
                              onChange={(e) => setNumQuestions(Number(e.target.value))}
                              style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                background: "var(--bg-input)",
                                color: "var(--text-color)",
                                border: "1px solid var(--border-color)",
                                fontSize: "13px",
                                outline: "none"
                              }}
                            >
                              <option value={5}>5 Questions</option>
                              <option value={10}>10 Questions</option>
                              <option value={15}>15 Questions</option>
                              <option value={20}>20 Questions</option>
                              <option value={25}>25 Questions</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, marginBottom: "8px" }}>
                              Quiz Difficulty:
                            </label>
                            <div style={{ display: "flex", gap: "8px" }}>
                              {["easy", "medium", "hard"].map((level) => (
                                <button
                                  type="button"
                                  key={level}
                                  onClick={() => setDifficulty(level)}
                                  style={{
                                    flex: 1,
                                    padding: "10px",
                                    borderRadius: "8px",
                                    border: difficulty === level ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                                    background: difficulty === level ? "var(--primary-glow)" : "var(--bg-input)",
                                    color: "var(--text-color)",
                                    fontWeight: 700,
                                    textTransform: "capitalize",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    transition: "all 0.2s"
                                  }}
                                >
                                  {level}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => generate("quiz")}
                          style={{
                            background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "10px",
                            padding: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            width: "100%",
                            fontSize: "13.5px",
                            boxShadow: "0 4px 12px var(--primary-glow)"
                          }}
                        >
                          Start Quiz
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        Please upload a PDF first to use the Quiz Workspace.
                      </div>
                    )
                  )}
                </motion.div>
              )}

              {/* VIEW 6: RECENT FILES WORKSPACE TAB */}
              {activeTab === "recent-files" && (
                <motion.div
                  key="recent-files"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: "flex", flexDirection: "column", gap: "20px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px 0" }}>Recent Files</h2>
                      <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>Manage your uploaded study materials</span>
                    </div>

                    {/* Close button */}
                    <button 
                      onClick={() => setActiveTab("dashboard")} 
                      style={{ background: "var(--btn-inactive)", border: "1px solid var(--border-color)", color: "var(--text-color)", padding: "8px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "20px",
                    padding: "24px",
                    boxShadow: "0 4px 20px var(--shadow-color)"
                  }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: "1.5px solid var(--border-color)", color: "var(--text-muted)", fontSize: "12.5px" }}>
                          <th style={{ padding: "12px 16px" }}>Document Name</th>
                          <th style={{ padding: "12px 16px" }}>Pages</th>
                          <th style={{ padding: "12px 16px" }}>File Size</th>
                          <th style={{ padding: "12px 16px" }}>Uploaded</th>
                          <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filterByQuery(uploadedFiles.filter(f => !f.isDeleted)).map((f, i) => {
                          const isActive = activeFile === f
                          return (
                            <tr key={i} style={{ borderBottom: "1px solid var(--border-color)", fontSize: "13.5px", background: isActive ? "rgba(139, 90, 43, 0.04)" : "transparent" }}>
                              <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <FileText size={15} style={{ color: "var(--primary)" }} />
                                  <span>{f.name}</span>
                                  {isActive && <span style={{ fontSize: "9px", background: "var(--primary-glow)", color: "var(--primary)", padding: "2px 6px", borderRadius: "8px", fontWeight: 700, marginLeft: "6px" }}>ACTIVE</span>}
                                </div>
                              </td>
                              <td style={{ padding: "14px 16px" }}>{f.pages} pages</td>
                              <td style={{ padding: "14px 16px" }}>{f.size}</td>
                              <td style={{ padding: "14px 16px" }}>{f.uploadedAt}</td>
                              <td style={{ padding: "14px 16px", textAlign: "right" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "14px" }}>
                                  <button
                                    onClick={() => toggleBookmark(f)}
                                    style={{ background: "transparent", border: "none", color: f.isBookmarked ? "var(--accent)" : "var(--text-muted)", cursor: "pointer" }}
                                  >
                                    <Star size={16} fill={f.isBookmarked ? "var(--accent)" : "none"} />
                                  </button>
                                  <button
                                    onClick={() => selectActiveFile(f)}
                                    disabled={isActive}
                                    style={{
                                      background: isActive ? "var(--btn-inactive)" : "var(--primary)",
                                      color: isActive ? "var(--text-color)" : "#ffffff",
                                      border: "none",
                                      borderRadius: "6px",
                                      padding: "6px 12px",
                                      fontSize: "11.5px",
                                      fontWeight: 700,
                                      cursor: isActive ? "default" : "pointer"
                                    }}
                                  >
                                    Activate
                                  </button>
                                  <button
                                    onClick={() => moveToTrash(f)}
                                    style={{ background: "transparent", border: "none", color: "var(--error-text)", cursor: "pointer" }}
                                  >
                                    <Trash size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {filterByQuery(uploadedFiles.filter(f => !f.isDeleted)).length === 0 && (
                      <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)", fontSize: "14px" }}>
                        {searchQuery ? "No files match your search query." : "No files uploaded. Drag a file into the sidebar uploader card to add it!"}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* VIEW 7: BOOKMARKS WORKSPACE TAB */}
              {activeTab === "bookmarks" && (
                <motion.div
                  key="bookmarks"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: "flex", flexDirection: "column", gap: "20px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px 0" }}>Bookmarked Files</h2>
                      <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>Starred files for quick access</span>
                    </div>

                    {/* Close button */}
                    <button 
                      onClick={() => setActiveTab("dashboard")} 
                      style={{ background: "var(--btn-inactive)", border: "1px solid var(--border-color)", color: "var(--text-color)", padding: "8px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "20px",
                    padding: "24px",
                    boxShadow: "0 4px 20px var(--shadow-color)"
                  }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: "1.5px solid var(--border-color)", color: "var(--text-muted)", fontSize: "12.5px" }}>
                          <th style={{ padding: "12px 16px" }}>Document Name</th>
                          <th style={{ padding: "12px 16px" }}>Pages</th>
                          <th style={{ padding: "12px 16px" }}>File Size</th>
                          <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filterByQuery(uploadedFiles.filter(f => f.isBookmarked && !f.isDeleted)).map((f, i) => {
                          const isActive = activeFile === f
                          return (
                            <tr key={i} style={{ borderBottom: "1px solid var(--border-color)", fontSize: "13.5px" }}>
                              <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <FileText size={15} style={{ color: "var(--primary)" }} />
                                  <span>{f.name}</span>
                                </div>
                              </td>
                              <td style={{ padding: "14px 16px" }}>{f.pages} pages</td>
                              <td style={{ padding: "14px 16px" }}>{f.size}</td>
                              <td style={{ padding: "14px 16px", textAlign: "right" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "14px" }}>
                                  <button
                                    onClick={() => toggleBookmark(f)}
                                    style={{
                                      background: "transparent",
                                      border: "1px solid var(--border-color)",
                                      borderRadius: "6px",
                                      padding: "6px 12px",
                                      fontSize: "11.5px",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      color: "var(--text-color)"
                                    }}
                                  >
                                    Remove Bookmark
                                  </button>
                                  <button
                                    onClick={() => selectActiveFile(f)}
                                    style={{
                                      background: "var(--primary)",
                                      color: "#ffffff",
                                      border: "none",
                                      borderRadius: "6px",
                                      padding: "6px 12px",
                                      fontSize: "11.5px",
                                      fontWeight: 700,
                                      cursor: "pointer"
                                    }}
                                  >
                                    Open
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {filterByQuery(uploadedFiles.filter(f => f.isBookmarked && !f.isDeleted)).length === 0 && (
                      <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)", fontSize: "14px" }}>
                        {searchQuery ? "No files match your search query." : "No starred files. Click the star icon on any document in Dashboard or Recent Files to bookmark it!"}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* VIEW 8: TRASH WORKSPACE TAB */}
              {activeTab === "trash" && (
                <motion.div
                  key="trash"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: "flex", flexDirection: "column", gap: "20px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px 0" }}>Trash Bin</h2>
                      <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>Recover or permanently delete files</span>
                    </div>

                    {/* Close button */}
                    <button 
                      onClick={() => setActiveTab("dashboard")} 
                      style={{ background: "var(--btn-inactive)", border: "1px solid var(--border-color)", color: "var(--text-color)", padding: "8px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "20px",
                    padding: "24px",
                    boxShadow: "0 4px 20px var(--shadow-color)"
                  }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: "1.5px solid var(--border-color)", color: "var(--text-muted)", fontSize: "12.5px" }}>
                          <th style={{ padding: "12px 16px" }}>Document Name</th>
                          <th style={{ padding: "12px 16px" }}>Pages</th>
                          <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filterByQuery(uploadedFiles.filter(f => f.isDeleted)).map((f, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid var(--border-color)", fontSize: "13.5px" }}>
                            <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <FileText size={15} style={{ color: "var(--text-muted)" }} />
                                <span style={{ textDecoration: "line-through", opacity: 0.6 }}>{f.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: "14px 16px" }}>{f.pages} pages</td>
                            <td style={{ padding: "14px 16px", textAlign: "right" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "14px" }}>
                                <button
                                  onClick={() => restoreFromTrash(f)}
                                  style={{
                                    background: "rgba(16, 185, 129, 0.15)",
                                    color: theme === "light" ? "#65a30d" : "#10b981",
                                    border: "none",
                                    borderRadius: "6px",
                                    padding: "6px 12px",
                                    fontSize: "11.5px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}
                                >
                                  <RotateCcw size={12} />
                                  <span>Restore</span>
                                </button>
                                <button
                                  onClick={() => deletePermanently(f)}
                                  style={{
                                    background: "rgba(239, 68, 68, 0.15)",
                                    color: "#ef4444",
                                    border: "none",
                                    borderRadius: "6px",
                                    padding: "6px 12px",
                                    fontSize: "11.5px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}
                                >
                                  <Trash size={12} />
                                  <span>Delete Permanently</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filterByQuery(uploadedFiles.filter(f => f.isDeleted)).length === 0 && (
                      <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)", fontSize: "14px" }}>
                        {searchQuery ? "No files match your search query." : "Trash is empty."}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* VIEW 9: STUDY PREFERENCES WORKSPACE TAB */}
              {activeTab === "study-preferences" && (
                <motion.div
                  key="study-preferences"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "520px", marginLeft: "auto", marginRight: "auto" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px 0" }}>Study Preferences</h2>
                      <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>Configure your default AI generation limits</span>
                    </div>

                    {/* Close button */}
                    <button 
                      onClick={() => setActiveTab("dashboard")} 
                      style={{ background: "var(--btn-inactive)", border: "1px solid var(--border-color)", color: "var(--text-color)", padding: "8px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "20px",
                    padding: "28px",
                    boxShadow: "0 4px 20px var(--shadow-color)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px"
                  }}>
                    {/* Default Configurations */}
                    <div>
                      <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Settings size={16} style={{ color: "var(--primary)" }} />
                        Default Generation Parameters
                      </h3>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {/* Questions count */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Default Quiz Questions</label>
                          <select 
                            value={numQuestions} 
                            onChange={(e) => setNumQuestions(Number(e.target.value))}
                            style={{
                              padding: "10px",
                              borderRadius: "8px",
                              background: "var(--bg-input)",
                              color: "var(--text-color)",
                              border: "1px solid var(--border-color)",
                              fontSize: "13px"
                            }}
                          >
                            <option value={5}>5 Questions</option>
                            <option value={10}>10 Questions</option>
                            <option value={15}>15 Questions</option>
                            <option value={20}>20 Questions</option>
                            <option value={25}>25 Questions</option>
                          </select>
                        </div>

                        {/* Flashcards count */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Default Flashcard Count</label>
                          <select 
                            value={numCards} 
                            onChange={(e) => setNumCards(Number(e.target.value))}
                            style={{
                              padding: "10px",
                              borderRadius: "8px",
                              background: "var(--bg-input)",
                              color: "var(--text-color)",
                              border: "1px solid var(--border-color)",
                              fontSize: "13px"
                            }}
                          >
                            <option value={5}>5 Cards</option>
                            <option value={10}>10 Cards</option>
                            <option value={15}>15 Cards</option>
                            <option value={20}>20 Cards</option>
                          </select>
                        </div>

                        {/* Difficulty */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Default Quiz Difficulty</label>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {["easy", "medium", "hard"].map((level) => (
                              <button
                                type="button"
                                key={level}
                                onClick={() => setDifficulty(level)}
                                style={{
                                  flex: 1,
                                  padding: "8px",
                                  borderRadius: "8px",
                                  border: difficulty === level ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                                  background: difficulty === level ? "var(--primary-glow)" : "var(--bg-input)",
                                  color: "var(--text-color)",
                                  fontWeight: 700,
                                  textTransform: "capitalize",
                                  cursor: "pointer",
                                  fontSize: "11.5px"
                                }}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "var(--primary-glow)", border: "1px solid var(--border-color)", borderRadius: "10px", color: "var(--text-color)", fontSize: "12px" }}>
                      <Check size={14} style={{ color: "var(--primary)" }} />
                      <span>Preferences are automatically saved and applied locally.</span>
                    </div>

                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

        {/* COLUMN 3: RIGHT PERSISTENT AI CHATBOT (Always pinned on the right) */}
        <div style={{
          width: `${chatWidth}px`,
          minWidth: `${chatWidth}px`,
          position: "relative",
          background: theme === "dark" ? "rgba(6, 14, 26, 0.8)" : "rgba(242, 235, 213, 0.85)",
          borderLeft: "1px solid var(--border-color)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          padding: "24px 18px",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          zIndex: 2,
          transition: "background-color var(--transition-speed), border-color var(--transition-speed)"
        }}>
          {/* Resize Handler (Puller) */}
          <div
            onMouseDown={startResizeChat}
            style={{
              position: "absolute",
              top: 0,
              left: "-3px",
              width: "6px",
              height: "100%",
              cursor: "col-resize",
              zIndex: 999,
              background: "transparent",
              transition: "background 0.2s"
            }}
            title="Drag to resize chat panel"
            className="chat-resizer-puller"
          >
            {/* Circular click stretcher button centered directly on the line */}
            <div
              onClick={(e) => {
                e.stopPropagation() // Stop dragging trigger
                if (chatWidth >= 450) {
                  setChatWidth(360)
                } else {
                  setChatWidth(600)
                }
              }}
              onMouseDown={(e) => e.stopPropagation()} // Stop drag initiation
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "var(--primary)",
                border: "1.5px solid var(--border-color)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 12px var(--primary-glow)",
                transition: "all 0.2s"
              }}
              title={chatWidth >= 450 ? "Shrink Chat Panel" : "Stretch Chat Panel"}
            >
              <ChevronsLeftRight size={13} />
            </div>
          </div>

          <Chatbot file={activeFile} isInline={true} chatWidth={chatWidth} setChatWidth={setChatWidth} />
        </div>

      </div>

      {/* Keyframe & Custom CSS Hover Injector */}
      <style>{`
        .chat-resizer-puller:hover {
          background: var(--primary) !important;
          box-shadow: 0 0 10px var(--primary-glow);
          width: 4px !important;
          left: -2px !important;
        }
        .ai-tool-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .ai-tool-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px var(--shadow-color);
          border-color: var(--primary) !important;
        }
        @keyframes floatUp {
          0% {
            transform: translateY(115vh) scale(0.8) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.9;
          }
          90% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(-15vh) scale(1.25) rotate(360deg);
            opacity: 0;
          }
        }
        .sea-bubble {
          position: absolute;
          border-radius: 50%;
          filter: blur(5px);
          animation: floatUp infinite linear;
          bottom: 0px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default App