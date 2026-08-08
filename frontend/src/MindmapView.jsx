import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GitFork, Search, ChevronDown, ChevronUp, Sparkles, ZoomIn, ZoomOut, RefreshCw, Maximize2, X } from "lucide-react"

export default function MindmapView({ data, file }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [collapsedBranches, setCollapsedBranches] = useState({})
  
  // Interactive Canvas States
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragActive, setDragActive] = useState(false)
  const [selectedNode, setSelectedNode] = useState(null)
  
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })

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

  // Drag Canvas Handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    if (e.target.closest("button") || e.target.closest("input") || e.target.closest(".mindmap-node-interactive") || e.target.closest(".mindmap-node-clickable")) return
    
    isDragging.current = true
    setDragActive(true)
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    e.preventDefault()
  }

  const handleMouseMove = (e) => {
    if (!isDragging.current) return
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    })
  }

  const handleMouseUp = () => {
    isDragging.current = false
    setDragActive(false)
  }

  const handleMouseLeave = () => {
    isDragging.current = false
    setDragActive(false)
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
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Header and Controller Area */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "24px",
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

      {/* Floating Canvas Controls */}
      <div style={{
        position: "absolute",
        top: "100px",
        right: "40px",
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: "12px",
        padding: "6px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        boxShadow: "0 6px 20px var(--shadow-color)",
        zIndex: 90
      }}>
        <button
          onClick={() => setZoom(z => Math.min(z + 0.1, 2.0))}
          title="Zoom In"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-color)",
            cursor: "pointer",
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s"
          }}
        >
          <ZoomIn size={15} />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))}
          title="Zoom Out"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-color)",
            cursor: "pointer",
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s"
          }}
        >
          <ZoomOut size={15} />
        </button>
        <button
          onClick={() => {
            setZoom(1)
            setPan({ x: 0, y: 0 })
          }}
          title="Recenter View"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-color)",
            cursor: "pointer",
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s"
          }}
        >
          <RefreshCw size={13} />
        </button>
        <button
          onClick={() => {
            setZoom(0.8)
            setPan({ x: 0, y: 20 })
          }}
          title="Fit to Canvas"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-color)",
            cursor: "pointer",
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s"
          }}
        >
          <Maximize2 size={13} />
        </button>
        <div style={{ height: "16px", width: "1px", background: "var(--border-color)", margin: "0 4px" }} />
        <span style={{ fontSize: "10px", color: "var(--text-muted)", padding: "0 6px 0 2px", fontWeight: 700, fontFamily: "monospace" }}>
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Mindmap Interactive Canvas Viewport */}
      <div 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          width: "100%",
          height: "480px",
          border: "1px solid var(--border-color)",
          borderRadius: "16px",
          background: "var(--bg-base)",
          backgroundImage: "radial-gradient(var(--border-color) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          overflow: "hidden",
          position: "relative",
          cursor: dragActive ? "grabbing" : "grab",
          transition: "border-color var(--transition-speed)"
        }}
      >
        {/* Transform Container */}
        <div style={{
          width: "100%",
          height: "100%",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          transition: isDragging.current ? "none" : "transform 0.15s ease-out",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          {/* Inner unit holding hierarchy tree */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "max-content",
            padding: "20px 40px",
            position: "relative"
          }}>
            {/* Level 0: Root Node */}
            <div className="mindmap-root-wrapper">
              <div 
                onClick={() => setSelectedNode(root)}
                className="mindmap-node-clickable"
                style={{
                  background: selectedNode?.id === root.id 
                    ? "var(--accent)" 
                    : "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
                  color: "#ffffff",
                  padding: "14px 28px",
                  borderRadius: "20px",
                  fontWeight: 800,
                  fontSize: "14.5px",
                  boxShadow: selectedNode?.id === root.id 
                    ? "0 0 16px var(--accent)" 
                    : "0 10px 25px var(--primary-glow)",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  zIndex: 10,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
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
                    const isSelected = selectedNode?.id === branch.id

                    return (
                      <div key={branch.id} className="mindmap-branch-column">
                        {/* Branch Node Card */}
                        <div 
                          onClick={() => setSelectedNode(branch)}
                          className={`mindmap-branch-node ${isCollapsed ? "collapsed" : ""} ${
                            matchesSearch(branch.label) ? "mindmap-node-highlighted" : ""
                          }`}
                          style={{
                            border: isSelected ? "2.5px solid var(--accent)" : "1px solid var(--border-color)",
                            boxShadow: isSelected ? "0 0 12px var(--accent)" : "0 4px 12px var(--shadow-color)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "8px",
                            cursor: "pointer",
                            padding: "8px 12px",
                            transition: "all 0.2s"
                          }}
                        >
                          <span style={{ fontWeight: 700, fontSize: "12px", flexGrow: 1, textAlign: "left" }}>{branch.label}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleBranch(branch.id)
                            }}
                            className="mindmap-node-interactive"
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              padding: "2px",
                              borderRadius: "4px"
                            }}
                          >
                            {isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                          </button>
                        </div>

                        {/* Leaf stem and list */}
                        <AnimatePresence>
                          {!isCollapsed && branch.children && branch.children.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                              <div className="mindmap-leaf-stem" />
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mindmap-leaves-list"
                              >
                                {branch.children.map((leaf) => {
                                  const isLeafSelected = selectedNode?.id === leaf.id
                                  return (
                                    <motion.div 
                                      key={leaf.id} 
                                      onClick={() => setSelectedNode(leaf)}
                                      className={`mindmap-leaf-node ${matchesSearch(leaf.label) ? "mindmap-node-highlighted" : ""}`}
                                      whileHover={{ x: 4 }}
                                      style={{ 
                                        cursor: "pointer",
                                        border: isLeafSelected ? "2px solid var(--accent)" : "1px solid var(--border-color)",
                                        boxShadow: isLeafSelected ? "0 0 10px var(--accent)" : "none",
                                        transition: "all 0.2s"
                                      }}
                                    >
                                      {leaf.label}
                                    </motion.div>
                                  )
                                })}
                              </motion.div>
                            </div>
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
      </div>

      {/* Selected Node Details Drawer */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              bottom: "28px",
              left: "28px",
              right: "28px",
              background: "var(--bg-card)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1.5px solid var(--border-color)",
              borderLeft: "4px solid var(--accent)",
              borderRadius: "16px",
              padding: "16px 20px",
              boxShadow: "0 10px 30px var(--shadow-color)",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              gap: "6px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ 
                  background: "var(--btn-inactive)", 
                  width: "24px", 
                  height: "24px", 
                  borderRadius: "6px", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  color: "var(--accent)" 
                }}>
                  <GitFork size={12} />
                </div>
                <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "var(--text-color)" }}>{selectedNode.label}</h4>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                title="Close definition"
                style={{
                  background: "var(--btn-inactive)",
                  border: "none",
                  borderRadius: "50%",
                  color: "var(--text-color)",
                  cursor: "pointer",
                  width: "22px",
                  height: "22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "opacity 0.2s"
                }}
              >
                <X size={12} />
              </button>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              {selectedNode.description || "Learn more about this document concept by selecting other branches."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
