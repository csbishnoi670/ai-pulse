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

        // Path logic
        const dataPath = 'data/latest.json';

        try {
            const response = await fetch(dataPath);
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            
            const data = await response.json();

            if (data.date) updateDateBadge.textContent = `Roundup: ${data.date}`;

            // Render News
            if (data.news) {
                newsGrid.innerHTML = data.news.map(item => `
                    <article class="card news-card fade-in">
                        <div class="card-header"><span class="tag">Breaking News</span></div>
                        <h3>${item.title}</h3>
                        <div class="gist-section">
                            <ul>${item.gist.map(g => `<li>${g}</li>`).join('')}</ul>
                        </div>
                        <div class="expandable-content">
                            <div class="deep-dive"><p>${item.full_summary}</p></div>
                            <div class="utility-tip"><strong>Why it matters:</strong> ${item.tip}</div>
                        </div>
                        <div class="card-footer">
                            <button class="read-more-btn">Read More</button>
                            <a href="${item.link}" class="source-link" target="_blank">Source ↗</a>
                        </div>
                    </article>
                `).join('');
            }

            // Render Tools
            if (data.tools) {
                toolsGrid.innerHTML = data.tools.map(tool => `
                    <article class="card tool-card fade-in">
                        <div class="card-header"><span class="tag">Trending Tool</span></div>
                        <h3>${tool.name}</h3>
                        <p class="gist-section">${tool.description}</p>
                        <div class="card-footer">
                            <a href="${tool.link}" class="source-link" target="_blank">Try Tool ↗</a>
                        </div>
                    </article>
                `).join('');
            }

            // Render Meme
            if (data.meme && data.meme.link) {
                memeGrid.innerHTML = `
                    <div class="meme-wrapper">
                        <p class="gist-section" style="text-align:center; margin-bottom:1.5rem;">${data.meme.description}</p>
                        <div id="tweet-container"></div>
                    </div>`;
                
                const tweetId = data.meme.link.split('/').pop().split('?')[0];
                if (window.twttr && window.twttr.widgets) {
                    window.twttr.widgets.createTweet(tweetId, document.getElementById('tweet-container'), {
                        theme: body.getAttribute('data-theme'),
                        align: 'center'
                    });
                }
            }

        } catch (error) {
            console.error('AI Pulse Loading Error:', error);
            newsGrid.innerHTML = `
                <div style="text-align: center; padding: 2rem; border: 1px solid var(--border-color); border-radius: 20px;">
                    <p class='error'><strong>Signal Error:</strong> ${error.message}</p>
                    <p style="font-size: 0.9rem; opacity: 0.7; margin-top: 1rem;">
                        This usually means the data file is missing or the server blocked the request. 
                        Please ensure <code>data/latest.json</code> exists in your repository.
                    </p>
                </div>`;
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
