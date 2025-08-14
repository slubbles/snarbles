# 🚀 Snarbles - Professional Token Creation Platform

**Create blockchain tokens in under 30 seconds with zero coding required.**

Snarbles is a comprehensive, production-ready token creation platform built with Next.js, featuring mobile-optimized design and multi-blockchain integration. Deploy tokens on Algorand and Solana networks with advanced features, real-time analytics, and seamless wallet integration.

![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue)
![Algorand](https://img.shields.io/badge/Algorand-Mainnet-green)
![Solana](https://img.shields.io/badge/Solana-Devnet-purple)

## ✨ Key Features

### 🎨 **Intuitive Token Creation**
- **30-second deployment** with guided interface
- **Multi-chain support** (Algorand mainnet, Solana devnet)
- **Rich metadata** including logos, descriptions, and social links
- **Advanced options** (mintable, burnable, pausable tokens)
- **Real-time preview** before deployment

### 📊 **Advanced Analytics Dashboard**
- **Comprehensive metrics** and interactive charts
- **Transaction history** tracking
- **Token performance** analytics
- **Portfolio management** for multiple tokens
- **Real-time data** directly from blockchain

### 💳 **Flexible Credit System**
- **ALGO/USDT payments** for token creation
- **Dynamic pricing** with admin configuration
- **Transaction tracking** in Supabase
- **Balance management** with real-time updates

### 🔍 **Token Verification System**
- **Security analysis** of deployed tokens
- **Trust indicators** and verification badges
- **Contract inspection** tools
- **Public registry** of verified tokens

### 📱 **Mobile-First Design**
- **Responsive layout** optimized for all devices
- **Touch-optimized** interactions
- **Fast performance** with optimized assets
- **Accessible design** (WCAG compliant)

### 🔗 **True Decentralization**
- **Wallet-based authentication** (no accounts needed)
- **Direct blockchain integration** with real-time data
- **Zero central dependencies** for core functionality
- **Complete Web3 experience**

## 🚨 Current Status

### ✅ Algorand Network - Fully Operational
- **Token Creation**: ✅ Working perfectly
- **Dashboard**: ✅ Full analytics and management
- **Verification**: ✅ Complete token verification system
- **Tokenomics**: ✅ Advanced modeling tools

### ⚠️ Solana Network - Temporarily Unavailable  
- **Status**: Smart contract initialization issues
- **Issue**: `ProgramFailedToComplete` error during platform setup
- **Solution**: Contract debugging and redeployment needed
- **Alternative**: Use Algorand for immediate token creation

## ✨ Features

### 🎨 Token Creation
- **Intuitive Builder**: Create tokens in under 30 seconds
- **Multi-Chain Support**: Algorand (active) + Solana (pending fix)
- **Custom Features**: Mintable, burnable, and pausable options
- **Rich Metadata**: Add logos, descriptions, and social links
- **Real-time Preview**: See your token before deployment

### 📊 Analytics & Management
- **Comprehensive Dashboard**: Track token performance and holders
- **Advanced Analytics**: Charts, metrics, and transaction history
- **Token Management**: Transfer, mint, burn, and pause functionality
- **Portfolio Overview**: Manage multiple tokens from one interface

### 🧮 Tokenomics Tools
- **Interactive Simulator**: Design token distribution with visual tools
- **Export Reports**: Generate detailed tokenomics documentation
- **Recommendations**: Built-in best practices and suggestions
- **Flexible Configuration**: Customize allocation percentages

### 🔍 Verification System
- **Security Analysis**: Comprehensive token verification
- **Trust Indicators**: Security scores and verification badges
- **Contract Inspection**: Detailed smart contract analysis
- **Public Registry**: Browse verified tokens

### 📱 Mobile-First Design
- **Responsive Layout**: Optimized for all screen sizes
- **Touch-Friendly**: Proper touch targets and interactions
- **Fast Performance**: Optimized images and lazy loading
- **Accessible**: WCAG compliant design

### 🔗 Decentralized Architecture
- **Wallet-Based Identity**: No accounts, just connect your wallet
- **Direct Blockchain Integration**: All data comes from on-chain sources
- **Zero Central Dependencies**: Works without any centralized services
- **True Web3 Experience**: Complete decentralization

## 🎯 Quick Start Guide

### For Token Creation (Recommended):
1. **Visit**: [Create Page](/create)
2. **Connect**: Pera Wallet (Algorand)
3. **Choose**: Algorand Mainnet or Testnet
4. **Create**: Fill in token details and deploy
5. **Manage**: Use dashboard for analytics and operations

### For Solana Development:
1. **Check Status**: Visit [Admin Page](/admin) with admin wallet
2. **Run Diagnostics**: `node scripts/check-solana-program.js`
3. **Review Issues**: See `SOLANA_FIX_GUIDE.md` for details
4. **Deploy Fix**: Redeploy smart contract when ready

## 🛠 Technology Stack

**Frontend & Framework**
- **Next.js 15.3.5** with App Router and TypeScript
- **React 19** with Server Components
- **Tailwind CSS** with custom design system
- **Radix UI** components for accessibility

**Blockchain Integration**
- **Algorand SDK** with Pera Wallet integration
- **Solana Web3.js** with multiple wallet adapters
- **Real-time balance tracking** across networks
- **Atomic transaction handling**

**Backend & Database**
- **Supabase** PostgreSQL with Row Level Security
- **Real-time subscriptions** for live updates
- **Edge Functions** for serverless API endpoints
- **Automatic schema migrations**

**UI/UX & Performance**
- **Framer Motion** for smooth animations
- **React Hook Form** with Zod validation
- **Optimized images** with Next.js Image component
- **Bundle analysis** and performance monitoring

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** 
- **npm** or **yarn**
- **Git**
- **Supabase account** (for database)

### 1. Clone & Install

```bash
git clone <repository-url>
cd snarbles
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your settings:

```bash
cp env.example .env.local
```

Configure the following required environment variables in `.env.local`:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Blockchain Network Settings
NEXT_PUBLIC_ALGORAND_NETWORK=testnet # or mainnet
NEXT_PUBLIC_SOLANA_NETWORK=devnet   # or mainnet-beta

# Application Configuration
NEXT_PUBLIC_APP_NAME=Snarbles
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Set up the required database schema (contact support for schema details)
3. Configure Row Level Security policies

### 4. Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

### 5. Production Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
snarbles/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── admin/             # Admin dashboard
│   ├── analytics/         # Analytics pages
│   ├── credits/           # Credit management
│   ├── create-token/      # Token creation flow
│   └── globals.css        # Global styles
├── components/            # Reusable React components
│   ├── providers/         # Context providers
│   ├── ui/               # Base UI components
│   └── wallet/           # Wallet integration
├── lib/                   # Utility functions
│   ├── algorand/         # Algorand blockchain utils
│   ├── credit-system.ts  # Credit management
│   └── utils.ts          # General utilities
├── public/               # Static assets
└── types/                # TypeScript definitions
```

## 🔧 Configuration

### Blockchain Networks

**Algorand Configuration:**
- **Mainnet:** Production deployments with real ALGO
- **Testnet:** Development and testing environment
- **Pera Wallet:** Primary wallet integration

**Solana Configuration:**
- **Mainnet-beta:** Production Solana network
- **Devnet:** Development and testing environment
- **Multiple Wallets:** Phantom, Solflare, Backpack support

### Credit System

Configure token creation pricing in your admin panel:
- **ALGO pricing:** Set cost per token in ALGO
- **USDT pricing:** Alternative payment method
- **Dynamic rates:** Adjust based on network fees

## 📄 License

This project is proprietary software. All rights reserved.

## � Support

For setup assistance or technical support, please contact:
- **Email:** support@snarbles.com
- **Website:** https://snarbles.com

---

**Built with ❤️ by the Snarbles team**

*Making blockchain accessible, one token at a time.*

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
snarbles-token-platform/
├── app/                    # Next.js app directory
│   ├── create/            # Token creation page
│   ├── dashboard/         # User dashboard
│   ├── tokenomics/        # Tokenomics simulator
│   ├── verify/            # Token verification
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── layout/           # Layout components
│   └── providers/        # Context providers
├── lib/                   # Utility functions
└── public/               # Static assets
```

## 🎨 Design System

### Color Palette
- **Primary**: Red (#EF4444) - Action and emphasis
- **Background**: Dynamic (Black/White) - Theme-based
- **Text**: High contrast for accessibility
- **Glass Effects**: Backdrop blur with transparency

### Typography
- **Font**: Inter with optimized weights
- **Scale**: Responsive typography system
- **Hierarchy**: Clear visual hierarchy

### Components
- **Glass Cards**: Translucent containers with blur effects
- **Enhanced Inputs**: Custom styled form controls
- **Gradient Buttons**: Eye-catching call-to-action buttons
- **Responsive Charts**: Mobile-optimized data visualization

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file:

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
```

### Deployment

#### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Deploy automatically on every push
3. Configure environment variables in Vercel dashboard

#### Netlify
1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `out`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Solana Foundation** for blockchain infrastructure
- **Algorand Foundation** for blockchain infrastructure
- **Vercel** for Next.js framework
- **Radix UI** for accessible components
- **Tailwind CSS** for utility-first styling

## 📞 Support

- **Documentation**: [Coming Soon]
- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/snarbles-token-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/snarbles-token-platform/discussions)

---

**Built with ❤️ for the blockchain ecosystem**

*Empowering creators to launch their token ideas in minutes, not months.*