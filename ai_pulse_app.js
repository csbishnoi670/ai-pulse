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

    async function loadWeeklyData() {
        const newsGrid = document.getElementById('news-grid');
        const toolsGrid = document.getElementById('tools-grid');
        const memeGrid = document.getElementById('meme-grid');
        const updateDateBadge = document.getElementById('update-date');

        try {
            const response = await fetch('data/latest.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            if (data.date) updateDateBadge.textContent = `Roundup: ${data.date}`;

            // DEFENSIVE NEWS RENDERING
            if (data.news && Array.isArray(data.news)) {
                newsGrid.innerHTML = data.news.map(item => {
                    const title = item.title || item.story || "AI Headline";
                    const link = item.link || item.url || "#";
                    const gist = Array.isArray(item.gist) ? item.gist : ["High-signal update available", "Click source for full details"];
                    const summary = item.full_summary || "Our agent is verifying the deep-dive details for this story. Check the source for the full report.";
                    const tip = item.tip || "Stay tuned for actionable implementation tips.";

                    return `
                    <article class="card news-card fade-in">
                        <div class="card-header"><span class="tag">Breaking News</span></div>
                        <h3>${title}</h3>
                        <div class="gist-section">
                            <ul>${gist.map(g => `<li>${g}</li>`).join('')}</ul>
                        </div>
                        <div class="expandable-content">
                            <div class="deep-dive"><p>${summary}</p></div>
                            <div class="utility-tip"><strong>Why it matters:</strong> ${item.tip}</div>
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
                    const name = tool.name || "AI Tool";
                    const desc = tool.description || tool.desc || "Trending breakthrough in the AI ecosystem.";
                    const link = tool.link || tool.url || "#";

                    return `
                    <article class="card tool-card fade-in">
                        <div class="card-header"><span class="tag">Trending Tool</span></div>
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
                const desc = data.meme.description || data.meme.title || "Viral AI Pulse";
                let link = data.meme.link || data.meme.url;
                
                // Ensure link is a string before calling .includes()
                if (link && typeof link === 'string' && (link.includes('x.com') || link.includes('twitter.com'))) {
                    memeGrid.innerHTML = `
                        <div class="meme-wrapper">
                            <p class="gist-section" style="text-align:center; margin-bottom:1.5rem;">${desc}</p>
                            <div id="tweet-container"></div>
                        </div>`;
                    
                    const tweetId = link.split('/').pop().split('?')[0];
                    if (window.twttr && window.twttr.widgets) {
                        window.twttr.widgets.createTweet(tweetId, document.getElementById('tweet-container'), {
                            theme: body.getAttribute('data-theme'),
                            align: 'center'
                        });
                    }
                } else {
                    memeGrid.innerHTML = `<p style="text-align:center; opacity:0.6;">Curating this week's viral AI signal...</p>`;
                }
            }

        } catch (error) {
            console.error('Render Error:', error);
            newsGrid.innerHTML = `<p class='error'>Loading Error: ${error.message}. Please refresh.</p>`;
        }
    }

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('read-more-btn')) {
            const btn = e.target;
            const card = btn.closest('.card');
            const isExpanded = card.classList.toggle('expanded');
            btn.textContent = isExpanded ? 'Show Less' : 'Read More';
        }
    });

    loadWeeklyData();
});
