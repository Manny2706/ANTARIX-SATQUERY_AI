import React, { useState, useRef, useEffect } from 'react';
import { socket } from '../socket/socket';
import './SearchPage.css';

export default function SearchPage({ onNavigate }) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [queryText, setQueryText] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [userId] = useState("70fa21d1-c6c0-4766-a264-9c2d418352c2");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState('overview');
  const [showEvidence, setShowEvidence] = useState(true);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [latestAiAnswer, setLatestAiAnswer] = useState("");
  const [evidenceList, setEvidenceList] = useState([]);
  const fileInputRef = useRef(null);

  const handleExportJson = () => {
    const exportData = {
      query: queryText,
      result: latestAiAnswer,
      timestamp: new Date().toISOString(),
      conversationId: conversationId,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis_result_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadReport = () => {
    const reportText = `SATQUERY AI - EARTH OBSERVATION ANALYSIS REPORT\n\nQuery: ${queryText}\nTimestamp: ${new Date().toLocaleString()}\nStatus: COMPLETED\n\nFINDINGS / SYNTHESIS:\n${latestAiAnswer || "The image shows a predominantly coastal region with dense urban built-up areas, structured road networks, mixed vegetation belts, and a prominent water body adjacent to the developed zone."}\n\nConfidence: 92%\nModel: Remote Sensing VLM\nDataset: BigEarthNet / Sentinel-2\n`;
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis_report_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const extractMessageText = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item;
    if (item.content) {
      if (typeof item.content === "string") return item.content;
      if (item.content.content && typeof item.content.content === "string") {
        return item.content.content;
      }
    }
    if (item.message && typeof item.message === "string") return item.message;
    return "";
  };

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("message:response", (data) => {
      console.log("🤖 AI RESPONSE:", data);
      setIsLoading(false);
      setAnalysisComplete(true);

      if (data?.conversationId) {
        setConversationId(data.conversationId);
      }

      let aiText = "";
      if (data?.assistantMessage) {
        aiText = extractMessageText(data.assistantMessage);
      } else if (data?.message) {
        aiText = extractMessageText(data.message);
      }

      const backendEvidence = data?.assistantMessage?.content?.metadata?.evidence || data?.metadata?.evidence;
      if (backendEvidence && Array.isArray(backendEvidence)) {
        setEvidenceList(backendEvidence);
      }

      if (aiText) {
        setLatestAiAnswer(aiText);
        setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
      }
    });

    socket.on("message:error", (error) => {
      console.log("❌ ERROR:", error);
      setIsLoading(false);
    });

    return () => {
      socket.off("connect");
      socket.off("message:response");
      socket.off("message:error");
      socket.disconnect();
    };
  }, []);

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(f => ({
        name: f.name,
        preview: URL.createObjectURL(f),
        file: f,
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
      setIsPopupOpen(false);
    }
  };

  const handleDriveUpload = () => {
    setUploadedFiles(prev => [...prev, {
      name: "Drive_Image_Selected.tif",
      preview: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=200&q=80",
      file: null,
    }]);
    setIsPopupOpen(false);
  };
  
  const [inputValue, setInputValue] = useState('');
  const [sentFiles, setSentFiles] = useState([]);

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!inputValue.trim() && uploadedFiles.length === 0) {
      return;
    }

    const currentQuery = inputValue;
    const currentFiles = [...uploadedFiles];

    setQueryText(currentQuery);
    setSentFiles(currentFiles);
    setHasQueried(true);
    setIsLoading(true);
    setAnalysisComplete(false);
    setActiveResultTab('overview');

    let imageData = null;
    const firstFile = currentFiles.length > 0 ? currentFiles[0].file : null;
    if (firstFile) {
      try {
        imageData = await firstFile.arrayBuffer();
      } catch (err) {
        console.error(err);
      }
    }

    socket.emit("message:send", {
      key: import.meta.env.VITE_SOCKET_KEY || "bgvpit303269bgwb9nishant",
      userId,
      conversationId,
      message: currentQuery,
      image: imageData,
    });

    setInputValue('');
    setUploadedFiles([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const searchBarElement = (
        <div className="search-bar-wrapper">
          <div className={`search-bar ${uploadedFiles.length > 0 ? 'has-files' : ''}`}>
            
            {uploadedFiles.length > 0 && (
              <div className="uploaded-files-preview">
                {uploadedFiles.map((file, i) => (
                  <div className="file-preview-card" key={i}>
                    <div className="remove-file-badge" onClick={() => removeFile(i)}>×</div>
                    <div className="file-thumbnail" style={{ backgroundImage: `url('${file.preview}')` }}></div>
                  </div>
                ))}
              </div>
            )}

            <div className="search-input-row">
              <div 
                className={`search-plus-icon ${isPopupOpen ? 'open' : ''}`} 
                onClick={() => setIsPopupOpen(!isPopupOpen)}
              >
                {isPopupOpen ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                )}
              </div>
              
              {isPopupOpen && (
                <div className="search-popup-menu">
                  <div className="popup-item" onClick={() => fileInputRef.current.click()}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                    Upload files
                  </div>
                  <div className="popup-item" onClick={handleDriveUpload}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                    Add from Drive
                  </div>
                  <div className="popup-item more-uploads">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                    More uploads
                    <span className="arrow-right">&gt;</span>
                  </div>
                </div>
              )}
              
              <input 
                type="text" 
                placeholder="Ask Anything" 
                className="search-input" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {inputValue.trim() !== '' || uploadedFiles.length > 0 ? (
                <div 
                  className="search-send-btn" 
                  onClick={handleSend}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="19" x2="12" y2="5"></line>
                    <polyline points="5 12 12 5 19 12"></polyline>
                  </svg>
                </div>
              ) : (
                <div className="search-mic-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                </div>
              )}
            </div>
            
            <input 
              type="file" 
              multiple 
              style={{ display: 'none' }} 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
          </div>
        </div>
  );

  return (
    <div className="searchpage-container">
     
      <div className="collapsed-sidebar">
        <div className="sidebar-icons">
          <div className="sidebar-logo">
            
          <svg width="47" height="46" viewBox="0 0 47 46" fill="none" stroke="black" strokeWidth="1.5">
            <circle cx="23.5" cy="23" r="21"></circle>
            <ellipse cx="23.5" cy="23" rx="21" ry="6" transform="rotate(-25 23.5 23)"></ellipse>
            <circle cx="23.5" cy="23" r="3.5" fill="#00B4D8" stroke="none"></circle>
          </svg>
       
          </div>
          
          <div className="icon-group">
            <div className="sidebar-icon" onClick={() => onNavigate && onNavigate('dashboard')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </div>
            <div className="sidebar-icon" onClick={() => onNavigate && onNavigate('history')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div className="sidebar-icon" onClick={() => onNavigate && onNavigate('reports')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div className="sidebar-icon" onClick={() => onNavigate && onNavigate('settings')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      
      <div className="searchpage-content">
        {!hasQueried ? (
          <div className="initial-search-container">
            {searchBarElement}
          </div>
        ) : (
          <div className="results-container">
            <div className="chat-section">
              <div className="chat-history">
                {sentFiles.length > 0 && (
                  <div className="message user-message image-message" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', backgroundColor: 'transparent', padding: '0', boxShadow: 'none' }}>
                    {sentFiles.map((f, i) => (
                      <img key={i} src={f.preview} alt="uploaded" style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '12px', objectFit: 'cover' }} />
                    ))}
                  </div>
                )}
                {queryText && (
                  <div className="message user-message">{queryText}</div>
                )}
                {messages.length > 0 ? (
                  messages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`}
                    >
                      {typeof msg.content === 'string' ? msg.content : (typeof msg === 'string' ? msg : JSON.stringify(msg))}
                    </div>
                  ))
                ) : (
                  <div className="message ai-message">
                    {isLoading 
                      ? "Processing your satellite imagery query..."
                      : "That is much more manageable on limited hardware while still covering essentially the complete mandatory scope. The official problem statement explicitly calls for single-image VQA, an additional single-image capability, multitemporal change analysis, optical-SAR analysis, and agentic orchestration."}
                  </div>
                )}
                {isLoading && (
                  <div className="loading-dots">
                    <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                  </div>
                )}
              </div>
              <div className="chat-input-area">
                {searchBarElement}
              </div>
            </div>
            
            <div className="analysis-section">
              {analysisComplete ? (
                <div className="analysis-results-card">
                  <div className="results-header-top">
                    <div className="badge-complete">
                      <span className="dot-circle"></span>
                      ANALYSIS COMPLETE
                    </div>
                    <div className="results-actions">
                      <button className="btn-secondary" onClick={handleExportJson}>Export JSON</button>
                      <button className="btn-primary" onClick={handleDownloadReport}>Download Report</button>
                    </div>
                  </div>

                  <h2 className="results-title">Analysis Results</h2>
                  <div className="results-query">
                    Query: "{queryText || 'Describe this image .'}"
                  </div>

                  <div className="results-tabs">
                    <button 
                      className={`result-tab-btn ${activeResultTab === 'overview' ? 'active' : ''}`}
                      onClick={() => setActiveResultTab('overview')}
                    >
                      Overview
                    </button>
                    <button 
                      className={`result-tab-btn ${activeResultTab === 'evidence' ? 'active' : ''}`}
                      onClick={() => setActiveResultTab('evidence')}
                    >
                      Evidence
                    </button>
                    <button 
                      className={`result-tab-btn ${activeResultTab === 'layers' ? 'active' : ''}`}
                      onClick={() => setActiveResultTab('layers')}
                    >
                      Layers
                    </button>
                    <button 
                      className={`result-tab-btn ${activeResultTab === 'trace' ? 'active' : ''}`}
                      onClick={() => setActiveResultTab('trace')}
                    >
                      Agent Trace
                    </button>
                    <button 
                      className={`result-tab-btn ${activeResultTab === 'metadata' ? 'active' : ''}`}
                      onClick={() => setActiveResultTab('metadata')}
                    >
                      Metadata
                    </button>
                  </div>

                  {activeResultTab === 'overview' && (
                    <>
                      <div className="results-overview-grid">
                        <div 
                          className="evidence-image-container"
                          style={{ backgroundImage: sentFiles.length > 0 ? `url('${sentFiles[0].preview}')` : "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80')" }}
                        >
                          {showEvidence && (
                            <>
                              <div className="bounding-box orange">
                                <span className="box-label orange">WATER / RIVER</span>
                              </div>
                              <div className="bounding-box cyan">
                                <span className="box-label cyan">VEGETATION</span>
                              </div>
                            </>
                          )}
                          <button 
                            className="hide-evidence-btn"
                            onClick={() => setShowEvidence(!showEvidence)}
                          >
                            {showEvidence ? 'HIDE EVIDENCE' : 'SHOW EVIDENCE'}
                          </button>
                        </div>

                        <div className="synthesis-text-container">
                          <div className="synthesis-heading">GLOBAL SYNTHESIS</div>
                          <div className="synthesis-content">
                            <p>{latestAiAnswer || "The image shows a predominantly coastal region with dense urban built-up areas, structured road networks, mixed vegetation belts, and a prominent water body adjacent to the developed zone. Settlement patterns indicate semi-dense to dense urban morphology."}</p>
                            <p>Vegetation appears intercalated between built-up patches, likely representing urban greenery or peri-urban agricultural land. The water body occupies the southeastern portion of the scene.</p>
                          </div>
                        </div>
                      </div>

                      <div className="results-bottom-row">
                        <div className="confidence-box">
                          <div className="box-subtitle">AI CONFIDENCE</div>
                          <div className="confidence-large-number">92%</div>
                          <div className="confidence-metric-item">
                            <div className="metric-text-row">
                              <span>Task Classification</span>
                              <span>98%</span>
                            </div>
                            <div className="metric-bar-bg">
                              <div className="metric-bar-fill" style={{ width: '98%' }}></div>
                            </div>
                          </div>
                          <div className="confidence-metric-item">
                            <div className="metric-text-row">
                              <span>Model Prediction</span>
                              <span>70%</span>
                            </div>
                            <div className="metric-bar-bg">
                              <div className="metric-bar-fill" style={{ width: '70%' }}></div>
                            </div>
                          </div>
                          <div className="confidence-metric-item">
                            <div className="metric-text-row">
                              <span>Evidence Agreement</span>
                              <span>89%</span>
                            </div>
                            <div className="metric-bar-bg">
                              <div className="metric-bar-fill" style={{ width: '89%' }}></div>
                            </div>
                          </div>
                        </div>

                        <div className="model-details-box">
                          <div className="box-subtitle">MODEL</div>
                          <div className="model-name">Remote Sensing VLM</div>
                          <div className="model-spec-table">
                            <div className="model-spec-row">
                              <span>Task</span>
                              <span>VQA / ML Answering</span>
                            </div>
                            <div className="model-spec-row">
                              <span>Input</span>
                              <span>Optical GeoTIFF</span>
                            </div>
                            <div className="model-spec-row">
                              <span>Dataset</span>
                              <span>BigEarthNet</span>
                            </div>
                            <div className="model-spec-row">
                              <span>Status</span>
                              <span className="status-pill-green">Completed</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {activeResultTab === 'trace' && (
                    <div className="execution-timeline" style={{ padding: '8px 0' }}>
                      <h3 style={{ fontSize: '11px', fontWeight: 700, marginBottom: '12px' }}>EXECUTION TIMELINE</h3>
                      <ul className="timeline-list">
                        <li className="done">Input validated</li>
                        <li className="done">Query understood</li>
                        <li className="done">Task identified</li>
                        <li className="done">Specialist selected</li>
                        <li className="done">Running analysis</li>
                        <li className="done">Generating evidence</li>
                        <li className="done">Preparing response</li>
                      </ul>
                    </div>
                  )}

                  {activeResultTab === 'metadata' && (
                    <div className="comp-card" style={{ marginTop: '8px' }}>
                      <div className="comp-card-header">
                        <div className="comp-thumb" style={{ backgroundImage: sentFiles.length > 0 ? `url('${sentFiles[0].preview}')` : "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=200&q=80')" }}></div>
                        <div className="comp-title">
                          <strong>{sentFiles.length > 0 ? sentFiles[0].name : 'satellite_image.tif'}</strong>
                          <span>14.2 MB - Uploaded 2014-02-23</span>
                        </div>
                        <div className="comp-status">✓ COMPATIBLE</div>
                      </div>
                      <div className="comp-stats">
                        <div className="stat-col">
                          <span className="stat-label">FORMAT</span>
                          <span className="stat-val">GeoTIFF</span>
                        </div>
                        <div className="stat-col">
                          <span className="stat-label">MODALITY</span>
                          <span className="stat-val">Optical</span>
                        </div>
                        <div className="stat-col">
                          <span className="stat-label">RESOLUTION</span>
                          <span className="stat-val">10 m</span>
                        </div>
                        <div className="stat-col">
                          <span className="stat-label">CRS</span>
                          <span className="stat-val">EPSG:4326</span>
                        </div>
                        <div className="stat-col">
                          <span className="stat-label">ACQUISITION</span>
                          <span className="stat-val">12 Aug 2026</span>
                        </div>
                        <div className="stat-col">
                          <span className="stat-label">BANDS</span>
                          <span className="stat-val">13 (Sentinel-2)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeResultTab === 'evidence' && (
                    <div>
                      <div className="evidence-cards-grid">
                        <div className="evidence-card-item">
                          <div 
                            className="evidence-card-thumb cyan-border"
                            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=400&q=80')" }}
                          ></div>
                          <div className="evidence-card-title">Urban Area</div>
                          <div className="evidence-stats-grid">
                            <div className="evidence-stat-col">
                              <span className="evidence-stat-label">CONFIDENCE</span>
                              <span className="evidence-stat-value">94%</span>
                            </div>
                            <div className="evidence-stat-col">
                              <span className="evidence-stat-label">AREA</span>
                              <span className="evidence-stat-value">38 km²</span>
                            </div>
                            <div className="evidence-stat-col">
                              <span className="evidence-stat-label">EVIDENCE</span>
                              <span className="evidence-stat-value">Optical</span>
                            </div>
                            <div className="evidence-stat-col">
                              <span className="evidence-stat-label">METHOD</span>
                              <span className="evidence-stat-value">DETR</span>
                            </div>
                          </div>
                        </div>

                        <div className="evidence-card-item">
                          <div 
                            className="evidence-card-thumb orange-border"
                            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80')" }}
                          ></div>
                          <div className="evidence-card-title">Vegetation</div>
                          <div className="evidence-stats-grid">
                            <div className="evidence-stat-col">
                              <span className="evidence-stat-label">CONFIDENCE</span>
                              <span className="evidence-stat-value">86%</span>
                            </div>
                            <div className="evidence-stat-col">
                              <span className="evidence-stat-label">AREA</span>
                              <span className="evidence-stat-value">22 km²</span>
                            </div>
                            <div className="evidence-stat-col">
                              <span className="evidence-stat-label">EVIDENCE</span>
                              <span className="evidence-stat-value">Optical</span>
                            </div>
                            <div className="evidence-stat-col">
                              <span className="evidence-stat-label">METHOD</span>
                              <span className="evidence-stat-value">DETR</span>
                            </div>
                          </div>
                        </div>

                        <div className="evidence-card-item centered-card">
                          <div 
                            className="evidence-card-thumb green-border"
                            style={{ backgroundImage: sentFiles.length > 0 ? `url('${sentFiles[0].preview}')` : "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80')" }}
                          ></div>
                          <div className="evidence-card-title">Water Body</div>
                          <div className="evidence-stats-grid">
                            <div className="evidence-stat-col">
                              <span className="evidence-stat-label">CONFIDENCE</span>
                              <span className="evidence-stat-value">
                                {evidenceList.length > 0 && evidenceList[0]?.confidence ? `${Math.round(evidenceList[0].confidence * 100)}%` : '89%'}
                              </span>
                            </div>
                            <div className="evidence-stat-col">
                              <span className="evidence-stat-label">AREA</span>
                              <span className="evidence-stat-value">12 km²</span>
                            </div>
                            <div className="evidence-stat-col">
                              <span className="evidence-stat-label">EVIDENCE</span>
                              <span className="evidence-stat-value">Optical</span>
                            </div>
                            <div className="evidence-stat-col">
                              <span className="evidence-stat-label">METHOD</span>
                              <span className="evidence-stat-value">DETR</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {evidenceList.length > 0 && evidenceList[0]?.finding && (
                        <div style={{ marginTop: '8px', padding: '10px 14px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '11px', color: '#334155', lineHeight: '1.5' }}>
                          <span style={{ fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '2px' }}>Verified Evidence Finding:</span>
                          {evidenceList[0].finding}
                        </div>
                      )}
                    </div>
                  )}

                  {activeResultTab === 'layers' && (
                    <div style={{ padding: '8px 0', fontSize: '12px', color: '#334155' }}>
                      <p><strong>Available Map Layers:</strong></p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked /> RGB True Color (B04, B03, B02)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked /> Water Mask (NDWI)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked /> Vegetation Index (NDVI)
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="analysis-card">
                  <div className="analysis-header">
                    <span className="agent-title">SATQUERY AGENT <span className="agent-status">- ACTIVE</span></span>
                    <h2>Analyzing Earth Observation Data</h2>
                  </div>
                  
                  <div className="analysis-image" style={{ backgroundImage: sentFiles.length > 0 ? `url('${sentFiles[0].preview}')` : "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80')" }}>
                    <div className="image-badges">
                      <span className="badge dark">SENTINEL-2</span>
                      <span className="badge dark">OPTICAL</span>
                      <span className="badge dark">10m</span>
                    </div>
                  </div>

                  <div className="analysis-details">
                    <div className="compatibility-check">
                      <h3>Compatibility Check</h3>
                      <div className="comp-card">
                        <div className="comp-card-header">
                          <div className="comp-thumb" style={{ backgroundImage: sentFiles.length > 0 ? `url('${sentFiles[0].preview}')` : "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=200&q=80')" }}></div>
                          <div className="comp-title">
                            <strong>{sentFiles.length > 0 ? sentFiles[0].name : 'satellite_image.tif'}</strong>
                            <span>14.2 MB - Uploaded 2014-02-23</span>
                          </div>
                          <div className="comp-status">✓ COMPATIBLE</div>
                        </div>
                        <div className="comp-stats">
                          <div className="stat-col">
                            <span className="stat-label">FORMAT</span>
                            <span className="stat-val">GeoTIFF</span>
                          </div>
                          <div className="stat-col">
                            <span className="stat-label">MODALITY</span>
                            <span className="stat-val">Optical</span>
                          </div>
                          <div className="stat-col">
                            <span className="stat-label">RESOLUTION</span>
                            <span className="stat-val">10 m</span>
                          </div>
                          <div className="stat-col">
                            <span className="stat-label">CRS</span>
                            <span className="stat-val">EPSG:4326</span>
                          </div>
                          <div className="stat-col">
                            <span className="stat-label">ACQUISITION</span>
                            <span className="stat-val">12 Aug 2026</span>
                          </div>
                          <div className="stat-col">
                            <span className="stat-label">BANDS</span>
                            <span className="stat-val">13 (Sentinel-2)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="execution-timeline">
                      <h3>EXECUTION TIMELINE</h3>
                      <ul className="timeline-list">
                        <li className="done">Input validated</li>
                        <li className="done">Query understood</li>
                        <li className="done">Task identified</li>
                        <li className={isLoading ? "active" : "done"}>
                          Specialist selected
                          {isLoading && <span className="processing-text">PROCESSING...</span>}
                        </li>
                        <li className={isLoading ? "pending" : "done"}>Running analysis</li>
                        <li className={isLoading ? "pending" : "done"}>Generating evidence</li>
                        <li className={isLoading ? "pending" : "done"}>Preparing response</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
