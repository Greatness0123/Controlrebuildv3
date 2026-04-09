# Control AI - Feature Limits & Plan Comparison

> Comprehensive breakdown of features, limits, and capabilities across Free, Pro, Master, and Enterprise plans for both Desktop App and Web Platform.

---

## Plan Overview

| Plan | Price | Target |
|------|-------|--------|
| Free | $0/mo | Individual exploration, basic automation |
| Pro | $29/mo | Regular users, bigger projects |
| Master | $59/mo | Power users, full-scale orchestration |
| Enterprise | Custom | Dedicated infrastructure |

---

## Session & Task Limits

### Task Sessions (Monthly)

| Plan | Free | Pro | Master | Enterprise |
|------|------|-----|--------|------------|
| **Sessions/Mo** | 100 | 500 | 2,000 | Unlimited |

### ACT Mode (Automation Tasks)

| Plan | Free | Pro | Master | Enterprise |
|------|------|-----|--------|------------|
| **Monthly Limit** | 10 | 200 | Unlimited | Unlimited |
| **Desktop App** | 10 | 200 | ∞ | ∞ |
| **Web** | 10 | 500 | 5,000 | Custom |

### ASK Mode (Q&A Tasks)

| Plan | Free | Pro | Master | Enterprise |
|------|------|-----|--------|------------|
| **Monthly Limit** | 200 | 500 | Unlimited | Unlimited |
| **Desktop App** | 50 | 2,000 | 10,000 | Custom |
| **Web** | 200 | 2,000 | 10,000 | Custom |

---

## Virtual Machine (VM) Limits

### VM Instances

| Plan | Free | Pro | Master | Enterprise |
|------|------|-----|--------|------------|
| **Max VMs** | 1 | 5 | 10 | Custom |
| **Storage** | 20GB | 20GB+ | 20GB+ | Custom |

### VM Auto-Stop (Free Tier)

- **Free Plan**: VMs auto-stop after inactivity
- **Pro/Master/Enterprise**: VMs stay running

### VM Resource Limits

| Resource | Free | Pro | Master |
|----------|------|-----|--------|
| **CPU Quota** | 200,000 | 200,000+ | 200,000+ |
| **Memory Limit** | 2GB | Higher | Higher |
| **Storage Limit** | 20GB | 20GB+ | 20GB+ |

---

## Token Usage Tracking

### Daily Token Tracking

Both Desktop App and Web track:
- `daily_token_usage` - Dictionary by date with:
  - `prompt` - Prompt tokens per day
  - `candidates` - Response tokens per day
  - `total` - Total tokens per day

### Monthly Token Tracking

| Plan | Free | Pro | Master |
|------|------|-----|--------|
| **Total Token Tracking** | Yes | Yes | Yes |
| **Token Reset** | Monthly | Monthly | No |

---

## API Keys & Providers

### Supported AI Providers

| Provider | Free | Pro | Master | Enterprise |
|----------|------|-----|--------|------------|
| **Gemini** | ✓ | ✓ | ✓ | ✓ |
| **OpenAI** | ✓ | ✓ | ✓ | ✓ |
| **Anthropic (Claude)** | ✓ | ✓ | ✓ | ✓ |
| **OpenRouter** | ✓ | ✓ | ✓ | ✓ |
| **xAI** | ✓ | ✓ | ✓ | ✓ |

### API Key Management

| Feature | Free | Pro | Master | Enterprise |
|---------|------|-----|--------|------------|
| **User API Keys** | ✓ | ✓ | ✓ | ✓ |
| **Shared API Keys** | ✓ | ✓ | ✓ | ✓ |
| **Provider Config** | Per-user | Per-user | Per-user | Custom |

---

## Voice Features

### Wake Word (Voice Activation)

| Feature | Free | Pro | Master | Enterprise |
|---------|------|-----|--------|------------|
| **Wake Word** | ✓ | ✓ | ✓ | ✓ |
| **Picovoice Key** | Optional | Optional | Optional | Optional |

### Text-to-Speech (TTS)

| Feature | Free | Pro | Master | Enterprise |
|---------|------|-----|--------|------------|
| **TTS Response** | ✓ | ✓ | ✓ | ✓ |
| **Voice Selection** | ✓ | ✓ | ✓ | ✓ |
| **Rate Control** | ✓ | ✓ | ✓ | ✓ |
| **Volume Control** | ✓ | ✓ | ✓ | ✓ |

### Speech-to-Text (STT)

| Feature | Free | Pro | Master | Enterprise |
|---------|------|-----|--------|------------|
| **Voice Input** | ✓ | ✓ | ✓ | ✓ |
| **Vosk Streaming** | ✓ | ✓ | ✓ | ✓ |

---

## Remote Access

### Remote Desktop Features

| Feature | Free | Pro | Master | Enterprise |
|---------|------|-----|--------|------------|
| **Remote Access** | ✓ | ✓ | ✓ | ✓ |
| **Pairing Code** | ✓ | ✓ | ✓ | ✓ |
| **Remote Links** | Limited | Yes | Unlimited | Unlimited |
| **Auto-start** | ✓ | ✓ | ✓ | ✓ |

---

## Automation Features

### Agent Capabilities

| Feature | Free | Pro | Master | Enterprise |
|---------|------|-----|--------|------------|
| **ACT Mode** | ✓ | ✓ | ✓ | ✓ |
| **ASK Mode** | ✓ | ✓ | ✓ | ✓ |
| **Browser Automation** | ✓ | ✓ | ✓ | ✓ |
| **File Operations** | ✓ | ✓ | ✓ | ✓ |
| **Terminal Commands** | ✓ | ✓ | ✓ | ✓ |
| **OCR** | ✓ | ✓ | ✓ | ✓ |
| **Screenshot** | ✓ | ✓ | ✓ | ✓ |
| **Window Management** | ✓ | ✓ | ✓ | ✓ |
| **Custom Agent Tooling** | - | ✓ | ✓ | ✓ |

### Workflow Features

| Feature | Free | Pro | Master | Enterprise |
|---------|------|-----|--------|------------|
| **Workflow Creation** | ✓ | ✓ | ✓ | ✓ |
| **Workflow Execution** | ✓ | ✓ | ✓ | ✓ |
| **Scheduled Triggers** | ✓ | ✓ | ✓ | ✓ |
| **Keyword Triggers** | ✓ | ✓ | ✓ | ✓ |
| **Manual Triggers** | ✓ | ✓ | ✓ | ✓ |

---

## Marketplace (Publishing & Purchasing)

### Publishing Workflows

| Feature | Free | Pro | Master | Enterprise |
|---------|------|-----|--------|------------|
| **Publish to Marketplace** | ✓ | ✓ | ✓ | ✓ |
| **Set Price (Free/Paid)** | ✓ | ✓ | ✓ | ✓ |
| **Categories** | ✓ | ✓ | ✓ | ✓ |

### Purchasing Workflows

| Feature | Free | Pro | Master | Enterprise |
|---------|------|-----|--------|------------|
| **Buy Free Workflows** | ✓ | ✓ | ✓ | ✓ |
| **Buy Paid Workflows** | ✓ | ✓ | ✓ | ✓ |
| **Payment Details** | ✓ | ✓ | ✓ | ✓ |

### Payment Details Storage

Users can store:
- Bank Name
- Account Number
- Account Name
- Routing Number
- PayPal Email

---

## Support

| Plan | Free | Pro | Master | Enterprise |
|------|------|-----|--------|------------|
| **Community Support** | ✓ | ✓ | - | - |
| **Priority Support** | - | ✓ | - | - |
| **Dedicated Tech Support** | - | - | ✓ | ✓ |
| **24/7 Priority Concierge** | - | - | - | ✓ |
| **Personal Onboarding** | - | - | - | ✓ |

---

## Additional Features

### Speed & Performance

| Feature | Free | Pro | Master | Enterprise |
|---------|------|-----|--------|------------|
| **Agent Speed** | Standard | High-Speed | High-Speed | Custom |
| **Real-time Data Export** | - | - | ✓ | ✓ |

### Security & Enterprise

| Feature | Free | Pro | Master | Enterprise |
|---------|------|-----|--------|------------|
| **Basic Remote Access** | ✓ | - | - | - |
| **Advanced System Access** | - | ✓ | ✓ | ✓ |
| **Enterprise SSO** | - | - | - | ✓ |
| **99.9% Uptime SLA** | - | - | - | ✓ |

### Beta Access

| Feature | Free | Pro | Master | Enterprise |
|---------|------|-----|--------|------------|
| **Early Beta Access** | - | - | ✓ | ✓ |

---

## Technical Implementation Details

### Database Schema (Supabase)

```sql
-- User plan stored in users table
plan TEXT DEFAULT 'free'

-- Task counts
act_count INTEGER DEFAULT 0
ask_count INTEGER DEFAULT 0

-- Token tracking
total_token_usage INTEGER DEFAULT 0
daily_token_usage JSONB DEFAULT '{}'

-- Storage
storage_used FLOAT
storage_limit FLOAT
```

### Backend Configuration (config.py)

```python
PLAN_LIMITS = {
    "free": {"max_vms": 1, "max_sessions": 100},
    "pro": {"max_vms": 5, "max_sessions": 500},
    "master": {"max_vms": 10, "max_sessions": 2000},
}
```

### Desktop App Limits (supabase-service.js)

```javascript
const limits = {
    'Free': { act: 10, ask: 50 },
    'Pro': { act: 500, ask: 2000 },
    'Master': { act: 5000, ask: 10000 }
};
```

---

## Notes

1. **Token limits** are tracked per billing cycle (monthly)
2. **VM auto-stop** only applies to Free tier users for cost management
3. **Enterprise plans** are fully customizable - contact sales
4. **API keys** can be user-provided or shared system-wide
5. **Marketplace** allows publishing with custom pricing (including free)

---

*Last Updated: April 2026*
*Document Version: 1.0*
