import { useState } from "react"
import { motion } from "framer-motion"
import { GitFork, Layers, Sparkles, Network } from "lucide-react"

function Flashcard({ front, back }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div 
      className="perspective-container" 
      style={{ 
        width: "100%", 
        height: "185px", 
        cursor: "pointer",
        position: "relative"
      }}
      onClick={() => setFlipped(!flipped)}
    >
      <motion.div 
        className={`flip-card-inner ${flipped ? 'flipped' : ''}`}
        whileHover={{ scale: 1.03, boxShadow: "0 10px 25px var(--shadow-color)" }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Front Face */}
        <div className="flip-card-front" style={{ padding: "16px" }}>
          <div style={{ 
            fontSize: "10px", 
            fontWeight: 700, 
            letterSpacing: "1px", 
            opacity: 0.5, 
            marginBottom: "8px",
            color: "var(--primary)",
            textTransform: "uppercase"
          }}>
            Question
          </div>
          <div style={{ 
            fontSize: "13px", 
            fontWeight: 500, 
            lineHeight: 1.4,
            overflowY: "auto",
            maxHeight: "120px",
            width: "100%",
            textAlign: "center"
          }}>
            {front}
          </div>
          <div style={{ 
            marginTop: "auto", 
            fontSize: "9px", 
            opacity: 0.4, 
            fontStyle: "italic" 
          }}>
            Click to reveal answer
          </div>
        </div>

        {/* Back Face */}
        <div className="flip-card-back" style={{ padding: "16px" }}>
          <div style={{ 
            fontSize: "10px", 
            fontWeight: 700, 
            letterSpacing: "1px", 
            opacity: 0.8, 
            marginBottom: "8px",
            color: "rgba(255, 255, 255, 0.9)",
            textTransform: "uppercase"
          }}>
            Answer
          </div>
          <div style={{ 
            fontSize: "13px", 
            fontWeight: 500, 
            lineHeight: 1.4,
            overflowY: "auto",
            maxHeight: "120px",
            width: "100%",
            textAlign: "center"
          }}>
            {back}
          </div>
          <div style={{ 
            marginTop: "auto", 
            fontSize: "9px", 
            opacity: 0.8, 
            fontStyle: "italic" 
          }}>
            Click to flip back
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function FlashcardsView({ data, file }) {
  const [viewMode, setViewMode] = useState("grid") // "tree" or "grid"

  // Split cards into two conceptual trunks for diagram tree structure
  const midPoint = Math.ceil(data.length / 2)
  const leftCards = data.slice(0, midPoint)
  const rightCards = data.slice(midPoint)

  return (
    <div style={{
      marginTop: "30px",
      background: "var(--bg-card)",
      padding: "28px",
      borderRadius: "20px",
      border: "1px solid var(--border-color)",
      boxShadow: "0 8px 32px var(--shadow-color)",
      transition: "background-color var(--transition-speed), border-color var(--transition-speed)",
      position: "relative"
    }}>
      {/* Header and Toggle Controllers */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "24px",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Network size={22} style={{ color: "var(--primary)" }} />
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>Study Concepts</h2>
        </div>
        
        {/* Toggle Switch */}
        <div style={{
          display: "flex",
          background: "var(--bg-input)",
          padding: "4px",
          borderRadius: "10px",
          border: "1px solid var(--border-color)"
        }}>
          <button
            onClick={() => setViewMode("tree")}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "none",
              background: viewMode === "tree" ? "var(--primary)" : "transparent",
              color: viewMode === "tree" ? "#ffffff" : "var(--text-muted)",
              fontSize: "11.5px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <GitFork size={13} />
            Tree Diagram
          </button>
          <button
            onClick={() => setViewMode("grid")}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "none",
              background: viewMode === "grid" ? "var(--primary)" : "transparent",
              color: viewMode === "grid" ? "#ffffff" : "var(--text-muted)",
              fontSize: "11.5px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Layers size={13} />
            Grid Deck
          </button>
        </div>
      </div>

      {/* RENDER TREE DIAGRAM VIEW */}
      {viewMode === "tree" ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", width: "100%", padding: "20px 0" }}>
          
          {/* Centered Root Node (Subject Label) */}
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            position: "relative", 
            zIndex: 10,
            marginBottom: "36px"
          }}>
            <div style={{
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
              color: "#ffffff",
              padding: "10px 20px",
              borderRadius: "20px",
              fontWeight: 700,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 8px 24px var(--primary-glow)",
              border: "1px solid rgba(255,255,255,0.15)",
              maxWidth: "280px"
            }}>
              <Sparkles size={14} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Subject: {file ? file.name : "Study Material"}
              </span>
            </div>
            {/* Stem line down */}
            <div style={{ width: "2px", height: "30px", background: "var(--border-color)", marginTop: "0px" }} />
          </div>

          {/* Flow Diagram Connector Lines Container */}
          <div style={{ display: "flex", width: "100%", justifyContent: "center", position: "relative" }}>
            
            {/* SVG Tree Connector Lines Overlay */}
            <svg 
              className="concept-tree-svg"
              style={{
                position: "absolute",
                top: "-32px",
                left: "5%",
                width: "90%",
                height: "50px",
                pointerEvents: "none",
                zIndex: 1
              }}
            >
              {/* Left Branch Curve */}
              <path 
                d="M 50% 0 C 50% 25, 25% 25, 25% 50" 
                fill="none" 
                stroke="var(--border-color)" 
                strokeWidth="2" 
                style={{ transformOrigin: "center" }}
              />
              {/* Right Branch Curve */}
              <path 
                d="M 50% 0 C 50% 25, 75% 25, 75% 50" 
                fill="none" 
                stroke="var(--border-color)" 
                strokeWidth="2"
              />
            </svg>

            {/* Tree Branch Structure Columns */}
            <div className="concept-branch-grid">
              
              {/* LEFT BRANCH (Trunk A) */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {/* Branch Header Node */}
                <div style={{
                  background: "var(--bg-input)",
                  border: "1.5px solid var(--border-color)",
                  color: "var(--text-color)",
                  padding: "8px 16px",
                  borderRadius: "14px",
                  fontSize: "12px",
                  fontWeight: 700,
                  marginBottom: "24px",
                  zIndex: 2,
                  boxShadow: "0 4px 12px var(--shadow-color)"
                }}>
                  Concept Trunk A
                </div>

                {/* Left side vertical connecting branch lines */}
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "20px", 
                  width: "100%", 
                  borderLeft: "2px dashed var(--border-color)",
                  paddingLeft: "20px",
                  marginLeft: "10px"
                }}>
                  {leftCards.map((card, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      {/* Horizontal connecting connector */}
                      <div style={{
                        position: "absolute",
                        left: "-20px",
                        top: "75px",
                        width: "20px",
                        height: "2px",
                        background: "var(--border-color)"
                      }} />
                      <Flashcard front={card.front} back={card.back} />
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT BRANCH (Trunk B) */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {/* Branch Header Node */}
                <div style={{
                  background: "var(--bg-input)",
                  border: "1.5px solid var(--border-color)",
                  color: "var(--text-color)",
                  padding: "8px 16px",
                  borderRadius: "14px",
                  fontSize: "12px",
                  fontWeight: 700,
                  marginBottom: "24px",
                  zIndex: 2,
                  boxShadow: "0 4px 12px var(--shadow-color)"
                }}>
                  Concept Trunk B
                </div>

                {/* Right side vertical connecting branch lines */}
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "20px", 
                  width: "100%", 
                  borderLeft: "2px dashed var(--border-color)",
                  paddingLeft: "20px",
                  marginLeft: "10px"
                }}>
                  {rightCards.map((card, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      {/* Horizontal connecting connector */}
                      <div style={{
                        position: "absolute",
                        left: "-20px",
                        top: "75px",
                        width: "20px",
                        height: "2px",
                        background: "var(--border-color)"
                      }} />
                      <Flashcard front={card.front} back={card.back} />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      ) : (
        /* RENDER STANDARD GRID DECK VIEW */
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "20px",
        }}>
          {data.map((card, i) => (
            <Flashcard key={i} front={card.front} back={card.back} />
          ))}
        </div>
      )}
    </div>
  )
}

export default FlashcardsView