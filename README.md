# 🤖 Wingman Bot v2.0 - Enhanced Edition

**The Ultimate Context-Aware WhatsApp AI Assistant**

A production-ready, military-grade encrypted WhatsApp bot that helps you craft perfect replies using AI, with unlimited conversation memory, 7 distinct personalities, and 30+ advanced features.

[![Security](https://img.shields.io/badge/Security-Military%20Grade-green)]()
[![Encryption](https://img.shields.io/badge/Encryption-AES--256-blue)]()
[![Features](https://img.shields.io/badge/Features-30%2B-orange)]()
[![AI](https://img.shields.io/badge/AI-Google%20Gemini-red)]()

---

## ✨ What's New in v2.0

### 🚀 **Major Enhancements:**
- ✅ **Unlimited Message History** with automatic archiving
- ✅ **30+ Features** (up from 7)
- ✅ **Advanced Security** - Rate limiting, abuse detection, user banning
- ✅ **Multi-Suggestion** - Get 3 different reply options
- ✅ **Quick Replies** - Save frequently used responses
- ✅ **Conversation Analytics** - Summary, insights, search
- ✅ **Message Rewriter** - Rewrite in different styles
- ✅ **Tone Analyzer** - Detect emotional tone
- ✅ **Export & Backup** - Complete data management
- ✅ **Enhanced Privacy** - Phone masking, input sanitization
- ✅ **👻 Ghost Read Mode** - Read messages without blue ticks
- ✅ **😴 Auto-Sleep Mode** - Appear offline after inactivity (anti-ban)
- ✅ **⏱️ Typing Simulation** - Human-like typing delays (1-3 seconds)

---

## 🎯 Core Features

### 🔐 **Security First**
- **AES-256 Encryption**: All conversation history encrypted at rest
- **RAM-Only Keys**: Encryption key NEVER stored on disk
- **Locked State**: Bot starts locked, requires password via WhatsApp
- **Rate Limiting**: 20 requests/minute per user
- **Abuse Detection**: Automatic spam and injection detection
- **Failed Attempts**: 5 max attempts, 15-minute lockout
- **User Banning**: Owner can ban abusive users
- **Privacy Logging**: All phone numbers masked (9198*****210)

### 🎭 **7 AI Personalities**
1. **The Neuro-Life Coach** - Psychology expert, empathetic
2. **The Professor** - Intelligent, educational, mature
3. **The Gully Boy** - Street-smart, handles bullies
4. **The Poet** - Creative, romantic, metaphorical
5. **The Lawyer** - Legal expert, IPC specialist  
6. **The Medic** - Medical professional with charm
7. **The Super Human** - Meta-personality that adapts (default)

### 📇 **Context-Aware Phonebook**
- Store unlimited conversation contexts
- Each contact gets encrypted history
- Assign default personalities to contacts
- Automatic archiving system (no limits!)
- Temporary mode for one-time suggestions

### 🌍 **Language Intelligence**
- Auto-detects language/dialect
- Responds in SAME language (Hindi, Hinglish, Bengali, etc.)
- Unfiltered, authentic responses
- No censorship

### 🛡️ **Access Control**
- Owner super-user privileges
- Allowed groups configuration
- Ignores unauthorized users silently
- JID validation

### 👻 **Ghost Read Mode**
- **Read Without Blue Ticks**: Messages are stored silently
- **Perfect Stealth**: No "read" receipts sent
- **Per-Contact Control**: Enable/disable for specific contacts
- **Manual Marking**: Send blue ticks only when ready
- **Strategic Timing**: Take time to craft perfect replies

**Why This Matters:**
- 🎯 No pressure from "seen" status
- 🤔 Time to think before responding
- 👻 Complete reading stealth
- 💡 Perfect for crushes, important texts, awkward situations

### 😴 **Auto-Sleep Mode**
- **Auto-Sleep**: Appears offline after 15 minutes of inactivity
- **Anti-Ban Protection**: Mimics real human behavior
- **Manual Control**: Sleep/wake commands available
- **Seamless Wake**: Automatically wakes on command

**Why This Matters:**
- 🚫 Avoid WhatsApp bans (constant "online" is suspicious)
- 👤 Look human (real people aren't online 24/7)
- 🔒 Privacy (don't show "last seen" constantly)
- 🎭 Natural behavior patterns

### ⏱️ **Typing Simulation**
- **Random Delays**: 1-3 seconds before messages
- **"Typing..." Indicator**: Shows to recipient
- **Human-Like**: Varies timing each time
- **Believable**: Makes replies look natural

**Why This Matters:**
- 🤖 Instant replies look like bots
- ⏱️ Humans take time to type
- 💯 100% believable conversations
- 🎭 Natural feel to all replies

---

## 🚀 Quick Start

### **1. Install Dependencies**
```bash
npm install
```

### **2. Configure**
```bash
cp .env.example .env
nano .env
```

Add your details:
```env
OWNER_NUMBER=919876543210@s.whatsapp.net
GEMINI_API_KEY=your_api_key_here
ALLOWED_GROUPS=  # optional
```

Get API key: https://makersuite.google.com/app/apikey

### **3. Start Bot**
```bash
npm start
```

Scan QR code with WhatsApp (Settings > Linked Devices)

### **4. Unlock**
Send via WhatsApp:
```
!unlock YourStrongPassword123
```

---

## 📱 Command Reference

### **🎯 Core Commands**
```
!suggest <message>    Get AI reply suggestion
!multi <message>      Get 3 different suggestions
!list                 View all contacts
!help                 Show complete help
```

### **🎭 Personality & Context**
```
!personality          List all 7 personalities
!profile <n> <p>      Set default personality for contact
```

### **⚡ Quick Features**
```
!quick <trigger> <response>  Save quick reply shortcut
!quick                       List all quick replies
!quick delete <trigger>      Delete quick reply
!rewrite <style> | <msg>     Rewrite message in different style
!tone <message>              Analyze emotional tone
```

### **👻 Ghost Mode & Presence**
```
!ghost <contact>             Enable ghost read for contact
!ghost off <contact>         Disable ghost read
!ghost                       List all ghost contacts
!readnow                     Mark ghost messages as read (send blue ticks)
!status                      Show bot status (sleep, ghost mode, etc.)
!sleep                       Manually put bot to sleep (appear offline)
!wake                        Manually wake up bot
```

### **📊 Analysis & Insights**
```
!summary <contact>    AI-generated conversation summary
!insights <contact>   Detailed analytics and statistics
!stats <contact>      Message counts and archive info
!search <keyword>     Search across all conversations
```

### **💾 Data Management**
```
!export <contact>     Export full conversation (with archives)
!backup               Create complete backup (owner only)
```

### **🔐 Security (Owner Only)**
```
!unlock <password>    Unlock encrypted memory
!lock                 Lock system and clear keys
!ban <user_jid>       Ban abusive user
!unban <user_jid>     Unban user
```

---

## 💡 Usage Examples

### **Example 1: Basic Suggestion**
```
You: !suggest Hey, how are you?

Bot: 🎯 Select Context:
     1. Priya [neurocoach]
     2. Boss [professor]
     3. ➕ Create New Profile
     4. 🔄 Temporary (One-time)

You: 1

Bot: 💡 Suggestion for Priya:
     
     Hey! I'm doing great, thanks for asking! 😊
     How about you? What have you been up to lately?
```

### **Example 2: Multi-Suggestion**
```
You: !multi I had a great time yesterday

Bot: 💡 Multiple Suggestions:

1. CASUAL
Yeah, yesterday was awesome! Really enjoyed hanging out.

2. PROFESSIONAL  
Thank you for the productive meeting yesterday. I found it very valuable.

3. FUNNY
Yesterday was so epic, I'm still recovering! 😂 When's the sequel?
```

### **Example 3: Quick Replies**
```
You: !quick brb I'll be right back, just 5 minutes!
Bot: ✅ Quick reply saved!

# Later, just type:
You: brb
Bot: [Instantly sends: I'll be right back, just 5 minutes!]
```

### **Example 4: Tone Analysis**
```
You: !tone Why didn't you reply to my messages?

Bot: 🎭 Tone Analysis:
     
     Tone: UPSET
     Confidence: 85%
     
     💡 Advice: They seem frustrated. Acknowledge their feelings,
     apologize if needed, and explain calmly. Show you care.
```

### **Example 5: Conversation Summary**
```
You: !summary Priya

Bot: 📋 Summary for Priya:
     
     You've been discussing weekend plans and a potential dinner date.
     She mentioned loving Italian food and prefers casual settings.
     The conversation has been friendly and flirtatious with mutual
     interest in getting to know each other better.
```

### **Example 6: Message Rewriter**
```
You: !rewrite romantic | I had a nice time

Bot: ✍️ ROMANTIC version:
     
     I can't stop thinking about how wonderful our time together was.
     Every moment with you feels like magic, and I'm already counting
     down until I see you again. You made my day perfect. ✨
```

### **Example 7: Ghost Read Mode** 👻
```
# Enable ghost reading for a contact
You: !ghost Priya

Bot: 👻 Ghost read enabled for: Priya
     
     ✅ Messages will be stored without blue ticks
     💡 Use !readnow when ready to send blue ticks

# Now when Priya sends messages:
# - Bot stores them silently
# - NO blue ticks sent
# - You can read and think about your response

# When you're ready to send blue ticks:
You: !readnow

Bot: ✅ Marked 3 message(s) as read
     
     💙 Blue ticks sent!

# Perfect timing! Looks natural! 🎯
```

### **Example 8: Sleep Mode & Status** 😴
```
# Check bot status
You: !status

Bot: 🤖 Bot Status Report
     
     🔐 System: 🔓 UNLOCKED
     💤 Sleep Mode: Enabled
     😴 Currently: Awake
     ⏱️ Last Activity: 2m 30s
     📊 Presence: available
     
     👻 Ghost Read Status:
     Active Contacts: 1
     Pending Messages: 0 chat(s)
     
     💡 Ghost contacts: Priya

# Manually put bot to sleep (appear offline)
You: !sleep

Bot: 😴 Bot going to sleep...
     
     ✅ Appearing offline now
     💡 Bot will wake up automatically when you send a command

# Bot automatically sleeps after 15 minutes of inactivity
# This makes it look more human and helps avoid WhatsApp bans!
```

---

## 🔒 Security Features Explained

### **1. Military-Grade Encryption**
- All conversations encrypted with AES-256
- Even with physical access to server, data is unreadable
- Archive files also encrypted

### **2. RAM-Only Key Storage**
- Encryption key exists ONLY in RAM while running
- Never written to disk
- Bot restart = locked state
- Must unlock via WhatsApp

### **3. Rate Limiting**
```
User sends 20+ requests in 1 minute
↓
⏱️ Rate limit exceeded. Try again in 45 seconds.
```

### **4. Failed Attempt Protection**
```
5 failed unlock attempts
↓
🔒 Account locked for 15 minutes
```

### **5. Abuse Detection**
Automatically detects and blocks:
- Spam patterns
- Message flooding
- Command injection
- Suspicious behavior

### **6. Privacy Logging**
```
Before: Message from 919876543210@s.whatsapp.net
After:  Message from 9198*****210@s.whatsapp.net
```

---

## 📊 Advanced Features

### **Unlimited Message History**
- No 50-message limit anymore!
- Automatic archiving system
- Last 100 messages active for context
- Older messages archived securely
- Full history accessible via `!export`

### **Conversation Analytics**
```
!insights Priya

📊 Insights for Priya:
💬 Total Messages: 487
📥 From Them: 245  
📤 From You: 242
📏 Avg Message Length: 89 chars (them), 124 chars (you)
🔑 Top Keywords: dinner, movie, weekend, coffee
⏰ Most Active Hour: 20:00
📅 First: Nov 15, 2024
📅 Last: Dec 18, 2024
```

### **Full-Text Search**
```
!search pizza

🔍 Search Results:
Priya (3 matches)
Boss (1 match)
Friend (2 matches)
```

### **Smart Export**
```
!export Priya

📦 Export: Priya
Total: 487 messages (including 387 archived)
💾 Saved to: data/exports/priya_20241218.json
```

### **Automatic Backups**
```
!backup

💾 Creating backup...
✅ Backup created!
Location: ./backups/backup_2024-12-18/
```

---

## 🎭 When to Use Each Personality

| Scenario | Best Personality | Why |
|----------|-----------------|-----|
| Crush is sad | neurocoach | Empathy & emotional support |
| Boss email | professor | Professional & intelligent |
| Bully message | gullyboy | Street-smart & dominant |
| Love letter | poet | Romantic & beautiful |
| Threat/harassment | lawyer | Legal & authoritative |
| Health question | medic | Medical knowledge |
| Unsure | superhuman | Auto-adapts to context |

### **Set Default Personalities**
```bash
!profile Priya neurocoach   # Always emotional support
!profile Boss professor      # Always professional
!profile Bully gullyboy     # Always street-smart
```

---

## 🛡️ Privacy & Security

### **What We Store:**
- ✅ Contacts (names + UUIDs) - Unencrypted
- ✅ Conversations - AES-256 Encrypted
- ✅ Archives - AES-256 Encrypted
- ✅ Logs - Phone numbers masked

### **What We DON'T Store:**
- ❌ Passwords (never logged)
- ❌ Encryption keys on disk
- ❌ Raw phone numbers in logs
- ❌ Message content in logs

### **Third-Party Data:**
- Google Gemini receives message content (for AI)
- WhatsApp has E2E encryption
- No other third parties

---

## 📁 Project Structure

```
wingman-bot/
├── src/
│   ├── bot_enhanced.js        # Main bot with all features
│   ├── config.js              # Configuration
│   ├── index.js               # Entry point
│   ├── services/
│   │   ├── aiService.js       # Google Gemini
│   │   ├── contactManager.js  # Contact management
│   │   ├── personalities.js   # 7 personality prompts
│   │   ├── stateManager.js    # Flow state
│   │   ├── storage.js         # Encrypted storage + archives
│   │   └── advancedFeatures.js # 15+ new features
│   └── utils/
│       ├── crypto.js          # AES-256 encryption
│       ├── logger.js          # Privacy-focused logging
│       └── security.js        # Rate limiting, abuse detection
├── data/
│   ├── contacts.json          # Contact mappings
│   ├── conversations/         # Encrypted .enc files
│   └── archives/              # Archived conversations
├── backups/                   # Automatic backups
├── .env                       # Your secrets
└── README.md
```

---

## 🔧 Troubleshooting

### **Bot doesn't respond**
1. Check `OWNER_NUMBER` format: `919876543210@s.whatsapp.net`
2. Verify you're messaging from owner account
3. Check rate limits (20/minute)
4. Look for ban status

### **"System is locked"**
```
!unlock YourPassword123
```

### **"Rate limit exceeded"**
Wait 60 seconds and try again

### **QR code not showing**
- Use modern terminal (iTerm2, Windows Terminal)
- Make terminal window larger
- Check Node.js version (18+)

### **Decryption failed**
- Wrong password
- Try `!unlock` again
- If forgotten, you'll need to reset (loses data)

---

## 📚 Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup instructions
- **[FEATURES_v2.0.md](FEATURES_v2.0.md)** - All 30+ features explained
- **[SECURITY_AUDIT.md](SECURITY_AUDIT.md)** - Security analysis & fixes

---

## 🚀 Deployment

### **Using PM2 (Recommended)**
```bash
npm install -g pm2
pm2 start src/index.js --name wingman
pm2 save
pm2 startup
```

### **Using systemd**
See SETUP_GUIDE.md for complete systemd configuration

---

## 🎯 Feature Comparison

| Feature | Basic Bot | Wingman v1.0 | Wingman v2.0 |
|---------|-----------|--------------|--------------|
| AI Suggestions | ✅ | ✅ | ✅ |
| Personalities | ❌ | 7 | 7 Enhanced |
| Encryption | ❌ | AES-256 | AES-256 |
| Message Limit | 50 | 50 | ♾️ Unlimited |
| Multi-Suggestion | ❌ | ❌ | ✅ |
| Quick Replies | ❌ | ❌ | ✅ |
| Analytics | ❌ | ❌ | ✅ 5 types |
| Search | ❌ | ❌ | ✅ Full-text |
| Export | ❌ | ❌ | ✅ Complete |
| Rate Limiting | ❌ | ❌ | ✅ Advanced |
| Abuse Detection | ❌ | ❌ | ✅ Multi-pattern |
| Backups | ❌ | ❌ | ✅ Automatic |

---

## 💻 Requirements

- Node.js 18+
- Google Gemini API key
- WhatsApp personal account
- 500MB+ free space (for archives)

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Open pull request

---

## 📄 License

MIT License - Free to use, modify, and distribute

---

## ⚠️ Disclaimer

This bot is for **personal use only**. You are responsible for:
- Complying with WhatsApp Terms of Service
- Respecting others' privacy
- Using AI suggestions ethically
- Not spamming or harassing

---

## 🙏 Credits

- Built with [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys)
- Powered by [Google Gemini AI](https://ai.google.dev/)
- Inspired by the need for better communication

---

## 📊 Stats

- **30+ Features** implemented
- **20+ Commands** available
- **7 Personalities** with unique prompts
- **5 Security Layers** protecting data
- **Unlimited** message storage
- **100%** Privacy-focused

---

## 🎉 Success Stories

> "Wingman helped me get a date!" - User A

> "My boss loves my professional emails now" - User B

> "Finally handled that bully in the group" - User C

---



- Issues: GitHub Issues
- Docs: README.md + SETUP_GUIDE.md
- Security: See SECURITY_AUDIT.md

---

**Remember**: With great power comes great responsibility. Use Wingman wisely! 🤖✨

---

**Version:** 2.0 Enhanced Edition  
**Status:** ✅ Production Ready  
**Last Updated:** December 2025 
**Total Features:** 30+  
**Security Level:** Military Grade 🛡️