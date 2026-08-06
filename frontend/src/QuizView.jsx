import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X as XIcon, HelpCircle } from "lucide-react"

function QuizView({ data, onQuizComplete }) {
  const [answers, setAnswers] = useState({})

  function choose(qIndex, optIndex) {
    if (answers[qIndex] !== undefined) return
    const nextAnswers = { ...answers, [qIndex]: optIndex }
    setAnswers(nextAnswers)

    // Trigger score callback when all questions are answered
    const answeredCount = Object.keys(nextAnswers).length
    if (answeredCount === data.length) {
      const finalScore = data.filter((q, i) => nextAnswers[i] === q.correct_index).length
      const percentage = Math.round((finalScore / data.length) * 100)
      if (onQuizComplete) {
        onQuizComplete(percentage)
      }
    }
  }

  const score = data.filter((q, i) => answers[i] === q.correct_index).length
  const answeredCount = Object.keys(answers).length
  const isFinished = answeredCount === data.length

  return (
    <div style={{
      marginTop: "30px",
      background: "var(--bg-card)",
      padding: "28px",
      borderRadius: "20px",
      border: "1px solid var(--border-color)",
      boxShadow: "0 8px 32px var(--shadow-color)",
      transition: "background-color var(--transition-speed), border-color var(--transition-speed)"
    }}>
      {/* Header and Score Banner */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "24px",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <HelpCircle size={24} style={{ color: "var(--primary)" }} />
          <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>Interactive Quiz</h2>
        </div>
        
        <div style={{
          background: "var(--primary-glow)",
          border: "1px solid var(--border-color)",
          padding: "8px 16px",
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontWeight: 700,
          color: "var(--primary)",
          fontSize: "14px"
        }}>
          Score: {score} / {data.length}
          {isFinished && (
            <span style={{ 
              fontSize: "11px", 
              background: "var(--primary)", 
              color: "#ffffff", 
              padding: "2px 6px", 
              borderRadius: "8px",
              marginLeft: "6px"
            }}>
              Completed!
            </span>
          )}
        </div>
      </div>

      {/* Questions Stack */}
      <motion.div 
        layout
        style={{ display: "flex", flexDirection: "column", gap: "20px" }}
      >
        {data.map((q, qIndex) => {
          const chosen = answers[qIndex]
          const answered = chosen !== undefined

          return (
            <motion.div
              key={qIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: qIndex * 0.08, duration: 0.4 }}
              style={{
                background: "rgba(0,0,0,0.03)",
                border: "1px solid var(--border-color)",
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                transition: "border-color 0.2s"
              }}
            >
              <p style={{ fontWeight: 600, marginBottom: "16px", lineHeight: 1.5, fontSize: "15px" }}>
                <span style={{ color: "var(--primary)", marginRight: "6px" }}>{qIndex + 1}.</span> 
                {q.question}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {q.options.map((option, optIndex) => {
                  let bg = "rgba(255,255,255,0.01)"
                  let border = "1px solid var(--border-color)"
                  let color = "var(--text-color)"
                  let glow = "none"
                  let opacity = 1

                  if (answered) {
                    if (optIndex === q.correct_index) {
                      bg = "var(--success-bg)"
                      border = "1px solid var(--success-border)"
                      color = "var(--success-text)"
                      glow = "0 0 10px rgba(16, 185, 129, 0.15)"
                    } else if (optIndex === chosen) {
                      bg = "var(--error-bg)"
                      border = "1px solid var(--error-border)"
                      color = "var(--error-text)"
                    } else {
                      opacity = 0.5
                    }
                  }

                  return (
                    <motion.button
                      key={optIndex}
                      onClick={() => choose(qIndex, optIndex)}
                      disabled={answered}
                      whileHover={answered ? {} : { x: 4, background: "rgba(255,255,255,0.04)", borderColor: "var(--primary)" }}
                      whileTap={answered ? {} : { scale: 0.99 }}
                      style={{
                        textAlign: "left",
                        padding: "12px 16px",
                        borderRadius: "10px",
                        border: border,
                        background: bg,
                        color: color,
                        cursor: answered ? "default" : "pointer",
                        fontWeight: 500,
                        fontSize: "13.5px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.2s",
                        boxShadow: glow,
                        width: "100%",
                        opacity: opacity,
                      }}
                    >
                      <span>{option}</span>
                      {answered && optIndex === q.correct_index && <Check size={16} />}
                      {answered && optIndex === chosen && optIndex !== q.correct_index && <XIcon size={16} />}
                    </motion.button>
                  )
                })}
              </div>

              {/* Smooth Explanations */}
              <AnimatePresence>
                {answered && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ 
                      marginTop: "16px", 
                      fontSize: "13px", 
                      lineHeight: 1.6,
                      padding: "12px 16px",
                      borderRadius: "10px",
                      background: chosen === q.correct_index ? "var(--success-bg)" : "var(--error-bg)",
                      borderLeft: chosen === q.correct_index ? "3px solid #10b981" : "3px solid #ef4444",
                      color: "var(--text-color)"
                    }}>
                      <span style={{ fontWeight: 700, display: "block", marginBottom: "4px" }}>
                        {chosen === q.correct_index ? "🎉 Correct Answer!" : "❌ Incorrect Choice"}
                      </span>
                      {q.explanation}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}

export default QuizView