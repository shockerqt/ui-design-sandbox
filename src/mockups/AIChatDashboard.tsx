import React, { useState } from 'react';
import { Dialog, Tooltip, Switch, Tabs } from '@base-ui/react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Settings, 
  Cpu, 
  Zap, 
  Layers, 
  MessageSquare, 
  BarChart3, 
  User, 
  ChevronRight, 
  ThumbsUp, 
  Sliders, 
  Info,
  CheckCircle,
  Copy,
  RefreshCw,
  Star
} from 'lucide-react';

export const AIChatDashboard: React.FC = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'agent',
      text: '¡Hola! Soy el agente de inteligencia de gobernanza. ¿En qué puedo ayudarte a diseñar hoy?',
      time: '14:02 PM',
      model: 'GPT-4o Enterprise'
    },
    {
      id: 2,
      sender: 'user',
      text: 'Quiero iterar la interfaz de los tableros de control para incluir telemetría en tiempo real y componentes Base UI.',
      time: '14:03 PM'
    },
    {
      id: 3,
      sender: 'agent',
      text: 'Excelente. He aplicado la paleta Sora (#0d1117 / #8395d5) con soporte para componentes desanclados @base-ui/react, insignias semánticas translúcidas y modales de configuración en tiempo real.',
      time: '14:04 PM',
      model: 'Claude 3.5 Sonnet'
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('Claude 3.5 Sonnet');
  const [isStreaming, setIsStreaming] = useState(true);
  const [feedbackRating, setFeedbackRating] = useState<number | null>(5);

  const handleSendMessage = () => {
    if (!inputPrompt.trim()) return;
    
    const newMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputPrompt,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const replyMsg = {
      id: Date.now() + 1,
      sender: 'agent',
      text: `Procesado autónomamente con el modelo ${selectedModel}. Los parámetros del tablero de control han sido actualizados en directo.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: selectedModel
    };

    setMessages(prev => [...prev, newMsg, replyMsg]);
    setInputPrompt('');
  };

  return (
    <div style={{
      background: '#0d1117',
      color: '#8b95b0',
      fontFamily: "'Sora', sans-serif",
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* TopBar Header */}
      <header style={{
        background: '#161b27',
        borderBottom: '1px solid #2a3147',
        padding: '0 20px',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
              NEXUS CHAT IA
            </span>
            <span style={{ color: '#8b95b0', opacity: 0.6, fontSize: '0.55rem', letterSpacing: '0.12em', marginTop: '2px' }}>
              TABLEROS & CONTROL DE AGENTES
            </span>
          </div>

          <span style={{
            color: '#8395d5',
            background: 'rgba(131, 149, 213, 0.12)',
            border: '1px solid rgba(131, 149, 213, 0.3)',
            borderRadius: '999px',
            padding: '2px 8px',
            fontSize: '0.65rem',
            fontWeight: 700,
            fontFamily: 'monospace'
          }}>
            LABS V2.4
          </span>
        </div>

        {/* Topbar Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#e2e8f0' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 10px #10b981'
            }} />
            <span style={{ fontSize: '0.78rem' }}>Agente Activo</span>
          </div>

          <Dialog.Root>
            <Dialog.Trigger style={{
              background: 'rgba(131, 149, 213, 0.15)',
              border: '1px solid rgba(131, 149, 213, 0.3)',
              color: '#8395d5',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Settings size={14} /> Configurar Prompt
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop className="base-Dialog-backdrop" />
              <Dialog.Popup className="base-Dialog-popup" style={{ background: '#161b27', borderColor: '#2a3147' }}>
                <h3 style={{ color: '#e2e8f0', fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                  Ajustes del Prompt del Agente
                </h3>
                <p style={{ color: '#8b95b0', fontSize: '0.85rem', marginBottom: '16px' }}>
                  Define las instrucciones de comportamiento autónomo para la generación de tableros de control.
                </p>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    System Prompt
                  </label>
                  <textarea
                    rows={4}
                    defaultValue="Eres un agente diseñador experto en React 19, Base UI y CSS modular. Prioriza estéticas oscuras, respuesta inmediata y código limpio."
                    style={{
                      width: '100%',
                      background: '#1c2333',
                      border: '1px solid #2a3147',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                      padding: '10px',
                      fontSize: '0.85rem',
                      fontFamily: 'Sora, sans-serif'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <Dialog.Close style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid #2a3147',
                    color: '#e2e8f0',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}>
                    Cancelar
                  </Dialog.Close>
                  <button className="btn-glow" style={{ background: '#8395d5' }}>
                    Guardar Cambios
                  </button>
                </div>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </header>

      {/* Main Body */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Left Sidebar */}
        <aside style={{
          width: '52px',
          background: '#161b27',
          borderRight: '1px solid #2a3147',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '16px 0',
          gap: '12px'
        }}>
          <button style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: '#1c2333',
            color: '#e2e8f0',
            border: '1px solid #2a3147',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}>
            <MessageSquare size={18} />
          </button>
          <button style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'transparent',
            color: '#8b95b0',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}>
            <BarChart3 size={18} />
          </button>
          <button style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'transparent',
            color: '#8b95b0',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}>
            <Cpu size={18} />
          </button>
        </aside>

        {/* Content View */}
        <main style={{ flex: 1, padding: '28px 36px', maxWidth: '1280px', margin: '0 auto' }}>
          
          {/* Version Banner */}
          <div style={{
            background: 'rgba(131, 149, 213, 0.08)',
            border: '1px solid rgba(131, 149, 213, 0.25)',
            borderRadius: '10px',
            padding: '12px 20px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#8395d5',
                animation: 'pulse 2s infinite'
              }} />
              <span style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600 }}>
                Tablero de Control IA & Telemetría de Agentes Autónomos
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: '#8b95b0' }}>Modo Streaming:</span>
              <Switch.Root
                checked={isStreaming}
                onCheckedChange={setIsStreaming}
                className="base-Switch-root"
                style={{
                  width: '38px',
                  height: '20px'
                }}
              >
                <Switch.Thumb className="base-Switch-thumb" style={{ width: '14px', height: '14px' }} />
              </Switch.Root>
            </div>
          </div>

          {/* Stat Grid Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '28px'
          }}>
            <div style={{
              background: '#1c2333',
              border: '1px solid #2a3147',
              borderRadius: '10px',
              padding: '16px 20px'
            }}>
              <span style={{ color: '#8b95b0', fontSize: '0.75rem', fontWeight: 500 }}>Tokens Procesados</span>
              <div style={{ color: '#e2e8f0', fontSize: '1.4rem', fontWeight: 700, marginTop: '4px', fontFamily: 'monospace' }}>
                1,420,890
              </div>
            </div>

            <div style={{
              background: '#1c2333',
              border: '1px solid #2a3147',
              borderRadius: '10px',
              padding: '16px 20px'
            }}>
              <span style={{ color: '#8b95b0', fontSize: '0.75rem', fontWeight: 500 }}>Latencia Promedio</span>
              <div style={{ color: '#10b981', fontSize: '1.4rem', fontWeight: 700, marginTop: '4px', fontFamily: 'monospace' }}>
                18.4 ms
              </div>
            </div>

            <div style={{
              background: '#1c2333',
              border: '1px solid #2a3147',
              borderRadius: '10px',
              padding: '16px 20px'
            }}>
              <span style={{ color: '#8b95b0', fontSize: '0.75rem', fontWeight: 500 }}>Agentes Ejecutando</span>
              <div style={{ color: '#8395d5', fontSize: '1.4rem', fontWeight: 700, marginTop: '4px', fontFamily: 'monospace' }}>
                4 Activos
              </div>
            </div>

            <div style={{
              background: '#1c2333',
              border: '1px solid #2a3147',
              borderRadius: '10px',
              padding: '16px 20px'
            }}>
              <span style={{ color: '#8b95b0', fontSize: '0.75rem', fontWeight: 500 }}>Costo Estimado</span>
              <div style={{ color: '#f59e0b', fontSize: '1.4rem', fontWeight: 700, marginTop: '4px', fontFamily: 'monospace' }}>
                $4.12 / día
              </div>
            </div>
          </div>

          {/* Interactive Chat Stream & Input Card */}
          <div style={{
            background: '#161b27',
            border: '1px solid #2a3147',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            
            {/* Chat Stream Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #2a3147',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#1c2333'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bot size={20} color="#8395d5" />
                <h3 style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: 600 }}>
                  Conversación con Agente de Arquitectura
                </h3>
              </div>

              {/* Model Selector */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {['Claude 3.5 Sonnet', 'GPT-4o', 'Gemini 1.5 Pro'].map(model => (
                  <button
                    key={model}
                    onClick={() => setSelectedModel(model)}
                    style={{
                      background: selectedModel === model ? '#8395d5' : 'transparent',
                      color: selectedModel === model ? '#fff' : '#8b95b0',
                      border: selectedModel === model ? 'none' : '1px solid #2a3147',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {model}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages List */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '380px', overflowY: 'auto' }}>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    maxWidth: '80%',
                    background: msg.sender === 'user' ? '#8395d5' : '#1c2333',
                    color: msg.sender === 'user' ? '#fff' : '#e2e8f0',
                    border: msg.sender === 'user' ? 'none' : '1px solid #2a3147',
                    borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    padding: '14px 18px',
                    fontSize: '0.875rem',
                    lineHeight: '1.5'
                  }}>
                    {msg.text}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#8b95b0', marginTop: '4px', padding: '0 4px' }}>
                    {msg.time} {msg.model ? `• ${msg.model}` : ''}
                  </span>
                </div>
              ))}
            </div>

            {/* Chat Input Bar */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #2a3147',
              background: '#161b27',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <input
                type="text"
                placeholder="Escribe una instrucción para el agente..."
                value={inputPrompt}
                onChange={e => setInputPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                style={{
                  flex: 1,
                  background: '#1c2333',
                  border: '1px solid #2a3147',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: '#e2e8f0',
                  fontSize: '0.9rem',
                  outline: 'none',
                  fontFamily: 'Sora, sans-serif'
                }}
              />
              <button
                onClick={handleSendMessage}
                style={{
                  background: '#8395d5',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                Enviar <Send size={15} />
              </button>
            </div>

          </div>

          {/* Feedback Rating Footer Card */}
          <div style={{
            marginTop: '28px',
            background: 'rgba(245, 158, 11, 0.06)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '12px',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Star size={14} fill="#f59e0b" /> Calificación de la Iteración
              </span>
              <p style={{ color: '#8b95b0', fontSize: '0.82rem', marginTop: '2px' }}>
                ¿El diseño generado cumple con las especificaciones visuales solicitadas?
              </p>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setFeedbackRating(star)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    color: (feedbackRating && star <= feedbackRating) ? '#f59e0b' : '#2a3147',
                    transition: 'transform 0.1s'
                  }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};
