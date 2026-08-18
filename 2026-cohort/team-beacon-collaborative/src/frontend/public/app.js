// ================= MOCK INITIAL STATE DATA =================
let foodDonations = [
  {
    id: 1,
    title: "Assorted Sweet Pastries & Croissants",
    donor: "Baker's Delight",
    category: "bakery",
    quantity: "15 items",
    expiry: "Expires in 2 hours",
    isUrgent: true,
    distance: "0.4 mi away",
    address: "89 Bakers Street",
    instructions: "Packed in cardboard boxes. Contains dairy, eggs, and gluten.",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: 2,
    title: "Fresh Organic Spinach Bags",
    donor: "Green Valley Farms",
    category: "produce",
    quantity: "12 bags",
    expiry: "Expires in 6 hours",
    isUrgent: false,
    distance: "1.2 mi away",
    address: "Farm Rd 4, Sector B",
    instructions: "Harvested this morning. Kept in cold crates.",
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: 3,
    title: "Roasted Veggie Pasta Boxes",
    donor: "Organic Bistro",
    category: "prepared",
    quantity: "8 boxes",
    expiry: "Expires in 3 hours",
    isUrgent: true,
    distance: "0.8 mi away",
    address: "402 Green Ave",
    instructions: "Vegan and nut-free. Standard restaurant takeaway containers.",
    image: "https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: 4,
    title: "Whole Wheat Sandwich Loaves",
    donor: "Fresh Foods Market",
    category: "bakery",
    quantity: "20 loaves",
    expiry: "Expires in 1 day",
    isUrgent: false,
    distance: "0.9 mi away",
    address: "90 Main St",
    instructions: "Pre-sliced and bagged. Contains wheat gluten.",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80"
  }
];

// Active filters
let currentCategory = "all";
let searchQuery = "";

// ================= DOM CONTENT INITIALIZATION =================
document.addEventListener("DOMContentLoaded", () => {
  initDesktopNav();
  initMobileDrawer();
  initMetricsCounter();
  initFoodFinder();
  initInteractiveMap();
  initFormsAndModals();
  initFormInstantValidation();
});

// ================= DESKTOP NAVIGATION =================
function initDesktopNav() {
  const navItems = document.querySelectorAll(".nav-links .nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      // If it's the donate button, prevent default to open modal smoothly
      if (item.id === "open-donate-modal-btn") {
        e.preventDefault();
      }
    });
  });
}

// ================= MOBILE NAVIGATION DRAWER =================
function initMobileDrawer() {
  const menuBtn = document.getElementById("mobile-menu-btn");
  const closeBtn = document.getElementById("drawer-close-btn");
  const overlay = document.getElementById("mobile-drawer-overlay");
  const drawer = document.getElementById("mobile-drawer");
  const drawerLinks = document.querySelectorAll(".drawer-item");

  const toggleDrawer = (open) => {
    drawer.classList.toggle("open", open);
    overlay.classList.toggle("open", open);
    document.body.style.overflow = open ? "hidden" : "";
  };

  menuBtn.addEventListener("click", () => toggleDrawer(true));
  closeBtn.addEventListener("click", () => toggleDrawer(false));
  overlay.addEventListener("click", () => toggleDrawer(false));

  drawerLinks.forEach(link => {
    link.addEventListener("click", () => {
      drawerLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      toggleDrawer(false);
    });
  });

}

// ================= ANIME METRICS COUNTER (SDG 2) =================
function initMetricsCounter() {
  const metrics = document.querySelectorAll(".metric-val");
  
  const options = {
    threshold: 0.5,
    rootMargin: "0px"
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const limit = parseInt(target.getAttribute("data-target"), 10);
        let count = 0;
        const speed = limit > 1000 ? 50 : 20;
        const step = Math.ceil(limit / speed);

        const updateCount = () => {
          count += step;
          if (count >= limit) {
            target.textContent = limit.toLocaleString();
          } else {
            target.textContent = count.toLocaleString();
            setTimeout(updateCount, 30);
          }
        };
        updateCount();
        observer.unobserve(target);
      }
    });
  }, options);

  metrics.forEach(metric => observer.observe(metric));
}

// ================= DYNAMIC FOOD FINDER GRID & FILTERING =================
function initFoodFinder() {
  const grid = document.getElementById("food-listings-grid");
  const searchInput = document.getElementById("search-input");
  const filterPills = document.querySelectorAll("#category-filters .filter-pill");

  // Initial render
  renderFoodCards();

  // Search input event
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderFoodCards();
  });

  // Filter pills
  filterPills.forEach(pill => {
    pill.addEventListener("click", () => {
      filterPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentCategory = pill.getAttribute("data-category");
      renderFoodCards();
    });
  });
}

function renderFoodCards() {
  const grid = document.getElementById("food-listings-grid");
  grid.innerHTML = "";

  const filtered = foodDonations.filter(item => {
    const matchesCategory = currentCategory === "all" || item.category === currentCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery) ||
                          item.donor.toLowerCase().includes(searchQuery) ||
                          item.address.toLowerCase().includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-selection-state w-100" style="grid-column: 1 / -1;">
        <i class="fa-solid fa-cookie-bite"></i>
        <p>No food listings match your search criteria. Try selecting another filter or post a new donation!</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "food-card glass-card";
    
    // Background placeholder or unsplash images
    const coverImage = item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80";

    card.innerHTML = `
      <div class="food-card-header" style="background-image: linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.65)), url('${coverImage}');">
        <span class="card-cat-badge ${item.category}">${item.category.toUpperCase()}</span>
        <span class="expiry-badge ${item.isUrgent ? 'urgent' : ''}">
          <i class="fa-solid fa-clock"></i> ${item.expiry}
        </span>
      </div>
      <div class="food-card-body">
        <h3>${item.title}</h3>
        <div class="donor-label">
          <i class="fa-solid fa-store"></i> <span>${item.donor}</span>
        </div>
        <div class="food-meta">
          <span><i class="fa-solid fa-cubes"></i> ${item.quantity}</span>
          <span><i class="fa-solid fa-map-pin"></i> ${item.distance}</span>
        </div>
        <div class="food-card-footer">
          <button class="btn btn-primary w-100 claim-trigger" data-id="${item.id}">
            <i class="fa-solid fa-circle-check"></i> Claim Food
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // Attach claim modal events
  document.querySelectorAll(".claim-trigger").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const donationId = parseInt(btn.getAttribute("data-id"), 10);
      setupAndOpenClaimModal(donationId);
    });
  });
}

// ================= INTERACTIVE DISTRIBUTION MAP =================
function initInteractiveMap() {
  const pins = document.querySelectorAll(".map-pin");
  const detailPanel = document.getElementById("map-selection-detail");

  pins.forEach(pin => {
    pin.addEventListener("click", () => {
      pins.forEach(p => p.classList.remove("active"));
      pin.classList.add("active");

      const id = parseInt(pin.getAttribute("data-id"), 10);
      const donation = foodDonations.find(item => item.id === id);

      if (donation) {
        detailPanel.innerHTML = `
          <div class="map-detail-card">
            <h4>${donation.title}</h4>
            <span class="category">${donation.category.toUpperCase()}</span>
            <div class="map-detail-meta">
              <div><i class="fa-solid fa-building"></i> <strong>Donor:</strong> ${donation.donor}</div>
              <div><i class="fa-solid fa-location-dot"></i> <strong>Location:</strong> ${donation.address}</div>
              <div><i class="fa-solid fa-clock"></i> <strong>Availability:</strong> ${donation.expiry}</div>
              <div><i class="fa-solid fa-box"></i> <strong>Quantity:</strong> ${donation.quantity}</div>
            </div>
            <button class="btn btn-secondary w-100 claim-trigger" data-id="${donation.id}">
              <i class="fa-solid fa-circle-check"></i> Claim Listing
            </button>
          </div>
        `;

        // Attach action events inside side panel claim buttons
        detailPanel.querySelector(".claim-trigger").addEventListener("click", () => {
          setupAndOpenClaimModal(donation.id);
        });
      } else {
        detailPanel.innerHTML = `
          <div class="empty-selection-state">
            <i class="fa-solid fa-circle-info"></i>
            <p>Donor node offline or claimed. Please select another active pin.</p>
          </div>
        `;
      }
    });
  });
}

// ================= FORMS & MODALS SYSTEM =================
function initFormsAndModals() {
  const openDonateBtn = document.getElementById("open-donate-modal-btn");
  const heroDonateBtn = document.getElementById("hero-donate-trigger");
  const closeDonateBtn = document.getElementById("close-donate-modal");
  const donateModal = document.getElementById("donate-modal");

  const closeClaimBtn = document.getElementById("close-claim-modal");
  const claimModal = document.getElementById("claim-modal");

  // Open Donate Modal
  const openDonate = () => openModal("donate-modal");
  if (openDonateBtn) openDonateBtn.addEventListener("click", openDonate);
  if (heroDonateBtn) heroDonateBtn.addEventListener("click", openDonate);
  const homeJoinDonateBtn = document.getElementById("home-join-donate");
  if (homeJoinDonateBtn) homeJoinDonateBtn.addEventListener("click", openDonate);

  // Close Donate Modal
  closeDonateBtn.addEventListener("click", () => closeModal("donate-modal"));
  closeClaimBtn.addEventListener("click", () => closeModal("claim-modal"));

  // Click outside to close modals
  window.addEventListener("click", (e) => {
    if (e.target === donateModal) closeModal("donate-modal");
    if (e.target === claimModal) closeModal("claim-modal");
  });

  // Handle donation submission
  const donateForm = document.getElementById("donate-food-form");
  donateForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    // Retrieve values
    const itemName = document.getElementById("don-item-name").value;
    const category = document.getElementById("don-category").value;
    const quantity = document.getElementById("don-quantity").value;
    const expiry = document.getElementById("don-expiry").value;
    const address = document.getElementById("don-distance").value;
    const instructions = document.getElementById("don-instructions").value;

    const newDonation = {
      id: foodDonations.length + 1,
      title: itemName,
      donor: "Self (Authorized Donor)",
      category: category,
      quantity: quantity,
      expiry: `Expires in ${expiry}`,
      isUrgent: expiry.toLowerCase().includes("hour"),
      distance: "0.1 mi away",
      address: address,
      instructions: instructions,
      image: getCategoryPlaceholder(category)
    };

    foodDonations.unshift(newDonation); // Add to beginning
    renderFoodCards();
    closeModal("donate-modal");
    donateForm.reset();

    // Trigger Success notification & CSS Confetti
    showToastNotification("Donation Created!", "Your surplus food is now listed for community pickup.");
    simulateSdgProgressUpdate();
  });

  // Handle claim submission
  const claimForm = document.getElementById("claim-food-form");
  claimForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const claimId = parseInt(claimForm.getAttribute("data-target-id"), 10);
    
    // Remove claimed item from lists
    foodDonations = foodDonations.filter(item => item.id !== claimId);
    renderFoodCards();
    closeModal("claim-modal");
    claimForm.reset();

    showToastNotification("Claim Successful!", "The food items have been reserved. Safe journey to your pickup location!");
  });

  // Handle partner registration submission
  const registerForm = document.getElementById("partner-registration-form");
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const orgName = document.getElementById("reg-org-name").value;
    registerForm.reset();
    showToastNotification("Registration Submitted!", `Welcome, ${orgName}! Our team is reviewing your credentials.`);
  });
}

function openModal(id) {
  document.getElementById(id).classList.add("open");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

function setupAndOpenClaimModal(id) {
  const donation = foodDonations.find(item => item.id === id);
  if (!donation) return;

  document.getElementById("claim-title").textContent = donation.title;
  document.getElementById("claim-donor").textContent = `Donated by: ${donation.donor} (${donation.address})`;
  document.getElementById("claim-meta-expiry").innerHTML = `<i class="fa-solid fa-clock"></i> ${donation.expiry}`;
  document.getElementById("claim-meta-dist").innerHTML = `<i class="fa-solid fa-location-dot"></i> ${donation.distance}`;

  const claimForm = document.getElementById("claim-food-form");
  claimForm.setAttribute("data-target-id", id);

  openModal("claim-modal");
}

function getCategoryPlaceholder(cat) {
  switch (cat) {
    case "bakery":
      return "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80";
    case "produce":
      return "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&q=80";
    case "prepared":
      return "https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=400&q=80";
    default:
      return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80";
  }
}

// ================= FORM INSTANT VALIDATION FEEDBACK =================
function initFormInstantValidation() {
  const fields = [
    { id: "reg-org-name", condition: val => val.length > 2 },
    { id: "reg-email", condition: val => val.includes("@") && val.includes(".") },
  ];

  fields.forEach(field => {
    const el = document.getElementById(field.id);
    if (!el) return;

    el.addEventListener("input", () => {
      const parent = el.closest(".form-group");
      if (field.condition(el.value)) {
        parent.classList.add("success");
      } else {
        parent.classList.remove("success");
      }
    });
  });
}

// ================= INTERACTIVE TOAST NOTIFICATIONS =================
function showToastNotification(title, desc) {
  const toast = document.getElementById("success-toast");
  document.getElementById("toast-title").textContent = title;
  document.getElementById("toast-desc").textContent = desc;

  toast.classList.add("show");
  
  // Confetti Simulation (Leaf Confetti)
  createConfettiShower();

  setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}

// Simulated SDG progress bar increments when donating
function simulateSdgProgressUpdate() {
  const progressFill = document.querySelector(".progress-bar-fill");
  const pctText = document.getElementById("goal-pct-val");
  let currentPct = parseInt(pctText.textContent, 10);
  
  if (currentPct < 98) {
    currentPct += 2;
    progressFill.style.width = `${currentPct}%`;
    pctText.textContent = currentPct;
  }
}

// Leaf-themed CSS Confetti generator
function createConfettiShower() {
  const container = document.body;
  const leavesColors = ["#81c784", "#66bb6a", "#4caf50", "#388e3c", "#a5d6a7"];
  
  for (let i = 0; i < 30; i++) {
    const leaf = document.createElement("div");
    leaf.className = "css-confetti-leaf";
    leaf.style.left = `${Math.random() * 100}vw`;
    leaf.style.top = `-20px`;
    leaf.style.backgroundColor = leavesColors[Math.floor(Math.random() * leavesColors.length)];
    leaf.style.width = `${Math.random() * 10 + 6}px`;
    leaf.style.height = `${Math.random() * 14 + 10}px`;
    leaf.style.borderRadius = "0px 10px 0px 10px"; // leaf shape
    leaf.style.position = "fixed";
    leaf.style.zIndex = "9999";
    leaf.style.opacity = Math.random();
    leaf.style.transform = `rotate(${Math.random() * 360}deg)`;
    
    // Add leaf animation inline
    leaf.animate([
      { transform: `translate(0, 0) rotate(0deg)` },
      { transform: `translate(${Math.random() * 150 - 75}px, 105vh) rotate(${Math.random() * 720}deg)` }
    ], {
      duration: Math.random() * 2000 + 2000,
      easing: "ease-out"
    });

    container.appendChild(leaf);

    // Remove element after animation
    setTimeout(() => {
      leaf.remove();
    }, 4000);
  }
}
