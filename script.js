

const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const ToggleThemeButton = document.querySelector("#Toggle_theme_button");
const DeleteChatButton = document.querySelector("#delete-chat-button");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");

let userMessage = null;
let isResponseGenerating = false;

const API_KEY = "AIzaSyDzagWlVg6oRclVOYj1X41A2yUdTJCC_B8";
// const API_KEY = config.apiKey;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const loadLocalStorageData = () => {
  const savedChats = localStorage.getItem("savedChats");
  const isLightMode = localStorage.getItem("themeColor") === "Light_mode";

  // apply theme
  document.body.classList.toggle("Light_mode", isLightMode);
  ToggleThemeButton.innerText = isLightMode ? "Dark_mode" : "light_mode";
  // restore chat
  chatList.innerHTML = savedChats || "";
  document.body.classList.toggle("hide-header", savedChats);
  chatList.scrollTo(0, chatList.scrollHeight); // scroll to bottom
};
loadLocalStorageData();

// create a new message element
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// typing Effect by displaying words one by one
const showTypingEffect = (text, textElement, messageDiv) => {
  const words = text.split(" ");
  let currentWordIndex = 0;

  const typingInterval = setInterval(() => {
    textElement.innerText +=
      (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex++];
    messageDiv.querySelector(".icon").classList.add("hide");

    if (currentWordIndex === words.length) {
      clearInterval(typingInterval);
      isResponseGenerating = false;
      messageDiv.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("savedChats", chatList.innerHTML);
    }
    chatList.scrollTo(0, chatList.scrollHeight); // scroll to bottom
  }, 75);
};

// Fetch Response from API
const generateAPIResponse = async (messageDiv) => {
  const textElement = messageDiv.querySelector(".text");
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: userMessage }],
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);
    const generatedText =
      data.candidates?.[0]?.content?.parts?.[0]?.text.replace(
        /\*\*(.*?)\*\*/g,
        "$1"
      );

    showTypingEffect(generatedText, textElement, messageDiv);

    const loadingIndicator = messageDiv.querySelector(".loading-indicator");
    if (loadingIndicator) {
      loadingIndicator.remove();
    }

    // Remove the 'loading' class from the messageDiv
    messageDiv.classList.remove("loading");
  } catch (error) {
    console.error("Error fetching API response:", error);
    textElement.innerText = error.message;
    textElement.classList.add("error");

    isResponseGenerating = false;
    const loadingIndicator = messageDiv.querySelector(".loading-indicator");
    if (loadingIndicator) {
      loadingIndicator.remove();
    }

    // Remove the 'loading' class from the messageDiv
    messageDiv.classList.remove("loading");
  }
};

const showLoadingAnimation = () => {
  const html = `
      <div class="message-content">
          <img src="gemini-color.svg" alt="Gemini image" class="avatar">
          <p class="text"></p>
          <div class="loading-indicator">
              <div class="loading-bar"></div>
              <div class="loading-bar"></div>
              <div class="loading-bar"></div>
          </div>
      </div>
      <span onClick="copyMessage(this)" class="icon material-symbols-rounded">
          content_copy
      </span>
  `;

  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatList.appendChild(incomingMessageDiv);
  chatList.scrollTo(0, chatList.scrollHeight); // scroll to bottom
  return incomingMessageDiv;
};

const copyMessage = (copyIcon) => {
  const messageText = copyIcon.parentElement.querySelector(".text").innerText;

  navigator.clipboard.writeText(messageText);
  copyIcon.innerText = "done";
  setTimeout(() => {
    copyIcon.innerText = "content_copy";
  }, 1000);
};

// Sending outgoing chat
const handleOutgoingChat = () => {
  userMessage =
    typingForm.querySelector(".typing-input").value.trim() || userMessage;
  if (!userMessage || isResponseGenerating) return;

  isResponseGenerating = true;
  const html = `
      <div class="message-content">
          <img src="https://c0.wallpaperflare.com/preview/325/981/320/avatar-people-person-business.jpg" alt="user image" class="avatar">
          <p class="text"></p>
      </div>
  `;

  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerText = userMessage;
  chatList.appendChild(outgoingMessageDiv);

  typingForm.reset();
  chatList.scrollTo(0, chatList.scrollHeight); // scroll to bottom

  document.body.classList.add("hide-header");
  const loadingDiv = showLoadingAnimation();
  setTimeout(() => generateAPIResponse(loadingDiv), 500); // Call API after delay
};

// Suggestion Click
suggestions.forEach((suggestion) => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    handleOutgoingChat();
  });
});

// Toggle Theme
ToggleThemeButton.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("Light_mode");
  localStorage.setItem("themeColor", isLightMode ? "Light_mode" : "Dark_mode");
  ToggleThemeButton.innerText = isLightMode ? "Dark_mode" : "light_mode";
});

// delete chat
DeleteChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all messages?")) {
    localStorage.removeItem("savedChats");
    loadLocalStorageData();
  }
});


typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutgoingChat();
});
