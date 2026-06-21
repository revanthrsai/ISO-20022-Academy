// UI Module - Handle interactive elements and detail panel

function openDetailPanel(messageCode) {
    const message = getMessageByCode(messageCode);
    if (!message) return;

    const panel = document.getElementById('detail-panel');
    panel.classList.add('open');

    const html = `
        <div class="detail-panel-content">
            <div class="detail-header">
                <div class="detail-title">${message.code}</div>
                <div class="detail-subtitle">${message.subtitle}</div>
            </div>

            <div class="detail-section">
                <div class="detail-label">Purpose</div>
                <div class="detail-description">${message.purpose}</div>
            </div>

            <div class="detail-section">
                <div class="detail-label">Direction</div>
                <div class="detail-value">${message.direction}</div>
            </div>

            <div class="detail-section">
                <div class="detail-label">Category</div>
                <div class="detail-value">${message.category}</div>
            </div>

            <div class="detail-section">
                <div class="detail-label">Use Cases</div>
                <div class="tags">${message.useCases.map(uc => `<span class="tag">${uc}</span>`).join('')}</div>
            </div>

            <div class="detail-section">
                <div class="detail-label">Key Fields</div>
                <div class="tags">${message.fields.map(f => `<span class="tag">${f}</span>`).join('')}</div>
            </div>

            <div class="detail-section">
                <div class="detail-label">XML Example</div>
                <div class="xml-example">${escapeHtml(message.example)}</div>
            </div>
        </div>
    `;

    panel.innerHTML = html;
}

function closeDetailPanel() {
    const panel = document.getElementById('detail-panel');
    panel.classList.remove('open');
    panel.innerHTML = '';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Render message explorer
function renderExplorer() {
    const content = document.getElementById('content');

    let familiesHtml = '';
    for (const family in DATA.messages) {
        const count = getMessageCountByFamily(family);
        familiesHtml += `
            <div class="family-card" onclick="selectFamily('${family}')">
                <div class="family-card-title">${family}</div>
                <div class="family-card-count">${count} Messages</div>
            </div>
        `;
    }

    const messagesHtml = getMessagesByFamily('CAMT')
        .map(msg => `
            <div class="message-card" onclick="openDetailPanel('${msg.code}')">${msg.code}</div>
        `).join('');

    content.innerHTML = `
        <div class="explorer-container">
            <div class="family-cards">
                ${familiesHtml}
            </div>
            <div class="message-grid">
                ${messagesHtml}
            </div>
        </div>
    `;

    // Mark first family as active
    document.querySelectorAll('.family-card')[0].classList.add('active');
}

function selectFamily(family) {
    // Update active family
    document.querySelectorAll('.family-card').forEach(card => {
        card.classList.remove('active');
    });
    event.target.closest('.family-card').classList.add('active');

    // Update messages
    const messages = getMessagesByFamily(family);
    const messagesHtml = messages
        .map(msg => `
            <div class="message-card" onclick="openDetailPanel('${msg.code}')">${msg.code}</div>
        `).join('');

    const messageGrid = document.querySelector('.message-grid');
    messageGrid.innerHTML = messagesHtml;

    // Close detail panel
    closeDetailPanel();
}

// Render glossary
function renderGlossary(items = DATA.glossary) {
    const glossaryGrid = document.getElementById('glossary-grid') || document.querySelector('.glossary-grid');
    
    if (!glossaryGrid) return;

    if (items.length === 0) {
        glossaryGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 32px; color: var(--text-muted);">No terms found</div>';
    } else {
        glossaryGrid.innerHTML = items.map(item => `
            <div class="glossary-card">
                <div class="glossary-term">${item.term}</div>
                <div class="glossary-definition">${item.definition}</div>
            </div>
        `).join('');
    }
}

function filterGlossary(query) {
    const filtered = DATA.glossary.filter(item =>
        item.term.toLowerCase().includes(query.toLowerCase()) ||
        item.definition.toLowerCase().includes(query.toLowerCase())
    );
    renderGlossary(filtered);
}

// Theme management
function toggleTheme() {
    const toggle = document.querySelector('.theme-toggle');
    const isDark = toggle.classList.contains('active');
    
    if (isDark) {
        setTheme('light');
        toggle.classList.remove('active');
    } else {
        setTheme('dark');
        toggle.classList.add('active');
    }
}

function setTheme(theme) {
    const toggle = document.querySelector('.theme-toggle');
    
    if (theme === 'dark') {
        document.body.classList.remove('light-mode');
        toggle.classList.add('active');
        localStorage.setItem('iso-theme', 'dark');
    } else {
        document.body.classList.add('light-mode');
        toggle.classList.remove('active');
        localStorage.setItem('iso-theme', 'light');
    }
}

// Initialize theme from localStorage
if (localStorage.getItem('iso-theme') === 'light') {
    setTheme('light');
} else {
    setTheme('dark');
}

// Initialize theme from localStorage
if (localStorage.getItem('iso-theme') === 'light') {
    setTheme('light');
} else {
    setTheme('dark');
}
