# ISO 20022 Academy - Premium Edition

Modern, premium fintech learning platform with dark luxury emerald design. Built with vanilla HTML, CSS, and JavaScript.

## 🎨 Premium Design Features

✅ **Dark Luxury + Emerald** - Professional fintech palette, not generic blues  
✅ **Smooth Interactions** - Slide-in detail panel, no jarring modals  
✅ **Modern SaaS Feel** - Inspired by Stripe, Linear, Raycast, Microsoft Learn  
✅ **Responsive** - Desktop-first, mobile-ready  
✅ **Zero Dependencies** - Pure HTML, CSS, JavaScript  

## 🎯 Architecture

### File Structure
```
iso-academy/
├── index.html                 (Main hub - navigation)
├── assets/
│   ├── css/
│   │   └── style.css         (All styling - emerald theme)
│   └── js/
│       ├── data.js           (Message & glossary data)
│       ├── ui.js             (Interactive UI, detail panel)
│       └── app.js            (Routing & page content)
└── README.md
```

### Pages

1. **Dashboard** - Long-form learning about ISO 20022
2. **Message Explorer** - Clickable family cards + message grid + slide-in details
3. **Decoder** - Message structure explorer (coming)
4. **Glossary** - Searchable terms
5. **Learning Path** - Course module placeholders

## 🎨 Color Palette

```
Background    #0A0B0F
Surface       #111318
Surface Alt   #171A21

Primary       #10B981 (Emerald)
Hover         #34D399 (Bright Emerald)

Text          #F8FAFC
Muted         #94A3B8
Border        #232834
```

## 🚀 Quick Start

### Open Locally
```
1. Extract ZIP
2. Open index.html in browser
3. Explore all sections
```

### Deploy
**GitHub Pages:**
```
1. Create repo: iso-20022-academy
2. Upload folder
3. Settings → Pages → Enable
4. Live at: yourusername.github.io/iso-20022-academy
```

**Netlify:**
```
1. Go to netlify.com
2. Drag folder → Deploy
3. Get instant URL
```

## ✨ Key Features

### Message Explorer (The Star)
- Left: Clickable family cards (CAMT, PACS, PAIN, SEEV, ACMT, Others)
- Right: Auto-filtering message grid
- Click message → Right panel slides in with full details
- Smooth, professional UX

### Detail Panel
- Slides in from right (not modal popup)
- Shows:
  - Title & subtitle
  - Purpose (business context)
  - Direction (Bank→Bank, Customer→Bank, etc)
  - Category
  - Use cases
  - Key fields
  - Real XML example
- Closes when switching messages or families

### Data-Driven Content
All content stored in `data.js`:
```javascript
DATA = {
    messages: { CAMT: [...], PACS: [...], ... },
    glossary: [...]
}
```

Easy to expand without touching code.

## 🛠️ How to Customize

### Add a Message Type

**Edit `assets/js/data.js`:**

```javascript
{
    code: 'CAMT.055',
    family: 'CAMT',
    title: 'CAMT.055',
    subtitle: 'Your Title Here',
    purpose: 'What this message does...',
    direction: 'Bank → Customer',
    category: 'Cash Management',
    useCases: ['Use Case 1', 'Use Case 2'],
    fields: ['Field1 (Description)', 'Field2'],
    example: '<Document>...</Document>'
}
```

Save → Refresh browser → Message appears!

### Add Glossary Term

**Edit `assets/js/data.js`:**

```javascript
{ term: 'Your Term', definition: 'Your definition...' }
```

### Change Colors

**Edit `assets/css/style.css`:**

```css
:root {
    --primary: #10B981;           /* Change this */
    --primary-hover: #34D399;     /* And this */
    /* ... others ... */
}
```

### Add Page Content

**Edit `assets/js/app.js`:**

Add to `PAGES` object:
```javascript
yourpage: `
    <div class="page">
        <h2 class="section-title">Your Title</h2>
        <p class="section-description">Content here...</p>
    </div>
`
```

Then add nav item in `index.html`:
```html
<button class="nav-item" onclick="navigate('yourpage')">Your Page</button>
```

## 📊 Message Data Structure

```javascript
{
    code: 'CAMT.054',              // Message code
    family: 'CAMT',                // Family (CAMT, PACS, PAIN, SEEV, ACMT)
    title: 'CAMT.054',             // Display title
    subtitle: 'Bank to Customer...',
    purpose: 'Notifies customers...',
    direction: 'Bank → Customer',  // Who sends to whom
    category: 'Cash Management',   // Category
    useCases: ['Use 1', 'Use 2'],  // Real business use cases
    fields: ['Field1 (Desc)', ...],
    example: '<Document>...</Document>'
}
```

## 🎯 Design Philosophy

- **Modern SaaS, not Banking** - Feels like Stripe/Linear, not legacy banking software
- **Emerald Premium** - Green instead of blue (stands out, premium)
- **Smooth Interactions** - Slide-in panels, no jarring transitions
- **Data-Driven** - Easy to expand with new messages, no code changes
- **Professional** - Clean, purposeful, trustworthy

## 🚀 Future Enhancements

### Soon
- Decoder with message structure trees
- Real message scenario flows
- Validator for XML messages

### Later
- Schema upload (auto-load messages from ISO 20022 schemas)
- Transformer feature (format conversion)
- Learning Path courses
- Interactive message builder
- PDF export

## 💡 Pro Tips

1. **Keep XMLsimple** - Use only relevant fields, not entire spec
2. **Business-focused** - "Salary payments" not "field mapping"
3. **Add real examples** - From your Volante/NETS/ICARD systems
4. **Update regularly** - Add messages as you encounter them
5. **Share publicly** - GitHub link is portfolio gold

## 📱 Browser Support

✅ Chrome 90+  
✅ Firefox 88+  
✅ Safari 14+  
✅ Edge 90+  
✅ Mobile browsers  

## 🎓 This is Your Portfolio

When recruiting:

*"I built an ISO 20022 learning platform that explains payment messages for both technical and business audiences. It's live here [GitHub link]. I designed it with modern SaaS UX (inspired by Stripe/Linear) and an emerald dark luxury theme. The platform is data-driven, making it easy to add new message types. I'm continuously expanding it with messages from my work with payment systems."*

That opens doors. 🚀

## 📌 Remember

- Single source of truth: `data.js` for all message data
- Styling is centralized: `style.css`
- Navigation is simple: `app.js` page content
- Easy to extend with new messages, pages, or features
- No build process, no dependencies, no complexity

---

**Built for the modern fintech engineer.**

Stripe + Linear + Raycast + Microsoft Learn inspiration.

Not traditional banking software. Modern SaaS product.

Go build. 💚
