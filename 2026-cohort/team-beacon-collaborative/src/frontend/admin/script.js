// =========================================================
// Nourish & Share Admin Panel script.js
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initSubmenus();
  initMobileMenu();
  seedDemoMessages();
});

// =========================================================
// ROUTING / NAVIGATION
// =========================================================
function initNavigation() {
  const menuButtons = document.querySelectorAll(".menu-item[data-screen]");

  menuButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetScreen = btn.dataset.screen;
      
      // Update active state on buttons
      menuButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // Handle Users trigger active styling highlight if a submenu item is clicked
      const submenuTrigger = document.getElementById("menu-users-trigger");
      if (btn.classList.contains("submenu-item")) {
        submenuTrigger.classList.add("active");
      } else {
        // Only remove active state from the submenu trigger if we are clicking a top-level link
        if (targetScreen !== "donors" && targetScreen !== "recipients") {
          submenuTrigger.classList.remove("active");
        }
      }

      // Route screen views
      showScreen(targetScreen);

      // Close mobile drawer menu
      closeMobileSidebar();
    });
  });
}

function showScreen(screenId) {
  // Hide all screens
  document.querySelectorAll(".admin-screen").forEach(screen => {
    screen.classList.remove("active");
  });

  // Show target screen
  const target = document.getElementById(`screen-${screenId}`);
  if (target) {
    target.classList.add("active");
  }

  if (screenId === "chat") {
    renderConversations();
  }
}

// =========================================================
// USERS SUBMENU COLLAPSE / EXPAND
// =========================================================
function initSubmenus() {
  const usersTrigger = document.getElementById("menu-users-trigger");
  const usersContainer = document.getElementById("submenu-users-container");

  if (usersTrigger && usersContainer) {
    usersTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      usersContainer.classList.toggle("open");
    });
  }
}

// =========================================================
// MOBILE DRAWER MENU
// =========================================================
function initMobileMenu() {
  const burger = document.getElementById("mobile-menu-burger");
  const closeBtn = document.getElementById("mobile-menu-close");
  const overlay = document.getElementById("sidebar-overlay");
  const sidebar = document.getElementById("admin-sidebar");

  if (burger && sidebar && overlay) {
    burger.addEventListener("click", () => {
      sidebar.classList.add("active");
      overlay.classList.add("active");
    });
  }

  if (closeBtn && sidebar && overlay) {
    closeBtn.addEventListener("click", () => {
      closeMobileSidebar();
    });
  }

  if (overlay && sidebar) {
    overlay.addEventListener("click", () => {
      closeMobileSidebar();
    });
  }
}

function closeMobileSidebar() {
  const sidebar = document.getElementById("admin-sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (sidebar) sidebar.classList.remove("active");
  if (overlay) overlay.classList.remove("active");
}

// =========================================================
// ADMIN LOGOUT
// =========================================================
function logoutAdmin() {
  // Clear admin authentication state
  sessionStorage.removeItem("admin_session");
  localStorage.removeItem("admin_session");
  
  alert("Logged out successfully!");
  
  // Redirect to public website login page
  window.location.href = "../public website/login.html";
}

// =========================================================
// SFRN CHAT SYSTEM CODE (ADMIN LOGIC)
// =========================================================
let activeConvoId = null;
let chatSearchQuery = "";
let adminFilterRole = "all"; // 'all', 'donors', 'recipients'

function getChatCurrentUser() {
  return {
    email: "admin@nourishshare.org",
    name: "Nourish & Share Admin",
    role: "Admin"
  };
}

function loadAllConversations() {
  const user = getChatCurrentUser();
  if (!user) return [];

  const conversations = [];
  const donations = JSON.parse(localStorage.getItem("donor_donations") || "[]");
  const messages = JSON.parse(localStorage.getItem("sfrn_chat_messages") || "[]");

  // Admin gathers support conversations from registered users
  const recipientState = JSON.parse(localStorage.getItem("recipient_onboarding_state") || "{}");
  const rEmail = recipientState.account?.accEmail || recipientState.contact?.ctEmail;
  if (rEmail) {
    conversations.push({
      id: `convo-admin-${rEmail}`,
      partnerName: recipientState.org?.orgName || "Recipient",
      partnerEmail: rEmail,
      partnerRole: "Recipient",
      context: "Support Chat"
    });
  }

  const donorState = JSON.parse(localStorage.getItem("donor_onboarding_state") || "{}");
  const dEmail = donorState.account?.accEmail || donorState.contact?.ctEmail;
  if (dEmail) {
    conversations.push({
      id: `convo-admin-${dEmail}`,
      partnerName: donorState.business?.bizName || "Donor",
      partnerEmail: dEmail,
      partnerRole: "Donor",
      context: "Support Chat"
    });
  }

  // Scan from reservations
  donations.forEach(d => {
    if (d.donorEmail && !conversations.some(c => c.partnerEmail === d.donorEmail)) {
      conversations.push({
        id: `convo-admin-${d.donorEmail}`,
        partnerName: d.donorName || "Donor",
        partnerEmail: d.donorEmail,
        partnerRole: "Donor",
        context: "Support Chat"
      });
    }
    if (d.reserved && d.reservedBy && !conversations.some(c => c.partnerEmail === d.reservedBy)) {
      conversations.push({
        id: `convo-admin-${d.reservedBy}`,
        partnerName: d.recipientName || "Recipient",
        partnerEmail: d.reservedBy,
        partnerRole: "Recipient",
        context: "Support Chat"
      });
    }
  });

  // Populate last message details for each convo
  conversations.forEach(c => {
    const convoMsgs = messages.filter(m => m.convoId === c.id);
    if (convoMsgs.length > 0) {
      const last = convoMsgs[convoMsgs.length - 1];
      c.lastMsgText = last.text;
      c.lastMsgTime = last.timestamp;
    } else {
      c.lastMsgText = "No messages yet.";
      c.lastMsgTime = 0;
    }
  });

  // Sort conversations by last message timestamp (most recent first)
  conversations.sort((a, b) => b.lastMsgTime - a.lastMsgTime);

  return conversations;
}

function renderConversations() {
  const deck = document.getElementById("conversations-deck");
  if (!deck) return;

  const user = getChatCurrentUser();
  const convos = loadAllConversations();
  
  let filtered = convos.filter(c => {
    const nameMatch = c.partnerName.toLowerCase().includes(chatSearchQuery.toLowerCase());
    const roleMatch = c.partnerRole.toLowerCase().includes(chatSearchQuery.toLowerCase());
    const contextMatch = c.context.toLowerCase().includes(chatSearchQuery.toLowerCase());
    return nameMatch || roleMatch || contextMatch;
  });

  // Filter based on selected admin role tab
  if (adminFilterRole === "donors") {
    filtered = filtered.filter(c => c.partnerRole === "Donor");
  } else if (adminFilterRole === "recipients") {
    filtered = filtered.filter(c => c.partnerRole === "Recipient");
  }

  if (filtered.length === 0) {
    deck.innerHTML = `<div style="padding:24px; text-align:center; color:var(--ink-faint);">No conversations found.</div>`;
    return;
  }

  const readStatus = JSON.parse(localStorage.getItem("sfrn_chat_read_status") || "{}");

  deck.innerHTML = filtered.map(c => {
    const timeStr = c.lastMsgTime > 0 ? formatChatTime(c.lastMsgTime) : "";
    const activeClass = c.id === activeConvoId ? "active" : "";
    
    const lastRead = readStatus[c.id]?.[user.email] || 0;
    const isUnread = c.lastMsgTime > lastRead && c.lastMsgTime > 0;
    const unreadDot = isUnread ? `<span class="convo-unread"></span>` : "";

    const initials = c.partnerName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    const avatarHtml = c.photo 
      ? `<div class="convo-avatar" style="background-image: url('${c.photo}')"></div>`
      : `<div class="convo-avatar" style="display:flex; align-items:center; justify-content:center; background:#EAF0EB; color:var(--blue-dark); font-weight:700; font-family:var(--font-display);">${initials}</div>`;

    return `
      <div class="convo-item ${activeClass}" onclick="selectConversation('${c.id}')">
        ${avatarHtml}
        <div class="convo-info">
          <div class="convo-meta">
            <span class="convo-name">${c.partnerName}</span>
            <span class="convo-time">${timeStr}</span>
          </div>
          <div class="convo-preview-row">
            <span class="convo-preview">${c.lastMsgText}</span>
            ${unreadDot}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function selectConversation(convoId) {
  activeConvoId = convoId;
  const user = getChatCurrentUser();
  const convos = loadAllConversations();
  const convo = convos.find(c => c.id === convoId);
  
  if (!convo) return;

  document.getElementById("chat-empty-state").style.display = "none";
  document.getElementById("chat-active-panel").style.display = "flex";

  document.getElementById("chat-conversations-list").classList.add("hidden-mobile");
  document.getElementById("chat-active-window").classList.add("active-mobile");

  document.getElementById("active-partner-name").textContent = convo.partnerName;
  document.getElementById("active-partner-role").textContent = convo.partnerRole;
  document.getElementById("active-context").textContent = convo.context;

  const initials = convo.partnerName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const avatarContainer = document.getElementById("active-partner-avatar");
  if (convo.photo) {
    avatarContainer.style.backgroundImage = `url('${convo.photo}')`;
    avatarContainer.innerHTML = "";
  } else {
    avatarContainer.style.backgroundImage = "none";
    avatarContainer.style.display = "flex";
    avatarContainer.style.alignItems = "center";
    avatarContainer.style.justifyContent = "center";
    avatarContainer.style.background = "#EAF0EB";
    avatarContainer.style.color = "var(--blue-dark)";
    avatarContainer.style.fontWeight = "700";
    avatarContainer.innerHTML = initials;
  }

  const readStatus = JSON.parse(localStorage.getItem("sfrn_chat_read_status") || "{}");
  if (!readStatus[convoId]) readStatus[convoId] = {};
  readStatus[convoId][user.email] = Date.now();
  localStorage.setItem("sfrn_chat_read_status", JSON.stringify(readStatus));

  renderMessages();
  renderConversations();
}

// Function to allow filtering by All/Donors/Recipients in Admin View
function filterAdminConversations(role) {
  adminFilterRole = role;
  
  // Update class highlight on Admin Filter tabs
  const tabs = document.querySelectorAll("#chat-admin-filters .filter-tab");
  tabs.forEach(tab => {
    tab.classList.toggle("active", tab.dataset.role === role);
  });

  renderConversations();
}

function renderMessages() {
  const container = document.getElementById("chat-messages-scroll");
  if (!container || !activeConvoId) return;

  const user = getChatCurrentUser();
  const allMessages = JSON.parse(localStorage.getItem("sfrn_chat_messages") || "[]");
  const convoMsgs = allMessages.filter(m => m.convoId === activeConvoId);

  if (convoMsgs.length === 0) {
    container.innerHTML = `<div style="padding:24px; text-align:center; color:var(--ink-faint);">No messages yet. Say hello!</div>`;
    return;
  }

  container.innerHTML = convoMsgs.map(m => {
    const isSent = m.senderEmail === user.email;
    const wrapperClass = isSent ? "sent" : "received";
    const timeStr = formatChatMessageTime(m.timestamp);

    return `
      <div class="msg-wrapper ${wrapperClass}">
        <div class="msg-bubble">${escapeHtml(m.text)}</div>
        <span class="msg-time">${timeStr}</span>
      </div>
    `;
  }).join("");

  container.scrollTop = container.scrollHeight;
}

function sendChatMessage(event) {
  if (event) event.preventDefault();
  const input = document.getElementById("chat-message-input");
  if (!input || !input.value.trim() || !activeConvoId) return;

  const user = getChatCurrentUser();
  const text = input.value.trim();
  
  const allMessages = JSON.parse(localStorage.getItem("sfrn_chat_messages") || "[]");
  
  const newMsg = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    convoId: activeConvoId,
    senderEmail: user.email,
    senderName: user.name,
    senderRole: user.role,
    text: text,
    timestamp: Date.now()
  };

  allMessages.push(newMsg);
  localStorage.setItem("sfrn_chat_messages", JSON.stringify(allMessages));

  const readStatus = JSON.parse(localStorage.getItem("sfrn_chat_read_status") || "{}");
  if (!readStatus[activeConvoId]) readStatus[activeConvoId] = {};
  readStatus[activeConvoId][user.email] = Date.now();
  localStorage.setItem("sfrn_chat_read_status", JSON.stringify(readStatus));

  input.value = "";
  
  renderMessages();
  renderConversations();
}

function handleChatSearch() {
  const input = document.getElementById("chat-convo-search");
  chatSearchQuery = input ? input.value : "";
  renderConversations();
}

function goBackToConversations() {
  document.getElementById("chat-conversations-list").classList.remove("hidden-mobile");
  document.getElementById("chat-active-window").classList.remove("active-mobile");
}

function formatChatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (isYesterday) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

function formatChatMessageTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Background sync loop for real-time updates
setInterval(() => {
  const chatTab = document.getElementById("screen-chat");
  if (chatTab && chatTab.classList.contains("active")) {
    renderConversations();
    if (activeConvoId) {
      renderMessages();
    }
  }
}, 3000);

function seedDemoMessages() {
  if (localStorage.getItem("sfrn_chat_messages")) return;
  
  const messages = [];
  const now = Date.now();
  
  // 1. Recipient Support Convo Seed
  messages.push({
    id: "seed-msg-1",
    convoId: "convo-admin-sarah@hopefoodpantry.org",
    senderEmail: "admin@nourishshare.org",
    senderName: "Nourish & Share Admin",
    senderRole: "Admin",
    text: "Welcome to the Nourish & Share network! Let us know if you have any questions about reserving food.",
    timestamp: now - 3600000 * 2
  });
  messages.push({
    id: "seed-msg-2",
    convoId: "convo-admin-sarah@hopefoodpantry.org",
    senderEmail: "sarah@hopefoodpantry.org",
    senderName: "Hope Food Pantry",
    senderRole: "Recipient",
    text: "Thank you! The platform has been really easy to use so far.",
    timestamp: now - 3600000
  });
  messages.push({
    id: "seed-msg-3",
    convoId: "convo-admin-sarah@hopefoodpantry.org",
    senderEmail: "admin@nourishshare.org",
    senderName: "Nourish & Share Admin",
    senderRole: "Admin",
    text: "Great to hear! We are here to support your community mission.",
    timestamp: now - 1800000
  });

  // 2. Donor Support Convo Seed
  messages.push({
    id: "seed-msg-4",
    convoId: "convo-admin-contact@freshmart.com",
    senderEmail: "admin@nourishshare.org",
    senderName: "Nourish & Share Admin",
    senderRole: "Admin",
    text: "Thank you for listing your fresh surplus food on the network! Let us know if you need help with pickup coordinates.",
    timestamp: now - 3600000 * 3
  });

  // 3. Dynamic Reservation-linked Convo Seed
  const donations = JSON.parse(localStorage.getItem("donor_donations") || "[]");
  donations.forEach(d => {
    if (d.reserved && d.reservedBy) {
      const convoId = `convo-donor-recipient-${d.id}`;
      messages.push({
        id: `seed-msg-res-1-${d.id}`,
        convoId: convoId,
        senderEmail: d.reservedBy,
        senderName: d.recipientName || "Recipient",
        senderRole: "Recipient",
        text: `Hello! We've successfully reserved the "${d.foodName}". We are planning to pick it up during the specified window. Does that work for you?`,
        timestamp: now - 3600000
      });
      messages.push({
        id: `seed-msg-res-2-${d.id}`,
        convoId: convoId,
        senderEmail: d.donorEmail || "contact@freshmart.com",
        senderName: d.donorName || "Fresh Mart",
        senderRole: "Donor",
        text: `Hi! Yes, that works perfectly. The crates are packaged and labeled. See you soon!`,
        timestamp: now - 1800000
      });
    }
  });

  localStorage.setItem("sfrn_chat_messages", JSON.stringify(messages));
}

