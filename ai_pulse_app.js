document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const savedTheme = localStorage.getItem('pulse-theme') || 'dark';
    body.setAttribute('data-theme', savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = body.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            body.setAttribute('data-theme', newTheme);
            localStorage.setItem('pulse-theme', newTheme);
            loadWeeklyData(); 
        });
    }

    const escapeHTML = (str) => {
        if (typeof str !== 'string') return str;
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    };

    async function loadWeeklyData() {
        const newsGrid = document.getElementById('news-grid');
        const toolsGrid = document.getElementById('tools-grid');
        const memeGrid = document.getElementById('meme-grid');
        const updateDateBadge = document.getElementById('update-date');
        
        // Setup Intersection Observer for scroll animations
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        try {
            // Artificial delay to show off the fancy new skeletons
            await new Promise(resolve => setTimeout(resolve, 800));
            const response = await fetch('data/latest.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            if (data.date) updateDateBadge.textContent = `Roundup: ${data.date}`;

            // DEFENSIVE NEWS RENDERING
            if (data.news && Array.isArray(data.news)) {
                newsGrid.innerHTML = data.news.map(item => {
                    const title = escapeHTML(item.title || item.story || "AI Headline");
                    const link = escapeHTML(item.link || item.url || "#");
                    const gist = Array.isArray(item.gist) ? item.gist.map(escapeHTML) : ["High-signal update available", "Click source for full details"];
                    const summary = escapeHTML(item.full_summary || "Our agent is verifying the deep-dive details for this story. Check the source for the full report.");
                    const tip = escapeHTML(item.tip || "Stay tuned for actionable implementation tips.");
                    const cardDate = escapeHTML(data.date || "Mar 14, 2026");

                    return `
                    <article class="card news-card fade-in">
                        <div class="card-header">
                            <span class="tag">Breaking News</span>
                            <span style="font-size: 0.75rem; color: var(--secondary-text); margin-left: 0.5rem; opacity: 0.8;">${cardDate}</span>
                        </div>
                        <h3>${title}</h3>
                        <div class="gist-section">
                            <ul>${gist.map(g => `<li>${g}</li>`).join('')}</ul>
                        </div>
                        <div class="expandable-content">
                            <div class="deep-dive"><p>${summary}</p></div>
                            <div class="utility-tip"><strong>Why it matters:</strong> ${tip}</div>
                        </div>
                        <div class="card-footer">
                            <button class="read-more-btn" aria-expanded="false">Read More</button>
                            <a href="${link}" class="source-link" target="_blank">Source ↗</a>
                        </div>
                    </article>
                `}).join('');
            }

            // DEFENSIVE TOOLS RENDERING
            if (data.tools && Array.isArray(data.tools)) {
                toolsGrid.innerHTML = data.tools.map(tool => {
                    const name = escapeHTML(tool.name || "AI Tool");
                    const desc = escapeHTML(tool.description || tool.desc || "Trending breakthrough in the AI ecosystem.");
                    const link = escapeHTML(tool.link || tool.url || "#");
                    
                    let useCase = tool.use_case || "Productivity";
                    // Shorten use case based on tool name
                    if (name.includes("Copilot Cowork")) useCase = "Teams";
                    else if (name.includes("Cross-App Synthesis")) useCase = "Productivity";
                    else if (name.includes("Nemotron 3 Super")) useCase = "Developers";
                    else if (name.includes("ChatGPT Tasks")) useCase = "Automation";
                    else if (name.includes("Enterprise Marketplace")) useCase = "Enterprise";
                    else if (name.includes("OpenClaw")) useCase = "Developers";

                    useCase = escapeHTML(useCase);
                    const pricing = escapeHTML(tool.pricing || "Freemium");
                    const pricingClass = `badge-${pricing.toLowerCase().split(' ')[0]}`;

                    return `
                    <article class="card tool-card fade-in">
                        <div class="card-header">
                            <span class="tag">Trending Tool</span>
                        </div>
                        <div class="badge-container" style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: nowrap; overflow: hidden; white-space: nowrap;">
                            <span class="tool-badge badge-usecase" style="flex-shrink: 0;">Best for: ${useCase}</span>
                            <span style="opacity: 0.5;">·</span>
                            <span class="tool-badge ${pricingClass}" style="flex-shrink: 0;">${pricing}</span>
                        </div>
                        <h3>${name}</h3>
                        <p class="gist-section">${desc}</p>
                        <div class="card-footer">
                            <a href="${link}" class="source-link" target="_blank">Try Tool ↗</a>
                        </div>
                    </article>
                `}).join('');
            }

            // FIXED: DEFENSIVE MEME RENDERING WITH TYPE CHECK
            if (data.meme) {
                const desc = escapeHTML(data.meme.description || data.meme.title || "Viral AI Pulse");
                let link = data.meme.link || data.meme.url;
                
                if (link && typeof link === 'string' && (link.includes('x.com') || link.includes('twitter.com'))) {
                    memeGrid.innerHTML = `
                        <div class="meme-wrapper">
                            <p class="gist-section" style="text-align:center; margin-bottom:1.5rem;">${desc}</p>
                            <div id="tweet-container"></div>
                        </div>`;
                    
                    let tweetId = '';
                    try {
                        const url = new URL(link);
                        if (url.pathname.includes('/status/')) {
                            tweetId = url.pathname.split('/status/')[1].split('/')[0];
                        } else if (url.pathname.includes('/video/')) {
                            // Some forms might be video
                            tweetId = url.pathname.split('/video/')[1].split('/')[0];
                        } else {
                            // Fallback if it ends with ID without status
                            const potentialId = url.pathname.split('/').pop().split('?')[0];
                            if (potentialId && !isNaN(potentialId)) {
                                tweetId = potentialId;
                            }
                        }
                    } catch (e) {
                        console.warn('Could not parse tweet ID from URL', e);
                    }

                    if (tweetId && window.twttr && window.twttr.widgets) {
                        window.twttr.widgets.createTweet(tweetId, document.getElementById('tweet-container'), {
                            theme: body.getAttribute('data-theme'),
                            align: 'center'
                        });
                    } else if (!tweetId) {
                        memeGrid.innerHTML += `<p style="text-align:center; opacity:0.6;"><a href="${escapeHTML(link)}" target="_blank" style="color:var(--accent-color);">View the meme on X</a></p>`;
                    }
                } else {
                    memeGrid.innerHTML = `<p style="text-align:center; opacity:0.6;">Curating this week's viral AI signal...</p>`;
                }
            }

            // Attach observer to newly rendered sections and existing static sections
            document.querySelectorAll('.fade-in:not(.hero-content)').forEach(el => observer.observe(el));

        } catch (error) {
            console.error('Render Error:', error);
            newsGrid.innerHTML = `<p class='error'>Loading Error: ${error.message}. Please refresh.</p>`;
        }
    }

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('read-more-btn')) {
            const btn = e.target;
            const card = btn.closest('.card');
            if (card) {
                const isExpanded = card.classList.toggle('expanded');
                btn.textContent = isExpanded ? 'Show Less' : 'Read More';
            }
        }
    });

    // Form submission handler
    const subscribeForm = document.querySelector('.subscribe-form');
    if (subscribeForm) {
        subscribeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = subscribeForm.querySelector('input[type="email"]');
            const submitBtn = subscribeForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // Simple visual feedback
            submitBtn.textContent = 'Subscribed! 🎉';
            submitBtn.style.backgroundColor = '#48bb78'; // Use green color for success
            emailInput.value = '';
            
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.style.backgroundColor = '';
            }, 3000);
        });
    }

    loadWeeklyData();
});
