<template>
  <div>
    <!-- Toggle Button -->
    <button
      @click="isOpen = !isOpen"
      class="chat-toggle-btn"
    >
      {{ isOpen ? 'Close Chat' : 'Chat' }}
    </button>

    <!-- Chat Panel -->
    <transition name="slide-up">
      <div
        v-if="isOpen"
        class="chat-panel"
      >
        <!-- Top Buttons -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <!-- Connection Status & Tabs -->
          <div style="display: flex; gap: 1rem; align-items: center;">
            <!-- MCP Connection Status -->
            <div class="connection-status">
              <div 
                class="status-dot"
                :style="{
                  background: connectionStatus === 'connected' ? '#10b981' : 
                             connectionStatus === 'connecting' ? '#f59e0b' : '#ef4444'
                }"
              ></div>
              <span class="status-text">
                {{ connectionStatus === 'connected' ? 'MCP Connected' : 
                   connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected' }}
              </span>
            </div>
            
            <!-- Tabs -->
            <div style="display: flex; gap: 1rem;">
              <button
                v-for="tab in tabs"
                :key="tab"
                @click="activeTab = tab"
                class="tab-button"
                :class="{ active: activeTab === tab, inactive: activeTab !== tab }"
              >
                {{ tab }}
              </button>
            </div>
          </div>
          
          <!-- Clear/Export -->
          <div style="display: flex; gap: 0.5rem;">
            <button @click="exportChat" title="Export chat" class="action-button">
              Export
            </button>
            <button @click="clearChat" title="Clear chat" class="action-button">
              Clear
            </button>
          </div>
        </div>

        <!-- Messages (only in Chat tab) -->
        <div v-if="activeTab === 'Chat'" ref="chatContainer" class="chat-container">
          <div
            v-for="(msg, index) in chatMessages"
            :key="index"
            class="message"
            :class="{ 
              user: msg.sender === 'user', 
              bot: msg.sender === 'bot'
            }"
          >
            <div v-html="formatMessage(msg.text)"></div>
            <div v-if="msg.timestamp" class="message-time">
              {{ formatTime(msg.timestamp) }}
            </div>
          </div>
          
          <!-- Loading indicator -->
          <div v-if="isLoading" class="loading-indicator">
            <div class="loading-spinner"></div>
            Thinking...
          </div>
        </div>

        <!-- MCP Workflows tab -->
        <div v-else-if="activeTab === 'Tools'" style="flex: 1; overflow-y: auto;">
          <div style="margin-bottom: 1rem;">
            <h3 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; color: #374151;">Available Workflows</h3>
            <div v-if="availableTools.length === 0" style="color: #6b7280; font-style: italic;">
              No workflows available. Check MCP connection.
            </div>
            <div v-else>
              <div 
                v-for="tool in availableTools" 
                :key="tool.name"
                style="padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; margin-bottom: 0.5rem;"
              >
                <div style="font-weight: 600; font-size: 0.8rem;">{{ tool.name }}</div>
                <div style="font-size: 0.75rem; color: #6b7280;">{{ tool.description }}</div>
                <button 
                  @click="triggerWorkflow(tool.name)"
                  style="margin-top: 0.25rem; padding: 0.25rem 0.5rem; background: #3b82f6; color: white; border: none; border-radius: 0.25rem; font-size: 0.7rem; cursor: pointer;"
                >
                  Trigger
                </button>
              </div>
            </div>
            <div style="margin-top: 1rem;">
              <button 
                @click="createComplianceRecord"
                class="compliance-button"
              >
                Create Compliance Record
              </button>
            </div>
          </div>
        </div>

        <!-- NLPearl Calls tab -->
        <div v-else-if="activeTab === 'Calls'" style="flex: 1; overflow-y: auto;">
          <div style="margin-bottom: 1rem;">
            <h3 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; color: #374151;">NLPearl Voice Calls</h3>
            <p style="font-size: 0.75rem; color: #6b7280; margin-bottom: 1rem;">Note: NLPearl only supports voice calls, not SMS</p>
            
            <!-- Quick Call Form -->
            <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
              <h4 style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.5rem;">Make Outbound Call</h4>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <input 
                  v-model="callForm.phone_number" 
                  type="tel" 
                  placeholder="Phone number (e.g., +1234567890)"
                  style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.25rem; font-size: 0.8rem;"
                />
                <textarea 
                  v-model="callForm.message" 
                  placeholder="Message to speak during the call"
                  rows="3"
                  style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.25rem; font-size: 0.8rem; resize: vertical;"
                ></textarea>
                <select 
                  v-model="callForm.voice_id"
                  style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.25rem; font-size: 0.8rem;"
                >
                  <option value="default">Default Voice</option>
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="calm">Calm</option>
                </select>
                <button 
                  @click="makeCall"
                  :disabled="!callForm.phone_number || !callForm.message || isLoading"
                  class="call-button"
                >
                  📞 Make Call
                </button>
              </div>
            </div>

            <!-- Reminder Form -->
            <div style="background: #fef3c7; padding: 1rem; border-radius: 0.5rem;">
              <h4 style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.5rem;">Send Reminder Call</h4>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <input 
                  v-model="reminderForm.phone_number" 
                  type="tel" 
                  placeholder="Phone number"
                  style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.25rem; font-size: 0.8rem;"
                />
                <input 
                  v-model="reminderForm.user_name" 
                  type="text" 
                  placeholder="User name"
                  style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.25rem; font-size: 0.8rem;"
                />
                <select 
                  v-model="reminderForm.reminder_type"
                  style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.25rem; font-size: 0.8rem;"
                >
                  <option value="">Select reminder type</option>
                  <option value="form_overdue">Form Overdue</option>
                  <option value="document_missing">Document Missing</option>
                  <option value="compliance_due">Compliance Due</option>
                </select>
                <input 
                  v-model="reminderForm.due_date" 
                  type="date" 
                  placeholder="Due date"
                  style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.25rem; font-size: 0.8rem;"
                />
                <input 
                  v-model="reminderForm.process_link" 
                  type="url" 
                  placeholder="Process link (optional)"
                  style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.25rem; font-size: 0.8rem;"
                />
                <button 
                  @click="sendReminder"
                  :disabled="!reminderForm.phone_number || !reminderForm.user_name || !reminderForm.reminder_type || isLoading"
                  class="reminder-button"
                >
                  🔔 Send Reminder Call
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Form (Chat tab only) -->
        <form
          v-if="activeTab === 'Chat'"
          @submit.prevent="sendMessage"
          class="input-form"
        >
          <input
            v-model="userInput"
            :disabled="isLoading || connectionStatus !== 'connected'"
            type="text"
            placeholder="Type your message..."
            class="message-input"
          />
          <button
            type="submit"
            :disabled="isLoading || connectionStatus !== 'connected' || !userInput.trim()"
            class="send-button"
            :class="{ 
              enabled: !isLoading && connectionStatus === 'connected' && userInput.trim(),
              disabled: isLoading || connectionStatus !== 'connected' || !userInput.trim()
            }"
          >
            {{ isLoading ? 'Sending...' : 'Send' }}
          </button>
        </form>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import axios from 'axios'

const isOpen = ref(false)
const userInput = ref('')
const messages = ref([])
const chatContainer = ref(null)
const activeTab = ref('Chat')
const tabs = ['Chat', 'Tools', 'Calls']
const isLoading = ref(false)
const connectionStatus = ref('disconnected') // disconnected, connecting, connected
const availableTools = ref([])

// NLPearl forms
const callForm = ref({
  phone_number: '',
  message: '',
  voice_id: 'default'
})

const reminderForm = ref({
  phone_number: '',
  user_name: '',
  reminder_type: '',
  due_date: '',
  process_link: ''
})

// Computed property to filter out system messages
const chatMessages = computed(() => {
  return messages.value.filter(msg => msg.sender !== 'system')
})

// MCP Configuration - UPDATE THESE TO MATCH YOUR SERVER
const MCP_CONFIG = {
  baseUrl: 'https://w2yeklcbqa.execute-api.us-west-1.amazonaws.com', // Your API Gateway URL
  endpoints: {
    chat: '/context/claude-enhanced',
    workflows: '/context/workflows',
    health: '/health',
    state: '/context/state',
    compliance: '/context/create_compliance_record',
    // NLPearl endpoints
    call: '/calls/outbound',
    reminder: '/reminders/send'
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

const formatMessage = (text) => {
  // Basic markdown-like formatting
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background: #f3f4f6; padding: 0.125rem 0.25rem; border-radius: 0.25rem;">$1</code>')
    .replace(/\n/g, '<br>')
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const checkMCPConnection = async () => {
  try {
    connectionStatus.value = 'connecting'
    const response = await axios.get(`${MCP_CONFIG.baseUrl}${MCP_CONFIG.endpoints.health}`, {
      timeout: 5000
    })
    
    if (response.status === 200) {
      connectionStatus.value = 'connected'
      await loadAvailableWorkflows()
      addSystemMessage('Connected to MCP server')
    } else {
      throw new Error('Health check failed')
    }
  } catch (error) {
    connectionStatus.value = 'disconnected'
    console.error('MCP connection failed:', error)
    addSystemMessage(`Failed to connect to MCP server: ${error.message}`)
  }
}

const loadAvailableWorkflows = async () => {
  try {
    const response = await axios.get(`${MCP_CONFIG.baseUrl}${MCP_CONFIG.endpoints.workflows}`)
    availableTools.value = response.data.workflows?.map(workflow => ({
      name: workflow,
      description: `Trigger ${workflow} workflow`
    })) || []
  } catch (error) {
    console.error('Failed to load workflows:', error)
    addSystemMessage('Failed to load available workflows')
  }
}

const addSystemMessage = (text) => {
  messages.value.push({
    sender: 'system',
    text: text,
    timestamp: Date.now()
  })
}

// NLPearl functions
const makeCall = async () => {
  if (!callForm.value.phone_number || !callForm.value.message) return
  
  try {
    isLoading.value = true
    const response = await axios.post(`${MCP_CONFIG.baseUrl}${MCP_CONFIG.endpoints.call}`, {
      phone_number: callForm.value.phone_number,
      message: callForm.value.message,
      voice_id: callForm.value.voice_id
    })
    
    messages.value.push({
      sender: 'bot',
      text: `📞 Call initiated to ${callForm.value.phone_number}. Call ID: ${response.data.call_id}`,
      timestamp: Date.now()
    })
    
    // Clear form
    callForm.value = { phone_number: '', message: '', voice_id: 'default' }
    
  } catch (error) {
    console.error('Call error:', error)
    messages.value.push({
      sender: 'bot',
      text: `❌ Call failed: ${error.response?.data?.detail || error.message}`,
      timestamp: Date.now()
    })
  } finally {
    isLoading.value = false
  }
}

const sendSMS = async () => {
  // SMS not supported by NLPearl
  messages.value.push({
    sender: 'bot',
    text: `❌ SMS not available: NLPearl only supports voice calls, not SMS messaging.`,
    timestamp: Date.now()
  })
}

const sendReminder = async () => {
  if (!reminderForm.value.phone_number || !reminderForm.value.user_name || !reminderForm.value.reminder_type) return
  
  try {
    isLoading.value = true
    const payload = {
      phone_number: reminderForm.value.phone_number,
      user_name: reminderForm.value.user_name,
      reminder_type: reminderForm.value.reminder_type
    }
    
    if (reminderForm.value.due_date) payload.due_date = reminderForm.value.due_date
    if (reminderForm.value.process_link) payload.process_link = reminderForm.value.process_link
    
    const response = await axios.post(`${MCP_CONFIG.baseUrl}${MCP_CONFIG.endpoints.reminder}`, payload)
    
    messages.value.push({
      sender: 'bot',
      text: `🔔 Reminder call sent to ${reminderForm.value.user_name} at ${reminderForm.value.phone_number}. Call ID: ${response.data.call_id}`,
      timestamp: Date.now()
    })
    
    // Clear form
    reminderForm.value = { phone_number: '', user_name: '', reminder_type: '', due_date: '', process_link: '' }
    
  } catch (error) {
    console.error('Reminder error:', error)
    messages.value.push({
      sender: 'bot',
      text: `❌ Reminder failed: ${error.response?.data?.detail || error.message}`,
      timestamp: Date.now()
    })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  // Listen for messages from parent Wix page (for password-protected pages)
  window.addEventListener('message', (event) => {
    console.log('Received message from Wix:', event.data);
    
    if (event.data.type === 'CHAT_OPENED') {
      console.log('Chat opened from password-protected page');
      // Auto-open chat
      if (!isOpen.value) {
        isOpen.value = true;
      }
      // Force connection check
      if (connectionStatus.value !== 'connected') {
        checkMCPConnection();
      }
    }
  });
  
  // Send ready message with retry for password-protected pages
  let attempts = 0;
  const maxAttempts = 5;
  
  const sendReady = () => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'CHAT_READY',
        data: { ready: true, attempt: attempts + 1 }
      }, '*');
      console.log(`Sent CHAT_READY message, attempt ${attempts + 1}`);
    }
    attempts++;
    if (attempts < maxAttempts) {
      setTimeout(sendReady, 1000);
    }
  };
  
  setTimeout(sendReady, 500); // Start after small delay
  
  // Load saved messages
  const saved = localStorage.getItem('mcpChatMessages')
  if (saved) {
    try {
      messages.value = JSON.parse(saved)
    } catch (error) {
      console.error('Failed to parse saved messages:', error)
    }
  }
  
  // Check MCP connection
  checkMCPConnection()
  
  // Set up periodic connection check
  const connectionCheck = setInterval(checkMCPConnection, 30000) // Check every 30 seconds
  
  onUnmounted(() => {
    clearInterval(connectionCheck)
  })
  
  scrollToBottom()
})

watch(messages, (newVal) => {
  // Only save chat messages, not system messages
  const chatOnly = newVal.filter(msg => msg.sender !== 'system')
  localStorage.setItem('mcpChatMessages', JSON.stringify(chatOnly))
  scrollToBottom()
}, { deep: true })

const sendMessage = async () => {
  const input = userInput.value.trim()
  if (!input || isLoading.value || connectionStatus.value !== 'connected') return

  // Add user message
  messages.value.push({ 
    sender: 'user', 
    text: input,
    timestamp: Date.now()
  })
  userInput.value = ''
  isLoading.value = true

  try {
    const response = await axios.post(`${MCP_CONFIG.baseUrl}${MCP_CONFIG.endpoints.chat}`, {
      prompt: input
    }, {
      timeout: 30000 // 30 second timeout
    })

    const botResponse = response.data.completion || 'No response received'
    
    messages.value.push({ 
      sender: 'bot', 
      text: botResponse,
      timestamp: Date.now()
    })

  } catch (error) {
    console.error('MCP chat error:', error)
    let errorMessage = 'Failed to get response from MCP server'
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timed out. The server might be busy.'
    } else if (error.response) {
      errorMessage = `Server error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`
    } else if (error.request) {
      errorMessage = 'No response from server. Check if MCP server is running.'
      connectionStatus.value = 'disconnected'
    }
    
    // Show error as bot message instead of system message
    messages.value.push({ 
      sender: 'bot', 
      text: `Error: ${errorMessage}`,
      timestamp: Date.now()
    })
  } finally {
    isLoading.value = false
  }
}

const clearChat = () => {
  messages.value = []
  localStorage.removeItem('mcpChatMessages')
  addSystemMessage('Chat cleared')
}

const triggerWorkflow = async (workflowName) => {
  try {
    isLoading.value = true
    const response = await axios.post(`${MCP_CONFIG.baseUrl}/context/trigger/${workflowName}`, {
      params: {} // You can customize this based on the workflow
    })
    
    addSystemMessage(`✅ Workflow '${workflowName}' triggered successfully`)
    messages.value.push({
      sender: 'bot',
      text: `Workflow '${workflowName}' has been triggered. ${response.data.status}`,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Workflow trigger error:', error)
    addSystemMessage(`❌ Failed to trigger workflow '${workflowName}': ${error.message}`)
  } finally {
    isLoading.value = false
  }
}

const createComplianceRecord = async () => {
  try {
    isLoading.value = true
    const response = await axios.post(`${MCP_CONFIG.baseUrl}${MCP_CONFIG.endpoints.compliance}`)
    
    addSystemMessage('✅ Compliance record created successfully')
    messages.value.push({
      sender: 'bot',
      text: `Compliance record has been created. ID: ${response.data.inserted_id}`,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Compliance record error:', error)
    addSystemMessage(`❌ Failed to create compliance record: ${error.message}`)
  } finally {
    isLoading.value = false
  }
}

const exportChat = () => {
  const content = messages.value
    .map(m => `[${formatTime(m.timestamp)}] ${m.sender.toUpperCase()}: ${m.text}`)
    .join('\n\n')
  
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `mcp-chat-export-${new Date().toISOString().split('T')[0]}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(40px);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.chat-toggle-btn {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 50;
  background: #2563eb;
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 9999px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.chat-toggle-btn:hover {
  background: #1d4ed8;
}

.chat-panel {
  position: fixed;
  bottom: 90px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 700px;
  padding: 1.5rem;
  background: white;
  border: 1px solid #d1d5db;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  border-radius: 1rem;
  height: 33vh;
  z-index: 9999;
  display: flex;
  flex-direction: column;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-text {
  font-size: 0.75rem;
  color: #6b7280;
}

.tab-button {
  font-size: 0.85rem;
  padding-bottom: 2px;
  background: none;
  border: none;
  cursor: pointer;
}

.tab-button.active {
  font-weight: 600;
  color: #1D4ED8;
  border-bottom: 2px solid #1D4ED8;
}

.tab-button.inactive {
  font-weight: 400;
  color: #6B7280;
}

.action-button {
  font-size: 0.75rem;
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.message {
  max-width: 80%;
  padding: 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  color: #111827;
}

.message.user {
  background: #DBEAFE;
  align-self: flex-end;
  text-align: right;
}

.message.bot {
  background: #F3F4F6;
  align-self: flex-start;
  text-align: left;
}

.message.system {
  background: #FEF3C7;
  border: 1px solid #F59E0B;
  align-self: flex-start;
  text-align: left;
}

.system-header {
  font-weight: 600;
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
  color: #92400e;
}

.message-time {
  font-size: 0.7rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.input-form {
  display: flex;
  gap: 0.5rem;
}

.message-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 9999px;
  font-size: 1rem;
}

.message-input:disabled {
  opacity: 0.6;
}

.send-button {
  padding: 0.75rem 1.25rem;
  color: white;
  border: none;
  border-radius: 9999px;
  font-weight: 500;
}

.send-button.enabled {
  background: #2563eb;
  cursor: pointer;
}

.send-button.disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.compliance-button {
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
}

.compliance-button:hover {
  background: #059669;
}

.call-button {
  padding: 0.5rem;
  background: #059669;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  cursor: pointer;
}

.call-button:disabled,
.reminder-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.call-button:hover:not(:disabled) {
  background: #047857;
}

.reminder-button {
  padding: 0.5rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  cursor: pointer;
}

.reminder-button:hover:not(:disabled) {
  background: #d97706;
}
</style>