import { motion } from "framer-motion"
import { ListChecks, FileText } from "lucide-react"

function SummaryView({ data }) {
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
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
        <FileText size={22} style={{ color: "var(--primary)" }} />
        Document Summary
      </h2>
      <p style={{ lineHeight: 1.6, marginBottom: "24px", fontSize: "14.5px", color: "var(--text-color)" }}>{data.overview}</p>

      <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
        <ListChecks size={18} style={{ color: "var(--accent)" }} />
        Key Takeaways
      </h3>
      <ul style={{ listStyle: "none", paddingLeft: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
        {data.key_points.map((point, i) => (
          <motion.li 
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            style={{ 
              lineHeight: 1.5,
              fontSize: "13.5px",
              padding: "12px 16px",
              borderRadius: "12px",
              background: "rgba(0,0,0,0.03)",
              border: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px"
            }}
          >
            <span style={{ color: "var(--accent)", fontWeight: 700 }}>•</span>
            <span>{point}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

export default SummaryView