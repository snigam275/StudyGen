import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GitFork, Search, ChevronDown, ChevronUp, Eye, EyeOff, Sparkles } from "lucide-react"

export default function MindmapView({ data, file }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [collapsedBranches, setCollapsedBranches] = useState({})

  if (!data) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
        No mind map data available. Generate a mind map to visualize concept mappings.
      </div>
    )
  }

  const { topic } = data

  const buildTree = (flatNodes) => {
    if (!flatNodes || flatNodes.length === 0) return null
    const nodeMap = {}
    let rootNode = null

    flatNodes.forEach(node => {
      nodeMap[node.id] = { ...node, children: [] }
    })

    flatNodes.forEach(node => {
      const mappedNode = nodeMap[node.id]
      if (!node.parent_id) {
        rootNode = mappedNode
      } else {
        const parent = nodeMap[node.parent_id]
        if (parent) {
          parent.children.push(mappedNode)
        } else {
          if (!rootNode) rootNode = mappedNode
        }
      }
    })

    return rootNode || nodeMap[flatNodes[0].id]
  }

  const root = data.root || buildTree(data.nodes || [])

  if (!root) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
        No valid mind map hierarchy resolved. Please try re-generating.
      </div>
    )
  }

  const toggleBranch = (id) => {
    setCollapsedBranches(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Check if search query matches node label
  const matchesSearch = (label) => {
    if (!searchQuery.trim()) return false
    return label.toLowerCase().includes(searchQuery.toLowerCase())
  }

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
      {/* Header and Controller Area */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "32px",
        flexWrap: "wrap",
        gap: "16px",
        borderBottom: "1px solid var(--border-color)",
        paddingBottom: "20px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <GitFork size={24} style={{ color: "var(--primary)" }} />
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>Interactive Concept Mind Map</h2>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Hierarchical flow mapping for: <strong>{file ? file.name : "Study Material"}</strong>
            </span>
          </div>
        </div>

        {/* Search Highlighter Box */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "var(--bg-input)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          padding: "8px 14px",
          width: "260px"
        }}>
          <Search size={15} style={{ color: "var(--text-muted)" }} />
          <input 
            type="text" 
            placeholder="Highlight concepts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: "12px",
              color: "var(--text-color)",
              width: "100%"
            }}
          />
        </div>
      </div>

      {/* Mindmap Container */}
      <div className="mindmap-container">
        
        {/* Level 0: Root Node */}
        <div className="mindmap-root-wrapper">
          <div className={`mindmap-root-node ${matchesSearch(root.label) ? "mindmap-node-highlighted" : ""}`}>
            <Sparkles size={14} style={{ marginRight: "6px", display: "inline", verticalAlign: "middle" }} />
            <span style={{ verticalAlign: "middle" }}>{root.label || topic}</span>
          </div>
          {root.children && root.children.length > 0 && <div className="mindmap-root-stem" />}
        </div>

        {/* Level 1 & 2: Branches and Leaves */}
        <AnimatePresence>
          {root.children && root.children.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mindmap-branches-container"
            >
              {root.children.map((branch) => {
                const isCollapsed = !!collapsedBranches[branch.id]
                const hasMatchInBranch = matchesSearch(branch.label) || 
                  branch.children?.some(leaf => matchesSearch(leaf.label))

                return (
                  <div key={branch.id} className="mindmap-branch-column">
                    {/* Branch Node Card */}
                    <div 
                      onClick={() => toggleBranch(branch.id)}
                      className={`mindmap-branch-node ${isCollapsed ? "collapsed" : ""} ${
                        matchesSearch(branch.label) ? "mindmap-node-highlighted" : ""
                      } ${hasMatchInBranch && !matchesSearch(branch.label) ? "mindmap-node-parent-match" : ""}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px"
                      }}
                    >
                      <span style={{ flexGrow: 1, textAlign: "center" }}>{branch.label}</span>
                      {branch.children && branch.children.length > 0 && (
                        <span style={{ opacity: 0.6, display: "flex", alignItems: "center" }}>
                          {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                        </span>
                      )}
                    </div>

                    {/* Stem down from branch to leaves list (only if expanded) */}
                    {branch.children && branch.children.length > 0 && !isCollapsed && (
                      <div className="mindmap-leaf-stem" />
                    )}

                    {/* Level 2: Leaves (Child nodes) */}
                    <AnimatePresence>
                      {branch.children && branch.children.length > 0 && !isCollapsed && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mindmap-leaves-list"
                        >
                          {branch.children.map((leaf) => (
                            <motion.div 
                              key={leaf.id} 
                              className={`mindmap-leaf-node ${matchesSearch(leaf.label) ? "mindmap-node-highlighted" : ""}`}
                              whileHover={{ x: 4 }}
                            >
                              {leaf.label}
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
