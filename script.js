document.addEventListener('DOMContentLoaded', () => {

    /* ==============================================
       1. LOADING SCREEN REMOVAL
    ============================================== */
    const loader = document.getElementById('loader');
    setTimeout(() => {
        loader.classList.add('fade-out');
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500); 
    }, 1500); // Shory display to simulate "booting sequence"

    /* ==============================================
       2. STICKY NAVBAR & MOBILE MENU
    ============================================== */
    const navbar = document.getElementById('navbar');
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        // Toggle icon between bars and close
        const icon = menuToggle.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    /* ==============================================
       3. INTERSECTION OBSERVER FOR SCROLL ANIMATIONS
    ============================================== */
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Trigger when 15% of element is visible
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing once initially revealed
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-in, .slide-in');
    animatedElements.forEach(el => scrollObserver.observe(el));

    /* ==============================================
       4. ANIMATED COUNTERS (ACHIEVEMENTS)
    ============================================== */
    const counters = document.querySelectorAll('.counter');
    let hasCounted = false;

    const counterObserver = new IntersectionObserver((entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasCounted) {
            hasCounted = true;
            counters.forEach(counter => {
                const target = +counter.getAttribute('data-target');
                const duration = 2000; // 2 seconds
                const increment = target / (duration / 16); // 60 FPS update roughly
                
                let current = 0;
                
                const updateCounter = () => {
                    current += increment;
                    if (current < target) {
                        counter.innerText = Math.ceil(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.innerText = target;
                    }
                };
                
                updateCounter();
            });
        }
    }, { threshold: 0.5 });
    
    // Defaulting to observing the achievements section
    const achievementSection = document.getElementById('achievements');
    if(achievementSection) counterObserver.observe(achievementSection);

    /* ==============================================
       5. MIKKI AI & VOICE LOGIC
    ============================================== */
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const closeChat = document.getElementById('close-chat');
    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');
    const sendMsg = document.getElementById('send-msg');
    const chatBody = document.getElementById('chat-body');
    const micBtn = document.getElementById('mic-btn');

    // Toggle Chat
    if (chatbotToggle && closeChat && chatWindow) {
        chatbotToggle.addEventListener('click', () => {
            chatWindow.classList.add('active');
            chatbotToggle.style.display = 'none';
            if (chatInput) chatInput.focus();
        });

        closeChat.addEventListener('click', () => {
            chatWindow.classList.remove('active');
            setTimeout(() => { chatbotToggle.style.display = 'flex'; }, 300);
            window.speechSynthesis.cancel(); // Stop talking if closed
        });
    }

    // Auto Append Message Helper
    const appendMessage = (text, sender) => {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message');
        msgDiv.classList.add(sender === 'user' ? 'user-msg' : 'bot-msg');
        
        // Remove markdown formatting for ui display if any
        let cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '');
        msgDiv.innerHTML = `<p>${cleanText}</p>`;
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    };
    
    // Setup Speech Synthesis Object
    const speakText = (text) => {
        window.speechSynthesis.cancel(); // Clear queue
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.1; // Slightly higher pitch for AI vibe
        
        // Try to grab a female English voice if available
        let voices = window.speechSynthesis.getVoices();
        let selectedVoice = voices.find(voice => voice.name.includes("Female") || voice.name.includes("Google UK English Female"));
        if (selectedVoice) utterance.voice = selectedVoice;
        
        window.speechSynthesis.speak(utterance);
    };

    // Make window voices load asynchronously
    window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };

    // Setup Speech Recognition Object
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isListening = false;
    
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isListening = true;
            if(micBtn) {
                micBtn.style.background = '#e3342f'; // Red for recording
                micBtn.style.color = '#fff';
                micBtn.innerHTML = '<i class="fa-solid fa-microphone-lines fa-fade"></i>';
            }
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if(chatInput) chatInput.value = transcript;
            handleSend(true); // True marks that it came from voice
        };

        recognition.onerror = (e) => {
            console.error("Mic error", e);
            stopListening();
        };

        recognition.onend = () => {
            stopListening();
        };
    } else {
        if(micBtn) micBtn.style.display = 'none'; // Hide mic if not supported
    }

    const stopListening = () => {
        isListening = false;
        if(micBtn) {
            micBtn.style.background = '';
            micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        }
    };

    if (micBtn) {
        micBtn.addEventListener('click', () => {
            if (isListening) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
    }

    // Mikki Brain Fetch Request
    const handleSend = async (fromVoice = false) => {
        if (!chatInput) return;
        const text = chatInput.value.trim();
        if (text !== '') {
            appendMessage(text, 'user');
            chatInput.value = '';
            
            // Show typing indicator
            const typingDiv = document.createElement('div');
            typingDiv.classList.add('message', 'bot-msg');
            typingDiv.innerHTML = `<p><i class="fa-solid fa-microchip fa-fade"></i> Processing...</p>`;
            chatBody.appendChild(typingDiv);
            chatBody.scrollTop = chatBody.scrollHeight;
            
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text })
                });

                const data = await response.json();
                chatBody.removeChild(typingDiv);
                
                if (response.ok) {
                    appendMessage(data.reply, 'bot');
                    // Clean text for speech (remove markdown stars)
                    let cleanSpokenText = data.reply.replace(/\*\*/g, '').replace(/\*/g, '');
                    speakText(cleanSpokenText);
                } else {
                    appendMessage(`Error: ${data.error}`, 'bot');
                }
            } catch (err) {
                chatBody.removeChild(typingDiv);
                appendMessage("CRITICAL ERROR: Failed to connect to AI Core.", 'bot');
            }
        }
    };

    if (sendMsg && chatInput) {
        sendMsg.addEventListener('click', () => handleSend(false));
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSend(false);
        });
    }

    /* ==============================================
       6. INTERACTIVE PROJECTS LOGIC
    ============================================== */
    const mainBox = document.getElementById('main-project-box');
    const transitionBox = document.getElementById('transition-text-box');
    const transitionText = document.getElementById('transition-text');
    const selectionView = document.getElementById('project-selection-view');
    const paperView = document.getElementById('paper-view');
    const paperIframe = document.getElementById('paper-iframe');
    const backBtn = document.getElementById('back-to-projects');
    const btnProj1 = document.getElementById('btn-proj-1');
    const btnProj2 = document.getElementById('btn-proj-2');

    const showTransitionText = (text, callback) => {
        transitionText.innerText = text;
        transitionBox.classList.remove('transition-text-hidden');
        transitionBox.classList.add('transition-text-visible');
        
        // Hide after 2 seconds
        setTimeout(() => {
            transitionBox.classList.remove('transition-text-visible');
            transitionBox.classList.add('transition-text-hidden');
            setTimeout(callback, 600); // Wait for fade out CSS transition
        }, 2000);
    };

    if (mainBox) {
        mainBox.addEventListener('click', () => {
            mainBox.style.display = 'none';
            showTransitionText('welcome buddy', () => {
                selectionView.classList.remove('hidden');
            });
        });

        btnProj1.addEventListener('click', () => {
            selectionView.classList.add('hidden');
            showTransitionText('ANOMALY DETECTION OF MEDICAL IMAGE USING AI AND ENSURE DATA PRIVACY', () => {
                paperIframe.src = 'project1_paper.pdf';
                paperView.classList.remove('hidden');
            });
        });

        btnProj2.addEventListener('click', () => {
            selectionView.classList.add('hidden');
            showTransitionText('SECURE EEG AND MEDICAL REPORT WITH AUTHENTICATIONS AND BLOCKCHAIN', () => {
                paperIframe.src = 'project2_paper.pdf';
                paperView.classList.remove('hidden');
            });
        });

        backBtn.addEventListener('click', () => {
            paperView.classList.add('hidden');
            paperIframe.src = '';
            selectionView.classList.remove('hidden');
        });
    }

    /* ==============================================
       7. SMS LETTER BOX SUBMISSION (TextBelt API)
    ============================================== */
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button');
            const originalText = btn.innerHTML;
            
            const name = document.getElementById('name').value;
            const message = document.getElementById('message').value;

            if (!name || !message) {
                alert("⚠️ Please provide an Alias and Your Thoughts.");
                return;
            }

            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Deploying...`;
            
            try {
                // The Ultimate Zero-Auth Invisible Email Box!
                const response = await fetch('https://formsubmit.co/ajax/harishhh808010@gmail.com', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ 
                        _subject: "New Message from Portfolio Letter Box!",
                        Alias: name, 
                        Message: message 
                    })
                });

                const resData = await response.json();

                if (response.ok) {
                    btn.innerHTML = `<i class="fa-solid fa-check"></i> Successfully Deployed`;
                    btn.style.background = '#10B981'; // Green
                    contactForm.reset();
                } else {
                    btn.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Transmission Blocked`;
                    btn.style.background = '#e3342f'; // Red
                }
            } catch (error) {
                btn.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Network Error`;
                btn.style.background = '#e3342f'; // Red
            }

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = ''; // reset to CSS default
                btn.style.fontSize = '';
            }, 4500);
        });
    }
});
