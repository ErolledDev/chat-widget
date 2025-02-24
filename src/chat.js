// Chat widget implementation
class ChatWidget {
  constructor(options = {}) {
    // Ensure this is only initialized in browser environment
    if (typeof window === 'undefined') return;
    
    // Require uid parameter
    if (!options.uid) {
      console.error('ChatWidget: uid parameter is required');
      return;
    }

    this.options = {
      position: 'bottom-right',
      primaryColor: '#2563eb',
      businessName: 'AI Sales Assistant',
      businessInfo: '',
      salesRepName: '',
      ...options // Allow overriding defaults with passed options
    };
    
    this.messages = [];
    this.isMinimized = true;
    this.initialized = false;
    this.uid = options.uid;
    this.unreadCount = 0;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000;

    // Create base widget structure
    this.createBaseWidget();
    
    // Fetch settings from API with retry logic
    this.fetchSettingsWithRetry();
  }

  async fetchSettingsWithRetry() {
    try {
      // Get the current hostname
      const currentHostname = window.location.hostname;
      
      // Determine the base URL based on the environment
      const baseUrl = currentHostname.includes('localhost') || currentHostname.includes('127.0.0.1')
        ? 'http://localhost:3000'
        : 'https://chatwidgetai.netlify.app';
      
      const settingsUrl = `${baseUrl}/.netlify/functions/settings`;
      
      const response = await fetch(`${settingsUrl}?uid=${this.uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const settings = await response.json();
      
      // Update options with fetched settings
      this.options = {
        ...this.options,
        primaryColor: settings.primary_color || this.options.primaryColor,
        businessName: settings.business_name || this.options.businessName,
        businessInfo: settings.business_info || this.options.businessInfo,
        salesRepName: settings.sales_rep_name || this.options.salesRepName
      };
      
      this.retryCount = 0;
      
      if (this.initialized) {
        this.updateWidgetStyles();
        this.updateWidgetContent();
      } else {
        this.init();
      }
    } catch (error) {
      console.error('Error fetching widget settings:', error);
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);
        
        setTimeout(() => {
          this.fetchSettingsWithRetry();
        }, delay);
      } else {
        console.log('Max retries reached, initializing with default settings');
        if (!this.initialized) {
          this.init();
        }
      }
    }
  }

  async sendMessage() {
    const content = this.input.value.trim();
    if (!content) return;

    this.input.value = '';
    this.addMessage({ role: 'user', content });
    this.showTypingIndicator();

    try {
      // Get the current hostname
      const currentHostname = window.location.hostname;
      
      // Determine the base URL based on the environment
      const baseUrl = currentHostname.includes('localhost') || currentHostname.includes('127.0.0.1')
        ? 'http://localhost:3000'
        : 'https://chatwidgetai.netlify.app';

      const response = await fetch(`${baseUrl}/.netlify/functions/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: this.messages,
          settings: {
            businessName: this.options.businessName,
            businessInfo: this.options.businessInfo,
            salesRepName: this.options.salesRepName
          }
        })
      });

      this.hideTypingIndicator();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const aiResponse = data.response || "I apologize, but I'm having trouble generating a response. Please try again.";
      
      this.addMessage({
        role: 'assistant',
        content: aiResponse
      });

      // Update messages array with both messages
      this.messages.push(
        { role: 'user', content },
        { role: 'assistant', content: aiResponse }
      );

      if (this.isMinimized) {
        this.incrementUnreadCount();
      }
    } catch (error) {
      console.error('Error:', error);
      this.hideTypingIndicator();
      this.addMessage({
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again in a moment.'
      });
    }
  }

  createBaseWidget() {
    this.widget = document.createElement('div');
    this.widget.className = 'chat-widget minimized';
    document.body.appendChild(this.widget);

    const header = document.createElement('div');
    header.className = 'chat-header';
    this.widget.appendChild(header);

    const minimizeButton = document.createElement('button');
    minimizeButton.className = 'minimize-button';
    minimizeButton.textContent = this.isMinimized ? '+' : '−';
    header.appendChild(minimizeButton);
  }

  init() {
    if (typeof window === 'undefined' || this.initialized) return;
    
    this.createStyles();
    this.createWidgetContent();
    this.attachEventListeners();
    this.initialized = true;

    setTimeout(() => {
      if (this.isMinimized) {
        this.toggleMinimize();
      }
    }, 3000);
  }

  updateWidgetStyles() {
    const oldStyle = document.getElementById('chat-widget-styles');
    if (oldStyle) {
      oldStyle.remove();
    }
    this.createStyles();
  }

  updateWidgetContent() {
    if (!this.initialized) return;

    const headerText = this.widget.querySelector('.chat-header span');
    if (headerText) {
      headerText.textContent = this.options.businessName;
    }

    const sendButton = this.widget.querySelector('.chat-input button');
    if (sendButton) {
      sendButton.style.backgroundColor = this.options.primaryColor;
    }

    const header = this.widget.querySelector('.chat-header');
    if (header) {
      header.style.backgroundColor = this.options.primaryColor;
    }

    const userMessages = this.widget.querySelectorAll('.message.user');
    userMessages.forEach(msg => {
      msg.style.backgroundColor = this.options.primaryColor;
    });

    const messages = this.widget.querySelectorAll('.message');
    if (messages.length === 1 && messages[0].classList.contains('assistant')) {
      const greeting = this.options.salesRepName 
        ? `Hello! I'm ${this.options.salesRepName} from ${this.options.businessName}. How can I help you today?`
        : `Hello! Welcome to ${this.options.businessName}. How can I help you today?`;
      messages[0].textContent = greeting;
    }

    const minimizeButton = this.widget.querySelector('.minimize-button');
    if (minimizeButton) {
      minimizeButton.textContent = this.isMinimized ? '+' : '−';
    }
  }

  createStyles() {
    const styles = document.createElement('style');
    styles.id = 'chat-widget-styles';
    styles.textContent = `
      .chat-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-family: system-ui, -apple-system, sans-serif;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 999999;
        opacity: 0;
        transform: translateY(20px);
        animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }

      @keyframes slideIn {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .chat-widget.minimized {
        height: 60px;
        cursor: pointer;
      }

      .chat-header {
        background: ${this.options.primaryColor};
        color: white;
        padding: 16px;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: background-color 0.3s ease;
        position: relative;
      }

      .unread-count {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        opacity: 0;
        transform: scale(0);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .unread-count.show {
        opacity: 1;
        transform: scale(1);
      }

      .minimize-button {
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        font-size: 1.2em;
        transition: transform 0.3s ease;
      }

      .minimize-button:hover {
        transform: scale(1.1);
      }

      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .message {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 14px;
        margin: 4px 0;
        white-space: pre-wrap;
        word-wrap: break-word;
        overflow-wrap: break-word;
        line-height: 1.4;
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateY(10px);
        animation: messageIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }

      @keyframes messageIn {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .message.user {
        background: ${this.options.primaryColor};
        color: white;
        align-self: flex-end;
      }

      .message.assistant {
        background: #f3f4f6;
        color: black;
        align-self: flex-start;
      }

      .typing-indicator {
        display: none;
        align-self: flex-start;
        background: #f3f4f6;
        padding: 12px 16px;
        border-radius: 14px;
        margin: 4px 0;
      }

      .typing-indicator.active {
        display: flex;
        align-items: center;
      }

      .typing-dots {
        display: flex;
        gap: 4px;
      }

      .typing-dot {
        width: 6px;
        height: 6px;
        background: #666;
        border-radius: 50%;
        animation: typing-animation 1.4s infinite;
      }

      .typing-dot:nth-child(2) {
        animation-delay: 0.2s;
      }

      .typing-dot:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes typing-animation {
        0%, 60%, 100% {
          transform: translateY(0);
          opacity: 0.4;
        }
        30% {
          transform: translateY(-4px);
          opacity: 1;
        }
      }

      .chat-input {
        padding: 16px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
      }

      .chat-input input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        outline: none;
        transition: border-color 0.3s ease;
      }

      .chat-input input:focus {
        border-color: ${this.options.primaryColor};
      }

      .chat-input button {
        background: ${this.options.primaryColor};
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s ease;
      }

      .chat-input button:hover {
        opacity: 0.9;
        transform: translateY(-1px);
      }

      .chat-input button:active {
        transform: translateY(1px);
      }
    `;
    document.head.appendChild(styles);
  }

  createWidgetContent() {
    this.widget.innerHTML = `
      <div class="chat-header">
        <span>${this.options.businessName}</span>
        <div class="unread-count">0</div>
        <button class="minimize-button">−</button>
      </div>
      <div class="chat-messages"></div>
      <div class="typing-indicator">
        <div class="typing-dots">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
      <div class="chat-input">
        <input type="text" placeholder="Type your message..." />
        <button>Send</button>
      </div>
    `;

    this.messagesContainer = this.widget.querySelector('.chat-messages');
    this.input = this.widget.querySelector('input');
    this.sendButton = this.widget.querySelector('.chat-input button');
    this.typingIndicator = this.widget.querySelector('.typing-indicator');
    this.unreadCountElement = this.widget.querySelector('.unread-count');

    setTimeout(() => {
      const greeting = this.options.salesRepName 
        ? `Hello! I'm ${this.options.salesRepName} from ${this.options.businessName}. How can I help you today?`
        : `Hello! Welcome to ${this.options.businessName}. How can I help you today?`;
      
      this.addMessage({
        role: 'assistant',
        content: greeting
      });

      if (this.isMinimized) {
        this.incrementUnreadCount();
      }
    }, 1000);
  }

  attachEventListeners() {
    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });

    this.widget.querySelector('.minimize-button').addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMinimize();
    });

    this.widget.querySelector('.chat-header').addEventListener('click', () => {
      if (this.isMinimized) {
        this.toggleMinimize();
      }
    });
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    this.widget.classList.toggle('minimized');
    this.widget.querySelector('.minimize-button').textContent = this.isMinimized ? '+' : '−';

    if (!this.isMinimized) {
      this.resetUnreadCount();
    }
  }

  incrementUnreadCount() {
    this.unreadCount++;
    this.unreadCountElement.textContent = this.unreadCount;
    this.unreadCountElement.classList.add('show');
  }

  resetUnreadCount() {
    this.unreadCount = 0;
    this.unreadCountElement.textContent = '0';
    this.unreadCountElement.classList.remove('show');
  }

  showTypingIndicator() {
    this.typingIndicator.classList.add('active');
  }

  hideTypingIndicator() {
    this.typingIndicator.classList.remove('active');
  }

  addMessage({ role, content }) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;
    messageEl.textContent = content;
    this.messagesContainer.appendChild(messageEl);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

    if (role === 'user') {
      messageEl.style.backgroundColor = this.options.primaryColor;
    }
  }
}

if (typeof window !== 'undefined') {
  window.ChatWidget = ChatWidget;
}

export { ChatWidget };